export const MEMORY_SENTENCE =
  'Key by CashLine, retry what time can fix, DLQ what data must fix, never skip a middle event, UNIQUE(event_id), replay through Kafka.';

export const SIXTY_SEC =
  'Neptune emits CashLine changes. We poll or CDC into Kafka keyed by cashLineId so one facility stays ordered. Hadron validates, applies a state machine, and writes processed_events in the same SQL transaction. Timeouts retry on retry-1/2/3. Poison and business errors go to a DLQ topic and a Postgres row. Replay republishes to the original topic under an optimistic lock. We do not claim exactly-once; we claim effectively-once.';

export const FIVE_MIN =
  'The dangerous story is Event 101 failing while 102 and 103 settle. Kafka order is per partition, so the key is the contract, and sequence numbers plus an open-DLQ hold are the safety net. Blocking in-memory retry would preserve order but kill the consumer with max.poll.interval. Retry topics bounce the same key with backoff. Operators never call the domain service; they produce. Unique event_id closes the gap between DB commit and offset commit. That is the Hadron CashLine DLQ design.';

export const TWO_MINUTE_STORY =
  'In our Hadron CashLine platform, we consume financial events from Neptune through Kafka. Neptune is the source of truth for facilities; Hadron is the processing system. A poller — or CDC when we can operate it — publishes to cashline-events with the CashLine ID as the partition key so CREATED, UPDATED, SETTLED, and COMPLETED for the same facility stay in one partition. The consumer validates, transforms, and persists in one database transaction together with processed_events. That UNIQUE(event_id) is how we survive at-least-once delivery when the DB commits and the offset does not. If Hadron DB times out, we do not sleep on the listener thread for five minutes; we publish to retry-1, retry-2, retry-3 with 5s/30s/5m backoff. If the JSON is poison or the amount is invalid, we skip the loop, write dead_letter_messages in a new transaction, and emit cashline-events-dlq. We do not then happily process SETTLEMENT for that CashLine — the sequence gate parks later events until ops corrects and replays through Kafka. Replay is a producer with optimistic locking so two operators cannot double-fire. Logs never include the raw amount. That is not a textbook DLQ; that is how we keep a money pipeline available without corrupting state.';

export const DECISION_MATRIX: string[][] = [
  ['DB timeout', 'YES', 'Eventually', 'Transient'],
  ['DB permanently down', 'YES capped', 'YES', 'Avoid infinite retry'],
  ['Invalid payload / poison', 'NO', 'YES now', 'Will never succeed'],
  ['Invalid business data', 'NO', 'YES', 'Needs correction'],
  ['Kafka broker blip', 'YES (client)', 'NO', 'Not a poison message'],
  ['Serialization failure', 'NO', 'YES now', 'Bad message'],
  ['Duplicate message', 'NO', 'Usually no', 'Idempotent ignore'],
  ['Unknown participant', 'Retry/wait', 'YES if stuck', 'Reference data'],
  ['Deadlock', 'YES', 'Eventually', 'Transient 40P01'],
  ['Ordering violation', 'Special park', 'Usually no skip', 'Preserve sequence'],
];

export const FAILURE_CASES: string[][] = [
  ['Duplicate payment', 'UNIQUE event_id / duplicate scenario', 'Ignore second', 'No', 'No', 'Yes', 'None', 'Already processed'],
  ['Duplicate CashLine', 'PK cashline_id + state machine', 'Idempotent apply', 'No', 'No', 'Yes', 'None', 'Same row'],
  ['Replay after settlement', 'State machine', 'Reject UPDATE', 'No', 'DLQ/conflict', 'Yes', 'Must not reopen', 'Ops override only'],
  ['Partial processing', 'Single SQL TX', 'Rollback', 'Redeliver', 'No', 'Yes', 'None', 'Retry whole event'],
  ['DB commit, ack fail', 'Redelivery + UNIQUE', 'Duplicate ignore', 'No', 'No', 'Yes', 'None', 'Commit offset 2nd time'],
  ['Ack then DB fail', 'Throw before ack', 'Do not ack on failure', 'Yes', 'If exhausted', 'N/A', 'None', 'Fix listener ack mode'],
  ['Crash mid TX', 'SQL rollback', 'Redeliver', 'Yes', 'If still failing', 'Yes', 'None', 'Reprocess'],
  ['Rebalance', 'max.poll.interval + idempotency', 'New owner retries', 'Yes', 'No extra', 'Yes', 'Keep key order', 'No blocking sleep'],
  ['Offset reset', 'Replay history', 'Stale seq ignored', 'No', 'No', 'Yes', 'Stale skip', 'Monitor lag'],
  ['Stale event', 'seq <= last', 'Ignore', 'No', 'No', 'Yes', 'Skip', 'Metrics stale'],
  ['Schema mismatch', 'Serde / enum', 'Poison', 'No', 'Yes now', 'Replay after deploy', 'Block that msg', 'Upgrade + replay'],
  ['Missing ref data', 'Unknown participant', 'Retry then DLQ', 'Yes', 'Yes if stuck', 'Yes', 'Hold CashLine', 'Load master data'],
  ['Deadlock', 'SQLSTATE 40P01', 'Retry', 'Yes', 'Eventually', 'Yes', 'None', 'Backoff'],
  ['Constraint violation', '23505 vs business FK', 'Duplicate vs DLQ', 'Rarely', 'If not duplicate', 'Yes', 'Depends', 'Classify SQLSTATE'],
  ['Currency mismatch', 'CashLineService', 'Business DLQ', 'No', 'Yes', 'Yes', 'Do not apply', 'Correct payload'],
  ['Cancelled CashLine', 'State machine', 'Reject money events', 'No', 'Yes', 'Yes', 'Terminal', 'Ignore or DLQ'],
];

export const CHECKLIST = [
  'Partition key is cashLineId on source, retry, and DLQ topics',
  'Retry topics share partition count',
  'ExceptionClassifier maps timeout/deadlock vs poison/business',
  'No minute-long sleeps on the listener thread',
  'processed_events UNIQUE(event_id) in the same SQL TX as CashLine mutate',
  'DLQ persist REQUIRES_NEW + unique event_id',
  'Open DLQ blocks later sequences for that CashLine',
  'Replay publishes to cashline-events after optimistic claim',
  'Replay APIs audited and authorized',
  'Payloads masked in logs',
  'Metrics: processed, failed, retry, dlq, replay, duplicate, out.of.order',
  'Alerts on DLQ growth, lag, retry rate, replay failures, DB latency',
  'Neptune cursor is (updated_at, id)',
  'State machine rejects COMPLETED→NEW and SETTLED→PROCESSING',
  'Retention job for resolved DLQ rows',
  'Prod ddl-auto validate, acks=all, idempotent producer',
];

export const CHEAT: [string, string][] = [
  ['Key', 'cashLineId'],
  ['Retry', '5s / 30s / 5m then DLQ'],
  ['Poison', 'DLQ immediately'],
  ['Idempotency', 'UNIQUE(event_id)'],
  ['EOS claim', 'No — effectively-once'],
  ['Replay', 'Producer, not service call'],
  ['Event 101 fails', 'Park 102/103'],
  ['Cursor', '(updated_at, id)'],
  ['Ack', 'After SQL commit, uniqueness for the gap'],
  ['How many DLQs', 'Per topic, reason in DB'],
];

export const CLOSING =
  'A Hadron DLQ is not a trash topic. It is a bounded, ordered, idempotent recovery path for financial events.';

export const COST_MODEL = [
  ['Poison messages', '10,000', '10,000'],
  ['Retries each', '10 unbounded', '3 bounded'],
  ['Attempts', '100,000', '30,000'],
  ['Ops replays', '0 (still broken)', '1 per corrected event'],
];
