# Spring Microservices Patterns Lab

Runnable Java 21 / Spring Boot 3.4 Maven lab demonstrating core microservices design patterns with **in-memory** implementations — no Docker, Kafka, Redis, or Postgres required for unit tests.

## Quick start

```bash
cd spring-microservices-patterns-lab
mvn -q test          # all tests (H2 in-memory, no external infra)
mvn -q spring-boot:run   # starts on http://localhost:8095
curl http://localhost:8095/api/lab/health
```

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│              SPRING MICROSERVICES PATTERNS LAB — OVERVIEW                   │
├─────────────────────────────────────────────────────────────────────────────┤
│  Client ──► API Gateway (AggregationService) ──► downstream services        │
│              │                                                               │
│              ├── StranglerRouter (legacy vs new)                            │
│              ├── ACL (AntiCorruptionLayer)                                  │
│              └── LoadBalancer (RR / WRR / Hash / LC / Random)               │
│                                                                             │
│  Resilience: Retry · CB · Timeout · Bulkhead · LoadShed · Hedge · Fallback  │
│                                                                             │
│  Data: CQRS (command + projection) · Event Sourcing · Outbox/Inbox        │
│  Saga: Orchestrator (compensation) · Choreography (event chain)             │
│                                                                             │
│  Primitives: Snowflake ID · Lamport/Vector clocks · Distributed lock      │
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
| `lb/` | 04 Load balancing | RR, WRR, consistent hash, least-conn, random |
| `resilience/` | 05 Resilience | Retry, CB, timeout, bulkhead, shed, hedge, fallback |
| `saga/` | 06 Distributed transactions | Orchestration + choreography + compensation |
| `outbox/` `inbox/` | 08 Messaging | Transactional outbox, idempotent inbox |
| `cqrs/` `eventsourcing/` | 07 Data management | CQRS write/read split, event store + snapshots |
| `cache/` | 10 Caching | Cache-aside, stampede guard |
| `lock/` | 11 Distributed locking | Redis-style lock + fencing tokens |
| `id/` `clock/` | 20 Distributed primitives | Snowflake, Lamport, vector clocks |
| `eip/` | 19 Enterprise integration | Splitter, aggregator, resequencer, claim check |

Memory sentence from the curriculum:

> Decompose by capability → own your data → communicate async with outbox/inbox → isolate failures with timeout/retry/CB/bulkhead → prove correctness with idempotency + tests.

## Test coverage

| Test class | What it proves |
|------------|----------------|
| `LoadBalancerTest` | RR, WRR, consistent hash, least-connection, random |
| `ManualCircuitBreakerTest` | CB state machine, fallback, bulkhead |
| `SagaCompensationTest` | Orchestrator compensation + choreography events |
| `OutboxInboxIdempotencyTest` | Outbox relay + inbox deduplication |
| `SnowflakeIdGeneratorTest` | 10k unique monotonic IDs |
| `FencingTokenTest` | Monotonic tokens, stale lock rejection |
| `ResequencerTest` | Out-of-order message reordering |

## Stack

- Java 21 (records, sealed types, virtual threads in gateway)
- Spring Boot 3.4.5, Spring Data JPA, H2
- Resilience4j + Micrometer (Prometheus actuator)
- Redis/Kafka on classpath but **auto-config excluded in tests**

## Related site modules

- [Resilience4j lab](../spring-resilience4j-lab/) — production Resilience4j annotations
- [Rate limiter lab](../spring-rate-limiter-lab/) — distributed token bucket
- Microservices Patterns hub — `lib/microservices-patterns/toc.ts`
