# 30-minute deep dive

## Concurrency (8 min)

Show the lost-update. Show why `@Version` retry-storms a hot SKU. Show `FOR UPDATE` hold time. Land on atomic SQL. Show
the 1-vs-1000 test.

## Inventory correctness (5 min)

Three layers: Redis filter, SQL authority, unique order. Compensation on reject/expiry. Reconciliation job compares
`available + reserved + sold` to `initial`.

## Kafka (4 min)

Keys: productId vs orderId. Hot partition. `acks=all` + idempotent producer. Manual ack after TX. DLQ vs retry
classification.

## Outbox (3 min)

Dual-write. SKIP LOCKED batch. Crash of poller. Duplicate `eventId` on the consumer.

## Saga (3 min)

Orchestration in order-service. State machine. Payment fail → release. Why not 2PC.

## Cache / Redis (2 min)

Gate ≠ cache ≠ lock. Stampede jitter. Fail closed.

## Failures (3 min)

Walk the matrix: Redis down, consumer kill -9, poison JSON, provider timeout.

## Scale / DB / observability (2 min)

You cannot scale a single row. Metrics: gate rejects, reserve success/fail, outbox age, consumer lag, CB state.
