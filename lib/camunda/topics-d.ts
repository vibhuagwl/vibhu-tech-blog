import type {CamundaTopic} from './types';

export const TOPICS_D: CamundaTopic[] = [
  {
    id: 'testing',
    title: 'Testing BPMN and Workers',
    badge: 'Quality',
    theory:
      'Test the BPMN model, worker behavior, idempotency, retries, incidents, and message/timer paths. Unit tests validate services; workflow tests validate process routing and variable contracts.',
    whenToUse:
      'Use focused tests for fraud reject, bank timeout retry, approval threshold, callback correlation, and compensation.',
    whenAvoid:
      'Do not rely only on clicking through Operate in a dev environment.',
    mermaid: `flowchart TD
  U[Unit tests] --> S[Service invariants]
  W[Worker tests] --> J[Job variables and failures]
  B[BPMN tests] --> R[Routing paths]
  I[Integration tests] --> Z[Test Zeebe/Testcontainers]
  E[E2E tests] --> API[REST + workflow + DB]`,
    code: `package com.vibhu.payment.worker;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;
import org.junit.jupiter.api.Test;

class FraudCheckWorkerTest {
  @Test
  void rejectsKnownFraudPattern() {
    FraudService fraudService = new FakeFraudService("REJECTED");
    FraudCheckWorker worker = new FraudCheckWorker(fraudService);

    Map<String, Object> result = worker.check(new FakeActivatedJob(Map.of(
        "paymentId", "pay-123",
        "amount", 999999L)));

    assertThat(result).containsEntry("fraudStatus", "REJECTED");
  }
}`,
    bpmn: `Test cases for payment-process.bpmn

1. amount 5000, fraud APPROVED -> process-payment -> bank-settlement -> notify-payment
2. fraud REJECTED -> notify-payment with REJECTED -> end
3. amount 150000 -> manual-review -> process-payment
4. bank 5xx three times -> incident at bankSettlement
5. manager timeout PT30M -> manual-review escalation`,
    production:
      'Keep frozen BPMN fixtures and variable examples in source control. Add tests before changing gateway conditions.',
    interview30s:
      'I test workers as idempotent units and test BPMN paths for approval, rejection, retry/incident, message, timer, and compensation.',
    mistakes: [
      'No test for amount exactly 100000',
      'Only happy-path workflow test',
      'Mocking away idempotency behavior',
    ],
    followUp: 'How do you test timers without waiting 30 minutes?',
    memoryTrick: 'Test services, jobs, routes, and recovery.',
  },
  {
    id: 'k8s',
    title: 'Kubernetes Deployment',
    badge: 'K8s',
    theory:
      'In Kubernetes, run Zeebe, Gateway, Operate, Tasklist, Identity, Elasticsearch/OpenSearch, and workers with independent scaling. Workers are stateless pods; brokers need durable volumes and careful resources.',
    whenToUse:
      'Use K8s when teams need production-grade scaling, rolling deployments, secrets, network policies, and autoscaling workers by job backlog.',
    whenAvoid:
      'Do not run brokers like disposable stateless pods or ignore disk I/O and snapshot sizing.',
    mermaid: `flowchart TD
  Ingress --> API[Payment API pods :8094]
  API --> GW[Zeebe Gateway svc :26500]
  W[Worker deployment] --> GW
  GW --> ZS[Zeebe StatefulSet]
  ZS --> PVC[(PVC)]
  ZS --> ES[(Elastic/OpenSearch)]
  ES --> OP[Operate :8081]
  Secret[OIDC/Zeebe secrets] --> API
  NP[NetworkPolicy] --> GW`,
    code: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: camunda-payment-workers
spec:
  replicas: 3
  selector:
    matchLabels: {app: camunda-payment-workers}
  template:
    metadata:
      labels: {app: camunda-payment-workers}
    spec:
      containers:
        - name: workers
          image: vibhu/camunda-payment-platform:latest
          ports:
            - containerPort: 8094
          env:
            - name: CAMUNDA_CLIENT_ZEEBE_GATEWAY_URL
              value: http://zeebe-gateway:26500
          readinessProbe:
            httpGet: {path: /actuator/health/readiness, port: 8094}`,
    bpmn: `<zeebe:taskDefinition type="process-payment" retries="3" />
<!-- Worker pods scale horizontally; BPMN job type remains stable. -->`,
    production:
      'Use PDBs, anti-affinity, persistent volumes, resource requests, backup/restore drills, and separate HPA policies per worker deployment.',
    interview30s:
      'Brokers are stateful; workers are stateless. I scale workers by job backlog and protect Zeebe with storage, network, and rollout controls.',
    mistakes: [
      'No persistent volume for brokers',
      'Single worker deployment for all job types',
      'Rolling out new BPMN while old workers are gone',
    ],
    followUp: 'Which pods need persistent storage?',
    memoryTrick: 'Stateful engine, stateless workers.',
  },
  {
    id: 'mistakes',
    title: 'Common Production Mistakes',
    badge: 'Runbook',
    theory:
      'Most Camunda incidents come from boundary mistakes: non-idempotent workers, wrong variables, no retry strategy, sensitive data in variables, missing old workers, and unclear ownership between workflow and business DB.',
    whenToUse:
      'Use this as the pre-production readiness checklist before enabling real payments.',
    whenAvoid:
      'Do not treat BPMN visibility as a substitute for domain correctness and runbooks.',
    mermaid: `flowchart LR
  Bad[Non-idempotent worker] --> Retry[Zeebe retry]
  Retry --> Double[Duplicate charge]
  Fix[Idempotency key + DB reference] --> Safe[Retry completes safely]
  Bad2[Huge variables] --> Slow[Exporter/UI pain]
  Fix2[Small routing variables] --> Clear[Operate readable]`,
    code: `package com.vibhu.payment.worker;

// Bad: call bank, then complete job, with no persisted reference.
// Good: use paymentId as idempotency key, persist bankReference, then complete.

public final class WorkerRule {
  public static final String RULE =
      "If a side effect can happen twice, store its external reference before completing the job.";
}`,
    bpmn: `<bpmn:serviceTask id="processPayment" name="Process payment">
  <bpmn:extensionElements>
    <zeebe:taskDefinition type="process-payment" retries="3" />
    <zeebe:taskHeaders>
      <zeebe:header key="idempotencyKey" value="=paymentId" />
    </zeebe:taskHeaders>
  </bpmn:extensionElements>
</bpmn:serviceTask>`,
    production:
      'Every production incident should map back to a model, worker, variable, retry, or ownership rule that can be improved.',
    interview30s:
      'The biggest mistakes are non-idempotent workers, wrong state ownership, no incident runbook, leaking PII in variables, and unsafe version rollout.',
    mistakes: [
      'Manual incident resolution without audit',
      'No old worker for old process version',
      'Workflow variables contain full bank payloads',
    ],
    followUp: 'What is your first review comment on a new payment worker?',
    memoryTrick: 'Idempotency first, visibility second, elegance third.',
  },
  {
    id: 'alternatives',
    title: 'Camunda vs Temporal, Step Functions, and Kafka',
    badge: 'Decision',
    theory:
      'Camunda is strongest when BPMN visibility, business collaboration, human tasks, and explicit process diagrams matter. Temporal is code-first durable execution, Step Functions is AWS-managed state machine orchestration, and Kafka is event streaming.',
    whenToUse:
      'Use Camunda for business-readable payment orchestration with operations visibility and human approvals.',
    whenAvoid:
      'Avoid Camunda when the need is only high-volume pub/sub, simple AWS glue, or code-first durable functions with no BPMN requirement.',
    mermaid: `flowchart TD
  Q[Need orchestration?]
  Q -->|Business BPMN + humans| C[Camunda 8]
  Q -->|Code-first durable execution| T[Temporal]
  Q -->|AWS-native service glue| S[Step Functions]
  Q -->|Event stream / replay / pubsub| K[Kafka]
  C --> P[Payment approval + incidents]
  T --> D[Developer workflow code]
  S --> A[AWS integrations]
  K --> E[Event backbone]`,
    code: `package com.vibhu.payment.architecture;

public enum OrchestrationChoice {
  CAMUNDA_8("BPMN, user tasks, Operate, explicit business process"),
  TEMPORAL("Code-first workflows, strong durable execution SDK"),
  STEP_FUNCTIONS("AWS-managed state machines and service integrations"),
  KAFKA("Event streaming, replay, pub/sub, not process ownership");

  private final String bestWhen;

  OrchestrationChoice(String bestWhen) {
    this.bestWhen = bestWhen;
  }
}`,
    bpmn: `Camunda decision model

if business wants BPMN diagram + approval + incidents -> Camunda 8
if developers own all workflow logic in code -> Temporal
if workflow is AWS service choreography -> Step Functions
if consumers react independently to facts -> Kafka`,
    production:
      'The choice is rarely one-or-the-other: Camunda can orchestrate a payment while Kafka publishes payment events and services use local DB transactions.',
    interview30s:
      'Camunda is BPMN/business-visible orchestration. Temporal is code-first durable workflows. Step Functions is AWS-native. Kafka is event streaming, not a workflow engine.',
    mistakes: [
      'Using Kafka consumer chains as hidden workflows',
      'Choosing BPMN when only developers will read it',
      'Ignoring managed-service lock-in and cost',
    ],
    followUp: 'Can Camunda and Kafka be used together?',
    memoryTrick: 'BPMN for process, Temporal for code, Step Functions for AWS glue, Kafka for events.',
  },
];
