export const PRODUCTION_MISTAKES = [
  {
    bad: 'Thread.sleep(5 minutes) in the Kafka listener',
    good: 'Retry topics with the same key and backoff',
    why: 'Blocking blows max.poll.interval and rebalances the group',
  },
  {
    bad: 'DLQ Event 2 and keep applying Event 3/4',
    good: 'Hold the CashLine until 2 is replayed',
    why: 'Otherwise you settle the wrong version',
  },
  {
    bad: 'if (!seen.add(eventId)) return; with no unique index',
    good: 'processed_events PRIMARY KEY event_id',
    why: 'Two consumers will both pass the if',
  },
  {
    bad: 'Call CashLineService from the replay REST API',
    good: 'Publish to cashline-events after commit',
    why: 'Direct calls skip ordering, retries, and the real consumer',
  },
  {
    bad: 'WHERE updated_at > lastTs',
    good: '(updated_at, id) cursor',
    why: 'Equal timestamps drop rows',
  },
  {
    bad: 'Log the CashLine JSON',
    good: 'Mask amount/account; log ids only',
    why: 'DLQ and app logs become a PII store',
  },
  {
    bad: 'Claim exactly-once because enable.idempotence=true',
    good: 'Say effectively-once via DB uniqueness',
    why: 'Producer idempotence is not consumer EOS with Postgres',
  },
  {
    bad: 'One Kafka topic per exception class',
    good: 'One DLQ per source topic + failure_reason column',
    why: 'Ops cannot run four replay tools',
  },
  {
    bad: 'Ack before the DB transaction commits',
    good: 'Throw on failure; RECORD ack after return',
    why: 'Otherwise you skip a CashLine forever',
  },
  {
    bad: 'Infinite retry of invalid JSON',
    good: 'Poison → DLQ immediately',
    why: 'You DDoS yourself and stall the partition',
  },
];
