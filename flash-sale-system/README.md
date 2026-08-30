# Flash Sale System — interview-grade LLD

Java 21 · Spring Boot 3.4 · Kafka · Redis · PostgreSQL.

**Redis sheds losers. PostgreSQL never oversells. Kafka + outbox + saga + unique constraints = business exactly-once.**

Start here:

1. [5-minute talk](docs/5-minute-interview-explanation.md)
2. [Architecture](docs/architecture.md)
3. [Concurrency](docs/concurrency.md)
4. [50 questions](docs/interview-guide.md)

## Problem

10,000 iPhones. Millions of buyers at 12:00:00. Never sell 10,001. Same user cannot win twice. Payment can fail after
reserve.

## Sync path (must stay fast)

```text
Gateway → JWT/rate-limit → sale state → idempotency → Redis Lua gate → outbox → 202 PENDING
```

## Async path (must stay correct)

```text
OrderRequested → atomic SQL reserve → Order + saga → Payment → confirm | compensate
```

## Services

| Module               | Port | Owns                                   |
|----------------------|------|----------------------------------------|
| api-gateway          | 8080 | Routing, correlation id                |
| flash-sale-service   | 8082 | Sale catalog, gate, intent idempotency |
| inventory-service    | 8083 | Stock, reservations                    |
| order-service        | 8084 | Orders, saga orchestrator              |
| payment-service      | 8085 | Charges (Strategy + Resilience4j)      |
| notification-service | 8086 | Side effects                           |

Database-per-service (four Postgres DBs). No shared tables.

## Redis + Resilience4j (open these)

| What                                                   | File                                                                   |
|--------------------------------------------------------|------------------------------------------------------------------------|
| Lua inventory gate                                     | `flash-sale-service/src/main/resources/redis/inventory-gate.lua`       |
| Lua rate limit                                         | `flash-sale-service/src/main/resources/redis/rate-limit.lua`           |
| Redis service                                          | `flash-sale-service/.../redis/InventoryRedisService.java`              |
| Redis circuit (fail closed)                            | `flash-sale-service/.../redis/RedisInventoryGate.java`                 |
| Redis distributed lock                                 | `flash-sale-service/.../redis/RedisLock.java`                          |
| Gateway Redis token bucket                             | `api-gateway/.../RedisRateLimitConfig.java`                            |
| Resilience4j CB+Retry+Bulkhead+RateLimiter+TimeLimiter | `payment-service/.../resilience/ResilientPaymentClient.java`           |
| Thresholds                                             | `payment-service/src/main/resources/application.yml` (`resilience4j:`) |

## Run locally

```bash
cd flash-sale-system
./mvnw test
docker compose up -d postgres redis kafka
redis-cli SET inv:gate:P1001 10000
# then run each service with SPRING_PROFILES_ACTIVE=local
```

Purchase:

```bash
curl -s -X POST http://localhost:8080/api/v1/flash-sales/SALE1001/orders \
  -H 'Content-Type: application/json' \
  -H 'X-User-Id: user-1' \
  -d '{"productId":"P1001","quantity":1,"idempotencyKey":"user-1-P1001-SALE1001"}'
```

Load: `k6 run load-test/purchase.js`

## Concurrency proof

```bash
./mvnw -pl inventory-service test -Dtest=AtomicInventoryReservationTest
```

`inventory=1`, `1000` threads, **exactly one** reservation, `available >= 0`.

## What is implemented (not TODOs)

- Atomic SQL decrement (`rows == 1`)
- Optimistic `@Version` and pessimistic `FOR UPDATE` repository methods
- Redis Lua inventory gate + rate limit + owner-token lock
- Flash-sale **State** pattern
- HTTP + Kafka **idempotency**
- `UNIQUE(user, sale, product)` on orders
- Transactional **outbox** + `SKIP LOCKED` batch poller
- **Saga** state machine + payment compensation
- Payment **Strategy** (mock + Stripe adapter) + Resilience4j
- Reservation TTL
- Micrometer/Prometheus hooks
- k6, OpenAPI, sample HPA/PDB
- Failure matrix and principal review

## Docs index

`architecture` · `lld` · `concurrency` · `kafka` · `caching` · `database` · `resilience` · `saga` · `outbox` ·
`failure-scenarios` · `scalability` · `capacity-planning` · `interview-guide` · `principal-review` · `5-minute` ·
`30-minute`

## Docker

```bash
docker compose up -d            # Postgres, Redis, Kafka, Kafka UI, Prometheus, Grafana
docker compose --profile full up --build   # also build and run all six Java services
```

Host processes use `localhost:9092` for Kafka. Containers use `kafka:29092`.

## Security note

`local` profile trusts `X-User-Id` for the lab. Production profile uses JWT (`ROLE_USER` / `ADMIN` / `OPERATIONS`). DLQ
replay is `/api/v1/admin/dlq/replay`.

