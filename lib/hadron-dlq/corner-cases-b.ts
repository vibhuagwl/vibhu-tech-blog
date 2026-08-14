import type {DlqCornerCase} from './corner-types';

export const CORNER_CASES_B: DlqCornerCase[] = [
  {
    id: 'duplicate-event',
    family: 'Idempotency',
    title: 'Duplicate payment / duplicate event_id',
    whatHappens: 'At-least-once redelivery after DB commit and before offset commit, or producer retry.',
    symptom: 'Same event_id twice. Must not double-apply money.',
    classify: 'IGNORE',
    retry: 'No.',
    dlq: 'No — second is a no-op.',
    holdCashLine: false,
    idempotency: 'processed_events PRIMARY KEY (event_id) in the same SQL TX as cash_lines mutate.',
    detection: 'alreadyProcessed or UNIQUE conflict',
    recovery: 'Commit offset. Metrics cashline.duplicate.',
    fallback: 'In-memory HashSet is not enough across restarts or two consumers.',
    alert: 'Duplicate rate after incidents is healthy; spike without rebalance is a producer bug.',
    lab: 'POST /api/lab/scenario/duplicate',
    mermaid: `sequenceDiagram
  participant K as Kafka
  participant DB as Hadron DB
  K->>DB: INSERT cash_lines + event_id
  Note over K: crash before ack
  K->>DB: same event_id
  DB-->>K: UNIQUE → ignore`,
    code: `@Transactional
// cash_lines + processed_events in ONE sql tx
boolean first = idempotency.markProcessed(event);`,
    interview: 'Effectively-once is the unique index, not enable.idempotence on the producer.',
    trap: 'if (!seen.add(id)) return; with no DB constraint.',
  },
  {
    id: 'commit-ack-gap',
    family: 'Idempotency',
    title: 'DB commit succeeds, Kafka offset ack fails',
    whatHappens: 'The dangerous-looking gap that uniqueness closes.',
    symptom: 'Redelivery of an already applied event.',
    classify: 'IGNORE',
    retry: 'Kafka redelivers; app ignores.',
    dlq: 'No.',
    holdCashLine: false,
    idempotency: 'Yes — this is the textbook case.',
    detection: 'duplicate metric after a broker/consumer crash',
    recovery: 'None for data; commit offset on second delivery.',
    fallback: 'If you acked before commit, you would skip forever — opposite bug.',
    alert: 'Crash loops + duplicates.',
    mermaid: `flowchart TD
  C[DB commit] --> A[ack fails]
  A --> R[redeliver]
  R --> U[UNIQUE ignore]`,
    code: `// RECORD ack after listener returns
// throw on failure → no ack`,
    interview: 'Name both gaps: commit-then-lost-ack vs ack-then-rollback. Design for the first; never create the second.',
    trap: 'Manual ack at the start of the listener.',
  },
  {
    id: 'ack-before-db',
    family: 'Idempotency',
    title: 'Ack then DB fail (lost CashLine)',
    whatHappens: 'If you commit the offset before the SQL transaction succeeds, a later rollback loses the event forever.',
    symptom: 'Missing CashLine; no DLQ; offset already past.',
    classify: 'DLQ_NOW',
    retry: 'Cannot retry — Kafka thinks it succeeded.',
    dlq: 'Too late unless you wrote DLQ first (you did not).',
    holdCashLine: true,
    idempotency: 'N/A — you skipped the write.',
    detection: 'Reconciliation vs Neptune; “ack then DB fail” in the failure matrix.',
    recovery: 'Fix ack mode; restore from Neptune poller/CDC; never this pattern.',
    fallback: 'Throw before ack. Always.',
    alert: 'This is a Sev-1 design bug, not a metric.',
    mermaid: `flowchart TD
  Bad[ack] --> Rollback[DB rollback]
  Rollback --> Lost[event gone]
  Good[throw] --> NoAck[redeliver]`,
    code: `// Spring Kafka RECORD: ack after method return
// never Acknowledgment.acknowledge() before process()`,
    interview: 'The unrecoverable consumer bug is ack-before-commit. DLQ cannot save a committed skip.',
    trap: 'Manual immediate ack “for throughput”.',
  },
  {
    id: 'crash-mid-tx',
    family: 'Idempotency',
    title: 'Crash mid SQL transaction',
    whatHappens: 'JVM/pod dies during cash_lines + processed_events TX.',
    symptom: 'SQL rolls back; Kafka has not acked.',
    classify: 'RETRY',
    retry: 'Redeliver whole event.',
    dlq: 'Only if it still fails after cap.',
    holdCashLine: false,
    idempotency: 'No partial CashLine.',
    detection: 'Pod kill / OOM / rebalance.',
    recovery: 'Reprocess. Single SQL TX is the recovery.',
    fallback: 'Do not split CashLine write and processed_events across transactions.',
    alert: 'Crash loops.',
    mermaid: `flowchart LR
  TX[open TX] --> Crash
  Crash --> RB[rollback]
  RB --> Redeliver`,
    code: `@Transactional
public ProcessResult process(...) { /* all writes here */ }`,
    interview: 'Partial processing is forbidden. One TX or nothing.',
    trap: 'Writing CashLine, committing, then inserting processed_events.',
  },
  {
    id: 'event-101-dlq',
    family: 'Ordering',
    title: 'Event 101 fails while 102/103 arrive (the money story)',
    whatHappens: 'UPDATE goes to DLQ. SETTLED/COMPLETED would otherwise apply on a stale facility.',
    symptom: 'Open DLQ for CL123; later sequences in the same partition.',
    classify: 'PARK',
    retry: '101 follows its own retry/DLQ path.',
    dlq: '101 yes if poison/business/exhausted. 102/103 parked in waiting_events, not settled.',
    holdCashLine: true,
    idempotency: 'Parked events keep event_id for later apply.',
    detection: 'hasUnresolvedPriorFailure + sequence gate',
    recovery: 'Correct/replay 101 through Kafka; then drain waiting_events in order.',
    fallback: 'Never “best effort” skip the hole.',
    alert: 'waiting_events depth + open DLQ per CashLine.',
    lab: 'POST /api/lab/scenario/out-of-order',
    mermaid: `sequenceDiagram
  participant E1 as seq1 CREATE
  participant E2 as seq2 UPDATE
  participant E3 as seq3 SETTLE
  E1->>E1: last_seq=1
  E2-->>E2: DLQ + blocked
  E3->>E3: park waiting_events
  Note over E3: do NOT settle`,
    code: `if (hasUnresolvedPriorFailure(cashLineId)) {
  waitingEvents.park(event, payload, expected);
  throw new OutOfOrderEventException(...);
}`,
    interview: 'If you cannot pause the CashLine, you do not have a safe financial DLQ.',
    trap: 'DLQ event 2 and keep consuming 3 and 4.',
  },
  {
    id: 'out-of-order',
    family: 'Ordering',
    title: 'Sequence gap (received 3, expected 2)',
    whatHappens: 'Even without a DLQ, seq 3 arrives before seq 2 (poller race, or 2 delayed on retry topic).',
    symptom: 'OutOfOrderEventException; waiting_events row.',
    classify: 'PARK',
    retry: 'Classifier maps OutOfOrderEventException to RETRY so the later event is not lost; park table is source for apply.',
    dlq: 'Usually no skip. If the gap never arrives, ops investigates; may DLQ the waiter after SLA.',
    holdCashLine: true,
    idempotency: 'Do not mark seq 3 processed until applied.',
    detection: 'expected = last_seq+1',
    recovery: 'When seq 2 applies, drain waiters in order.',
    fallback: 'Do not settle on a gap.',
    alert: 'cashline.out.of.order',
    lab: 'POST /api/lab/scenario/out-of-order',
    mermaid: `flowchart TD
  S3[seq=3] --> Exp[expected=2]
  Exp --> Park[waiting_events]
  S2[seq=2 arrives] --> Apply2
  Apply2 --> Drain[apply seq=3]`,
    code: `if (event.sequenceNumber() != expected) {
  waitingEvents.park(event, payload, expected);
  throw new OutOfOrderEventException(id, expected, received);
}`,
    interview: 'Partition key gives Kafka order only if every hop keeps the key and partition count.',
    trap: 'Assuming Kafka orders across partitions.',
  },
  {
    id: 'stale-event',
    family: 'Ordering',
    title: 'Stale event (seq ≤ last_processed)',
    whatHappens: 'Neptune republishes an old version, or offset reset replays history.',
    symptom: 'seq 1 arrives after seq 3 already applied.',
    classify: 'IGNORE',
    retry: 'No.',
    dlq: 'No — stale skip, metric only.',
    holdCashLine: false,
    idempotency: 'Mark processed so we do not DLQ-loop the stale id if it is new event_id with old seq.',
    detection: 'isStale: sequenceNumber <= lastProcessedSequence',
    recovery: 'Ignore. Monitor cashline.stale / duplicate.',
    fallback: 'State machine still rejects illegal transitions if seq check is bypassed.',
    alert: 'Stale spike after offset reset.',
    lab: 'POST /api/lab/scenario/stale-event',
    mermaid: `flowchart LR
  Last[last_seq=3] --> Old[seq=1]
  Old --> Skip[ignore]`,
    code: `if (ordering.isStale(event, state)) {
  idempotency.markProcessed(event);
  return ProcessResult.stale(event.eventId());
}`,
    interview: 'Offset reset is a history replay. Sequence + event_id make it a no-op.',
    trap: 'DLQ-ing stale events and blocking the CashLine.',
  },
  {
    id: 'replay-after-settle',
    family: 'Ordering',
    title: 'Replay UPDATE after SETTLED',
    whatHappens: 'Ops replays an old UPDATE onto a CashLine that already settled.',
    symptom: 'InvalidCashLineException / state machine reject.',
    classify: 'DLQ_NOW',
    retry: 'No.',
    dlq: 'Conflict/DLQ. Must not reopen the facility.',
    holdCashLine: false,
    idempotency: 'SETTLED is terminal except COMPLETED.',
    detection: 'CashLineService: SETTLED + UPDATED → exception',
    recovery: 'Ops override only with an explicit compensating event — not silent UPDATE.',
    fallback: 'State machine is the last fence.',
    alert: 'Replay failures after settlement.',
    lab: 'POST /api/lab/scenario/replay-after-settle',
    mermaid: `flowchart TD
  S[SETTLED] --> U[UPDATED replay]
  U --> X[reject]
  X --> DLQ`,
    code: `if (entity.getStatus() == SETTLED && eventType contains UPDATED)
  throw new InvalidCashLineException("Replay after settlement...");`,
    interview: 'Replay is not a time machine. Terminal states stay terminal.',
    trap: 'Calling the domain service from the replay API and forcing the update.',
  },
  {
    id: 'cancelled-then-money',
    family: 'Ordering',
    title: 'Money event after CANCELLED',
    whatHappens: 'Facility cancelled; SETTLE/UPDATE still in Kafka or replayed.',
    symptom: 'InvalidCashLineException already cancelled.',
    classify: 'DLQ_NOW',
    retry: 'No.',
    dlq: 'Yes — do not apply money.',
    holdCashLine: false,
    idempotency: 'CANCELLED is terminal (self-transition only).',
    detection: 'status == CANCELLED before apply',
    recovery: 'Ignore or DLQ; investigate producer.',
    fallback: 'Never un-cancel from a settlement event.',
    alert: 'Business DLQ on cancelled facilities.',
    lab: 'POST /api/lab/scenario/cancelled-then-settle',
    mermaid: `flowchart TD
  C[CANCELLED] --> S[SETTLED event]
  S --> Reject[DLQ / ignore]`,
    code: `if (entity.getStatus() == CashLineStatus.CANCELLED)
  throw new InvalidCashLineException("CashLine already cancelled");`,
    interview: 'Cancelled facilities do not take money events. DLQ is evidence.',
    trap: 'Reopening CANCELLED because SETTLE arrived later.',
  },
  {
    id: 'currency-mismatch',
    family: 'Business',
    title: 'Currency / account mismatch on later event',
    whatHappens: 'CREATE was USD/ACC-1001; UPDATE says EUR or another account.',
    symptom: 'InvalidCashLineException mismatch.',
    classify: 'DLQ_NOW',
    retry: 'No.',
    dlq: 'Yes. Correct payload or compensating event.',
    holdCashLine: true,
    idempotency: 'Do not mutate currency in place.',
    detection: 'CashLineService compares stored vs event',
    recovery: 'Ops correction; replay.',
    fallback: 'Do not silently overwrite currency.',
    alert: 'Business DLQ mismatch.',
    lab: 'POST /api/lab/scenario/currency-mismatch',
    mermaid: `flowchart LR
  USD[stored USD] --> EUR[event EUR]
  EUR --> DLQ`,
    code: `if (entity.getCurrency() != null && !entity.getCurrency().equals(event.currency()))
  throw new InvalidCashLineException("Currency mismatch");`,
    interview: 'Identity fields are invariants. Mismatch is data, not a timeout.',
    trap: 'Updating currency because “latest event wins”.',
  },
];
