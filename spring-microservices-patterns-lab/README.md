# Spring Microservices Patterns Lab

Runnable Java 21 / Spring Boot 3.4 Maven lab demonstrating core microservices design patterns with **in-memory** implementations — no Docker, Kafka, Redis, or Postgres required for default unit tests.

## Quick start

```bash
cd spring-microservices-patterns-lab
mvn -q test          # 42 unit tests (H2 in-memory, no external infra)
mvn -q spring-boot:run   # starts on http://localhost:8095
curl http://localhost:8095/api/lab/health
```

### Integration tests (Docker required)

Gated integration tests live under `src/test/java/com/vibhu/msp/it/` and only run when `MSP_IT=true`:

```bash
# Requires Docker for Testcontainers (Postgres, Redis, Kafka)
MSP_IT=true mvn -q test
```

| IT class | Container | What it proves |
|----------|-----------|----------------|
| `PostgresOutboxIT` | PostgreSQL 16 | Transactional outbox persists and relays against real Postgres |
| `RedisLockIT` | Redis 7 | SET NX PX lock + fencing token validation |
| `KafkaConsumerIT` | Kafka 7.6 | Spring Kafka listener receives published events |

For a full multi-service stack (order, payment, inventory, gateway), see the sibling project [`../spring-msp-platform/`](../spring-msp-platform/) — start its services and infra there when running end-to-end demos across bounded contexts.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│              SPRING MICROSERVICES PATTERNS LAB — OVERVIEW                   │
├─────────────────────────────────────────────────────────────────────────────┤
│  Client ──► API Gateway (AggregationService) ──► downstream services        │
│              │                                                               │
│              ├── StranglerRouter (legacy vs new)                            │
│              ├── ACL (AntiCorruptionLayer)                                  │
│              ├── DemoJwtAuthFilter (demo bearer stub)                       │
│              ├── TraceContextFilter (W3C traceparent → MDC)                 │
│              └── LoadBalancer (RR / WRR / Hash / LC / Random)               │
│                                                                             │
│  Resilience: Retry · CB · Timeout · Bulkhead · LoadShed · Hedge · Fallback  │
│  Rate limit: TokenBucketRateLimiter · SlidingWindowRateLimiter              │
│                                                                             │
│  Data: CQRS (command + projection) · Event Sourcing · Outbox/Inbox        │
│  Saga: Orchestrator (compensation) · Choreography (event chain)             │
│                                                                             │
│  Primitives: Snowflake ID · Lamport/Vector clocks · Distributed lock      │
│  Cache: Cache-aside · Stampede guard · BloomFilterNegativeCache             │
│  EIP: Splitter · Aggregator · Resequencer · Claim Check                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Curriculum board mapping

| Lab package | Curriculum part | Pattern |
|-------------|-----------------|---------|
| `decompose/` | 01 Decomposition | Business capability boundaries |
| `acl/` | 01 Decomposition | Anti-Corruption Layer |
| `strangler/` | 01 Decomposition | Strangler Fig router |
| `gateway/` | 02 API Gateway | Parallel aggregation (CompletableFuture) |
| `security/` | 02 API Gateway | Demo JWT resource-server filter stub |
| `observability/` | 02 API Gateway | W3C traceparent → SLF4J MDC correlation |
| `lb/` | 04 Load balancing | RR, WRR, consistent hash, least-conn, random |
| `resilience/` | 05 Resilience | Retry, CB, timeout, bulkhead, shed, hedge, fallback |
| `ratelimit/` | 09 Rate limiting | Token bucket, sliding window |
| `saga/` | 06 Distributed transactions | Orchestration + choreography + compensation |
| `outbox/` `inbox/` | 08 Messaging | Transactional outbox, idempotent inbox |
| `cqrs/` `eventsourcing/` | 07 Data management | CQRS write/read split, event store + snapshots |
| `cache/` | 10 Caching | Cache-aside, stampede guard, bloom negative cache |
| `lock/` | 11 Distributed locking | Redis-style lock + fencing tokens |
| `id/` `clock/` | 20 Distributed primitives | Snowflake, Lamport, vector clocks |
| `eip/` | 19 Enterprise integration | Splitter, aggregator, resequencer, claim check |

Memory sentence from the curriculum:

> Decompose by capability → own your data → communicate async with outbox/inbox → isolate failures with timeout/retry/CB/bulkhead → prove correctness with idempotency + tests.

## Test coverage

### Default unit tests (`mvn test` — 42 tests)

| Test class | What it proves |
|------------|----------------|
| `LoadBalancerTest` | RR, WRR, consistent hash, least-connection, random |
| `ManualCircuitBreakerTest` | CB state machine, fallback, bulkhead |
| `AggregationResilienceWireMockTest` | Gateway aggregation, CB, hedged requests vs WireMock downstream |
| `SagaCompensationTest` | Orchestrator compensation + choreography events |
| `OutboxInboxIdempotencyTest` | Outbox relay + inbox deduplication |
| `InboxIdempotencyConcurrencyTest` | Inbox idempotency under parallel threads |
| `SnowflakeIdGeneratorTest` | 10k unique monotonic IDs |
| `SnowflakeIdGeneratorConcurrencyTest` | Snowflake uniqueness under concurrent threads |
| `FencingTokenTest` | Monotonic tokens, stale lock rejection |
| `FencingTokenConcurrencyTest` | Lock exclusivity + fencing under contention |
| `ResequencerTest` | Out-of-order message reordering |
| `TokenBucketRateLimiterTest` | Token bucket burst + refill |
| `SlidingWindowRateLimiterTest` | Sliding window enforcement |
| `BloomFilterNegativeCacheTest` | Bloom guard against cache penetration |
| `TraceContextFilterTest` | W3C traceparent parse + generate |

### Integration tests (`MSP_IT=true` — +3 tests, Docker required)

| Test class | What it proves |
|------------|----------------|
| `PostgresOutboxIT` | Outbox against real PostgreSQL |
| `RedisLockIT` | Distributed lock against real Redis |
| `KafkaConsumerIT` | Kafka producer → consumer round-trip |

## Stack

- Java 21 (records, sealed types, virtual threads in gateway)
- Spring Boot 3.4.5, Spring Data JPA, H2
- Resilience4j + Micrometer (Prometheus actuator)
- Testcontainers + WireMock (test scope)
- Redis/Kafka on classpath but **auto-config excluded in default tests**

## Related site modules

- [Resilience4j lab](../spring-resilience4j-lab/) — production Resilience4j annotations
- [Rate limiter lab](../spring-rate-limiter-lab/) — distributed token bucket
- [MSP platform](../spring-msp-platform/) — multi-service docker-compose stack
- Microservices Patterns hub — `lib/microservices-patterns/toc.ts`
