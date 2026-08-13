import type {CamundaTopic} from './types';

export const TOPICS_A: CamundaTopic[] = [
  {
    id: 'architecture',
    title: 'Camunda 8 Architecture for Payments',
    badge: 'Foundation',
    theory:
      'Camunda 8 is a workflow platform around Zeebe, a horizontally scalable workflow engine. The payment service starts process instances, workers execute jobs, and Operate/Tasklist expose runtime state. Keep money movement in your services and use workflow state for orchestration.',
    whenToUse:
      'Use it when a payment spans validation, fraud, gateway, account, processing, bank callbacks, manual review, notification, and long-running retries.',
    whenAvoid:
      'Avoid using BPMN as a replacement for domain models, ledger consistency, or high-throughput event streaming that has no orchestration state.',
    mermaid: `flowchart LR
  API[PaymentController :8094] --> ZG[Zeebe Gateway :26500]
  ZG --> B1[Broker Partition 1]
  ZG --> B2[Broker Partition 2]
  B1 --> E[(Event Log)]
  B2 --> E
  W1[ValidatePaymentWorker] --> ZG
  W2[FraudCheckWorker] --> ZG
  W3[ProcessPaymentWorker] --> ZG
  W4[NotifyPaymentWorker] --> ZG
  E --> ES[(Elasticsearch / OpenSearch)]
  ES --> OP[Operate :8081]
  ES --> TL[Tasklist]
  API --> DB[(Business DB)]`,
    code: `package com.vibhu.payment.config;

import io.camunda.zeebe.client.ZeebeClient;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class CamundaConfiguration {
  @Bean
  ZeebeClient zeebeClient() {
    return ZeebeClient.newClientBuilder()
        .gatewayAddress("127.0.0.1:26500")
        .usePlaintext()
        .build();
  }
}

# application.yml
server:
  port: 8094
camunda:
  client:
    zeebe:
      gateway-url: http://127.0.0.1:26500
      prefer-rest-over-grpc: false
operate:
  url: http://127.0.0.1:8081`,
    bpmn: `<bpmn:process id="payment-process" isExecutable="true">
  <bpmn:startEvent id="paymentRequested" />
  <bpmn:serviceTask id="validate" zeebe:taskDefinitionType="validate-payment" />
  <bpmn:serviceTask id="fraud" zeebe:taskDefinitionType="fraud-check" />
  <bpmn:serviceTask id="process" zeebe:taskDefinitionType="process-payment" />
  <bpmn:endEvent id="paymentCompleted" />
</bpmn:process>`,
    production:
      'Size partitions for workflow throughput, not HTTP QPS. Keep Zeebe durable, workers stateless, and the payment DB authoritative for balances, ledger rows, and idempotency.',
    interview30s:
      'Camunda 8 uses Zeebe as the engine, workers pull jobs by type, and Operate/Tasklist provide visibility. For payments, workflow orchestrates steps while services own money correctness.',
    mistakes: [
      'Putting ledger mutation inside BPMN variables only',
      'Running one worker with every job type and no backpressure',
      'Treating Operate as the business reporting database',
    ],
    followUp: 'What state belongs in Zeebe and what state belongs in your payment DB?',
    memoryTrick: 'Zeebe remembers the path; the business DB owns the money.',
  },
  {
    id: 'c7-vs-c8',
    title: 'Camunda 7 vs Camunda 8',
    badge: 'Migration',
    theory:
      'Camunda 7 embeds or connects to a relational process engine. Camunda 8 runs Zeebe as a distributed engine with append-only event logs and external workers. The model is still BPMN, but operations, APIs, scaling, and job execution change.',
    whenToUse:
      'Use C8 for cloud-native orchestration, horizontal workers, long-running processes, and independent engine scaling.',
    whenAvoid:
      'Do not assume C7 Java delegates, engine transactions, SQL queries, or embedded engine extensions move unchanged to C8.',
    mermaid: `flowchart TD
  C7[Camunda 7] --> C7E[Embedded/remote engine]
  C7E --> SQL[(Relational DB)]
  C7E --> JD[JavaDelegate in engine transaction]
  C8[Camunda 8] --> Z[Zeebe cluster]
  Z --> LOG[(Partitioned event log)]
  Z --> EXT[External workers]
  Z --> EXP[Exporter to Operate]`,
    code: `package com.vibhu.payment.worker;

// Camunda 7 style: JavaDelegate runs in engine transaction.
// public class ValidateDelegate implements JavaDelegate { ... }

import io.camunda.zeebe.spring.client.annotation.JobWorker;
import io.camunda.zeebe.client.api.response.ActivatedJob;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class ValidatePaymentWorker {
  @JobWorker(type = "validate-payment", autoComplete = true)
  public Map<String, Object> validate(ActivatedJob job) {
    String paymentId = (String) job.getVariablesAsMap().get("paymentId");
    return Map.of("validated", true, "paymentId", paymentId);
  }
}`,
    bpmn: `<bpmn:serviceTask id="validatePayment" name="Validate payment">
  <bpmn:extensionElements>
    <zeebe:taskDefinition type="validate-payment" />
  </bpmn:extensionElements>
</bpmn:serviceTask>`,
    production:
      'Migrations must rewrite delegates into idempotent workers, replace engine SQL reads with Operate/Optimize/API views, and retest retry semantics.',
    interview30s:
      'C7 is relational-engine centric; C8 is Zeebe plus external workers. BPMN remains familiar, but execution is distributed and pull-based.',
    mistakes: [
      'Porting JavaDelegate code directly',
      'Expecting the Zeebe broker to join your business DB transaction',
      'Using C7 SQL monitoring patterns against C8',
    ],
    followUp: 'Why does the external worker model change transaction boundaries?',
    memoryTrick: 'C7 delegates; C8 workers.',
  },
  {
    id: 'components',
    title: 'Core Components',
    badge: 'Operate',
    theory:
      'Zeebe broker executes workflow state. Gateway exposes gRPC/REST entry points. Workers handle job types. Operate inspects incidents and tokens, Tasklist handles user tasks, Optimize reports, and Identity secures access.',
    whenToUse:
      'Use this component map when debugging where a failure lives: command ingestion, broker processing, worker code, exporter, or UI.',
    whenAvoid:
      'Do not route business traffic through Operate/Tasklist; they are visibility and human-task products, not payment APIs.',
    mermaid: `sequenceDiagram
  participant API as PaymentController
  participant GW as Zeebe Gateway
  participant BR as Broker
  participant WK as Worker
  participant OP as Operate
  API->>GW: create instance
  GW->>BR: append command
  WK->>GW: activate validate-payment
  WK->>BR: complete job
  BR-->>OP: exporter data
  OP-->>API: inspect incident manually`,
    code: `package com.vibhu.payment.controller;

import io.camunda.zeebe.client.ZeebeClient;
import java.util.Map;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {
  private final ZeebeClient zeebe;

  public PaymentController(ZeebeClient zeebe) {
    this.zeebe = zeebe;
  }

  @PostMapping
  public Map<String, Object> start(@RequestBody PaymentRequest request) {
    var result = zeebe.newCreateInstanceCommand()
        .bpmnProcessId("payment-process")
        .latestVersion()
        .variables(Map.of("paymentId", request.paymentId(), "amount", request.amount()))
        .send()
        .join();
    return Map.of("processInstanceKey", result.getProcessInstanceKey());
  }
}

record PaymentRequest(String paymentId, long amount, String currency) {}`,
    bpmn: `<zeebe:taskDefinition type="fraud-check" retries="3" />
<zeebe:taskHeaders>
  <zeebe:header key="component" value="fraud-service" />
</zeebe:taskHeaders>`,
    production:
      'Alert separately on broker health, gateway latency, activated-but-not-completed jobs, exporter lag, and incidents by BPMN element.',
    interview30s:
      'Gateway receives commands, brokers execute, workers complete jobs, Operate shows runtime state, and Tasklist owns human work.',
    mistakes: [
      'Debugging only worker logs when the exporter is lagging',
      'Letting Tasklist be the only approval audit trail',
      'Ignoring gateway saturation',
    ],
    followUp: 'Which metric tells you workers are too slow?',
    memoryTrick: 'Gateway accepts, broker decides, worker acts, Operate explains.',
  },
  {
    id: 'payment-bpmn',
    title: 'Payment Processing BPMN',
    badge: 'Story',
    theory:
      'The interview story is Validate -> Fraud -> Gateway -> Account -> Process -> Bank -> Notify. The model also handles fraud rejection, bank timeout/5xx retry, incidents, and manager approval for amount above 100000.',
    whenToUse:
      'Use BPMN when the business wants visible, versioned orchestration across automated and manual payment steps.',
    whenAvoid:
      'Avoid one giant BPMN with every internal method call; model stable business milestones, not private code structure.',
    mermaid: `flowchart LR
  S((Start)) --> V[Validate]
  V --> F[Fraud]
  F -->|reject| R[Notify rejected]
  F -->|ok| G[Gateway]
  G --> A[Account]
  A --> X{amount > 100000?}
  X -->|yes| M[Manager approval]
  X -->|no| P[Process]
  M --> P
  P --> B[Bank]
  B --> N[Notify]
  N --> E((End))
  B -. timeout/5xx .-> I[Retry then incident]`,
    code: `package com.vibhu.payment.worker;

import io.camunda.zeebe.spring.client.annotation.JobWorker;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class ProcessPaymentWorker {
  private final PaymentService paymentService;

  public ProcessPaymentWorker(PaymentService paymentService) {
    this.paymentService = paymentService;
  }

  @JobWorker(type = "process-payment")
  public Map<String, Object> process(Map<String, Object> variables) {
    String paymentId = (String) variables.get("paymentId");
    String bankReference = paymentService.process(paymentId);
    return Map.of("processed", true, "bankReference", bankReference);
  }
}`,
    bpmn: `payment-process.bpmn

start -> validate-payment -> fraud-check
fraudStatus == REJECTED -> notify-payment -> end
fraudStatus == APPROVED -> payment-gateway -> account-validation
amount > 100000 -> manual-review -> process-payment
amount <= 100000 -> process-payment
process-payment -> bank-settlement -> notify-payment -> end`,
    production:
      'Make every step idempotent by paymentId. Persist external references before completing jobs so a worker crash can safely retry.',
    interview30s:
      'I model the payment as visible milestones with idempotent workers and explicit exceptions for fraud reject, manual approval, and bank retry/incident.',
    mistakes: [
      'Completing the job before saving the bank reference',
      'Using amount strings instead of validated minor units',
      'No explicit fraud-rejected end state',
    ],
    followUp: 'Where do you store payment status: BPMN variable or payment table?',
    memoryTrick: 'Model milestones, code details.',
  },
  {
    id: 'spring-workers',
    title: 'Spring Boot Workers',
    badge: 'Java',
    theory:
      'Workers subscribe to job types and execute outside the broker. They must be idempotent because failures, timeouts, deployments, and retries can run the same business action again. In payments, idempotency is not optional.',
    whenToUse:
      'Use Spring workers for service tasks like validate-payment, fraud-check, account-validation, process-payment, notify-payment, and manual-review integration.',
    whenAvoid:
      'Do not put blocking calls without timeouts or unbounded concurrency inside workers.',
    mermaid: `sequenceDiagram
  participant Z as Zeebe
  participant W as FraudCheckWorker
  participant F as FraudService
  Z-->>W: activate fraud-check job
  W->>F: check(paymentId, amount)
  alt reject
    W-->>Z: complete fraudStatus=REJECTED
  else ok
    W-->>Z: complete fraudStatus=APPROVED
  end`,
    code: `package com.vibhu.payment.worker;

import io.camunda.zeebe.client.api.response.ActivatedJob;
import io.camunda.zeebe.spring.client.annotation.JobWorker;
import java.time.Duration;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class FraudCheckWorker {
  private final FraudService fraudService;

  public FraudCheckWorker(FraudService fraudService) {
    this.fraudService = fraudService;
  }

  @JobWorker(type = "fraud-check", timeout = 30_000, maxJobsActive = 32)
  public Map<String, Object> check(ActivatedJob job) {
    Map<String, Object> vars = job.getVariablesAsMap();
    FraudDecision decision = fraudService.check(
        (String) vars.get("paymentId"),
        ((Number) vars.get("amount")).longValue(),
        Duration.ofSeconds(2));
    return Map.of("fraudStatus", decision.status(), "fraudReason", decision.reason());
  }
}`,
    bpmn: `<bpmn:serviceTask id="fraudCheck" name="Fraud check">
  <bpmn:extensionElements>
    <zeebe:taskDefinition type="fraud-check" retries="3" />
  </bpmn:extensionElements>
</bpmn:serviceTask>`,
    production:
      'Use bounded maxJobsActive, client-side timeouts, idempotency keys, dead-letter business states, and metrics per job type.',
    interview30s:
      'A worker pulls jobs by type, executes idempotent business code, and completes/fails the job with variables. Zeebe handles retries and incidents.',
    mistakes: [
      'No idempotency key for bank calls',
      'Returning huge objects as variables',
      'Letting one slow downstream exhaust all worker threads',
    ],
    followUp: 'What happens if the worker performs the bank call and crashes before completing the job?',
    memoryTrick: 'Workers can replay; side effects must not.',
  },
  {
    id: 'rest-apis',
    title: 'REST APIs Around Camunda',
    badge: 'API',
    theory:
      'Your application API should hide Zeebe details from clients. The controller starts workflows, correlates messages, exposes payment status from the business DB, and links operators to Operate for diagnostics.',
    whenToUse:
      'Use REST for external clients and internal services that request, approve, cancel, or query payments.',
    whenAvoid:
      'Do not expose raw processInstanceKey as the only customer-facing identifier; use paymentId and access control.',
    mermaid: `sequenceDiagram
  participant Client
  participant API as PaymentController :8094
  participant DB as payment table
  participant Z as Zeebe :26500
  Client->>API: POST /api/payments
  API->>DB: insert REQUESTED idempotently
  API->>Z: create payment-process
  API-->>Client: 202 paymentId
  Client->>API: GET /api/payments/{id}
  API->>DB: read status
  API-->>Client: APPROVED/REJECTED/PENDING`,
    code: `package com.vibhu.payment.controller;

import io.camunda.zeebe.client.ZeebeClient;
import java.util.Map;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {
  private final ZeebeClient zeebe;
  private final PaymentService paymentService;

  public PaymentController(ZeebeClient zeebe, PaymentService paymentService) {
    this.zeebe = zeebe;
    this.paymentService = paymentService;
  }

  @PostMapping("/{paymentId}/cancel")
  public Map<String, Object> cancel(@PathVariable String paymentId) {
    paymentService.markCancelRequested(paymentId);
    zeebe.newPublishMessageCommand()
        .messageName("PaymentCancelled")
        .correlationKey(paymentId)
        .variables(Map.of("cancelRequested", true))
        .send()
        .join();
    return Map.of("paymentId", paymentId, "status", "CANCEL_REQUESTED");
  }
}`,
    bpmn: `<bpmn:intermediateCatchEvent id="waitForCancel" name="Payment cancelled">
  <bpmn:messageEventDefinition messageRef="PaymentCancelledMessage" />
</bpmn:intermediateCatchEvent>
<bpmn:message id="PaymentCancelledMessage" name="PaymentCancelled">
  <bpmn:extensionElements>
    <zeebe:subscription correlationKey="=paymentId" />
  </bpmn:extensionElements>
</bpmn:message>`,
    production:
      'Return 202 for async starts, protect approval/cancel APIs with authz, and read customer-facing status from your DB projection.',
    interview30s:
      'My API starts and signals workflows, but clients see paymentId and domain status, not raw workflow internals.',
    mistakes: [
      'Blocking the HTTP thread until the entire process completes',
      'Leaking process keys to unauthorized callers',
      'Reading status only from Operate',
    ],
    followUp: 'Why return 202 instead of 200 with final bank result?',
    memoryTrick: 'REST owns the contract; Zeebe owns the orchestration.',
  },
];
