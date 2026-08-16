/** @RetryableTopic, @Backoff, comparison to DefaultErrorHandler. */

export const RETRYABLE_CODE = `@RetryableTopic(
    attempts = "4",
    backoff = @Backoff(delay = 1000, multiplier = 2.0, maxDelay = 30_000, random = true),
    include = { TransientException.class, QueryTimeoutException.class },
    exclude = { ValidationException.class, JsonParseException.class },
    traversingCauses = "true",
    topicSuffixingStrategy = TopicSuffixingStrategy.SUFFIX_WITH_DELAY_VALUE,
    sameIntervalTopicReuseStrategy = SameIntervalTopicReuseStrategy.SINGLE_TOPIC,
    dltStrategy = DltStrategy.FAIL_ON_ERROR,
    autoCreateTopics = "false",
    autoStartDltHandler = "true",
    kafkaTemplate = "bytesRetryTemplate",
    concurrency = "3"
)
@KafkaListener(topics = "orders.v1", groupId = "order-service")
public void consume(Order order) {
  orderService.apply(order);
}

@DltHandler
public void onDlt(Order order, ConsumerRecord<?, ?> rec) {
  ops.persistDeadLetter(rec);
}`;

export const RETRYABLE_FLOW = `main topic (orders.v1)
    |
    v  failure classified as retryable
retry topic (e.g. orders.v1-retry-1000)
    |
    v
retry topic (…-2000 / …-4000 / …)
    |
    v
DLT (orders.v1-dlt)
    |
    v
@DltHandler (optional; else logging default)`;

export const RETRYABLE_WHAT = `Spring creates (or expects) retry + DLT topics and additional listener containers
that consume those topics and re-invoke your listener logic after delay.

Kafka broker does not implement retry. Spring producers forward the record
to the next hop topic; separate consumers read hops.

NOT supported with batch listeners — use DefaultErrorHandler + DeadLetterPublishingRecoverer.`;

export const RETRYABLE_ATTRS: string[][] = [
  ['attempts', 'Delivery attempts before DLT (default "3")', 'Includes original + retries — confirm meaning in your version'],
  ['backoff', '@Backoff delay/multiplier/maxDelay/random', 'Defines hop delays'],
  ['timeout', 'Give up to DLT after elapsed ms', 'Wall-clock cap'],
  ['include / includeNames', 'Exception types to retry', 'Others may go DLT'],
  ['exclude / excludeNames', 'Straight to DLT', 'Poison/permanent'],
  ['traversingCauses', 'Walk cause chain for include/exclude', 'Default true when include/exclude set'],
  ['kafkaTemplate', 'Template bean for forwarding', 'Must serialize same payload'],
  ['listenerContainerFactory', 'Factory for retry/DLT containers', 'Defaults to main'],
  ['autoCreateTopics', 'Spring creates retry/DLT topics', 'Prefer false + IaC in prod'],
  ['numPartitions / replicationFactor', 'For auto-created topics', 'Match main partitions for key order'],
  ['retryTopicSuffix / dltTopicSuffix', 'Naming', 'Defaults -retry / -dlt'],
  ['topicSuffixingStrategy', 'DELAY_VALUE vs INDEX', 'Ops naming clarity'],
  ['sameIntervalTopicReuseStrategy', 'SINGLE_TOPIC default (3.2+)', 'Fewer topics for fixed backoff'],
  ['dltStrategy', 'ALWAYS_RETRY_ON_ERROR / FAIL_ON_ERROR / NO_DLT', 'DLT handler failure behavior'],
  ['autoStartDltHandler', 'Defer DLT container start', 'Ops-controlled drain'],
  ['concurrency', 'Retry/DLT container concurrency', 'Defaults to main'],
  ['exceptionBasedDltRouting', 'Route to custom DLT by exception (3.2+)', 'Multi-DLT taxonomy'],
];

export const RETRY_VS_DEH: string[][] = [
  ['Blocking retry', 'No (non-blocking hops)', 'Yes (in-thread BackOff)'],
  ['Retry topics', 'Yes', 'No (unless custom)'],
  ['Partition blocking on main', 'Main unblocks after forward', 'Yes during backoff'],
  ['Ordering (same key)', 'Can break across hops', 'Preserved on partition'],
  ['Backoff', '@Backoff / topic delays', 'FixedBackOff / ExponentialBackOff'],
  ['DLT', 'Built-in + @DltHandler', 'DeadLetterPublishingRecoverer'],
  ['Batch listeners', 'NOT supported', 'Supported + BatchListenerFailedException'],
  ['Ops complexity', 'Higher (many topics)', 'Lower'],
  ['Best for', 'Seconds–minutes transient', 'Short blips; strict order'],
];

export const BACKOFF_CODE = `@Backoff(
    delay = 1000,        // initial delay ms
    multiplier = 2.0,    // exponential factor
    maxDelay = 30_000,   // cap
    random = true        // jitter
)

Timeline (multiplier 2, max 30s, no jitter):
1s → 2s → 4s → 8s → 16s → 30s → 30s …

Jitter spreads thundering herds when many partitions fail together
(e.g. shared DB outage). Prefer random=true in prod fan-out systems.`;

export const BACKOFF_NOTES =
  '@Backoff is from spring-retry; used inside @RetryableTopic to size delay hops. It does not sleep the main listener for minutes when non-blocking retry topics are used — delays are realized by when the retry-topic consumer picks up the record (plus framework delay mechanisms).';
