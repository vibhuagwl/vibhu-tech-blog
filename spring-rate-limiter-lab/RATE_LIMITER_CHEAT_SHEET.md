# Rate Limiter Cheat Sheet

## Policy fields (`RateLimitPolicy`)

| Field | Token bucket | Fixed / sliding window | Leaky bucket |
|-------|--------------|------------------------|--------------|
| `capacity` | Max burst tokens | Often unused | Bucket size (max queue water) |
| `refillRate` | Tokens per period | Max requests per window | Leak rate (units per period) |
| `refillPeriod` | Refill interval | Window size default | Leak interval |
| `timeWindow` | TTL hint | Window duration | Optional override |

## Algorithms at a glance

| Algorithm | Pros | Cons |
|-----------|------|------|
| Token bucket | Burst + sustained; lazy refill | Slightly more state |
| Leaky bucket | Smooth output rate | No large burst |
| Fixed window | Simple; fast | 2× traffic at window edge |
| Sliding log | Exact | Memory O(limit) per key |
| Sliding counter | Low memory; smooth | Approximate |

## Redis Lua return shape

`{allowed, remaining, retry_after_ms, limit}` — both scripts match this.

## Fail policies

- `FAIL_OPEN` — allow when store down (reads, health)
- `FAIL_CLOSED` — reject when store down (payments)
- `LOCAL_FALLBACK` — per-JVM bucket; may overshoot cluster quota

## Key formula

```text
rate_limit:{tenant}:SCOPE:identity...
```

## Curl quick reference

```bash
# Playground
curl -H 'X-Lab-Key: k' http://localhost:8098/api/lab/TOKEN_BUCKET?cost=1

# Algorithms list
curl http://localhost:8098/api/lab/algorithms

# Production path
curl -X POST http://localhost:8098/api/payments \
  -H 'X-Tenant-Id: acme' -H 'X-Client-Id: c' -H 'X-User-Id: u'
```

## Concurrency pattern (tests)

```java
ExecutorService pool = Executors.newFixedThreadPool(100);
CountDownLatch start = new CountDownLatch(1);
// all threads call allow() after start.countDown()
// assert allowed count ≈ limit
```

## Maven

```bash
mvn test
mvn spring-boot:run
mvn spring-boot:run -Dspring-boot.run.profiles=redis
```
