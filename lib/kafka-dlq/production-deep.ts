/** Pattern comparison + parking lot + external scheduler + deep race runbooks. */

export const PATTERN_COMPARE: string[][] = [
  ['DefaultErrorHandler + FixedBackOff', 'In-thread ms–s', 'Preserves partition order', 'Low', 'Blocks partition', 'Short transient DB blips'],
  ['ExponentialBackOff', 'Growing', 'Preserves order', 'Low', 'Blocks longer', 'Backoff without hop topics'],
  ['ContainerPausingBackOffHandler', 'Long safe', 'Preserves order', 'Med', 'Pauses container', 'Backoff > max.poll.interval'],
  ['@RetryableTopic', 'Topic hops', 'Can break order across hops', 'Med–High', 'Non-blocking main', 'Seconds–minutes transient'],
  ['Manual retry topics', 'Designed hops', 'Same-key if designed', 'High ops', 'Non-blocking', 'Finance with custom headers'],
  ['External scheduler (DB/Redis)', 'retry_at', 'App-controlled', 'Highest', 'Decoupled', 'Hours+ delay, audit'],
  ['DLT (terminal)', 'N/A', 'Parked', 'Med', 'Unblocks if skip', 'Poison / exhausted / permanent'],
  ['Parking lot / hold', 'Until release', 'Preserves workflow order', 'High domain', 'Blocks later events', 'OOO lifecycle / gap'],
];

export const PATTERN_A = `// Pattern A — Blocking retry (DefaultErrorHandler)
@Bean
CommonErrorHandler blocking(KafkaTemplate<String, Object> tpl) {
  var recoverer = new DeadLetterPublishingRecoverer(tpl);
  var eh = new DefaultErrorHandler(recoverer, new FixedBackOff(1_000L, 3L));
  eh.addNotRetryableExceptions(ValidationException.class, JsonParseException.class);
  eh.setResetStateOnRecoveryFailure(true); // re-run backoff after DLT publish fail
  return eh;
}
// Pros: simple, preserves per-partition order (B retries before C).
// Cons: thread blocked; long sleep → max.poll.interval → rebalance.
// When: sub-second transient, low fan-out, ordering mandatory.`;

export const PATTERN_B = `// Pattern B — @RetryableTopic (non-blocking)
@RetryableTopic(
  attempts = "4",
  backoff = @Backoff(delay = 5_000, multiplier = 2.0, maxDelay = 300_000),
  dltStrategy = DltStrategy.FAIL_ON_ERROR,
  autoCreateTopics = "false")
@KafkaListener(topics = "payment.requested.v1", groupId = "settlement")
void onPayment(ConsumerRecord<String, PaymentEvent> rec) { ... }

// Ordering: B may hop to retry while C processes on main → order broken for same key
// unless you park later events or keep concurrency=1 and design holds.
// NOT supported for batch listeners (Spring Kafka docs).`;

export const PATTERN_C = `// Pattern C — Manual retry topology (no @RetryableTopic)
// main → retry-5s → retry-30s → retry-5m → DLT
// Prefer when: custom headers, shared hops across services, strict naming, no auto-create.
public void onTransient(ConsumerRecord<String, byte[]> rec, Exception ex) {
  int attempt = headerInt(rec, "x-retry-attempt") + 1;
  String dest = switch (attempt) {
    case 1 -> "payment.requested.v1.retry-5s";
    case 2 -> "payment.requested.v1.retry-30s";
    case 3 -> "payment.requested.v1.retry-5m";
    default -> "payment.requested.v1.DLT";
  };
  producer.send(dest, rec.key(), enrich(rec, attempt, ex));
  // then ack source — same DLT-then-commit discipline
}`;

export const PATTERN_D = `// Pattern D — External retry scheduler
// Kafka consume fail → INSERT retry_jobs(event_id, payload, retry_at, attempts)
// Scheduler SELECT ... FOR UPDATE SKIP LOCKED WHERE retry_at <= now()
// → produce back to main or retry topic
// Pros: hour-scale delay without max.poll risk; full audit in Postgres.
// Cons: duplicate risk, ordering harder, ops surface (DB + workers).
CREATE TABLE retry_jobs (
  event_id TEXT PRIMARY KEY,
  topic TEXT NOT NULL,
  payload BYTEA NOT NULL,
  retry_at TIMESTAMPTZ NOT NULL,
  attempts INT NOT NULL,
  last_error TEXT
);`;

export const PARKING_VS = `DLT          — terminal failure parking (ops + replay tooling)
Retry topic  — still in-flight work with delay
Parking lot  — ordered workflow hold (gap / prior open failure)
Quarantine   — security/PII/suspicious isolation (restricted ACL)

Example: OrderCreated → OrderPaid → OrderShipped (same orderId key)
If OrderPaid fails and you DLT it while OrderShipped succeeds on the same key,
you ship without pay — business corruption.
Finance/Hadron pattern: open failure / sequence hold parks later events until Paid replays.`;

export const ORDERING_WALK = `P0 records: A, B(fails), C, D

Blocking retry:
  A → B retry… → then C → D   (C waits; order preserved; throughput drops)

Skip to DLT immediately:
  A → B→DLT → C → D           (C proceeds; order of success ≠ business order)

Retry topic hop:
  A → B→retry-1 → C → D on main while B delayed
  (same-key order broken unless parking/hold)`;

export const DLT_PUBLISH_FAIL = `Consumer processing fails
        |
        v
DeadLetterPublishingRecoverer.accept(...)
        |
        X  DLT publish failure
           (broker down, ACL, topic missing, RecordTooLarge,
            serde fail building DLT record, txn/fencing, timeout)

Spring Kafka (DefaultErrorHandler):
  • Recoverer exception → failed record included in seeks
  • By default resetStateOnRecoveryFailure=true → backoff resets; redeliveries retry before recover again
  • Source offset MUST NOT commit — only copy may be the source topic
  • Partition can stall until DLT is healthy → alert Sev1 on recoveryFailed

Production-safe:
  eh.setResetStateOnRecoveryFailure(true);
  recoverer listener / RetryListener.recoveryFailed → page on-call
  Ensure ACL WRITE on DLT, matching partition count (same-partition resolver),
  max.message.bytes ≥ source, and separate producer config for DLT if needed.`;

export const OFFSET_SEQUENCES = `Sequence 1 — SAFE-ish (at-least-once DLT):
  process fail → publish DLT → commit source
  Crash after DLT before commit → redelivery → possible DUPLICATE DLT
  Mitigate: DLT unique (topic,partition,offset) or header dedupe

Sequence 2 — UNSAFE (loss):
  process fail → commit source → publish DLT
  If publish fails / process dies → message LOST from failure queue

Sequence 3 — Transactional (Kafka-internal EOS):
  begin txn → process → DLT produce → sendOffsetsToTransaction → commit
  DefaultAfterRollbackProcessor + DeadLetterPublishingRecoverer + commitRecovered
  Does NOT include PostgreSQL in the same atomic unit`;

export const REBALANCE_RACES = `Processing or DLT publish in flight
        |
        v
rebalance (max.poll.interval exceeded, session timeout, scale-out, deploy)

Risks:
  • Another consumer gets the partition and reprocesses → duplicate side effects / duplicate DLT
  • Offset commit race (old generation commit ignored / fenced)
  • DLT published by A, offset committed by B (or neither)

Mitigations:
  • Keep listener short; use retry topics / ContainerPausingBackOffHandler for long delay
  • Idempotent business write (UNIQUE event_id) + idempotent DLT sink
  • Static membership (group.instance.id) to reduce unnecessary revokes
  • Cooperative sticky assignor; monitor rebalance rate
  • Never Thread.sleep(minutes) on the listener thread`;

export const BATCH_DEEP = `Batch: A B C D E F — fail at C (index 2)

Throw BatchListenerFailedException("...", cause, indexOrRecord):
  • Commits/seeks so A,B are considered done (framework-dependent path)
  • Retries / recovers C
  • Remaining D,E,F redelivered after recovery seek semantics
  • If recoverer fails → seeks as if retries not exhausted (C stays)

Fallback (non-BatchListenerFailedException): retry/recover whole batch — expensive.

@RetryableTopic: NOT supported with batch listeners — use DEH + DLP.

Deser in batch: ErrorHandlingDeserializer or check ConversionException list and throw
BatchListenerFailedException at first bad index — batch does not auto-route deser to DLT.`;

export const DESER_DEEP = `poll() → deserialize key/value → IF FAIL before listener:
  Listener never sees a typed object.
  Use ErrorHandlingDeserializer wrapping the real deser:
    • Failed record delivered with null value/key + exception headers
    • Then DEH / DLP can publish raw bytes to DLT

Also cover:
  • Schema Registry unavailable → often TRANSIENT (backoff; do not DLT-storm)
  • Unknown schema id / incompatible → often PERMANENT → DLT + alert
  • Corrupt Avro / malformed JSON → POISON → immediate DLT
  • Preserve original payload bytes in DLT for forensics
  • Key deser failure vs value deser failure — both need EHD on both deserializers`;
