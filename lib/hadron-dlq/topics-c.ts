import type {HadronTopic} from './types';

export const TOPICS_C: HadronTopic[] = [
  {
    id: 'dlq',
    title: '13. DLQ Topics',
    badge: 'One family',
    problem: 'How many DLQs? One per exception is an ops nightmare. One mixed pile is noisy but operable.',
    whenToUse: 'Hadron: one DLQ topic per source topic, plus failure_reason in the DB for filters.',
    whenAvoid: 'A new Kafka topic per exception class.',
    mermaid: `flowchart LR
  B[business] --> D[cashline-events-dlq]
  T[technical exhausted] --> D
  S[schema/poison] --> D
  D --> DB[(filter by failure_reason)]`,
    code: `publisher.publish(TopicNames.DLQ, envelope.key(), envelope.payload(), headers);`,
    failure: 'Security/PII incidents may justify a separate restricted topic with tighter ACLs — not a fourth catch-all.',
    production: 'Practical Hadron rec: DLQ per source topic (cashline-events-dlq). Category is a column. Optional second topic only for poison/schema if serde fails before you can parse cashLineId.',
    interview30s: 'One DLQ per topic, many reasons in Postgres. Split by service, not by exception.',
    followUp: 'DLQ per service vs per topic: per topic keeps replay mapping obvious.',
    tradeoff: 'Multiple DLQs isolate noise; they also isolate monitoring and replay tooling. Start with one.',
    memoryTrick: 'Topics for transport, columns for taxonomy.',
  },
  {
    id: 'dlq-persist',
    title: '14. DLQ Persistence',
    badge: 'REQUIRES_NEW',
    problem: 'If DLQ insert joins the failed CashLine transaction, rollback deletes the evidence.',
    whenToUse: 'Always persist in a new transaction.',
    whenAvoid: 'Best-effort log-only DLQ for payments.',
    mermaid: `flowchart TD
  F[Process fails] --> N[REQUIRES_NEW insert DLQ]
  N --> C[Commit offset]
  C -->|offset commit fails| R[Redelivery]
  R --> U[UNIQUE event_id update last_failed_at]`,
    code: `@Transactional(propagation = REQUIRES_NEW)
public DeadLetterMessageEntity persist(...) {
  try { return repository.saveAndFlush(row); }
  catch (DataIntegrityViolationException dup) { return findByEventId(...); }
}`,
    failure: 'DLQ DB itself down: you must not loop forever. Alert, keep the Kafka retry, or fail the consumer so lag pages you.',
    production: 'Truncate payloads, mask in logs, retain FAILED until resolve, cleanup REPLAYED after 90 days.',
    interview30s: 'DLQ write is idempotent and in a separate transaction so Kafka redelivery does not create two tickets.',
    followUp: 'Sensitive financial payload at rest: encrypt column or store a tokenized pointer. Lab truncates and masks logs.',
    tradeoff: 'If DLQ insert fails you might reprocess poison. That is better than silently committing the offset with no record.',
    memoryTrick: 'Evidence first, then skip.',
  },
  {
    id: 'replay',
    title: '15. Replay',
    badge: 'Through Kafka',
    problem: 'Two operators clicking Replay, or calling the service method directly, duplicates money.',
    whenToUse: 'After correcting payload or restoring a dependency.',
    whenAvoid: 'Replaying SETTLED CashLines without an explicit ops override.',
    mermaid: `flowchart TD
  A[User A] --> L[@Version REPLAYING]
  B[User B] --> X[409 ReplayConflict]
  L --> K[publish cashline-events]
  K --> C[same consumer]
  C --> I[processed_events]`,
    code: `if (!REPLAYABLE.contains(row.getStatus())) throw new ReplayConflictException(...);
row.setStatus(REPLAYING);
dlq.saveAndFlush(row); // OptimisticLockingFailureException → 409`,
    failure: 'Direct service call skips partition order and the retry/DLQ path. Replay afterCommit publishes instead.',
    production: 'APIs: replay id, replay cashlineId, batch, list, get, resolve, ignore, correct. Header X-Replay-Actor is audited.',
    interview30s: 'Replay is a producer. Idempotency makes a second successful consume a no-op.',
    followUp: 'States: FAILED → READY_FOR_REPLAY → REPLAYING → REPLAYED | REPLAY_FAILED. RESOLVED/IGNORED are human exits.',
    tradeoff: 'Optimistic lock vs Redis lock. DB version is enough for a single-row replay.',
    memoryTrick: 'Claim, publish, never invoke.',
  },
  {
    id: 'cashline-ordering',
    title: '16. CashLine Ordering',
    badge: 'CL123 100–103',
    problem: 'Event 101 UPDATE fails. 102 SETTLEMENT and 103 COMPLETION must not win.',
    whenToUse: 'Always validate sequenceNumber against cashline_state.last_processed_sequence.',
    whenAvoid: 'Processing “whatever arrives” because “Kafka is ordered”.',
    mermaid: `flowchart TD
  E100[CREATE seq1] --> OK1[last=1]
  E101[UPDATE seq2 FAIL] --> DLQ
  E102[SETTLE seq3] --> PARK[waiting_events]
  E103[COMPLETE seq4] --> PARK`,
    code: `int expected = state.getLastProcessedSequence() + 1;
if (event.sequenceNumber() != expected) {
  waitingEvents.park(event, payload, expected);
  throw new OutOfOrderEventException(cashLineId, expected, received);
}`,
    failure: 'Option A (partition key) prevents cross-partition reorder. Option B (sequence) prevents retry-topic reorder. You want both.',
    production: 'Optimistic @Version on cashline_state. Open DLQ on that CashLine blocks later sequences.',
    interview30s: 'Expected = last+1. If we see 3 while expecting 2, we park, we do not settle.',
    followUp: 'Stale sequence <= last is ignored/idempotent, not DLQ, because it is a redelivery.',
    tradeoff: 'Parking needs a release path after replay of 101. Lab parks; ops replays in order by cashlineId API.',
    memoryTrick: '101 DLQ means 102 is a hostage, not a success.',
  },
  {
    id: 'state-machine',
    title: '17. CashLine State Machine',
    badge: 'Illegal transitions',
    problem: 'COMPLETED → NEW would resurrect a settled facility. SETTLED → PROCESSING would reopen money movement.',
    whenToUse: 'Every apply() path, including replay.',
    whenAvoid: 'Stringly status updates from the listener.',
    mermaid: `stateDiagram-v2
  [*] --> NEW
  NEW --> VALIDATED
  VALIDATED --> PROCESSING
  PROCESSING --> PROCESSED
  PROCESSED --> SETTLED
  SETTLED --> COMPLETED
  VALIDATED --> CANCELLED
  COMPLETED --> COMPLETED: idempotent`,
    code: `if (from == to) return from; // COMPLETED → COMPLETED OK
if (!allowed.get(from).contains(to)) throw new IllegalStateTransitionException(...);`,
    failure: 'Replay after settlement of an UPDATE event must fail closed.',
    production: 'Failure states RETRY/DLQ/MANUAL_REVIEW live on cashline_state.blockedReason, not as happy-path statuses mixed into money transitions.',
    interview30s: 'The state machine is the business lock. Kafka is just how events arrive.',
    followUp: 'Idempotent COMPLETED→COMPLETED is required because at-least-once will retry the last event.',
    tradeoff: 'Strict machine vs “upsert last event”. Strict wins in payments.',
    memoryTrick: 'States are a door. Events are keys. DLQ is a lost key, not a new door.',
  },
  {
    id: 'neptune',
    title: '18. Neptune Integration',
    badge: 'Cursor (updated_at, id)',
    problem: 'WHERE updated_at > lastTimestamp skips rows that share the timestamp of the last polled row.',
    whenToUse: 'When CDC is not available. Prefer CDC (Debezium) for lower lag and deletes.',
    whenAvoid: 'Polling without a monotonic cursor or without storing progress atomically after a successful batch.',
    mermaid: `flowchart TD
  Q["SELECT ... WHERE (updated_at,id) > (c_ts,c_id) ORDER BY updated_at,id"] --> B[batch]
  B --> P[publish Kafka]
  P --> C[save cursor last row]`,
    code: `WHERE n.updatedAt > :updatedAt OR (n.updatedAt = :updatedAt AND n.id > :id)
ORDER BY n.updatedAt ASC, n.id ASC`,
    failure: 'Crash after publishing half a batch but before cursor save → duplicates (OK, idempotent). Cursor save before publish → silent loss (not OK).',
    production: 'Handle deletes as CASHLINE_CANCELLED. Paginate. Backpressure by batch-size. Duplicate pollers need a leader lock on poller_cursor.',
    interview30s: 'CDC if we can. Else poll with (updated_at, id), publish, then advance cursor.',
    followUp: 'Equal timestamps are the classic lost-update of pollers.',
    tradeoff: 'CDC operational cost vs poller lag and load on Neptune.',
    memoryTrick: 'Cursor is a pair, never a timestamp.',
  },
];
