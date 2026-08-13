import type {CamundaTopic} from './types';

export const TOPICS_B: CamundaTopic[] = [
  {
    id: 'zeebe-storage',
    title: 'Zeebe Storage and Partitions',
    badge: 'Engine',
    theory:
      'Zeebe persists commands, events, and state transitions in partitioned logs. A workflow instance is assigned to a partition, and exporters project runtime data to Operate/Optimize. This gives scalability but not a relational query model.',
    whenToUse:
      'Use Zeebe state for workflow progress, timers, jobs, variables needed for routing, and incident recovery.',
    whenAvoid:
      'Do not store ledgers, balances, card data, or long business history only as workflow variables.',
    mermaid: `flowchart LR
  C[Create command] --> P1[Partition log]
  P1 --> S1[Stream processor]
  S1 --> ST[(Zeebe state)]
  S1 --> J[Job available]
  W[Worker] --> C2[Complete command]
  C2 --> P1
  P1 --> X[Exporter]
  X --> OP[(Operate index)]`,
    code: `package com.vibhu.payment.service;

import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class PaymentWorkflowVariables {
  public Map<String, Object> startVariables(Payment payment) {
    return Map.of(
        "paymentId", payment.id(),
        "amount", payment.amountMinor(),
        "currency", payment.currency(),
        "customerId", payment.customerId(),
        "businessKey", payment.id());
  }

  public Map<String, Object> avoid() {
    return Map.of(
        "doNotStoreHere", "PAN, CVV, full account number, ledger entries, raw bank payload");
  }
}`,
    bpmn: `<zeebe:ioMapping>
  <zeebe:input source="=paymentId" target="paymentId" />
  <zeebe:input source="=amount" target="amount" />
  <zeebe:output source="=fraudStatus" target="fraudStatus" />
</zeebe:ioMapping>`,
    production:
      'Control variable size, exporter lag, snapshot storage, disk pressure, and partition count. Treat Operate data as operational projection.',
    interview30s:
      'Zeebe stores workflow events and state in partitioned logs. It is durable orchestration storage, not the payment system of record.',
    mistakes: [
      'Large JSON documents as process variables',
      'Relying on Operate indexes for transactional reads',
      'No disk and exporter-lag alerts',
    ],
    followUp: 'What happens if Elasticsearch is down but Zeebe is healthy?',
    memoryTrick: 'Log for workflow, DB for business truth.',
  },
  {
    id: 'bpmn-elements',
    title: 'BPMN Elements You Actually Need',
    badge: 'BPMN',
    theory:
      'Most production payment processes use start/end events, service tasks, user tasks, gateways, message events, timer events, boundary events, and subprocesses. Start small and make exceptional paths explicit.',
    whenToUse:
      'Use gateways for business decisions, boundary events for timeout/error edges, and subprocesses for grouping compensation or approval.',
    whenAvoid:
      'Avoid modeling every Java branch as a BPMN gateway; keep BPMN at business-readable granularity.',
    mermaid: `flowchart TD
  S((Start)) --> ST[Service task]
  ST --> G{Exclusive gateway}
  G -->|auto| P[Process payment]
  G -->|manual| U[User task]
  U --> P
  P --> E((End))
  ST -. error .-> ER[Error boundary]
  U -. timer .-> TO[Timeout boundary]`,
    code: `package com.vibhu.payment.worker;

import io.camunda.zeebe.spring.client.annotation.JobWorker;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class AccountValidationWorker {
  @JobWorker(type = "account-validation")
  public Map<String, Object> validateAccount(Map<String, Object> variables) {
    String paymentId = (String) variables.get("paymentId");
    boolean valid = paymentId != null && !paymentId.isBlank();
    return Map.of("accountValid", valid);
  }
}`,
    bpmn: `<bpmn:exclusiveGateway id="amountGateway" name="High value?" />
<bpmn:sequenceFlow sourceRef="amountGateway" targetRef="manualReview">
  <bpmn:conditionExpression xsi:type="bpmn:tFormalExpression">=amount &gt; 100000</bpmn:conditionExpression>
</bpmn:sequenceFlow>
<bpmn:userTask id="manualReview" name="Manager approval" />`,
    production:
      'Prefer clear BPMN names: Validate payment, Fraud check, Bank settlement. Operators use these names at 3 AM.',
    interview30s:
      'I model business milestones with service tasks, gateways, user tasks, timers, messages, and boundary events for exceptions.',
    mistakes: [
      'Over-modeling low-level code branches',
      'Unnamed gateways and cryptic task IDs',
      'No explicit timeout branch',
    ],
    followUp: 'When would you choose a boundary event over a gateway?',
    memoryTrick: 'BPMN is the map, not every footstep.',
  },
  {
    id: 'user-tasks',
    title: 'User Tasks and Manager Approval',
    badge: 'Human',
    theory:
      'A user task pauses the workflow for a human decision. For high-value payments above 100000, Tasklist or a custom approval UI can complete manual-review with approved or rejected variables.',
    whenToUse:
      'Use user tasks for manager approval, compliance review, KYC exception, or manual bank reconciliation.',
    whenAvoid:
      'Do not use user tasks for machine delays; use timers or messages instead.',
    mermaid: `sequenceDiagram
  participant Z as Zeebe
  participant T as Tasklist
  participant M as Manager
  participant API as Approval API
  Z-->>T: create manual-review task
  M->>T: review payment > 100000
  T->>API: approve/reject
  API->>Z: complete task variables
  Z-->>Z: continue process`,
    code: `package com.vibhu.payment.controller;

import io.camunda.zeebe.client.ZeebeClient;
import java.util.Map;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/approvals")
public class ApprovalController {
  private final ZeebeClient zeebe;

  public ApprovalController(ZeebeClient zeebe) {
    this.zeebe = zeebe;
  }

  @PostMapping("/{taskKey}/approve")
  public Map<String, Object> approve(@PathVariable long taskKey) {
    zeebe.newUserTaskCompleteCommand(taskKey)
        .variables(Map.of("managerApproved", true, "reviewOutcome", "APPROVED"))
        .send()
        .join();
    return Map.of("taskKey", taskKey, "completed", true);
  }
}`,
    bpmn: `<bpmn:userTask id="manualReview" name="Manager approval">
  <bpmn:extensionElements>
    <zeebe:assignmentDefinition candidateGroups="payment-managers" />
    <zeebe:formDefinition formId="payment-manual-review" />
  </bpmn:extensionElements>
</bpmn:userTask>`,
    production:
      'Mirror approvals into an audit table with actor, timestamp, old/new status, reason, and correlation IDs.',
    interview30s:
      'For amount > 100000, the workflow creates a manager task; completing it returns approved/rejected variables and resumes orchestration.',
    mistakes: [
      'No authorization on task completion',
      'No SLA timer on manual review',
      'Approval decision not audited outside Tasklist',
    ],
    followUp: 'How do you handle a manager never acting?',
    memoryTrick: 'Humans need task, SLA, audit.',
  },
  {
    id: 'timers',
    title: 'Timers and Approval Timeouts',
    badge: 'SLA',
    theory:
      'Timers model waiting without holding threads. Use boundary timers for approval SLAs and intermediate timers for scheduled wait states. Timers are durable workflow state, not sleeps in workers.',
    whenToUse:
      'Use timers for approval timeout, bank callback wait, retry backoff windows, and escalation.',
    whenAvoid:
      'Avoid Thread.sleep in workers and cron jobs that duplicate workflow timeout logic.',
    mermaid: `sequenceDiagram
  participant Z as Zeebe
  participant Task as Manual review
  participant Esc as Escalation
  Z->>Task: create user task
  par waiting
    Task-->>Z: manager approves
  and SLA clock
    Z-->>Esc: PT30M timer fires
  end
  Esc-->>Z: escalate or reject`,
    code: `package com.vibhu.payment.worker;

import io.camunda.zeebe.spring.client.annotation.JobWorker;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class ManualReviewWorker {
  @JobWorker(type = "manual-review")
  public Map<String, Object> escalate(Map<String, Object> variables) {
    return Map.of(
        "reviewOutcome", "ESCALATED",
        "escalationReason", "approval timer expired");
  }
}`,
    bpmn: `<bpmn:userTask id="manualReview" name="Manager approval" />
<bpmn:boundaryEvent id="approvalTimeout" attachedToRef="manualReview" cancelActivity="true">
  <bpmn:timerEventDefinition>
    <bpmn:timeDuration>PT30M</bpmn:timeDuration>
  </bpmn:timerEventDefinition>
</bpmn:boundaryEvent>
<bpmn:serviceTask id="escalateReview" zeebe:taskDefinitionType="manual-review" />`,
    production:
      'Use ISO-8601 durations, document business timezone rules for due dates, and alert on timer-heavy partitions if volumes spike.',
    interview30s:
      'A timer is a durable wait state. For approval, I attach a boundary timer so the workflow escalates or rejects when SLA expires.',
    mistakes: [
      'Sleeping inside a worker',
      'No business owner for timeout duration',
      'Timer branch loses payment status update',
    ],
    followUp: 'What is cancelActivity on a boundary timer?',
    memoryTrick: 'Timer waits; worker works.',
  },
  {
    id: 'messages',
    title: 'Messages and Bank Callback Correlation',
    badge: 'Async',
    theory:
      'Messages resume a waiting workflow by correlation key. For payments, use paymentId or a bank reference mapping to correlate bank callbacks, cancellations, or external fraud results.',
    whenToUse:
      'Use messages when an external party completes later: bank callback, cancellation, dispute, or manual external approval.',
    whenAvoid:
      'Avoid message correlation without a stable key and idempotent handling.',
    mermaid: `sequenceDiagram
  participant Bank
  participant API as PaymentController
  participant DB as payment DB
  participant Z as Zeebe
  Bank->>API: POST /api/payments/{id}/bank-callback
  API->>DB: upsert callback idempotently
  API->>Z: publish BankSettled(paymentId)
  Z-->>Z: continue from catch event
  Z-->>API: accepted`,
    code: `package com.vibhu.payment.controller;

import io.camunda.zeebe.client.ZeebeClient;
import java.util.Map;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/payments")
public class PaymentCallbackController {
  private final ZeebeClient zeebe;

  public PaymentCallbackController(ZeebeClient zeebe) {
    this.zeebe = zeebe;
  }

  @PostMapping("/{paymentId}/bank-callback")
  public Map<String, Object> callback(@PathVariable String paymentId) {
    zeebe.newPublishMessageCommand()
        .messageName("BankSettled")
        .correlationKey(paymentId)
        .timeToLive(java.time.Duration.ofMinutes(10))
        .variables(Map.of("bankStatus", "SETTLED"))
        .send()
        .join();
    return Map.of("paymentId", paymentId, "correlated", true);
  }
}`,
    bpmn: `<bpmn:intermediateCatchEvent id="waitForBank" name="Wait for bank">
  <bpmn:messageEventDefinition messageRef="BankSettledMessage" />
</bpmn:intermediateCatchEvent>
<bpmn:message id="BankSettledMessage" name="BankSettled">
  <bpmn:extensionElements>
    <zeebe:subscription correlationKey="=paymentId" />
  </bpmn:extensionElements>
</bpmn:message>`,
    production:
      'Persist callback first, publish message second, and make duplicate callbacks harmless. Tune message TTL for out-of-order arrival.',
    interview30s:
      'A message resumes a workflow using a correlation key, usually paymentId. I persist the external callback idempotently before publishing it to Zeebe.',
    mistakes: [
      'Using customerId as correlation key for multiple payments',
      'No TTL for early messages',
      'Publishing message before saving callback evidence',
    ],
    followUp: 'What if the bank callback arrives before the process reaches the catch event?',
    memoryTrick: 'Message needs name, key, TTL, and idempotency.',
  },
  {
    id: 'errors-retries-incidents',
    title: 'Errors, Retries, and Incidents',
    badge: 'Failure',
    theory:
      'A worker can complete, throw BPMN business error, or fail the job for technical retry. When retries reach zero, Zeebe creates an incident. Operators fix data/downstream issues and resolve the incident.',
    whenToUse:
      'Use BPMN errors for expected business outcomes like fraud reject; use fail/retry for transient 5xx, timeouts, and dependency errors.',
    whenAvoid:
      'Do not throw generic exceptions for business decisions or retry permanent validation failures forever.',
    mermaid: `sequenceDiagram
  participant Z as Zeebe
  participant W as BankSettlementWorker
  participant B as Bank API
  participant O as Operate
  Z-->>W: job retries=3
  W->>B: settle
  B-->>W: 500 timeout
  W-->>Z: fail retries=2 backoff=PT30S
  W->>B: retry
  B-->>W: 500
  W-->>Z: fail retries=0
  Z-->>O: incident
  O->>Z: resolve after fix`,
    code: `package com.vibhu.payment.worker;

import io.camunda.zeebe.client.ZeebeClient;
import io.camunda.zeebe.client.api.response.ActivatedJob;
import io.camunda.zeebe.spring.client.annotation.JobWorker;
import java.time.Duration;
import org.springframework.stereotype.Component;

@Component
public class BankSettlementWorker {
  private final ZeebeClient zeebe;
  private final BankService bankService;

  public BankSettlementWorker(ZeebeClient zeebe, BankService bankService) {
    this.zeebe = zeebe;
    this.bankService = bankService;
  }

  @JobWorker(type = "bank-settlement", autoComplete = false)
  public void settle(ActivatedJob job) {
    try {
      bankService.settle((String) job.getVariablesAsMap().get("paymentId"));
      zeebe.newCompleteCommand(job.getKey()).send().join();
    } catch (BankTimeoutException ex) {
      zeebe.newFailCommand(job.getKey())
          .retries(Math.max(job.getRetries() - 1, 0))
          .retryBackoff(Duration.ofSeconds(30))
          .errorMessage("Bank timeout")
          .send()
          .join();
    }
  }
}`,
    bpmn: `<bpmn:serviceTask id="bankSettlement" name="Bank settlement">
  <bpmn:extensionElements>
    <zeebe:taskDefinition type="bank-settlement" retries="3" />
  </bpmn:extensionElements>
</bpmn:serviceTask>
<bpmn:boundaryEvent id="bankBusinessError" attachedToRef="bankSettlement">
  <bpmn:errorEventDefinition errorRef="PaymentRejectedByBank" />
</bpmn:boundaryEvent>`,
    production:
      'Separate business rejection, retryable technical failure, and incident. Alert on incidents by element ID and stale jobs with low remaining retries.',
    interview30s:
      'Expected business failures take BPMN error paths. Transient technical failures decrement retries; zero retries creates an incident visible in Operate.',
    mistakes: [
      'Retrying fraud rejection as if it were a timeout',
      'Failing jobs without useful redacted error messages',
      'No runbook for incident resolution',
    ],
    followUp: 'How do you avoid charging twice when a retry happens after a bank timeout?',
    memoryTrick: 'Business error routes; technical failure retries; incident asks humans.',
  },
];
