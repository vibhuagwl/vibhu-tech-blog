/** Producer-side failure taxonomy — these are NOT consumer DLQ cases. */

export const PRODUCER_NEQ_DLQ =
  'Producer failure ≠ Consumer DLQ. A produce that never lands on a topic has nothing for a consumer error handler to recover. Use producer retries, idempotence, transactions, and the transactional outbox for the business write path.';

export type ProducerFail = {
  failure: string;
  handling: string;
  retry: string;
  consumerDlq: string;
};

export const PRODUCER_FAILURES: ProducerFail[] = [
  {failure: 'Value serialization failure', handling: 'Fix schema/serde before produce; fail the API call', retry: 'No (poison at source)', consumerDlq: 'N/A'},
  {failure: 'Key serialization failure', handling: 'Same — reject request; never send partial', retry: 'No', consumerDlq: 'N/A'},
  {failure: 'Broker unavailable / network partition', handling: 'Producer retries + delivery.timeout.ms; outbox if must not lose', retry: 'Yes (client)', consumerDlq: 'N/A'},
  {failure: 'Request / produce timeout', handling: 'Idempotent producer + retries; unknown outcome → reconcile', retry: 'Yes capped', consumerDlq: 'N/A'},
  {failure: 'Metadata unavailable / DNS', handling: 'Backoff; bootstrap fix; circuit on metadata storms', retry: 'Yes', consumerDlq: 'N/A'},
  {failure: 'Authorization / ACL WRITE denied', handling: 'Ops ACL fix; alert Sev1; do not spin forever', retry: 'No until ACL fixed', consumerDlq: 'N/A'},
  {failure: 'Topic does not exist', handling: 'Fail closed if auto.create=false; create via IaC', retry: 'No', consumerDlq: 'N/A'},
  {failure: 'Wrong topic / misconfigured name', handling: 'Config bug — fix deploy; quarantine outbound', retry: 'No', consumerDlq: 'N/A'},
  {failure: 'Partition unavailable / leader election', handling: 'Client retries; monitor under-replicated', retry: 'Yes', consumerDlq: 'N/A'},
  {failure: 'NOT_ENOUGH_REPLICAS / AFTER_APPEND', handling: 'acks=all + min.insync.replicas; capacity/ISR alert', retry: 'Yes until timeout', consumerDlq: 'N/A'},
  {failure: 'RecordTooLarge', handling: 'Shrink payload / increase max.request.size + topic max.message.bytes', retry: 'No', consumerDlq: 'N/A'},
  {failure: 'Buffer exhaustion (buffer.memory)', handling: 'Backpressure caller; max.block.ms; scale produce rate', retry: 'Blocks then fail', consumerDlq: 'N/A'},
  {failure: 'delivery.timeout.ms exhausted', handling: 'Treat as unknown; idempotent key + outbox reconcile', retry: 'Exhausted', consumerDlq: 'N/A'},
  {failure: 'Idempotent producer fencing', handling: 'New producer epoch; do not dual-write two PIDs', retry: 'Special', consumerDlq: 'N/A'},
  {failure: 'Producer Fenced / txn timeout', handling: 'Abort txn; restart with new transactional.id discipline', retry: 'No blind', consumerDlq: 'N/A'},
  {failure: 'TLS / SASL failure', handling: 'Cert/credential rotate; fail closed', retry: 'Limited', consumerDlq: 'N/A'},
];

export const PRODUCER_CODE = `// Producer path — NEVER route these to consumer DefaultErrorHandler / DLT
@Bean
ProducerFactory<String, PaymentEvent> pf(KafkaProperties props) {
  Map<String, Object> cfg = props.buildProducerProperties(null);
  cfg.put(ProducerConfig.ACKS_CONFIG, "all");
  cfg.put(ProducerConfig.ENABLE_IDEMPOTENCE_CONFIG, true);
  cfg.put(ProducerConfig.MAX_IN_FLIGHT_REQUESTS_PER_CONNECTION, 5);
  cfg.put(ProducerConfig.DELIVERY_TIMEOUT_MS_CONFIG, 120_000);
  cfg.put(ProducerConfig.RETRIES_CONFIG, Integer.MAX_VALUE);
  return new DefaultKafkaProducerFactory<>(cfg);
}

// Unknown produce outcome (timeout after possible broker accept):
// 1) Do NOT double-charge — use business idempotencyKey
// 2) Persist intent in outbox BEFORE attempt when loss is unacceptable
// 3) Reconcile with bank/ledger; do not invent a "producer DLQ" that consumers read`;

export const OUTBOX_NOTE =
  'Transactional outbox: write business row + outbox row in one PostgreSQL transaction, then a relay publishes to Kafka. That converts “produce failed” into “relay retries” without pretending the broker has a producer DLQ.';
