# Transactional Outbox

## The dual-write bug

```text
BEGIN; UPDATE inventory; COMMIT;
kafka.send(...);   // process dies here
```

DB says reserved. Kafka never got `InventoryReserved`. Order never created. User is charged later against nothing — or
worse, you retry the HTTP path and double-reserve.

Reverse order (Kafka then DB) publishes ghosts.

## The rule

**Business row + `outbox_events` row in ONE PostgreSQL transaction.** After commit, a poller publishes.

If the poller dies, rows stay `NEW`. Another pod’s poller picks them up. Kafka may see a duplicate produce after a crash
mid-send — consumers key on `eventId`.

## Poller

```sql
SELECT * FROM outbox_events
WHERE status = 'NEW'
ORDER BY created_at
LIMIT 500
FOR UPDATE SKIP LOCKED;
```

`SKIP LOCKED` = multiple publisher replicas without a leader election. Batch of 500 amortizes broker round-trips (
`linger.ms` on top).

States: `NEW → PUBLISHING → PUBLISHED` (or `FAILED` after max retries → ops alert, not silent drop).

## Outbox vs CDC (Debezium)

CDC avoids the poller but adds a connector, schema coupling, and “we published a raw row change.” We use explicit outbox
events (`eventType`, `eventVersion`, payload). CDC is the right evolution when poller lag is the bottleneck.

## What if you skip outbox

You will demo a sale that works on the happy path and fails the first kill -9 in an interview.
