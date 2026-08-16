import type {AttrDoc} from './types';

export const ENABLE_WHAT = `@EnableKafka turns on Spring's Kafka listener annotation processing:
  KafkaListenerAnnotationBeanPostProcessor scans @KafkaListener methods
  and registers MessageListenerContainers.

It runs in the Spring ApplicationContext — never on the broker or KRaft controller.`;

export const ENABLE_CODE = `@Configuration
@EnableKafka
public class KafkaConfig {
  // ConcurrentKafkaListenerContainerFactory, ConsumerFactory, …
}

// Spring Boot 3.x: KafkaAutoConfiguration typically registers listener
// infrastructure when spring-kafka is on the classpath.
// Explicit @EnableKafka is still common (and required for non-Boot /
// custom setups). @EnableKafkaRetryTopic is meta-annotated with @EnableKafka.`;

export const ENABLE_WHEN =
  'Use when you need Kafka listeners and are not relying solely on Boot auto-config, or when documenting intent. Prefer @EnableKafkaRetryTopic if you configure global non-blocking retry infrastructure via that import path.';

export const ENABLE_WHEN_NOT =
  'Do not expect @EnableKafka to create brokers, topics, or consumer groups. Do not add both @EnableKafkaRetryTopic and a custom RetryTopicConfigurationSupport setup that duplicates beans.';

export const ENABLE_INTERVIEW =
  'Is @EnableKafka required in every Spring Boot Kafka app? Nuanced: Boot auto-config usually wires ConcurrentKafkaListenerContainerFactory and related beans when spring-kafka + spring.kafka.* are present. Explicit @EnableKafka is still best practice for clarity and non-Boot apps. @EnableKafkaRetryTopic already includes @EnableKafka.';

export const LISTENER_EXAMPLE = `@KafkaListener(
    id = "order-main",
    topics = "orders.v1",
    groupId = "order-service",
    containerFactory = "kafkaListenerContainerFactory",
    concurrency = "3",
    autoStartup = "true",
    properties = {
      "max.poll.records:100",
      "spring.json.value.default.type:com.acme.Order"
    }
)
public void consume(Order order,
                    @Header(KafkaHeaders.RECEIVED_TOPIC) String topic,
                    Acknowledgment ack) {
  process(order);
  ack.acknowledge(); // only if AckMode is MANUAL*
}`;

export const LISTENER_ATTRS: AttrDoc[] = [
  {
    name: 'topics',
    what: 'Explicit topic name(s) to subscribe.',
    why: 'Most common subscription mode.',
    when: 'Known static topic list.',
    example: 'topics = "orders.v1"',
    impact: 'Wrong name = silent empty consume if auto-create off.',
  },
  {
    name: 'topicPattern',
    what: 'Regex subscription across matching topics.',
    why: 'Multi-tenant or versioned topic families.',
    when: 'Dynamic topic set; avoid overlapping patterns across groups.',
    example: 'topicPattern = "orders\\\\..*"',
    impact: 'Metadata churn; careful with ACL wildcards.',
  },
  {
    name: 'topicPartitions',
    what: '@TopicPartition list with optional @PartitionOffset.',
    why: 'Pin partitions or start offsets for tooling/replay.',
    when: 'Admin/replay consumers — rare in core services.',
    example: '@TopicPartition(topic="orders", partitions={"0-2"})',
    impact: 'Bypasses normal group assignment semantics if misused.',
  },
  {
    name: 'groupId',
    what: 'Kafka consumer group id for this listener container.',
    why: 'Defines competing consumers and offset ownership.',
    when: 'Always set explicitly in prod (avoid anonymous groups).',
    example: 'groupId = "order-service"',
    impact: 'Wrong group = duplicate processing or empty lag.',
  },
  {
    name: 'id / idIsGroup',
    what: 'Listener id; optionally used as group id.',
    why: 'Stable metrics/JMX/actuator identity.',
    when: 'Multiple listeners in one app.',
    example: 'id = "order-main"',
    impact: 'Duplicate ids fail context startup.',
  },
  {
    name: 'containerFactory',
    what: 'Bean name of ConcurrentKafkaListenerContainerFactory.',
    why: 'Different deser, AckMode, concurrency, error handler per listener.',
    when: 'Batch vs record, JSON vs Avro, txn vs non-txn.',
    example: 'containerFactory = "batchFactory"',
    impact: 'Wrong factory silently changes commit/error semantics.',
  },
  {
    name: 'concurrency',
    what: 'Number of KafkaMessageListenerContainer threads for this listener.',
    why: 'Scale poll loops within one JVM.',
    when: 'partitions >= concurrency; else idle threads.',
    example: 'concurrency = "3"',
    impact: 'NOT partition count; excess concurrency idles.',
  },
  {
    name: 'autoStartup',
    what: 'Whether container starts with the context.',
    why: 'Defer consume until migrations/warm caches ready.',
    when: 'Controlled rollout / feature flags.',
    example: 'autoStartup = "${orders.listener.enabled:true}"',
    impact: 'false = lag grows until started.',
  },
  {
    name: 'properties',
    what: 'Per-listener Kafka consumer property overrides.',
    why: 'Tune max.poll.records etc. without global change.',
    when: 'Listener-specific SLOs.',
    example: '"max.poll.interval.ms:300000"',
    impact: 'Overrides can fight Boot yaml — document them.',
  },
  {
    name: 'clientIdPrefix',
    what: 'Prefix for Kafka client.id.',
    why: 'Broker logs / quotas identify this listener.',
    when: 'Multi-listener apps.',
    example: 'clientIdPrefix = "order-svc"',
    impact: 'Helps incident forensics.',
  },
  {
    name: 'errorHandler',
    what: 'KafkaListenerErrorHandler bean name (method-level).',
    why: 'Custom per-listener error path before container EH.',
    when: 'Request/reply failure mapping; rare vs CommonErrorHandler.',
    example: 'errorHandler = "ordersEh"',
    impact: 'Do not seek in listener EH — container unaware.',
  },
  {
    name: 'filter',
    what: 'RecordFilterStrategy bean — drop records before listener.',
    why: 'Ignore noise without business code.',
    when: 'Header-based skip; beware silent drops.',
    example: 'filter = "ignoreTestOrders"',
    impact: 'Filtered records still consume offsets (typically).',
  },
  {
    name: 'batch',
    what: 'Hint / pairing with batch factory (List / ConsumerRecords).',
    why: 'Throughput via batch listeners.',
    when: 'High volume; needs BatchListenerFailedException discipline.',
    example: 'Use batch-enabled containerFactory',
    impact: '@RetryableTopic NOT supported with batch.',
  },
  {
    name: 'concurrency SpEL / contentFilterChain',
    what: 'Advanced wiring for filtered message converters.',
    why: 'Legacy Spring Messaging filters.',
    when: 'Rare — prefer RecordFilterStrategy.',
    example: '—',
    impact: 'Complexity / surprise drops.',
  },
];

export const LISTENER_LIFECYCLE = `Application Startup
       |
Spring detects @KafkaListener (via @EnableKafka / Boot)
       |
ConcurrentMessageListenerContainer created
       |
KafkaConsumer created (ConsumerFactory)
       |
join group (groupId)
       |
partition assignment
       |
poll()
       |
deserialize key/value
       |
invoke listener method (or error handler if deser failed with EHD)
       |
business processing
       |
ack / commit (AckMode / txn / manual Acknowledgment)`;

export const OFFSET_CODE = `// MANUAL_IMMEDIATE — safe pattern: process then ack
@KafkaListener(topics = "orders", groupId = "order-service")
public void consume(ConsumerRecord<String, Order> rec, Acknowledgment ack) {
  process(rec.value());
  ack.acknowledge(); // commits this record's offset per AckMode rules
}

// UNSAFE: ack before side effects complete
ack.acknowledge();
bank.charge(...); // crash → lost record, money maybe charged

// enable.auto.commit=true is generally avoided with Spring listeners
// Prefer container-managed AckMode.BATCH / RECORD / MANUAL*`;

export const OFFSET_NOTES = `Relationship:
  @KafkaListener does not itself commit — the MessageListenerContainer does,
  according to containerFactory AckMode, Acknowledgment usage, or Kafka transactions.

  Throw from listener → CommonErrorHandler / AfterRollbackProcessor path
  (seek, retry, DLT) — offset advance depends on recoverer success.

  With KafkaTransactionManager: offsets sent via sendOffsetsToTransaction.`;

export const CONCURRENCY_DIAGRAM = `concurrency = listener consumer threads (containers), NOT partition count

6 partitions, concurrency=3  → each thread ~2 partitions (approx)
2 partitions, concurrency=5  → 2 busy threads, 3 idle

Idle consumers still hold threads/connections — waste and rebalance noise.
Prefer concurrency <= partition count for that topic.`;

export const MULTIPLE_LISTENERS = `Two @KafkaListener methods = two listener containers (usually two consumers).

Same groupId + same topics → competing consumers (scaled parallelism).
Different groupId + same topics → independent fan-out (each gets all records).
Different containerFactory → different AckMode/deser/error handling.

Threads do not share a single KafkaConsumer instance across methods.`;
