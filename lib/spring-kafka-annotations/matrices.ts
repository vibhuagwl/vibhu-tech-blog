export const INTERACTION: string[][] = [
  ['@KafkaListener + @RetryableTopic', 'Yes', 'Yes (record listeners)', 'Non-blocking retry hops'],
  ['@KafkaListener + @DltHandler', 'Needs @RetryableTopic', 'Yes', '@DltHandler alone does not create DLT'],
  ['@KafkaListener + @Transactional', 'Yes', 'Careful', 'Name Kafka TM explicitly for Kafka EOS'],
  ['@KafkaListener + @SendTo', 'Yes', 'Yes', 'Publish return on success'],
  ['@RetryableTopic + @DltHandler', 'Yes', 'Yes', 'Same class; one handler for all'],
  ['@RetryableTopic + @Transactional', 'Possible', 'Advanced', 'Forwarding + txn semantics — test hard'],
  ['@KafkaHandler + @RetryableTopic', 'On class/methods', 'Possible', 'Put @RetryableTopic with listener setup'],
  ['@KafkaListener + manual Ack', 'Yes', 'Yes', 'Never ack before side effects / DLT'],
  ['@KafkaListener batch + @RetryableTopic', 'NO', 'No', 'Unsupported — use DEH + DLP'],
  ['@SendTo + failing listener', 'N/A', '—', 'No send on exception'],
  ['@DltHandler + business workflow', 'Legal', 'No', 'Ops sink only'],
  ['@EnableKafka + Boot auto-config', 'Yes', 'Yes', 'Redundant but clear'],
];

export const INTERACTION_HEADERS = ['Combination', 'Valid?', 'Recommended?', 'Why'];

export const EXCEPTION_CODE = `@RetryableTopic(
    include = { TransientException.class, QueryTimeoutException.class },
    exclude = { ValidationException.class, DeserializationException.class },
    traversingCauses = "true"
)
@KafkaListener(topics = "orders.v1", groupId = "order-service")
public void consume(Order order) { ... }

// TransientException → retry hops
// ValidationException → DLT immediately
// Unknown → policy depends on include/exclude emptiness — be explicit`;

export const DESER_FLOW = `poll()
 |
Deserializer
 |
 X failure
 |
@KafkaListener method NEVER executes (no typed arg)

Fix: ErrorHandlingDeserializer wrapping value/key desers
 → record delivered with null payload + exception headers
 → container error handler / retry / DLT can run

Without EHD: consumer may stuck/seek depending on configuration.`;

export const BATCH_NOTES = `@KafkaListener with List<Order> or ConsumerRecords requires batch-enabled factory.

Partial failure: throw BatchListenerFailedException(index|record)
 → recover failed index; commit prior; redeliver rest (framework rules)

@RetryableTopic: NOT supported for batch listeners (Spring Kafka docs).
Use DefaultErrorHandler + DeadLetterPublishingRecoverer.

Batch conversion errors need explicit checks — not always auto-routed to DLT.`;

export const DIAGRAMS: {title: string; body: string}[] = [
  {
    title: '@RetryableTopic lifecycle',
    body: `@RetryableTopic
      |
Kafka listener
      |
exception
      |
classify include/exclude
      |
retry topic hop(s)
      |
retry listener (same method)
      |
exhausted
      |
DLT
      |
@DltHandler`,
  },
  {
    title: '@SendTo lifecycle',
    body: `Kafka
 |
Consumer
 |
@KafkaListener
 |
method return
 |
@SendTo
 |
KafkaTemplate
 |
Kafka`,
  },
  {
    title: '@Transactional (Kafka) lifecycle',
    body: `poll record
 |
beginTransaction
 |
listener method
 |
produce(s)
 |
sendOffsetsToTransaction
 |
commit / rollback`,
  },
];

export const ANTIPATTERNS = [
  '@RetryableTopic on every listener without classifier — operational topic sprawl',
  '@DltHandler with no metrics/alerts — silent poison landfill',
  '@Transactional without naming kafkaTransactionManager when you meant Kafka EOS',
  '@SendTo for heavy multi-service orchestration — hidden produce coupling',
  'Huge attempts / unbounded retry — cost storms',
  'Retrying permanent ValidationException',
  'Annotations without idempotent business writes',
  'Blocking DEH with minute-scale sleep (use hops or pausing backoff)',
  'Using @DltHandler as primary business workflow',
  'Batch listener + @RetryableTopic (unsupported)',
  'autoCreateTopics=true in prod without capacity/ACL review',
  'concurrency >> partitions',
];

export const EXAMPLES: {title: string; body: string}[] = [
  {
    title: '1 — Payment timeout',
    body: `PaymentRequested → @KafkaListener → Bank API timeout
  → @RetryableTopic hops (5s/30s/5m)
  → DLT → @DltHandler persists
  → Replay only after reconcile (idempotencyKey) — see /kafka-dlq#payment-reconcile`,
  },
  {
    title: '2 — Order enrich + @SendTo',
    body: `OrderCreated → @KafkaListener → DB read → return ProcessedOrder
  → @SendTo("orders.processed.v1")
  → failure before return: nothing published`,
  },
  {
    title: '3 — Notification transient SMTP',
    body: `@RetryableTopic(include=SmtpTransientException.class)
  exclude permanent address bounce → DLT for ops`,
  },
  {
    title: '4 — Poison payload',
    body: `Malformed JSON → EHD → exclude JsonParseException → DLT immediately
  @DltHandler stores raw bytes; no hot retries`,
  },
  {
    title: '5 — Financial Kafka TX + inbox',
    body: `@Transactional("kafkaTransactionManager") @KafkaListener
  produce ledger event + sendOffsetsToTransaction
  PLUS Postgres UNIQUE(event_id) for side effects that leave Kafka`,
  },
];

export const MISCONCEPTIONS: {wrong: string; right: string}[] = [
  {wrong: '@KafkaListener creates a KafkaConsumer directly', right: 'Spring creates a MessageListenerContainer which owns the KafkaConsumer.'},
  {wrong: '@RetryableTopic retries inside the Kafka broker', right: 'Spring forwards to retry topics; broker only stores records.'},
  {wrong: '@DltHandler creates a DLT', right: '@RetryableTopic/config creates topics; @DltHandler consumes the DLT.'},
  {wrong: '@Transactional always means Kafka transaction', right: 'Default TM is often DataSource — name kafkaTransactionManager explicitly.'},
  {wrong: '@SendTo is only for producers', right: 'It publishes listener return values after consume.'},
  {wrong: '@KafkaHandler creates multiple consumer groups', right: 'Handlers share one class-level @KafkaListener container/group.'},
  {wrong: '@EnableKafka creates Kafka brokers', right: 'It enables Spring listener infrastructure only.'},
  {wrong: '@KafkaListener guarantees exactly-once', right: 'At-most container semantics; EOS needs Kafka TX + careful design; DB needs inbox.'},
  {wrong: '@RetryableTopic guarantees ordering', right: 'Hops can reorder relative to main-topic progress for the same key.'},
  {wrong: '@DltHandler guarantees successful DLT processing', right: 'Handler can fail; dltStrategy + alerts required.'},
];

export const REFERENCE: string[][] = [
  ['@EnableKafka', 'Spring', 'Enable listener scanning', 'Config', '—', 'Thinking it configures brokers'],
  ['@EnableKafkaRetryTopic', 'Spring', 'Import retry-topic infra', 'Config', '—', 'Duplicate with custom configurer'],
  ['@KafkaListener', 'Consumer', 'Consume records', 'Service', 'topics, groupId, concurrency, factory', 'Wrong AckMode / group'],
  ['@KafkaHandler', 'Consumer', 'Type dispatch', 'Listener class', 'isDefault', 'Ambiguous types'],
  ['@KafkaListeners', 'Consumer', 'Repeatable listeners', 'Method', 'nested @KafkaListener', 'Surprise multi-containers'],
  ['@RetryableTopic', 'Retry/DLT', 'Non-blocking hops', 'Listener', 'attempts, backoff, include/exclude, dltStrategy', 'Topic sprawl; batch unsupported'],
  ['@Backoff', 'Retry', 'Delay policy', 'Inside @RetryableTopic', 'delay, multiplier, maxDelay, random', 'No jitter → herds'],
  ['@DltHandler', 'DLT', 'Consume DLT', 'Same class', 'method args/headers', 'Silent failure loops'],
  ['@SendTo', 'Messaging', 'Publish return', 'Listener', 'destination SpEL', 'Hidden coupling'],
  ['@Transactional', 'TX', 'TX boundary', 'Listener/service', 'transactionManager', 'Wrong TM; false EOS claims'],
];

export const REFERENCE_HEADERS = ['Annotation', 'Layer', 'Purpose', 'Location', 'Key attributes', 'Main risk'];
