import type {HadronTopic} from './types';

export const TOPICS_B: HadronTopic[] = [
  {
    id: 'idempotency',
    title: '07. Idempotency Is Mandatory',
    badge: 'UNIQUE(event_id)',
    problem: 'Replay and Kafka redelivery both look like “new” messages. Application if-not-exists races without a unique constraint.',
    whenToUse: 'Every consumer that inserts money or state.',
    whenAvoid: 'Never rely only on a HashSet in memory.',
    mermaid: `flowchart TD
  R[Receive] --> Q{event_id exists?}
  Q -->|yes| I[Ignore DUPLICATE]
  Q -->|no| P[Process]
  P --> M[INSERT processed_events]
  M -->|23505| I`,
    code: `@Column(name = "event_id") private String eventId; // @Id = UNIQUE
try { processedEvents.saveAndFlush(row); return true; }
catch (DataIntegrityViolationException dup) { return false; }`,
    failure: 'DB commit succeeded, offset commit failed → redelivery. Without UNIQUE you double-insert a CashLine.',
    production: 'Effectively-once = at-least-once Kafka + idempotent DB. Kafka transactions alone do not make your SQL idempotent.',
    interview30s: 'We do not claim exactly-once. We claim effectively-once because event_id is unique and the CashLine apply is a state machine.',
    followUp: 'Transaction boundary: mark processed in the same DB transaction as the CashLine write.',
    tradeoff: 'Unique on event_id is simple; unique on (cashLineId, sequenceNumber) also blocks duplicate sequences from different event ids.',
    memoryTrick: 'Constraint first, if-check second.',
  },
  {
    id: 'dlq-database',
    title: '08. DLQ Database',
    badge: 'Indexes',
    problem: 'A Kafka DLQ topic is not an ops console. You need queryable, lockable rows.',
    whenToUse: 'Always persist DLQ for financial consumers.',
    whenAvoid: 'Do not store unbounded payloads or unencrypted PII without retention.',
    mermaid: `flowchart LR
  T[topic+partition+offset] --> UK[unique tpo]
  E[event_id] --> UK2[unique event]
  C[cashline_id] --> IDX[incident lookup]
  S[status] --> Q[ops queues]`,
    code: `@UniqueConstraint(columnNames = "event_id")
@UniqueConstraint(columnNames = {"topic","partition_no","offset_no"})
@Index(columnList = "cashLineId")
@Index(columnList = "status")
@Index(columnList = "createdAt")`,
    failure: 'Missing unique(event_id) duplicates DLQ rows when offset commit fails after a successful DLQ insert.',
    production: 'Indexes: cashline_id (incident), message_id, event_id, status (queues), created_at (retention), topic+partition+offset (Kafka forensics).',
    interview30s: 'DLQ table is the system of record for failed CashLines. The topic is just transport.',
    followUp: 'Retention job deletes RESOLVED/IGNORED/REPLAYED after N days; FAILED stays until a human acts.',
    tradeoff: 'Large payload column vs object store pointer. Lab stores truncated TEXT with a max-bytes cap.',
    memoryTrick: 'If ops cannot query it, it is not a DLQ — it is a dump.',
  },
  {
    id: 'spring-kafka',
    title: '09. Spring Kafka Configuration',
    badge: 'DefaultErrorHandler',
    problem: 'Default seek-to-current + long backoff blocks the partition. Recoverer should jump to retry/DLQ topics.',
    whenToUse: 'Spring Kafka 3 consumers with manual ack and classified exceptions.',
    whenAvoid: 'ExponentialBackOffWithMaxRetries of minutes on the listener thread.',
    mermaid: `flowchart TD
  L[Listener] --> EH[DefaultErrorHandler]
  EH -->|retryable| RT[retry topic same partition]
  EH -->|not retryable| D[DLQ topic]`,
    code: `DeadLetterPublishingRecoverer recoverer = new DeadLetterPublishingRecoverer(template,
  (record, ex) -> new TopicPartition(classifier.retryable(ex) ? nextRetry(record) : DLQ, record.partition()));
new DefaultErrorHandler(recoverer, new FixedBackOff(0L, 0L));`,
    failure: 'enable-auto-commit=true plus a thrown exception = lost or double processing depending on timing.',
    production: 'acks=all, idempotent producer, isolation read_committed, concurrency by partitions, RECORD ack after DB commit returns.',
    interview30s: 'Error handler classifies; recoverer publishes to retry-n or DLQ keeping the partition index.',
    followUp: 'Why FixedBackOff(0,0)? Because delayed retry belongs on retry topics, not in the hot listener.',
    tradeoff: 'Spring RetryTopicConfigurationBuilder vs explicit topics. Explicit names match the interview story.',
    memoryTrick: 'Handler classifies, recoverer routes, listener stays thin.',
  },
  {
    id: 'producer',
    title: '10. Producer',
    badge: 'Key = CashLine ID',
    problem: 'If the producer uses a null key, Hadron cannot keep CL123 ordered.',
    whenToUse: 'Neptune poller, CDC, and replay API all share CashLineProducer.',
    whenAvoid: 'Do not change the key on retry/replay.',
    mermaid: `flowchart LR
  N[Neptune row] --> PR[CashLineProducer]
  PR -->|key cashLineId| K[cashline-events]
  RP[Replay] --> PR`,
    code: `publisher.publish(CASHLINE_EVENTS, event.cashLineId(), mapper.writeValueAsString(event), headers);`,
    failure: 'Serializing differently on replay (field order, extra fields) can break hash-based idempotency if you keyed on payload bytes. We key on event_id.',
    production: 'Idempotent producer, acks=all, lz4, linger. Headers: correlationId, retry-count, replay-dlq-id.',
    interview30s: 'Producer is boring on purpose: stable key, JSON body, tracing headers, no business logic.',
    followUp: 'CDC vs poller: CDC is lower lag; poller is operable when you do not own Debezium. Both must emit event_id + sequence.',
    tradeoff: 'CDC duplicates vs poller duplicates — both solved by processed_events.',
    memoryTrick: 'Same producer for origin and replay.',
  },
  {
    id: 'consumer',
    title: '11. Consumer',
    badge: 'Thin listener',
    problem: 'Fat listeners mix Kafka, SQL, and HTTP and cannot be tested without a broker.',
    whenToUse: 'Listener → FailurePipeline/ProcessingService.',
    whenAvoid: 'Catching Exception and committing anyway.',
    mermaid: `flowchart TD
  L[KafkaListener] --> P[CashLineProcessingService]
  P --> V[validate]
  V --> O[sequence]
  O --> C[cashline apply]
  C --> I[mark processed]`,
    code: `@KafkaListener(topics = TopicNames.CASHLINE_EVENTS)
public void onCashLine(ConsumerRecord<String, String> record) {
  processing.process(KafkaConsumerConfig.toEnvelope(record));
}`,
    failure: 'Rebalance mid-processing: the record is retried. Idempotency must make that safe.',
    production: 'max.poll.interval greater than worst-case DB work. Small max.poll.records. No remote HTTP inside the listener without timeouts and classification.',
    interview30s: 'The listener converts a record to an envelope. The domain service does the money work inside a DB transaction.',
    followUp: 'Offset is committed after the method returns (RECORD ack). That is after the DB transaction commits — still not atomic with Kafka.',
    tradeoff: 'Sync processing vs handing to an inner queue. Inner queues duplicate Kafka and lose pause semantics.',
    memoryTrick: 'Listener is a socket. Service is the bank.',
  },
  {
    id: 'retry',
    title: '12. Retry Strategies',
    badge: '5s / 30s / 5m',
    problem: 'Strategy 1 (Thread.sleep on the consumer) causes rebalances. Strategy 2 (retry topics) is what we ship.',
    whenToUse: 'Exponential/step backoff for timeouts, deadlocks, brief dependency loss.',
    whenAvoid: 'Sleeping 5 minutes in DefaultErrorHandler.',
    mermaid: `flowchart TD
  M[cashline-events] --> R1[retry-1 5s]
  R1 --> R2[retry-2 30s]
  R2 --> R3[retry-3 5m]
  R3 --> D[dlq]`,
    code: `String topic = TopicNames.retryTopic(nextRetry);
publisher.publishDelayed(topic, key, payload, headers, delay);`,
    failure: 'BlockingRetryService is behind hadron.retry.blocking-in-memory=true as an anti-pattern demo.',
    production: 'Lab delays are 200/400/800ms. Prod is 5s/30s/5m. Cap at 3. Then DLQ.',
    interview30s: 'We do not retry in memory for long. We bounce the record to retry-n with the same key so order per CashLine stays possible.',
    followUp: 'Exponential backoff: 5s, 30s, 5m is a step function that matches “blip / failover / human”.',
    tradeoff: 'Retry topics add lag and storage. They save consumer threads and prevent infinite hot loops.',
    memoryTrick: 'Delay lives in the topic, not in the thread.',
  },
];
