/** Spring Kafka DLQ/DLT — framework components (not Apache Kafka broker features). */

export const SPRING_STACK_NOTE =
  'Spring Kafka layers on Apache Kafka 4.x clients: @KafkaListener containers, CommonErrorHandler (DefaultErrorHandler), DeadLetterPublishingRecoverer, @RetryableTopic, DefaultAfterRollbackProcessor, ErrorHandlingDeserializer. All DLQ behavior is configured in the application — broker only stores topics/offsets. Defaults below are Spring Kafka reference-doc defaults (e.g. DefaultErrorHandler FixedBackOff(0L, 9)); override intentionally in production. Target: Java 21, Spring Boot 3.x / Spring Kafka 3.x+ (verify exact version in your BOM).';

export const ERROR_HANDLER_FLOW = `
poll() → listener invoked
  → success → ack/commit per AckMode
  → exception → DefaultErrorHandler.handleRemaining()
       → not retryable? → recoverer immediately
       → retryable → BackOff sleep (blocks partition)
       → attempts exhausted → recoverer (DeadLetterPublishingRecoverer)
       → recoverer success → commit offset / ack
       → recoverer throws → seeks include failed record (partition may stall)
Default: FixedBackOff(0L, 9) = 10 delivery attempts total (Spring Kafka docs)`;

export const DEH_ROWS: string[][] = [
  ['Retry', 'Default FixedBackOff(0L, 9) — 10 attempts, 0 ms delay between (Spring Kafka docs default)', 'Override with FixedBackOff(interval, maxAttempts) where total = maxAttempts+1'],
  ['Backoff', 'FixedBackOff or ExponentialBackOff; UNLIMITED_ATTEMPTS = infinite retries (dangerous)', 'Use retry topics for long delays'],
  ['Classification', 'setNotRetryableExceptions / setRetryableExceptions / ExceptionClassifier', 'Fatal exceptions skip retry → recoverer on first failure'],
  ['Recoverer', 'BiConsumer or DeadLetterPublishingRecoverer — skip poison record', 'Required for production DLQ — default only logs after retries'],
  ['Seek on recoverer fail', 'Failed record included in seeks by default', 'Partition stuck retrying same offset until recoverer succeeds'],
  ['resetStateOnRecoveryFailure', 'Default true (since 2.5.5) — backoff resets after recoverer failure', 'Set false to skip retry delays on immediate re-recovery attempt'],
  ['Commit', 'After successful recovery, offset advanced per AckMode', 'MANUAL_IMMEDIATE vs BATCH vs RECORD — must align with idempotency'],
  ['Batch listeners', '@RetryableTopic NOT supported; use DEH + DLP', 'BatchListenerFailedException for partial batch failure index'],
  ['Transactions', 'Default: no error handler on transactional containers — exception rolls back txn', 'Use DefaultAfterRollbackProcessor instead'],
];

export const DLP_ROWS: string[][] = [
  ['When invoked', 'After retries exhausted or non-retryable exception on DefaultErrorHandler / AfterRollbackProcessor', 'Not on every first failure unless configured'],
  ['Default destination', 'originalTopic + "-dlt" (Spring Kafka DeadLetterPublishingRecoverer source default)', 'User said verify docs — current docs use hyphen -dlt lowercase'],
  ['Default partition', 'Same partition index as failed ConsumerRecord', 'DLT must have ≥ partitions as source topic'],
  ['Custom resolver', 'BiFunction<ConsumerRecord, Exception, TopicPartition>', 'Use partition -1 to let broker choose — loses partition alignment'],
  ['Headers added', 'KafkaHeaders.DLT_EXCEPTION_FQCN, DLT_EXCEPTION_CAUSE_FQCN, DLT_EXCEPTION_STACKTRACE, DLT_EXCEPTION_MESSAGE, DLT_ORIGINAL_TOPIC, DLT_ORIGINAL_PARTITION, DLT_ORIGINAL_OFFSET, DLT_ORIGINAL_TIMESTAMP, DLT_ORIGINAL_TIMESTAMP_TYPE, DLT_ORIGINAL_CONSUMER_GROUP', 'Key deser errors use DLT_KEY_EXCEPTION_*'],
  ['ErrorHandlingDeserializer', 'Restores original value bytes in DLT record when deser failed in listener path', 'Earlier versions value was null — decode exception from headers'],
  ['Transactional publish', 'DeadLetterPublishingRecoverer can use transactional KafkaTemplate', 'Pair with DefaultAfterRollbackProcessor commitRecovered'],
  ['Publish failure', 'Throws → record seeked → backoff may reset → partition stall risk', 'Alert + broker health + ACL WRITE on DLT'],
  ['logRecoveryRecord', 'Optional logging of recovery publish', 'Scrub PII in prod'],
  ['Multiple templates', 'Map<Class, KafkaTemplate> for String vs byte[] vs Avro', 'DeserializationException may need bytes template'],
];

export const RETRYABLE_ROWS: string[][] = [
  ['Attempts', 'Configured per @RetryableTopic — attempts array + backoff', 'Non-blocking — consumer thread not sleeping'],
  ['Backoff', 'Fixed or exponential between retry topics', 'Implemented via retry topic listeners + delay topics'],
  ['Naming', 'Auto suffix retry topics (e.g. -retry-0, -retry-1) per annotation config', 'Verify RetryTopicConfigurationBuilder output'],
  ['Classification', 'dltProcessingFailure strategy, same classifier concepts', 'Include/exclude exception types per stage'],
  ['Blocking vs non-blocking', 'Non-blocking — failed message to retry topic, offset committed on main', 'Main partition advances while retry happens elsewhere'],
  ['Limitation', 'NOT supported with batch listeners', 'Use DefaultErrorHandler for batch'],
  ['Limitation', 'Requires additional topics and consumers', 'Operational overhead vs in-thread backoff'],
  ['Limitation', 'Same key routing required for per-key order', 'Partition count must match across retry chain'],
  ['dltStrategy', 'FAIL_ON_ERROR vs default failure handler to DLT topic', 'Configure terminal topic explicitly'],
  ['Concurrency', 'Each retry stage is its own listener', 'Scale retry consumers independently'],
];

export const ROLLBACK_ROWS: string[][] = [
  ['Container type', 'DefaultErrorHandler — non-transactional or custom EH with txn', 'DefaultAfterRollbackProcessor — transactional containers default'],
  ['On exception', 'Retry/backoff in error handler path', 'Transaction rolls back; processor seeks or recovers'],
  ['Offset commit', 'After recovery via error handler ack', 'commitRecovered sends offset in new txn for DLT'],
  ['Batch behavior', 'BatchListenerFailedException index', 'Entire batch reprocessed unless batchRecoverAfterRollback'],
  ['Recoverer', 'DeadLetterPublishingRecoverer supported', 'Same recoverer class — different processor'],
  ['maxFailures / BackOff', 'DefaultAfterRollbackProcessor uses BackOff like DEH', 'Default 10 failures logged if no recoverer'],
  ['ProducerFencedException', 'May not invoke processor — rebalance vs txn expiry ambiguity', 'Large txn timeout + periodic empty txn or stopContainerWhenFenced'],
  ['When to use', 'Standard consumers with manual ack', 'read_committed + transactional producer pipelines'],
];

export const BLOCKING_VS_NB: string[][] = [
  ['Mechanism', 'DefaultErrorHandler FixedBackOff sleep on consumer thread', '@RetryableTopic publishes to retry-N topic'],
  ['Partition blocking', 'Yes — partition paused during sleep/retry', 'No on main topic after forward to retry'],
  ['max.poll.interval risk', 'High for long backoff', 'Low on main consumer'],
  ['Delay ceiling', 'Seconds practical', 'Minutes/hours via retry topology'],
  ['Operational complexity', 'Low — one consumer', 'Higher — multiple topics/listeners'],
  ['Duplicate risk', 'Crash mid-retry → redelivery', 'Retry topic + main both may see dup on crash'],
  ['Ordering per key', 'Natural on partition', 'Requires same key + partition alignment'],
  ['Batch listeners', 'Supported with DEH', '@RetryableTopic not supported'],
  ['When choose blocking', 'Quick retries < few seconds, low volume', '—'],
  ['When choose non-blocking', 'Production payment pipelines, dependency outages', 'Default for staff interviews'],
];

export const CODE_DEH = `// Java 21 — Spring Kafka DefaultErrorHandler + DeadLetterPublishingRecoverer
@Bean
DeadLetterPublishingRecoverer dltRecoverer(KafkaTemplate<String, Object> template) {
  return new DeadLetterPublishingRecoverer(template);
  // default: topic + "-dlt", same partition — DLT partitions >= source
}

@Bean
DefaultErrorHandler errorHandler(DeadLetterPublishingRecoverer recoverer) {
  // Production override — docs default is FixedBackOff(0L, 9) = 10 attempts
  var backoff = new FixedBackOff(1000L, 2L); // 3 attempts, 1s apart
  var handler = new DefaultErrorHandler(recoverer, backoff);
  handler.addNotRetryableExceptions(
      JsonProcessingException.class,
      ValidationException.class);
  handler.setResetStateOnRecoveryFailure(true);
  return handler;
}

@Bean
ConcurrentKafkaListenerContainerFactory<String, Object> factory(
    ConsumerFactory<String, Object> cf, DefaultErrorHandler handler) {
  var f = new ConcurrentKafkaListenerContainerFactory<String, Object>();
  f.setConsumerFactory(cf);
  f.setCommonErrorHandler(handler);
  f.getContainerProperties().setAckMode(ContainerProperties.AckMode.MANUAL_IMMEDIATE);
  return f;
}`;

export const CODE_RETRYABLE = `// @RetryableTopic — non-blocking retries (NOT for batch listeners)
@RetryableTopic(
    attempts = "3",
    backoff = @Backoff(delay = 5000, multiplier = 2.0),
    autoCreateTopics = "false",
    dltStrategy = DltStrategy.FAIL_ON_ERROR,
    include = {SocketTimeoutException.class, DataAccessException.class},
    exclude = {JsonProcessingException.class})
@KafkaListener(topics = "payments.requested.v1", groupId = "settlement-worker")
public void onPayment(ConsumerRecord<String, PaymentEvent> record, Acknowledgment ack) {
  settlementService.settle(record.value()); // idempotent on paymentId
  ack.acknowledge();
}`;

export const CODE_DESER = `// ErrorHandlingDeserializer — failures before listener
props.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, ErrorHandlingDeserializer.class);
props.put(ErrorHandlingDeserializer.VALUE_DESERIALIZER_CLASS, JsonDeserializer.class.getName());
props.put(JsonDeserializer.VALUE_DEFAULT_TYPE, PaymentEvent.class.getName());

// Listener may receive null value with DeserializationException in headers
// DeadLetterPublishingRecoverer restores bytes when publishing to DLT (Spring Kafka 2.3+)`;

export const CODE_TX = `// Transactional consumer + DLT via DefaultAfterRollbackProcessor
@Bean
DefaultAfterRollbackProcessor<String, Object> afterRollbackProcessor(
    KafkaTemplate<String, Object> template) {
  var recoverer = new DeadLetterPublishingRecoverer(template);
  var processor = new DefaultAfterRollbackProcessor<>(recoverer, new FixedBackOff(0L, 2L));
  processor.setCommitRecovered(true);
  processor.setKafkaTemplate(template);
  processor.addNotRetryableExceptions(JsonProcessingException.class);
  return processor;
}

@Bean
ConcurrentKafkaListenerContainerFactory<String, Object> txnFactory(
    ConsumerFactory<String, Object> cf,
    DefaultAfterRollbackProcessor<String, Object> processor) {
  var f = new ConcurrentKafkaListenerContainerFactory<String, Object>();
  f.setConsumerFactory(cf);
  f.getContainerProperties().setTransactionManager(kafkaTransactionManager);
  f.setAfterRollbackProcessor(processor);
  return f;
}`;

export const SPRING_HEADERS_ROWS: string[][] = [
  ['KafkaHeaders.DLT_EXCEPTION_FQCN', 'Exception class name on DLT record'],
  ['KafkaHeaders.DLT_EXCEPTION_CAUSE_FQCN', 'Cause class if present'],
  ['KafkaHeaders.DLT_EXCEPTION_STACKTRACE', 'Stack trace text'],
  ['KafkaHeaders.DLT_EXCEPTION_MESSAGE', 'Exception message'],
  ['KafkaHeaders.DLT_KEY_EXCEPTION_FQCN', 'Key deserialization failure only'],
  ['KafkaHeaders.DLT_KEY_EXCEPTION_STACKTRACE', 'Key deser stack trace'],
  ['KafkaHeaders.DLT_KEY_EXCEPTION_MESSAGE', 'Key deser message'],
  ['KafkaHeaders.DLT_ORIGINAL_TOPIC', 'Failed record topic'],
  ['KafkaHeaders.DLT_ORIGINAL_PARTITION', 'Failed record partition'],
  ['KafkaHeaders.DLT_ORIGINAL_OFFSET', 'Failed record offset'],
  ['KafkaHeaders.DLT_ORIGINAL_TIMESTAMP', 'Original timestamp ms'],
  ['KafkaHeaders.DLT_ORIGINAL_TIMESTAMP_TYPE', 'Timestamp type'],
  ['KafkaHeaders.DLT_ORIGINAL_CONSUMER_GROUP', 'Consumer group id'],
  ['KafkaHeaders.DELIVERY_ATTEMPT', 'Attempt counter when enabled'],
  ['KafkaHeaders.ORIGINAL_OFFSET (legacy)', 'Prefer DLT_ORIGINAL_* in new code'],
];
