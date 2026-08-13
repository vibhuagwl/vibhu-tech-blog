export const MEMORY_SENTENCE =
  'Camunda 8 orchestrates the payment journey with Zeebe, while idempotent Spring workers own side effects and the payment DB remains the source of truth.';

export const COMPONENT_TABLE = [
  {component: 'Zeebe Broker', role: 'Executes workflow state on partitions', port: 'Internal', production: 'StatefulSet, PVC, snapshots, disk alerts'},
  {component: 'Zeebe Gateway', role: 'Client entry point for commands and job activation', port: '26500', production: 'Scale, protect with network policy, watch latency'},
  {component: 'Spring Workers', role: 'Execute validate/fraud/account/process/notify jobs', port: '8094 app', production: 'Stateless, idempotent, backpressure per job type'},
  {component: 'Operate', role: 'Incident and token visibility', port: '8081', production: 'Operator auth, redacted variables, exporter lag alerts'},
  {component: 'Tasklist', role: 'Human task inbox for manager approval', port: '8082 typical', production: 'Groups, SLA timers, approval audit'},
  {component: 'Identity', role: 'OIDC/auth for Camunda apps', port: '8084 typical', production: 'SSO, least privilege, secret rotation'},
  {component: 'Elasticsearch/OpenSearch', role: 'Read projection for Operate/Tasklist/Optimize', port: '9200', production: 'Not transactional source of truth'},
  {component: 'Payment DB', role: 'Domain status, idempotency, ledger refs, audit', port: 'DB port', production: 'Authoritative for customer APIs'},
];

export const C7_VS_C8_TABLE = [
  {area: 'Engine', c7: 'Relational process engine, often embedded', c8: 'Zeebe distributed engine', note: 'Execution and operations change'},
  {area: 'Workers', c7: 'JavaDelegate/external tasks', c8: 'External workers by job type', note: 'Idempotency and retries are central'},
  {area: 'Storage', c7: 'SQL runtime/history tables', c8: 'Partitioned log + exporters', note: 'Do not port SQL queries directly'},
  {area: 'Transactions', c7: 'Can share engine transaction in embedded mode', c8: 'No shared DB transaction with broker', note: 'Use idempotency and outbox-style thinking'},
  {area: 'Scaling', c7: 'Scale app/engine and DB', c8: 'Scale brokers, gateways, workers', note: 'Different bottlenecks'},
  {area: 'Ops UI', c7: 'Cockpit/Tasklist', c8: 'Operate/Tasklist/Optimize', note: 'Incident model is Zeebe based'},
  {area: 'Migration risk', c7: 'Delegate code and SQL habits', c8: 'Worker contracts and process versions', note: 'Rewrite, do not copy'},
];

export const ALTERNATIVES_TABLE = [
  {choice: 'Camunda 8', best: 'BPMN, human tasks, business visibility, incidents', avoid: 'Pure pub/sub or code-only teams', paymentFit: 'High-value payments with approvals and exceptions'},
  {choice: 'Temporal', best: 'Code-first durable execution with SDK workflows', avoid: 'Business users require BPMN diagrams', paymentFit: 'Developer-owned orchestration and retries'},
  {choice: 'AWS Step Functions', best: 'AWS-native service choreography', avoid: 'Cloud portability or complex human workflow', paymentFit: 'Managed AWS payment glue'},
  {choice: 'Kafka', best: 'Event streaming, replay, decoupled consumers', avoid: 'Owning long-running process state alone', paymentFit: 'Payment event backbone with Camunda orchestrating'},
  {choice: 'Custom scheduler', best: 'Tiny internal process', avoid: 'Auditable payment lifecycle', paymentFit: 'Usually not enough for regulated flows'},
];

export const PROS_CONS = [
  ['Pro', 'Business-readable BPMN and clear exception paths'],
  ['Pro', 'External workers scale independently from the engine'],
  ['Pro', 'Operate makes incidents and stuck tokens visible'],
  ['Pro', 'User tasks and timers are first-class'],
  ['Con', 'Requires Zeebe/Elastic/Operate operational ownership'],
  ['Con', 'Variable contracts and worker idempotency must be disciplined'],
  ['Con', 'Not a ledger, queue replacement, or reporting database'],
  ['Con', 'C7 migrations need redesign around workers and storage'],
] as const;

export const DECISION_TREE = `Start with the shape of the work.

1. Is there a long-running business process with visible milestones, manual approval, timers, and exceptions?
   -> Camunda 8 is a strong fit.
2. Is the logic developer-only and better expressed as code with durable retries?
   -> Consider Temporal.
3. Is the flow mostly AWS service integration with simple states?
   -> Consider Step Functions.
4. Is the need event distribution, replay, and many independent consumers?
   -> Use Kafka, often alongside Camunda.
5. Is money correctness the concern?
   -> Use a payment DB/ledger with idempotency; orchestration does not replace it.`;

export const CHECKLIST: string[] = [
  'Every worker side effect is idempotent by paymentId or external idempotency key',
  'Payment DB stores status, idempotency key, approval audit, bank reference, and reconciliation data',
  'BPMN variables are small, non-sensitive, and sufficient for routing',
  'Fraud reject uses business path; bank timeout/5xx uses retry then incident',
  'Amount > 100000 creates manager approval and approval timeout',
  'Old workers remain deployed for old process versions until drained or migrated',
  'Operate/Tasklist are protected by OIDC and do not expose PAN/CVV/secrets',
  'Metrics cover job activation, completion, failures, retries, incidents, exporter lag, and partition health',
  'Kubernetes brokers use PVCs, PDBs, resource requests, anti-affinity, and backup/restore drills',
  'Tests cover happy path, fraud reject, bank timeout, incident, message callback, approval timeout, and compensation',
  'Runbooks explain incident resolution, retry exhaustion, duplicate bank callback, and stuck approval',
  'REST APIs return domain status from the business DB, not only Operate',
];

export const CHEAT: [string, string][] = [
  ['Zeebe', 'Distributed Camunda 8 workflow engine'],
  ['Gateway 26500', 'Client endpoint for commands and workers'],
  ['Worker', 'External service that activates jobs by type'],
  ['Job type', 'Stable contract such as validate-payment or fraud-check'],
  ['Retries', 'Technical retry count before incident'],
  ['Incident', 'Workflow is blocked and needs fix/resolution'],
  ['BPMN error', 'Expected business error path'],
  ['Message', 'Correlates external event by key'],
  ['Timer', 'Durable wait or SLA timeout'],
  ['User task', 'Human work such as manager approval'],
  ['Saga', 'Local transactions plus compensation'],
  ['DB boundary', 'Payment DB owns money state; Zeebe owns orchestration state'],
];

export const SIXTY_SEC =
  'I would use Camunda 8 for a payment process when the business needs visible orchestration: validate, fraud, gateway, account, process, bank, notify, plus high-value manual approval and clear failure paths. Zeebe runs the workflow, Spring workers execute job types idempotently, and Operate shows incidents. The payment DB remains the source of truth for status, idempotency, ledger references, and audit. Fraud rejection is a business path; bank 5xx/timeouts retry and eventually create incidents.';

export const TWO_MIN =
  'The production design is: PaymentController on port 8094 accepts a request, writes REQUESTED idempotently, and starts payment-process through the Zeebe gateway on 26500. Workers for validate-payment, fraud-check, account-validation, process-payment, bank-settlement, notify-payment, and manual-review pull jobs. Each side effect uses paymentId as an idempotency key and persists external references before completing the job. BPMN has an approval gateway for amount > 100000, timers for approval timeout, messages for bank callbacks/cancel, and incidents for exhausted technical retries. Operate on 8081 helps operators resolve workflow failures, but customer status comes from the payment DB.';

export const FIVE_MIN =
  'For an architect-level answer, I separate orchestration from money correctness. Camunda 8 gives a visible, versioned model of the payment lifecycle: Validate -> Fraud -> Gateway -> Account -> Process -> Bank -> Notify. Zeebe stores workflow state and activates external Spring workers; workers own side effects and must be idempotent because retries and crashes are normal. The payment database stores domain status, idempotency keys, ledger/bank references, approval audit, and reconciliation data. BPMN models business exceptions explicitly: fraud reject ends through a rejected notification path; amount > 100000 creates manager approval with a timer; bank timeout/5xx uses fail command retry/backoff and becomes an Operate incident after retries are exhausted. For distributed consistency, I use saga compensation for holds or gateway authorizations, not 2PC. In Kubernetes, brokers are stateful with durable volumes and workers are stateless deployments scaled by backlog. Security covers OIDC for Operate/Tasklist, scoped worker credentials, network policies to Zeebe, and redacted variables. Observability includes job latency, retry count, incidents by element, exporter lag, partition health, and domain payment status transitions.';

export const STORY_ANSWERS = [
  {label: '60 seconds', text: SIXTY_SEC},
  {label: '2 minutes', text: TWO_MIN},
  {label: '5 minutes', text: FIVE_MIN},
];

export const CLOSING =
  'The senior answer is not "Camunda runs payments"; it is "Camunda coordinates the process, workers make idempotent side effects, and the payment DB owns financial truth."';
