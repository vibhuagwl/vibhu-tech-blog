/** Kafka DLQ/DLT curriculum — Apache Kafka 4.x broker facts vs Spring Kafka framework patterns. */

export const VERSION_NOTE =
  'Targets Apache Kafka 4.x (broker/client) + Java 21 + Spring Boot with Spring Kafka (current reference docs). Critical distinction: Apache Kafka provides topics, partitions, offsets, replication, and transactions — it does NOT ship a generic built-in DLQ/DLT abstraction. DLQ/DLT is an application/framework pattern: dedicated topic(s) + error classification + producer publish + offset commit policy + retry topology + replay workflow. Spring Kafka supplies DefaultErrorHandler, DeadLetterPublishingRecoverer, @RetryableTopic, DefaultAfterRollbackProcessor, and ErrorHandlingDeserializer — these are framework components, not Kafka broker features. Never claim “Kafka automatically provides a DLQ” or “DLQ guarantees exactly-once.”';

export const MEMORY_SENTENCE =
  'Mental model: Consumer polls a partition-ordered log → classify the failure (transient vs permanent vs poison vs unknown) → apply a retry strategy (in-thread backoff, retry topics, or external scheduler) → on exhaustion or immediate poison, publish to DLT with provenance headers → commit or seek the source offset so the partition advances → ops/replay tooling re-publishes to the source topic with idempotency keys. Offsets and DLT publishes are separate steps — at-least-once everywhere unless you engineer business idempotency. Kafka transactional EOS ties consume+produce offsets inside Kafka; it does not make external databases exactly-once.';

export const BASIC_FLOW = `flowchart TB
  subgraph source["Source topic"]
    T[orders.v1 partition P]
  end
  subgraph consumer["Consumer app"]
    L[Listener / handler]
    C{Classify exception}
    R[Retry policy]
    DLP[DLT producer]
  end
  subgraph dlt["DLT topic (app pattern)"]
    DLT[orders.v1-dlt partition P]
  end
  T --> L
  L -->|success| OC[Commit offset]
  L -->|failure| C
  C -->|transient| R
  R -->|retry exhausted| DLP
  C -->|poison / permanent| DLP
  DLP --> DLT
  DLP --> OC
  OC --> T`;

export const MASTER_ARCH = `flowchart TB
  subgraph ingress["Ingress"]
    P[Producer acks=all + idempotence]
    SR[Schema Registry optional]
  end
  subgraph main["Main topic"]
    M[service.events.v1 N partitions]
  end
  subgraph consume["Consumer group"]
    EH[DefaultErrorHandler / classifier]
    RT1[retry-1 topic same N partitions]
    RT2[retry-2 topic]
    RT3[retry-3 topic]
    DLT[service.events.v1-dlt]
    DB[(Idempotent sink + processed_events)]
  end
  subgraph replay["Replay plane"]
    API[Replay API / job]
    AUD[Audit + RBAC]
  end
  P --> M
  SR -.-> M
  M --> EH
  EH -->|transient| RT1
  RT1 --> RT2
  RT2 --> RT3
  RT3 -->|cap| DLT
  EH -->|poison| DLT
  EH --> DB
  DLT --> AUD
  AUD --> API
  API -->|same key republish| M`;

export const TX_DLT_FLOW = `flowchart TB
  subgraph txn["Transactional consumer"]
    TXN[beginTransaction]
    PROC[Process record]
    OUT[Produce result / DLT in same txn]
    SO[sendOffsetsToTransaction]
    CT[commitTransaction]
  end
  subgraph rollback["On listener exception"]
    RB[Transaction rolls back]
    ARP[DefaultAfterRollbackProcessor seeks]
    REC[DeadLetterPublishingRecoverer optional]
    CR[commitRecovered + kafkaTemplate]
  end
  M[Main topic] --> PROC
  PROC -->|ok| OUT
  OUT --> SO --> CT
  PROC -->|fail| RB
  RB --> ARP
  ARP -->|recover| REC
  REC --> DLT[DLT topic]
  REC --> CR`;

export const REPLAY_ARCH = `flowchart TB
  subgraph dlt_store["DLT"]
    DLT[orders.v1-dlt]
    DLQDB[(DLQ metadata table optional)]
  end
  subgraph gates["Replay gates"]
    RBAC[RBAC + audit actor]
    LOCK[Optimistic replay lock]
    IDEM[Business idempotency key]
    VAL[Payload / schema validation]
  end
  subgraph republish["Republish"]
    RP[Replay producer same key]
    MAIN[orders.v1 original partition via key]
  end
  subgraph outcome["Outcomes"]
    OK[REPLAYED / success metric]
    FAIL[replay.failed + stay in DLT]
  end
  DLT --> DLQDB
  DLQDB --> RBAC
  RBAC --> LOCK
  LOCK --> VAL
  VAL --> IDEM
  IDEM --> RP
  RP --> MAIN
  MAIN -->|consumer applies| OK
  MAIN -->|reject illegal state| FAIL`;

export const TERM_ROWS: string[][] = [
  ['DLQ (Dead Letter Queue)', 'Generic pattern name — often a Kafka topic or DB table holding failed messages that cannot be processed successfully with current code/data/dependencies after bounded retries. Not a Kafka broker primitive.'],
  ['DLT (Dead Letter Topic)', 'Kafka topic used as DLQ transport. Spring Kafka default naming: originalTopic + "-dlt" (framework default in DeadLetterPublishingRecoverer). Same partition index as source by default to preserve per-partition ordering context.'],
  ['Retry topic', 'Intermediate topic for delayed/non-blocking retries (retry-1, retry-2, …). Same partition count and stable key recommended. Time lives in topic topology + consumer delay, not broker delay queues.'],
  ['Error topic', 'Broader term for any topic receiving failure traffic — may include retry stages, DLT, parking lot. Naming varies by org; distinguish retry vs terminal.'],
  ['Parking lot', 'Holds messages blocked by ordering/gap semantics — not yet terminal failure. Later events for same key parked until gap resolved. Distinct from DLT for poison.'],
  ['Quarantine', 'Ops/security isolation topic or store for sensitive or suspicious payloads (fraud, malware scan fail). Stricter ACL, longer retention, manual release only.'],
];

export const WHY_ROWS: string[][] = [
  ['Solves: poison isolation', 'One bad record should not infinite-loop and stall a partition or burn CPU on hopeless retries.'],
  ['Solves: dependency blips', 'Transient DB/API failures get bounded retries; terminal failures get evidence for humans.'],
  ['Solves: operability', 'Headers + DLT give forensics: original topic/partition/offset, exception stack, consumer group.'],
  ['Solves: replay workflow', 'Corrected payloads re-enter the pipeline through Kafka with audit, not ad-hoc DB patches alone.'],
  ['Solves: SLO protection', 'Retry storms and hot poison keys are capped — protects downstream and consumer thread budget.'],
  ['Does NOT solve: business EOS', 'DLT publish + offset commit are separate steps. Duplicates on replay and redelivery remain unless idempotent sinks.'],
  ['Does NOT solve: cross-partition ordering', 'Per-key order requires stable keys + partition preservation; DLT does not magically reorder.'],
  ['Does NOT solve: gap / lifecycle ordering', 'Skipping event 2 while processing event 3 can corrupt state — need parking/hold semantics.'],
  ['Does NOT solve: broker outages', 'If cluster unavailable, DLT publish also fails — need seek/retry on recoverer failure.'],
  ['Does NOT solve: privacy by default', 'DLT copies payloads — governance, encryption, retention, ACL required.'],
];

export const CLASSIFY_ROWS: string[][] = [
  ['Transient', 'Timeout, 503, deadlock, brief broker blip', 'Retry (in-thread or retry topic) with cap', 'After cap → DLT', 'Dependency SLO alert', 'After success or DLT publish per policy', 'Often safe if idempotent', 'Page dependency owner'],
  ['Permanent / business', 'Validation fail, 400 business rule, illegal state transition', 'No long retry', 'DLT immediately', 'Business metric spike', 'After DLT publish or classified skip', 'Replay only after fix', 'Ops / product workflow'],
  ['Poison', 'Bad JSON, unknown enum, NPE in mapper, corrupt Avro', 'No — time cannot fix', 'DLT immediately', 'Poison rate alert', 'Commit after DLT to unblock partition', 'Replay after code/schema fix', 'Stop deploy / fix producer'],
  ['Unknown', 'New exception type, classifier gap', 'Short bounded retry + log sample', 'DLT after cap or manual triage', 'Unknown exception counter', 'Conservative: do not commit until classified', 'Treat as incident', 'Add classifier rule'],
];

export const RETRY_STRATEGY_ROWS: string[][] = [
  ['Immediate re-poll', '0 ms', 'Per partition preserved', 'Yes — blocks partition', 'Low', 'Low if idempotent', 'Single quick transient blip only'],
  ['Fixed backoff (DEH)', 'Fixed ms between attempts', 'Per partition', 'Yes — listener thread sleeps', 'Medium', 'Medium', 'Spring DefaultErrorHandler in-thread retries'],
  ['Exponential backoff', 'Growing delay', 'Per partition', 'Yes unless NB retry topics', 'Medium', 'Medium', 'API rate limits, DB failover windows'],
  ['Exponential + jitter', 'Exp + random', 'Per partition', 'Yes in-thread', 'Medium', 'Lower sync retry storms', 'Many consumers retrying same dependency'],
  ['Retry topic (@RetryableTopic)', 'Topic delay topology', 'Same key → same partition', 'No — non-blocking', 'High', 'Medium — duplicates possible', 'Production default for longer delays'],
  ['Delayed retry (header/timestamp)', 'App-scheduled', 'Key-based', 'No if separate consumer', 'High', 'Medium', 'Custom delay without @RetryableTopic'],
  ['Scheduled / cron replay', 'Minutes–hours', 'Batch', 'No', 'High', 'Controlled', 'Parking lot / quarantine release'],
  ['External store (DB/SQS)', 'Arbitrary', 'App-defined', 'No', 'High', 'Dup if replayed twice', 'Complex workflows, human approval gates'],
  ['DLT (terminal)', 'N/A', 'Preserves source partition by default', 'Unblocks source partition', 'N/A', 'Replay duplicates unless idempotent', 'Poison, cap exhausted, permanent errors'],
];

export const RETRY_TOPIC_DESIGN = `
orders.v1          (N partitions, key=orderId)
orders.v1-retry-0  (N partitions, same key — attempt 1 delay ~5s)
orders.v1-retry-1  (N partitions, same key — attempt 2 delay ~30s)
orders.v1-retry-2  (N partitions, same key — attempt 3 delay ~5m)
orders.v1-dlt      (≥ N partitions — Spring default same partition index)

Rules:
  • Partition count on retry/DLT ≥ source when using same-partition resolver
  • Never change key on retry/DLT/replay
  • @RetryableTopic creates suffix topics automatically — verify naming in docs
  • Delay is NOT a Kafka broker feature — achieved by retry topic listeners + backoff
  • After final attempt → DLT listener or DLT topic from recoverer`;

export const DELAY_NOTE =
  'Apache Kafka has no native per-message delay queue or SQS-style visibility timeout. Delayed retry requires application patterns: (1) @RetryableTopic non-blocking retry topics with configured backoff, (2) retry topics + separate consumer with scheduled republish, (3) external scheduler/DB holding work until retry-at, or (4) in-thread sleep via DefaultErrorHandler FixedBackOff/ExponentialBackOff — which blocks the partition and risks max.poll.interval violations. Choose retry topics for production delays beyond a few seconds.';

export const HEADER_STANDARD: string[][] = [
  ['KafkaHeaders.DLT_ORIGINAL_TOPIC', 'Source topic name — forensics and replay routing'],
  ['KafkaHeaders.DLT_ORIGINAL_PARTITION', 'Source partition index — ordering context'],
  ['KafkaHeaders.DLT_ORIGINAL_OFFSET', 'Source offset — exactly which log record failed'],
  ['KafkaHeaders.DLT_ORIGINAL_TIMESTAMP', 'Original record timestamp'],
  ['KafkaHeaders.DLT_ORIGINAL_TIMESTAMP_TYPE', 'CREATE_TIME vs LOG_APPEND_TIME'],
  ['KafkaHeaders.DLT_ORIGINAL_CONSUMER_GROUP', 'Consumer group that failed (Spring Kafka 2.8+)'],
  ['KafkaHeaders.DLT_EXCEPTION_FQCN', 'Exception class (often ListenerExecutionFailedException)'],
  ['KafkaHeaders.DLT_EXCEPTION_CAUSE_FQCN', 'Cause exception class if present'],
  ['KafkaHeaders.DLT_EXCEPTION_MESSAGE', 'Exception message — scrub PII in logs'],
  ['KafkaHeaders.DLT_EXCEPTION_STACKTRACE', 'Stack trace for debugging — cap size in prod'],
  ['KafkaHeaders.DLT_KEY_EXCEPTION_*', 'Key deserialization failures only'],
  ['KafkaHeaders.DELIVERY_ATTEMPT', 'Incrementing attempt counter when DeliveryAttemptAware enabled'],
  ['x-retry-count / custom', 'Org-specific retry metadata — not broker standard'],
  ['x-correlation-id', 'Distributed tracing across retry/DLT/replay'],
  ['x-business-id / payment_id', 'Idempotency key for replay — application header'],
];

export const ENVELOPE_JSON = `{
  "envelopeVersion": "1",
  "failedAt": "2026-08-14T18:30:00Z",
  "source": {
    "topic": "payments.requested.v1",
    "partition": 3,
    "offset": 918273,
    "timestamp": 1723612200000,
    "consumerGroup": "settlement-worker"
  },
  "failure": {
    "exceptionFqcn": "org.springframework.kafka.listener.ListenerExecutionFailedException",
    "causeFqcn": "java.net.SocketTimeoutException",
    "message": "Bank API timeout after 3000ms",
    "deliveryAttempt": 10
  },
  "payload": {
    "paymentId": "pay-7f3a",
    "accountId": "acct-991",
    "amount": 12500,
    "currency": "USD"
  },
  "replay": {
    "status": "FAILED",
    "replayCount": 0,
    "lastReplayBy": null
  }
}`;

export const PAYLOAD_COMPARE: string[][] = [
  ['Raw value only', 'Original bytes/JSON in DLT value', 'Loses structure; headers carry metadata separately', 'Simple dumps, byte-preserving replay'],
  ['Envelope JSON', 'Wrapped payload + failure + source metadata in one value', 'Larger record; single consume contract', 'Ops portals, unified replay API'],
  ['Headers + original value', 'Spring DeadLetterPublishingRecoverer default style', 'Value unchanged; rich Kafka headers', 'Spring Kafka default; best for schema evolution'],
  ['DB row + topic pointer', 'Kafka DLT for transport; SQL for query/lock', 'Dual write risk between DB and topic', 'Financial DLQ consoles (Hadron pattern)'],
];

export const NAMING_ROWS: string[][] = [
  ['{topic}-dlt', 'Spring Kafka DeadLetterPublishingRecoverer default', 'Per source topic terminal failures', 'Same partition count ≥ source'],
  ['{topic}-retry-{n}', '@RetryableTopic or manual retry stages', 'Non-blocking delayed retries', 'Match source partition count'],
  ['{service}.dlq.{domain}', 'Org convention', 'Shared service DLQ', 'ACL per service'],
  ['{topic}.parking', 'Ordering hold', 'Parked not terminal', 'May use same key routing'],
  ['dead.letter.{env}', 'Shared DLQ', 'Small teams', 'Risk: noisy neighbor + ACL blur'],
];

export const DLT_TOPOLOGY_ROWS: string[][] = [
  ['Per-topic DLT', 'orders.v1-dlt, payments.v1-dlt', 'Clear ownership, partition alignment easy', 'Many topics to monitor'],
  ['Shared DLT', 'platform.dlt.v1', 'One lag alert, central ops', 'ACL harder; partition alignment lost unless envelope encodes source'],
  ['Per-service DLT', 'settlement.dlt.v1', 'Team owns replay tooling', 'Multiple services on same source topic need agreement'],
  ['Per-failure-type split', 'schema.dlt, security.dlt', 'Strict isolation', 'Ops fragmentation — use only when mandated'],
];

export const RETENTION_ROWS: string[][] = [
  ['Source topic', 'Business replay window + compliance', 'Often 7–30d prod; longer for audit domains'],
  ['Retry topics', 'Short — hours to days', 'Only in-flight retries; compaction usually off'],
  ['DLT', 'Until resolved + legal hold', 'Often 30–90d; financial may be years in cold storage'],
  ['Compacted DLT metadata', 'Rare for raw DLT', 'Compaction drops history — bad for audit unless keyed carefully'],
  ['__consumer_offsets', 'Broker default retention', 'Not a substitute for DLT retention policy'],
];

export const COMPACTION_NOTE =
  'DLT topics are typically delete retention (retention.ms), not compacted — you need every failure event for audit. compaction=compact on DLT loses history per key and is wrong for forensic queues unless you only store latest failure per business key in a separate compacted status topic. Retry topics also use delete retention. Source topics may be compacted for changelog use cases — DLQ semantics differ.';

export const CAPACITY_EXAMPLE = `Capacity sketch (order of magnitude):
  100,000 events/sec ingress
  × 1% failure rate → 1,000 DLT publishes/sec
  × 2 KB average record (value + headers) → ~2 MB/sec DLT write
  × 86,400 sec/day × 7 days retention
  ≈ 2 MB/s × 604,800 s ≈ 1.2 TB raw (before replication factor)

  With replication.factor=3 → ~3.6 TB cluster burden for DLT alone
  Add: retry topic fan-out (3 stages) multiplies transient traffic
  Plan: RF, disk per broker, DLT retention tiering, payload truncation, object-store for large bodies`;

export const METRIC_ROWS: string[][] = [
  ['dlt.publish.rate', 'Counter per topic', 'Poison deploy, dependency hard fail'],
  ['dlt.lag', 'Consumer group on DLT', 'Replay backlog'],
  ['retry.attempt.rate', 'Per stage', 'Dependency degradation'],
  ['error_handler.recovery.failure', 'Recoverer threw', 'DLT publish failing — partition stuck'],
  ['consumer.records-lag-max', 'Source group', 'DLT not draining or processing slow'],
  ['delivery.attempt.max', 'Histogram', 'Classifier too generous'],
  ['replay.success / replay.failed', 'Replay job', 'Bad corrected payloads'],
  ['poison.rate', 'By exception type', 'Schema/code issues'],
  ['partition.stall.duration', 'Time stuck on offset', 'Seek loop / recoverer fail'],
];

export const ALERT_ROWS: string[][] = [
  ['DLT rate > baseline × 5 for 5m', 'Sev2', 'Deploy, schema, upstream bug'],
  ['Recoverer failure rate > 0', 'Sev1', 'Broker ACL, serialization, disk full'],
  ['DLT lag > SLO (e.g. 10k)', 'Sev2', 'Replay tooling down or ops backlog'],
  ['Retry topic lag rising + DLT flat', 'Sev2', 'Dependency timeout storm'],
  ['Poison JSON rate > 0 sustained', 'Sev2', 'Producer publishing bad payloads'],
  ['Single partition lag only', 'Sev3', 'Hot poison key on that partition'],
  ['DLT growth vs retention', 'Sev3', 'Disk capacity — tier or truncate payloads'],
];

export const ANTI_PATTERNS: string[] = [
  'Claiming Kafka broker provides built-in DLQ',
  'Claiming DLT guarantees exactly-once processing',
  'enable.auto.commit=true with thrown exceptions',
  'Committing offset before successful processing',
  'Infinite DefaultErrorHandler retries (UNLIMITED_ATTEMPTS)',
  'Sleeping minutes in listener thread via FixedBackOff',
  'No exception classifier — everything retries 10 times',
  'DLT with fewer partitions than source + same-partition resolver',
  'Changing message key on retry or replay',
  'Replay by calling service method instead of republishing to Kafka',
  'No idempotency key on financial replay',
  'Logging full DLT payload with PAN/account numbers',
  'Single shared DLT without source metadata in headers',
  'Compacted DLT topic for audit failures',
  'No retention policy on DLT — disk fills',
  'No RBAC on replay API',
  'Skipping poison without DLT — silent loss',
  'Using batch listener with @RetryableTopic',
  'DefaultErrorHandler on transactional listener without understanding rollback',
  'Ignoring DefaultAfterRollbackProcessor for transactional containers',
  'Not setting commitRecovered on transactional DLT publish',
  'Assuming EOS transaction covers external database',
  'DLT publish success but offset never committed — infinite redelivery',
  'Offset committed but DLT publish failed — message lost from failure queue',
  'No alert on DeadLetterPublishingRecoverer failure',
  'Treating retry topic as terminal DLQ',
  'No delivery attempt header or metric',
  'Schema change without DLQ replay plan',
  'Fat listener with Kafka + HTTP + SQL unclassified',
  'Pausing entire cluster for one poison key',
  'Not preserving partition on DLT when ordering matters',
  'Using partition -1 without documenting order loss',
  'Duplicate transactional.id across pods',
  'No max.poll.interval budget for retry backoff',
  'Deserialization failure without ErrorHandlingDeserializer',
  'Storing only Kafka DLT without queryable DB for finance',
  'Replay without optimistic lock — double replay',
  'DLT ACL same as main topic consumers',
  'No truncation for oversized stack traces in headers',
  'Relying on Kafka message id — use business id',
  'Ignoring rebalance during in-thread retry sleep',
  'No chaos test for recoverer failure path',
  'Assuming read_committed fixes DLT duplicates',
  'Publishing DLT without correlation id',
  'One DLQ per exception type at day one',
  'No runbook for DLT lag incident',
  'Using DLT as primary event store',
  'Skipping governance on quarantine payloads',
];

export const SOURCE_CLASSES: string[][] = [
  ['KafkaConsumer', 'Kafka client', 'Poll, fetch, deserialize, commit offsets — no DLQ logic'],
  ['ConsumerCoordinator', 'Kafka client', 'Group membership, generation, offset commit to __consumer_offsets'],
  ['ErrorHandlingDeserializer', 'Spring Kafka', 'Wrap deserializer; put DeserializationException in headers instead of failing poll'],
  ['@KafkaListener', 'Spring Kafka', 'Invoke listener; exceptions bubble to error handler'],
  ['DefaultErrorHandler', 'Spring Kafka', 'Non-transactional retry/backoff + recoverer; seek on recoverer failure by default'],
  ['DeadLetterPublishingRecoverer', 'Spring Kafka', 'Publish failed record to DLT topic with DLT_* headers'],
  ['DefaultAfterRollbackProcessor', 'Spring Kafka', 'Transactional: seek/retry/recover after rollback — NOT DefaultErrorHandler'],
  ['RetryableTopicConfigurer', 'Spring Kafka', '@RetryableTopic non-blocking retry topic topology'],
  ['KafkaTemplate', 'Spring Kafka', 'Producer for DLT/retry/replay publishes'],
  ['ConsumerRecord', 'Kafka client / Spring', 'topic, partition, offset, headers, value — replay coordinates'],
  ['ExceptionClassifier', 'Application', 'Maps exception → retry vs DLT now — your policy'],
  ['ReplayService', 'Application', 'Audit, lock, validate, republish — not broker'],
  ['processed_events table', 'Application DB', 'Business idempotency — not Kafka EOS'],
];

export const PROTOCOL_FLOW = `Non-transactional DLQ sequence (at-least-once):
  1. poll() returns record R from Tp offset O
  2. listener throws E
  3. DefaultErrorHandler: classify E
  4. BackOff retries (default FixedBackOff(0,9) = 10 attempts per Spring Kafka docs)
  5. DeadLetterPublishingRecoverer publishes R' to T-dlt partition P with DLT_* headers
  6. On success: error handler commits offset O+1 (or batch ack policy)
  7. On recoverer failure: record included in seeks; resetStateOnRecoveryFailure default true → backoff resets

Gap: step 5 and 6 are not atomic — crash between → dup or missing DLT entry`;

export const PROTOCOL_TX_FLOW = `Transactional DLQ sequence:
  1. Consumer with read_committed + transactional producer
  2. beginTransaction → process → on success produce + sendOffsetsToTransaction → commitTransaction
  3. On listener exception: transaction rolls back — offset NOT committed
  4. DefaultAfterRollbackProcessor seeks to failed offset (or batch reprocesses)
  5. Optional: DeadLetterPublishingRecoverer with commitRecovered=true + kafkaTemplate
     → recovered offset sent in new transaction for DLT publish
  6. ProducerFencedException: container may not invoke AfterRollbackProcessor — tune txn timeout

External DB still outside Kafka transaction boundary unless chained idempotency`;
