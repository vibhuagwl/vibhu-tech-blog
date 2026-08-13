# Distributed Caching Interview Lab (Spring Boot)

Production-shaped lab for Staff/Principal interviews:

- Spring Cache (`@Cacheable` / `@CacheEvict`) with Caffeine
- L1 Caffeine + stampede guard (`DistributedLock`)
- Fail-open `CacheErrorHandler`
- Tenant `KeyGenerator`
- Optional Redis profile + Kafka invalidation (compose profile `full`)

## Quick start

```bash
./mvnw test
./mvnw spring-boot:run
curl localhost:8080/api/payments/P100
curl localhost:8080/api/payments/_stats
```

## Redis mode

```bash
docker compose up -d redis
./mvnw spring-boot:run -Dspring-boot.run.profiles=redis
```

## Full stack (Redis + Kafka)

```bash
docker compose --profile full up -d
# enable app.cache.kafka-enabled=true in a local override
```

## Interview drills

1. Hit ratio: call `/api/payments/P100` twice — `_stats` DB queries should not grow on second Spring-cache path.
2. Stampede: unit test `stampedeGuardLimitsDbLoadUnderConcurrency`.
3. Failure: Redis down should not crash API when fail-open handler is wired (redis profile + stop container).
