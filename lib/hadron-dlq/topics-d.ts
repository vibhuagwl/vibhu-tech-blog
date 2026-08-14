import type {HadronTopic} from './types';

export const TOPICS_D: HadronTopic[] = [
  {
    id: 'transactions',
    title: '19. Transaction Handling',
    badge: 'Not exactly-once',
    problem: '@Transactional on processCashLine does not include the Kafka offset.',
    whenToUse: 'DB transaction for CashLine + processed_events. Kafka ack after success. Idempotency for the overlap.',
    whenAvoid: 'Saying “Kafka transactions give exactly-once payments”.',
    mermaid: `flowchart TD
  S1[DB commit then Kafka ack fails] --> D[Redeliver / UNIQUE]
  S2[Kafka ack then DB rollback] --> L[Lost unless you do not ack on throw]
  S3[Crash mid TX] --> R[Rollback DB + redeliver]`,
    code: `@Transactional
public ProcessResult process(EventEnvelope envelope) {
  // cash_lines + processed_events + cashline_state in ONE sql tx
}
// Kafka RECORD ack happens after this method returns without exception`,
    failure: 'Scenario 2 is the dangerous one if you ack before DB commit. Spring Kafka RECORD ack after listener return avoids it if you throw on failure.',
    production: 'Safest practical: idempotent consumer + unique constraints + throw to skip ack. Optional Kafka transactions for produce/consume atomicity of retry/DLQ publishes — still not EOS with Postgres.',
    interview30s: 'Three transactions: Kafka, database, application. We align DB writes, then ack, and we survive the gap with event_id.',
    followUp: 'Transactional outbox is for Hadron→downstream. For Neptune→Hadron the analog is the poller cursor vs Kafka produce (produce first, then cursor).',
    tradeoff: 'Kafka + DB XA is rarely worth it. Effectively-once is.',
    memoryTrick: 'Ack after commit, uniqueness after redelivery.',
  },
  {
    id: 'observability',
    title: '20. Observability',
    badge: 'Micrometer',
    problem: 'A silent DLQ is worse than a noisy retry.',
    whenToUse: 'Every consume, retry, DLQ, replay, duplicate, out-of-order.',
    whenAvoid: 'High-cardinality labels like eventId on Prometheus.',
    mermaid: `flowchart LR
  M[cashline.dlq] --> A[alert threshold]
  L[consumer lag] --> A
  R[replay.failed] --> A`,
    code: `Counter.builder("cashline.dlq").register(registry);
log.info("Processing type={} masked={}", type, masker.mask(payload));`,
    failure: 'Logging full JSON with amount and accountId is a security incident, not observability.',
    production: 'Alerts: DLQ count > N, DLQ growth rate, replay failures, consumer lag, retry rate, DB latency. MDC: correlationId, eventId, cashlineId, traceId.',
    interview30s: 'Metrics name the symptom. Logs carry IDs. Payloads stay masked.',
    followUp: ' lag increasing + retry increasing + DLQ flat = dependency outage. DLQ spiking + retry flat = poison/deploy.',
    tradeoff: 'Actuator prometheus vs vendor APM. Lab exposes /actuator/prometheus.',
    memoryTrick: 'Lag is delay. DLQ is death. Retry is fever.',
  },
  {
    id: 'security',
    title: '21. Security',
    badge: 'Financial data',
    problem: 'DLQ tables are a treasure chest of failed payments.',
    whenToUse: 'Encrypt at rest, TLS to Kafka/DB, RBAC on replay, audit actor, mask logs, retain with a policy.',
    whenAvoid: 'Open GET /api/dlq in production without auth.',
    mermaid: `flowchart TD
  R[Replay API] --> A[X-Replay-Actor + RBAC]
  A --> U[audit_log]
  P[payload] --> M[mask in logs]
  P --> E[encrypt at rest]`,
    code: `maskField(object, "amount");
maskField(object, "accountId");
maskField(object, "participantId");`,
    failure: 'Replay authorization is write access to the ledger. Treat it like a payment POST.',
    production: 'Lab documents require-replay-actor. Prod: mTLS, Kafka ACLs, DB grants least privilege, column encryption or tokenization.',
    interview30s: 'We never log the financial payload. Replay is audited. DLQ retention is a compliance control.',
    followUp: 'PII in headers? Same rules. Correlation IDs are fine.',
    tradeoff: 'Keeping payloads for replay vs crypto-shredding. Payments usually keep until resolved, then purge.',
    memoryTrick: 'DLQ is production data, not debug.',
  },
  {
    id: 'docker',
    title: '22. Docker / Deployment',
    badge: 'compose',
    problem: 'Local Kafka + Postgres + Prometheus + Grafana so the story is runnable.',
    whenToUse: 'kafka profile and compose stack.',
    whenAvoid: 'Requiring Docker for unit tests — default profile is H2 + in-memory broker.',
    mermaid: `flowchart LR
  APP[hadron :8095] --> PG[(postgres :5433)]
  APP --> KF[kafka :9092]
  APP --> PR[prometheus]
  UI[kafka-ui :8088] --> KF`,
    code: `docker compose up -d
mvn spring-boot:run -Dspring-boot.run.profiles=kafka`,
    failure: 'Advertised listener 127.0.0.1 vs kafka hostname inside compose. App container must use kafka:9092.',
    production: 'Prod yml: ddl-auto validate, pool timeouts, acks all, idempotent producer, no H2.',
    interview30s: 'Tests do not need Kafka. The kafka profile is the production shape.',
    followUp: 'Topic automation via NewTopic beans with matching partition counts.',
    tradeoff: 'KRaft single-node compose vs real cluster. Fine for a lab.',
    memoryTrick: '8095 lab, 9092 Kafka, 5433 Postgres.',
  },
  {
    id: 'testing',
    title: '23. Tests',
    badge: 'No Docker required',
    problem: 'If DLQ tests need a cluster, they will not run in CI.',
    whenToUse: 'Classifier/state unit tests + SpringBootTest IT through REST and the in-memory broker.',
    whenAvoid: 'Only mocking KafkaTemplate and never asserting the DLQ table.',
    mermaid: `flowchart TD
  U[unit classifier] --> I[IT poison]
  I --> R[IT retry then success]
  R --> P[IT replay + optimistic lock]
  P --> N[IT poller cursor]`,
    code: `await().until(() -> dlq.findByEventId("e-amt-1").isPresent());
mvc.perform(post("/api/dlq/"+id+"/replay"));`,
    failure: 'Not waiting for delayed retry topics. Use Awaitility matching lab delays.',
    production: 'Optional Testcontainers Kafka under profile kafka. Default CI is H2.',
    interview30s: 'We test the money path without a broker, then optionally the real one.',
    followUp: 'Concurrent replay IT expects one 200 and one 409.',
    tradeoff: 'Embedded Kafka vs in-memory broker. In-memory matches our retry scheduling exactly.',
    memoryTrick: 'If CI needs Docker, the default profile failed its job.',
  },
  {
    id: 'failures',
    title: '24. Financial Corner Cases',
    badge: 'Problem → Action',
    problem: 'Every payment failure needs: detection, retry?, DLQ?, idempotency?, ordering?, recovery.',
    whenToUse: 'Incident reviews and interview deep-dives.',
    whenAvoid: 'Generic “we would retry”.',
    mermaid: `flowchart TD
  DUP[Duplicate payment] --> ID[event_id UNIQUE]
  SET[Replay after settle] --> SM[state machine reject]
  RB[Rebalance] --> ID
  ST[Stale event] --> IG[ignore seq <= last]`,
    code: `if (entity.getStatus() == SETTLED && eventType contains UPDATED)
  throw new InvalidCashLineException("Replay after settlement...");`,
    failure: 'See the hub catalog (24. Dead-letter corner cases): poison, timeout, deadlock, Event-101/102, ack-before-commit, concurrent replay, poller cursor, hot poison key, and the rest — each with Detection → Recovery → Alert.',
    production: 'Write the matrix before coding the classifier. The lab implements the happy subset and the dangerous ordering subset.',
    interview30s: 'I classify by whether time, data, or a human fixes it — and whether later events may proceed.',
    followUp: 'Offset reset is a replay of history. Idempotency + sequence make it a no-op for already applied ids.',
    tradeoff: 'Fail closed on unknown enum (poison) vs defaulting. Fail closed.',
    memoryTrick: 'Money mistakes are either duplicates or skipped middles.',
  },
  {
    id: 'poison',
    title: 'Poison Messages',
    badge: 'Cap at 3',
    problem: 'Malformed JSON retries forever without a classifier.',
    whenToUse: 'Serde failures, unknown enums, corrupt payloads.',
    whenAvoid: 'Calling a DB timeout a poison message.',
    mermaid: `flowchart LR
  M[message] --> R1[retry]
  R1 --> R2[retry]
  R1 --> R3[retry]
  R3 --> D[DLQ stop]`,
    code: `} catch (JsonProcessingException e) {
  throw new PoisonMessageException("Malformed CashLine JSON", e);
}`,
    failure: 'Infinite loop of deserialize → throw → seek-to-current.',
    production: 'Immediate DLQ for poison. Do not burn retry-1/2/3 on JSON you will never parse.',
    interview30s: 'Poison is a message that cannot succeed with the current code and payload. Park it.',
    followUp: 'Schema evolution: unknown fields ignored (Jackson), unknown enum is poison until the consumer is upgraded — then replay.',
    tradeoff: 'Fail the partition vs DLQ. For a single bad JSON, DLQ. For a poison key that is also a hot partition, still DLQ so others move.',
    memoryTrick: 'Three strikes for transients. Zero strikes for poison.',
  },
  {
    id: 'classifier',
    title: 'Dynamic Retry Policy',
    badge: 'ExceptionClassifier',
    problem: 'Not every Exception is retryable.',
    whenToUse: 'Central policy used by both in-memory pipeline and Kafka DefaultErrorHandler.',
    whenAvoid: 'Copy-pasting instanceof lists in each listener.',
    mermaid: `flowchart TD
  X[Throwable] --> C[walk cause chain]
  C --> D{decision}
  D --> R[RETRY]
  D --> L[DLQ_IMMEDIATE]
  D --> I[IGNORE]`,
    code: `if (t instanceof SQLException sql && RETRY_SQL_STATES.contains(sql.getSQLState()))
  return RETRY; // 40001, 40P01 deadlock`,
    failure: 'Swallowing NPE as retry hides bugs and burns money.',
    production: 'Configurable lists of retry SQL states. Unknown defaults to retry-with-cap (then DLQ), except NPE/serde/business which DLQ now.',
    interview30s: 'One classifier. Listeners do not vote.',
    followUp: 'ExternalServiceTimeout is retry. ValidationException is DLQ.',
    tradeoff: 'Default retry (might delay poison) vs default DLQ (might park an outage as data). We default retry then cap.',
    memoryTrick: 'Classifier is policy. Pipeline is mechanism.',
  },
  {
    id: 'how-many-dlqs',
    title: 'How Many DLQs Do We Need?',
    badge: 'Architect',
    problem: 'One pile vs many piles.',
    whenToUse: 'Start with one DLQ per source topic.',
    whenAvoid: 'One DLQ per exception, per customer, per enum value.',
    mermaid: `flowchart TD
  T1[cashline-events] --> D1[cashline-events-dlq]
  T2[settlement-events] --> D2[settlement-events-dlq]
  D1 --> DB[(reason column)]`,
    code: `failure_reason VARCHAR(64)  -- BUSINESS / POISON / TECHNICAL / DATA`,
    failure: 'Four DLQ topics without four replay tools = four forgotten queues.',
    production: 'Hadron rec: per topic, not per exception. Optional schema DLQ only if you cannot parse a key. Security DLQ only if ACLs demand isolation.',
    interview30s: 'I would not create cashline-npe-dlq. I would filter Postgres.',
    followUp: 'Per service vs per topic: if one service consumes five topics, five DLQs map replay back correctly.',
    tradeoff: 'Simplicity vs noisy ops. Columns beat topics until volume or security forces a split.',
    memoryTrick: 'Do not shard your parking lot by the crash type.',
  },
  {
    id: 'cost',
    title: 'Cost Saving',
    badge: 'Uncontrolled retry',
    problem: 'DLQ is not a coupon. It stops you from paying for 100k poison attempts.',
    whenToUse: 'Explain TCO of a bad consumer.',
    whenAvoid: 'Claiming DLQ reduces Kafka storage (it can increase it).',
    mermaid: `flowchart LR
  P[10k poison] --> BAD[x10 retry = 100k attempts]
  P --> GOOD[x3 retry = 30k then DLQ]`,
    code: `// 10_000 poison * 10 hot retries = 100_000 CPU/DB/API hits
// 10_000 poison * 3 bounded retries = 30_000 then one ops replay`,
    failure: 'Alerts on every retry without a DLQ cap wake people and still burn compute.',
    production: 'Savings: CPU, pool slots, Kafka traffic, downstream API, engineer time, incident duration. Cost of DLQ: storage + a replay tool. Net positive when poison exists.',
    interview30s: 'Unbounded retry is an amplification attack you run against yourself.',
    followUp: 'Cloud bill: consumer CPU + RDS connections + log ingestion often dwarf the DLQ table.',
    tradeoff: 'Three retries might be too few for a 10-minute failover. Tune delays, not infinite counts.',
    memoryTrick: 'Cap the loop, pay for the parking.',
  },
];
