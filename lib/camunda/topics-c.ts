import type {CamundaTopic} from './types';

export const TOPICS_C: CamundaTopic[] = [
  {
    id: 'saga',
    title: 'Saga and Compensation',
    badge: 'Correctness',
    theory:
      'A saga coordinates local transactions and compensating actions instead of one distributed transaction. In payments, reserve account, call gateway, settle bank, and notify can each commit locally with compensation for later failures.',
    whenToUse:
      'Use saga orchestration when each service owns its DB and a later failure requires refund, release hold, reverse ledger intent, or notify customer.',
    whenAvoid:
      'Do not use compensation to hide weak idempotency or missing ledger invariants.',
    mermaid: `sequenceDiagram
  participant Z as payment-process
  participant A as AccountService
  participant G as GatewayService
  participant B as BankService
  Z->>A: reserve funds
  A-->>Z: holdId
  Z->>G: authorize gateway
  G-->>Z: authId
  Z->>B: settle
  alt bank fails permanently
    Z->>G: void auth(authId)
    Z->>A: release hold(holdId)
    Z-->>Z: payment FAILED_COMPENSATED
  else ok
    Z-->>Z: payment SETTLED
  end`,
    code: `package com.vibhu.payment.worker;

import io.camunda.zeebe.spring.client.annotation.JobWorker;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class CompensationWorkers {
  private final PaymentService paymentService;

  public CompensationWorkers(PaymentService paymentService) {
    this.paymentService = paymentService;
  }

  @JobWorker(type = "release-account-hold")
  public Map<String, Object> releaseHold(Map<String, Object> vars) {
    paymentService.releaseHold((String) vars.get("paymentId"), (String) vars.get("holdId"));
    return Map.of("holdReleased", true);
  }

  @JobWorker(type = "void-gateway-authorization")
  public Map<String, Object> voidGateway(Map<String, Object> vars) {
    paymentService.voidAuthorization((String) vars.get("paymentId"), (String) vars.get("authId"));
    return Map.of("gatewayVoided", true);
  }
}`,
    bpmn: `<bpmn:subProcess id="paymentSaga" triggeredByEvent="false">
  <bpmn:serviceTask id="reserveFunds" zeebe:taskDefinitionType="account-validation" />
  <bpmn:serviceTask id="authorizeGateway" zeebe:taskDefinitionType="payment-gateway" />
  <bpmn:serviceTask id="settleBank" zeebe:taskDefinitionType="bank-settlement" />
</bpmn:subProcess>
<bpmn:boundaryEvent id="sagaFailed" attachedToRef="paymentSaga">
  <bpmn:errorEventDefinition errorRef="SagaFailed" />
</bpmn:boundaryEvent>
<bpmn:serviceTask id="releaseHold" zeebe:taskDefinitionType="release-account-hold" />`,
    production:
      'Compensation is a business action with its own idempotency, audit, and failure handling. It is not rollback magic.',
    interview30s:
      'A payment saga commits each local step and defines compensations like void authorization or release hold when later steps fail.',
    mistakes: [
      'Assuming compensation restores the exact old world',
      'No idempotency on compensation workers',
      'No customer-visible compensated failure status',
    ],
    followUp: 'How is saga different from two-phase commit?',
    memoryTrick: 'Saga does, then undoes with business actions.',
  },
  {
    id: 'parallel-multi-instance',
    title: 'Parallel and Multi-Instance Work',
    badge: 'Scale',
    theory:
      'Parallel gateways run independent branches at the same time. Multi-instance repeats a task for a collection. Payment examples include parallel fraud/credit/account checks or notifying multiple downstream channels.',
    whenToUse:
      'Use parallel branches when tasks are independent and joined before the next money-moving step.',
    whenAvoid:
      'Avoid parallelizing side effects that must be ordered or share the same idempotency key incorrectly.',
    mermaid: `flowchart LR
  S[Validated] --> P{Parallel}
  P --> F[Fraud check]
  P --> C[Credit check]
  P --> A[Account validation]
  F --> J{Join}
  C --> J
  A --> J
  J --> G{all ok?}
  G -->|yes| Pay[Process payment]
  G -->|no| Reject[Reject]`,
    code: `package com.vibhu.payment.worker;

import io.camunda.zeebe.spring.client.annotation.JobWorker;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class CreditCheckWorker {
  @JobWorker(type = "credit-check", maxJobsActive = 16)
  public Map<String, Object> check(Map<String, Object> variables) {
    long amount = ((Number) variables.get("amount")).longValue();
    return Map.of("creditStatus", amount <= 250000 ? "APPROVED" : "REVIEW");
  }
}

@Component
class NotifyPaymentWorker {
  @JobWorker(type = "notify-payment", maxJobsActive = 64)
  public Map<String, Object> notify(Map<String, Object> variables) {
    return Map.of("notificationSent", true);
  }
}`,
    bpmn: `<bpmn:parallelGateway id="startParallelChecks" />
<bpmn:serviceTask id="fraudCheck" zeebe:taskDefinitionType="fraud-check" />
<bpmn:serviceTask id="creditCheck" zeebe:taskDefinitionType="credit-check" />
<bpmn:serviceTask id="accountValidation" zeebe:taskDefinitionType="account-validation" />
<bpmn:parallelGateway id="joinParallelChecks" />
<zeebe:loopCharacteristics inputCollection="=notificationChannels" inputElement="channel" />`,
    production:
      'Join branch results explicitly and apply backpressure per job type. Multi-instance can multiply load quickly.',
    interview30s:
      'I run fraud, credit, and account checks in parallel, join results, and only process payment if all required checks pass.',
    mistakes: [
      'Parallel branches writing the same row without version checks',
      'No rate limit for multi-instance notifications',
      'Joining without validating every branch outcome',
    ],
    followUp: 'How do you handle one branch failing while others succeeded?',
    memoryTrick: 'Parallel saves latency; join protects correctness.',
  },
  {
    id: 'versioning',
    title: 'Process Versioning and Migration',
    badge: 'Change',
    theory:
      'Deploying a BPMN creates a new process version. New instances can use latest; existing instances usually continue on their version unless migrated. Versioning is a production release concern.',
    whenToUse:
      'Use explicit version strategy when adding approval, changing gateway conditions, or replacing worker job types.',
    whenAvoid:
      'Do not silently change semantics for in-flight high-value payments without migration and audit.',
    mermaid: `sequenceDiagram
  participant Dev
  participant Z as Zeebe
  participant Old as v3 instances
  participant New as v4 instances
  Dev->>Z: deploy payment-process v4
  New->>Z: create latest version
  Old-->>Z: continue on v3
  Dev->>Z: migrate selected v3 to v4 plan
  Z-->>Old: token moves to mapped element`,
    code: `package com.vibhu.payment.service;

import io.camunda.zeebe.client.ZeebeClient;
import org.springframework.stereotype.Service;

@Service
public class PaymentProcessDeployment {
  private final ZeebeClient zeebe;

  public PaymentProcessDeployment(ZeebeClient zeebe) {
    this.zeebe = zeebe;
  }

  public long deploy() {
    return zeebe.newDeployResourceCommand()
        .addResourceFromClasspath("payment-process.bpmn")
        .send()
        .join()
        .getProcesses()
        .get(0)
        .getProcessDefinitionKey();
  }
}`,
    bpmn: `<bpmn:process id="payment-process" name="Payment Process" isExecutable="true">
  <!-- v4 adds amount > 100000 manager approval before process-payment -->
  <bpmn:exclusiveGateway id="highValueGateway" name="High value payment?" />
</bpmn:process>`,
    production:
      'Release BPMN and worker code together. Keep old workers until old instances drain or migration is complete.',
    interview30s:
      'Each deployment creates a version. New payments use latest, in-flight payments remain stable unless we intentionally migrate them.',
    mistakes: [
      'Removing a job worker while old versions still need it',
      'Changing gateway conditions without replaying examples',
      'No rollback plan for BPMN deployment',
    ],
    followUp: 'How do you deploy a new manual approval step safely?',
    memoryTrick: 'New model for new work; migrate old work deliberately.',
  },
  {
    id: 'security',
    title: 'Security and Access Control',
    badge: 'Security',
    theory:
      'Secure both the platform and the payment APIs. Use Identity/OIDC for Camunda apps, mTLS or network policy for Zeebe access, scoped credentials for workers, and domain authorization for payment actions.',
    whenToUse:
      'Use separate credentials for deployers, workers, operators, managers, and APIs.',
    whenAvoid:
      'Do not give every service broad Zeebe rights or allow public access to Operate/Tasklist.',
    mermaid: `flowchart TD
  User[Manager OIDC] --> Tasklist
  Operator[Ops OIDC] --> Operate
  API[Payment API] -->|scoped client| Zeebe
  Worker[Worker pods] -->|job activation only| Zeebe
  Net[NetworkPolicy/mTLS] --> Zeebe
  API --> AuthZ[Domain authorization]`,
    code: `package com.vibhu.payment.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class PaymentSecurityConfiguration {
  @Bean
  SecurityFilterChain paymentSecurity(HttpSecurity http) throws Exception {
    return http
        .authorizeHttpRequests(auth -> auth
            .requestMatchers("/api/approvals/**").hasAuthority("SCOPE_payment.approve")
            .requestMatchers("/api/payments/**").hasAuthority("SCOPE_payment.write")
            .anyRequest().authenticated())
        .oauth2ResourceServer(oauth -> oauth.jwt())
        .build();
  }
}`,
    bpmn: `<zeebe:assignmentDefinition candidateGroups="payment-managers" />
<zeebe:taskHeaders>
  <zeebe:header key="requiredScope" value="payment.approve" />
</zeebe:taskHeaders>`,
    production:
      'Protect variables from PII leakage, redact Operate-visible values, rotate client secrets, and restrict who can resolve incidents.',
    interview30s:
      'Security covers Zeebe connectivity, Camunda UI access, worker credentials, API authorization, and variable redaction.',
    mistakes: [
      'Public Operate with sensitive variables',
      'One client secret for every worker and deployer',
      'Approval API checks login but not payment approval scope',
    ],
    followUp: 'How do you prevent support users from seeing PAN in Operate?',
    memoryTrick: 'Secure engine, apps, workers, variables, and domain actions.',
  },
  {
    id: 'observability',
    title: 'Observability and Operations',
    badge: 'Prod',
    theory:
      'Production Camunda needs metrics, logs, traces, and business dashboards. Operate explains workflow tokens and incidents; application telemetry explains worker latency, downstream errors, idempotency, and payment outcomes.',
    whenToUse:
      'Use Operate for incident drill-down and Prometheus/Grafana/APM for fleet-level health.',
    whenAvoid:
      'Do not rely on screenshots of Operate as your only SLO signal.',
    mermaid: `flowchart LR
  W[Workers] --> M[Micrometer metrics]
  W --> L[Structured logs]
  W --> T[Traces]
  Z[Zeebe] --> ZM[Broker/Gateway metrics]
  Z --> OP[Operate incidents]
  M --> G[Grafana]
  L --> SIEM[Log search]
  T --> APM[Trace UI]`,
    code: `package com.vibhu.payment.worker;

import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import io.camunda.zeebe.spring.client.annotation.JobWorker;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class ValidatePaymentWorker {
  private final MeterRegistry registry;

  public ValidatePaymentWorker(MeterRegistry registry) {
    this.registry = registry;
  }

  @JobWorker(type = "validate-payment")
  public Map<String, Object> validate(Map<String, Object> variables) {
    return Timer.builder("payment.worker.duration")
        .tag("jobType", "validate-payment")
        .register(registry)
        .record(() -> Map.of("validated", true));
  }
}`,
    bpmn: `<zeebe:taskHeaders>
  <zeebe:header key="slo" value="payment-critical" />
  <zeebe:header key="runbook" value="https://runbooks/payments/camunda-incidents" />
</zeebe:taskHeaders>`,
    production:
      'Track job activation latency, completion latency, fail count, remaining retries, incidents, exporter lag, partition health, and payment status transitions.',
    interview30s:
      'Operate is for workflow diagnosis; metrics and traces are for SLOs. I tag workers by job type and correlate everything by paymentId.',
    mistakes: [
      'PII in variables, logs, or metric labels',
      'No alert until customers complain',
      'Only monitoring HTTP APIs, not worker backlog',
    ],
    followUp: 'Which alert catches a stuck fraud worker?',
    memoryTrick: 'Operate shows where; telemetry shows how bad.',
  },
  {
    id: 'business-db-vs-workflow',
    title: 'Business DB vs Workflow State',
    badge: 'Boundary',
    theory:
      'The payment DB owns customer-visible payment status, idempotency keys, ledger references, approvals, and audit. Zeebe owns process position, jobs, timers, variables for routing, and incidents. Sync them deliberately.',
    whenToUse:
      'Use the DB for queries, reports, reconciliation, and legal audit. Use Zeebe to coordinate next actions.',
    whenAvoid:
      'Do not ask Zeebe/Operate to answer every customer status query under load.',
    mermaid: `sequenceDiagram
  participant W as Worker
  participant DB as Business DB
  participant Z as Zeebe
  W->>DB: update payment PROCESSING with version check
  W->>Bank: idempotent call paymentId
  W->>DB: save bank reference
  W->>Z: complete job with summary variables
  Note over DB,Z: DB has full truth; Zeebe has routing facts`,
    code: `package com.vibhu.payment.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PaymentService {
  private final PaymentRepository repository;
  private final BankClient bankClient;

  public PaymentService(PaymentRepository repository, BankClient bankClient) {
    this.repository = repository;
    this.bankClient = bankClient;
  }

  @Transactional
  public String process(String paymentId) {
    Payment payment = repository.lockByPaymentId(paymentId);
    if (payment.bankReference() != null) {
      return payment.bankReference();
    }
    String reference = bankClient.charge(paymentId, payment.amountMinor());
    payment.markProcessing(reference);
    repository.save(payment);
    return reference;
  }
}`,
    bpmn: `<zeebe:output source="=bankReference" target="bankReference" />
<zeebe:output source="='PROCESSING'" target="paymentStatus" />`,
    production:
      'Write the DB before completing the job for side effects. If completion fails, retry sees the DB reference and completes safely.',
    interview30s:
      'The DB is the payment system of record. Zeebe carries enough variables to route the workflow and recover incidents.',
    mistakes: [
      'Customer GET endpoint reads Operate only',
      'No unique constraint on paymentId/idempotencyKey',
      'Completing workflow before committing business state',
    ],
    followUp: 'How do you handle DB commit success but job completion failure?',
    memoryTrick: 'DB answers what happened; workflow answers what next.',
  },
];
