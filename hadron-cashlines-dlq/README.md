# Hadron CashLines DLQ Lab

Production-style Spring Boot 3 / Kafka Dead Letter Queue for **Neptune → Kafka `cashline-events` → Hadron**.

Default profile runs **without Docker Kafka**: an in-memory broker preserves the same topics, retry delays, DLQ persistence, idempotency, ordering, and replay APIs. Profile `kafka` switches the publisher/listeners to Spring Kafka + PostgreSQL.

## Quick start (no Kafka)

```bash
cd hadron-cashlines-dlq
mvn test
mvn spring-boot:run   # http://127.0.0.1:8095
```

## Happy path → failure → retry → DLQ → replay

```bash
# 1. Success
curl -sS -X POST http://127.0.0.1:8095/api/lab/scenario/success

# 2. Poison JSON (no infinite retry)
curl -sS -X POST http://127.0.0.1:8095/api/lab/scenario/poison
curl -sS http://127.0.0.1:8095/api/dlq

# 3. Invalid amount → correct payload → replay through Kafka (not a direct service call)
curl -sS -X POST http://127.0.0.1:8095/api/lab/scenario/invalid-amount
# take id from GET /api/dlq, then:
curl -sS -X POST http://127.0.0.1:8095/api/dlq/1/correct \
  -H 'Content-Type: application/json' -H 'X-Replay-Actor: ops' \
  -d '{"eventId":"e-amt-1","cashLineId":"CL-AMT","eventType":"CASHLINE_CREATED","sequenceNumber":1,"version":1,"participantId":"P-NEPTUNE","accountId":"ACC-1001","currency":"USD","amount":25.00,"transactionType":"DRAWDOWN"}'
curl -sS -X POST http://127.0.0.1:8095/api/dlq/1/replay -H 'X-Replay-Actor: ops'
curl -sS http://127.0.0.1:8095/api/cashlines/CL-AMT

# 4. Transient DB timeout that succeeds on retry-2
curl -sS -X POST http://127.0.0.1:8095/api/lab/scenario/transient-then-ok

# 5. Permanent timeout → retry-1/2/3 → DLQ
curl -sS -X POST http://127.0.0.1:8095/api/lab/scenario/timeout

# 6. Neptune poller with (updated_at, id) cursor
curl -sS -X POST http://127.0.0.1:8095/api/neptune/seed \
  -H 'Content-Type: application/json' \
  -d '{"cashLineId":"CL-N1","participantId":"P-NEPTUNE","accountId":"ACC-1001","currency":"USD","amount":10,"eventType":"CASHLINE_CREATED","sequenceNumber":1}'
curl -sS -X POST http://127.0.0.1:8095/api/neptune/poll

# 7. Corner-case catalog (poison, NPE, enum, cancel, settle, stale, mismatch, ...)
curl -sS http://127.0.0.1:8095/api/lab/scenarios | jq .
curl -sS -X POST http://127.0.0.1:8095/api/lab/scenario/npe
curl -sS -X POST http://127.0.0.1:8095/api/lab/scenario/cancelled-then-settle
curl -sS -X POST http://127.0.0.1:8095/api/lab/scenario/replay-after-settle
curl -sS -X POST http://127.0.0.1:8095/api/lab/scenario/stale-event
curl -sS http://127.0.0.1:8095/api/dlq | jq .
```

Lab retry delays are **200ms / 400ms / 800ms** so you can watch the pipeline. Production (`application-prod.yml`) uses **5s / 30s / 5m**.

## Kafka + Postgres

```bash
docker compose up -d postgres kafka kafka-ui prometheus grafana
mvn spring-boot:run -Dspring-boot.run.profiles=kafka
```

- App: http://127.0.0.1:8095
- Kafka UI: http://127.0.0.1:8088
- Prometheus: http://127.0.0.1:9090
- Grafana: http://127.0.0.1:3001

Partition key is **CashLine ID**. Retry topics use the same partition count so ordering per CashLine is preserved.

## Design rules this lab encodes

1. Kafka is **at-least-once**. Exactly-once *business* processing comes from `processed_events(event_id)` UNIQUE + CashLine state machine, not from claiming Kafka EOS alone.
2. Replay **always republishes to `cashline-events`**. Never call the consumer service from the replay API.
3. Permanent business / poison errors skip retry and go to DLQ. Transient SQL timeouts / deadlocks retry with backoff.
4. If event 101 fails, event 102/103 must not silently settle the CashLine. Sequence check + open-DLQ hold parks later events.
5. Concurrent replay uses `@Version` optimistic locking (`REPLAYING`).
6. Logs never print raw amounts/account numbers (`PayloadMasker`).
7. DLQ insert uses `REQUIRES_NEW` + unique(event_id) so a later Kafka redelivery does not create a second DLQ row.

Interview hub: `/hadron-dlq` on the site.
