export const DLT_HANDLER_CODE = `@RetryableTopic(...)
@KafkaListener(topics = "orders.v1", groupId = "order-service")
public void consume(Order order) { ... }

@DltHandler
public void processDlt(
    Order order,
    @Header(KafkaHeaders.RECEIVED_TOPIC) String topic,
    @Header(KafkaHeaders.EXCEPTION_FQCN) String ex,
    @Header(KafkaHeaders.EXCEPTION_MESSAGE) String msg,
    ConsumerRecord<String, Order> record) {
  // persist, alert, do NOT treat as happy-path business workflow
}`;

export const DLT_HANDLER_FLOW = `Main @KafkaListener
      |
failure → retry hops (@RetryableTopic)
      |
attempts exhausted
      |
DLT topic
      |
@DltHandler method (same class; shared across @RetryableTopic methods in that class)
      |
success → DLT offset commits
failure → dltStrategy (ALWAYS_RETRY_ON_ERROR vs FAIL_ON_ERROR)`;

export const DLT_HANDLER_NOTES = `@DltHandler does NOT create the DLT topic — @RetryableTopic / RetryTopicConfiguration does.
It registers a consumer for the DLT (or uses logging default if absent).

Headers typically include original topic/partition/offset and exception metadata
(Spring Kafka DLT headers). Method signatures are flexible (payload, ConsumerRecord, headers).

autoStartDltHandler=false defers DLT consumption — lag grows until started.`;

export const DLT_FAILURE = `DLT
 |
@DltHandler
 |
 X failure

DLT != guarantee that processing succeeds.

ALWAYS_RETRY_ON_ERROR (default): keep redelivering DLT record → poison loop risk
FAIL_ON_ERROR: stop retrying DLT after failure (configure recoverer/ops)
NO_DLT: no DLT topic path

Production:
  • Keep @DltHandler side-effect light (persist + alert)
  • Idempotent DLT sink (unique original topic+partition+offset)
  • Metrics on DLT handler failures
  • Parking/quarantine for handler poison
  • Never use DLT handler as primary business workflow`;

export const SENDTO_CODE = `@KafkaListener(topics = "orders.v1", groupId = "enricher")
@SendTo("orders.processed.v1")
public ProcessedOrder process(Order order) {
  return enrich(order);
}

// null return → nothing sent
// exceptions → error handler path; @SendTo does not publish`;

export const SENDTO_FLOW = `Kafka topic
 |
Consumer (@KafkaListener)
 |
listener method return value
 |
@SendTo destination (fixed / SpEL / reply header)
 |
KafkaTemplate produce
 |
Kafka topic`;

export const SENDTO_NOTES = `@SendTo is a Spring Messaging pattern adapted to Kafka listeners.
It publishes the method return value — it is not "only for producers,"
but it does cause a produce after successful consume.

Use for enrich/transform pipelines and request/reply (reply topics / KafkaHeaders.REPLY_TOPIC).
Avoid for heavy downstream fan-out with complex failure domains — prefer explicit KafkaTemplate
+ outbox. Combine carefully with transactions (return publish participates in txn when configured).`;

export const TX_CODE = `// Kafka transaction — specify the Kafka TM
@Transactional("kafkaTransactionManager")
@KafkaListener(topics = "orders.v1", groupId = "order-svc")
public void consume(Order order) {
  kafkaTemplate.send("orders.events.v1", order.id(), OrderEvent.from(order));
  // offsets committed via sendOffsetsToTransaction on success
}

// Plain @Transactional often binds to DataSourceTransactionManager (JPA)
@Transactional
@KafkaListener(...)
public void consume(Order order) {
  repo.save(order); // DB TX only unless chained/synchronized carefully
}`;

export const TX_LISTENER_FLOW = `Kafka Consumer (read_committed peers see committed only)
       |
begin Kafka transaction
       |
process record
       |
produce downstream (same transactional producer)
       |
sendOffsetsToTransaction
       |
commitTransaction

On failure:
rollback → offsets not committed → record redelivered
DefaultAfterRollbackProcessor may retry / publish DLT`;

export const TX_DB = `DB transaction
       X   (not automatically the same atomic unit)
Kafka transaction

@Transactional on a listener does NOT magically merge PostgreSQL + Kafka.
Patterns:
  • Kafka-only EOS for consume-process-produce
  • DB inbox UNIQUE(event_id) + after-commit produce / outbox
  • ChainedTransactionManager — fragile; prefer outbox
  • Never claim exactly-once across bank APIs`;
