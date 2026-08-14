export const PAYMENT_REQS: string[][] = [
  ['Idempotency', 'UNIQUE(payment_id) or business key in same TX as ledger write'],
  ['Ack policy', 'enable.auto.commit=false; MANUAL_IMMEDIATE after DB commit'],
  ['DLT evidence', 'Headers + optional dead_letter_messages table with topic/partition/offset'],
  ['Replay RBAC', 'Separate role; audit actor + timestamp'],
  ['Ordering', 'Key = accountId or paymentId; sequence for lifecycle events'],
  ['No silent skip', 'Poison payment → DLT — never commit without terminal action'],
  ['Dependency retry', '@RetryableTopic or retry topics — not 5m DEH sleep'],
  ['EOS claim', 'Effectively-once via idempotency — not Kafka txn alone'],
  ['PII', 'Truncate DLT payload; encrypt; no full PAN in headers'],
  ['SLO', 'DLT rate alert; settlement lag separate from DLT lag'],
];

export const PAYMENT_ARCH = `flowchart TB
  subgraph api["payment-api"]
    REST[POST /payments]
    PROD[KafkaTemplate idempotent]
  end
  subgraph kafka["Kafka topics"]
    REQ[payments.requested.v1]
    RETRY[payments.requested.v1-retry-0/1/2]
    DLT[payments.requested.v1-dlt]
    RES[payments.result.v1]
  end
  subgraph worker["settlement-worker"]
    LIST[@KafkaListener + classifier]
    SVC[SettlementService @Transactional DB]
    PE[(processed_payments UNIQUE payment_id)]
    LED[(ledger)]
  end
  subgraph ops["Ops plane"]
    DLQDB[(dead_letter_messages)]
    REPLAY[Replay API RBAC]
  end
  REST --> PROD --> REQ
  REQ --> LIST
  LIST -->|transient| RETRY
  RETRY --> LIST
  LIST -->|fail terminal| DLT
  LIST --> SVC
  SVC --> PE
  SVC --> LED
  SVC -->|ok| RES
  DLT --> DLQDB
  DLQDB --> REPLAY
  REPLAY -->|same paymentId key| REQ`;

export const PAYMENT_FAILURE_ROWS: string[][] = [
  ['Bank API timeout', 'Retry 3× via retry topics', 'Then DLT', 'Commit after settle or DLT', 'Dup if redelivered — idempotent settle', 'Low', 'Dependency alert'],
  ['Duplicate payment_id event', 'No retry', 'Ignore DUPLICATE', 'Commit', 'None', 'Low', 'Metric duplicate ignored'],
  ['Invalid amount / currency', 'No', 'DLT immediate', 'After DLT', 'Replay after fix', 'Low', 'Business validation alert'],
  ['SETTLED then UPDATE replay', 'No', 'Reject illegal transition', 'DLT stays', 'No dup charge', 'Low', 'replay.failed'],
  ['DB commit ok offset fail', 'Redelivery', 'No second settle', 'Retry commit', 'Idempotent — no dup', 'Low', 'Standard ALO gap'],
  ['DLT publish fail', 'Seek loop', 'No DLT row yet', 'Not committed', 'Later dup possible', 'Medium until fixed', 'Sev1 recoverer'],
  ['Poison JSON in payment event', 'No', 'DLT immediate', 'After DLT', 'Replay after producer fix', 'Low if DLT ok', 'Poison alert'],
  ['Rebalance mid-settlement', 'New owner redelivers', 'Maybe duplicate attempt', 'Idempotent settle', 'Dup without UNIQUE', 'Low', 'Static membership'],
];

export const REPLAY_WORKFLOW = `Payment DLT replay workflow (safe):
  1. Ops opens DLQ console row — status FAILED, payment_id, DLT headers
  2. Validate payload + schema; fix if needed (correct amount, enum)
  3. Optimistic lock: UPDATE status REPLAYING WHERE id=? AND status=FAILED
  4. If 0 rows updated → 409 conflict (another operator or already replayed)
  5. Republish to payments.requested.v1 with SAME key paymentId
  6. Add headers: x-replay-dlq-id, x-correlation-id, hadron-replay=true
  7. Consumer: if payment_id in processed_payments → skip DUPLICATE
  8. On success: mark DLQ row REPLAYED; emit payments.result if needed
  9. On illegal transition: mark replay.failed; stay in DLT for triage
  Never: call settlementService.settle() directly from HTTP — bypasses offset/idempotency story`;

export const PAYMENT_GUARDS: string[] = [
  'UNIQUE(payment_id) in processed_payments — same DB TX as ledger',
  'State machine: COMPLETED→COMPLETED ok; SETTLED→PROCESSING reject',
  'Sequence gate: do not SETTLE if earlier lifecycle event in DLT',
  'Replay lock prevents double operator replay',
  'Same Kafka key on replay as original ingress',
  'DLT retention ≥ max dispute investigation window',
  'No auto-replay for business validation failures without human',
  'Circuit breaker on bank API — pause ingress or sample DLT',
  'Metrics: settlement.dlt, settlement.replay.failed — not raw payment_id labels',
  'read_committed if consuming transactional payment results',
];
