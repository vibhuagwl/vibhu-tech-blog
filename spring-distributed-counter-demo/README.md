# Spring Distributed Counter Demo

Runnable Spring Boot 3.4 / Java 21 multi-module Maven demo for a likes/views style distributed counter.

This is an interview demo, not a production Redis/DB implementation. All storage is `ConcurrentHashMap` based:

- Hot path sharded increments simulate Redis `INCR` keys: `counter:{resourceId}:shard:{i}`
- LIKE idempotency uses `Idempotency-Key`, `clientRequestId`, and `(userId, resourceId)` semantics
- VIEW increments are intentionally allowed many times
- The API writes the shard first, then publishes a `CounterDeltaEvent` through an outbox-style publisher
- The aggregator idempotently merges delta events into a durable snapshot map keyed as `counter:{resourceId}`
- Reads in the API implement exact shard-sum reads: `consistency = SHARD_SUM`

## Modules

| Module | Port | Purpose |
| --- | --- | --- |
| `counter-common` | n/a | DTOs, events, topic names |
| `counter-api` | `8091` | REST increment/get/batch/shards/flush API and sharded counter store |
| `counter-aggregator` | `8092` | Consumes `CounterDeltaEvent` and exposes internal snapshots |

## Build and test

```bash
cd /workspace/spring-distributed-counter-demo
mvn test

# Required focused test command
mvn -pl counter-api test
```

## Run local profile, no Docker

The default profile is `local`. It uses Spring `ApplicationEventPublisher` instead of Kafka. This is useful for running the API hot path and tests without infrastructure:

```bash
cd /workspace/spring-distributed-counter-demo
mvn -pl counter-api spring-boot:run
```

In another terminal:

```bash
./scripts/demo.sh
```

## Curl demo

```bash
BASE_URL=http://localhost:8091

curl -fsS "$BASE_URL/actuator/health"

curl -fsS -X POST "$BASE_URL/api/v1/counters/post-1/increment" \
  -H 'Content-Type: application/json' \
  -H 'X-User-Id: alice' \
  -H 'Idempotency-Key: alice-like-post-1' \
  -d '{"delta":1,"clientRequestId":"alice-like-post-1","action":"LIKE"}'

# Same LIKE is ignored, value remains 1
curl -fsS -X POST "$BASE_URL/api/v1/counters/post-1/increment" \
  -H 'Content-Type: application/json' \
  -H 'X-User-Id: alice' \
  -H 'Idempotency-Key: alice-like-post-1' \
  -d '{"delta":1,"clientRequestId":"alice-like-post-1","action":"LIKE"}'

curl -fsS -X POST "$BASE_URL/api/v1/counters/post-1/increment" \
  -H 'Content-Type: application/json' \
  -H 'X-User-Id: bob' \
  -H 'Idempotency-Key: bob-like-post-1' \
  -d '{"delta":1,"clientRequestId":"bob-like-post-1","action":"LIKE"}'

curl -fsS "$BASE_URL/api/v1/counters/post-1"
curl -fsS "$BASE_URL/api/v1/counters/post-1/shards"
curl -fsS -X POST "$BASE_URL/api/v1/counters/batch" \
  -H 'Content-Type: application/json' \
  -d '{"resourceIds":["post-1","post-2"]}'
curl -fsS -X POST "$BASE_URL/api/v1/counters/post-1/flush"
```

## Run Kafka profile with aggregator snapshots

Kafka is only needed to show cross-process API-to-aggregator durability:

```bash
cd /workspace/spring-distributed-counter-demo
docker compose up -d kafka

SPRING_PROFILES_ACTIVE=kafka mvn -pl counter-aggregator spring-boot:run
SPRING_PROFILES_ACTIVE=kafka mvn -pl counter-api spring-boot:run
```

After increments through the API:

```bash
curl -fsS http://localhost:8092/actuator/health
curl -fsS http://localhost:8092/api/v1/snapshots/post-1
```

## Consistency notes

- Implemented API reads use shard-sum reads for exact LIKE counts and up-to-date VIEW counts inside the API process.
- A production system may serve `snapshot + pending deltas` for lower read latency, where the aggregator snapshot is durable and the API tracks not-yet-merged local shard deltas.
- Production would replace `ConcurrentHashMap` with Redis Cluster for shards, a database/object store for snapshots, durable outbox storage, retries, monitoring, and compaction.
