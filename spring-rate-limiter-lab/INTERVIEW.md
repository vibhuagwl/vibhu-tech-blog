# Rate Limiter Interview Guide

## 30-second pitch

"I'd use a **token bucket** in Redis with a Lua script for shared quotas across app servers. Keys are scoped by tenant/client/API. The filter checks policies in order (global → tenant → client → user). On Redis failure, payments **fail closed**; public reads **fail open**. Burst is `capacity`; sustained rate is `refillRate` per `refillPeriod`."

## 1-minute version

Add: multi-level **CompositeRateLimiter** (AND — all matching policies must allow). Dynamic config via CRUD without restart. Headers: `X-RateLimit-Limit`, `Remaining`, `Reset`, `Retry-After`. For strict per-minute limits without boundary doubling, prefer **sliding window log** or **counter**; trade memory/accuracy. Cluster: single-key Lua scripts only.

## 5-minute deep dive

1. **Requirements** — RPS per client, burst tolerance, multi-tenant isolation, geographic distribution, config changes without deploy.
2. **Key design** — `rate_limit:{tenant}:CLIENT_API:client:path` with hash tag on tenant for future multi-key scripts.
3. **Algorithm** — Token bucket for burst + sustained; fixed window if simplicity wins (document boundary burst); sliding log for accuracy.
4. **Storage** — Redis primary; in-memory for single-node or LOCAL_FALLBACK.
5. **Atomicity** — Lua `EVAL` or `ConcurrentHashMap.compute`; never read-modify-write across round trips.
6. **Failure** — Explicit fail policy per route; metrics on `degraded` decisions.
7. **Testing** — Concurrent tests (100 threads, limit 10); boundary burst test for fixed window.
8. **Alternatives** — API gateway rate limit, service mesh, WAF — when to push to edge vs app.

---

## Questions (40+)

### Fundamentals

1. What is rate limiting vs throttling?
2. Why not `if (count > N)` in application code?
3. Difference between rate limiter and circuit breaker?
4. What is a permit/token?
5. What does `Retry-After` communicate?

### Algorithms

6. Token bucket vs leaky bucket?
7. Fixed window vs sliding window?
8. Sliding window log vs sliding window counter?
9. What is the fixed-window **boundary burst** problem?
10. Which algorithm allows burst? Which smooths output?
11. Memory complexity of sliding window log?
12. Accuracy of sliding window counter?
13. When is token bucket better than fixed window?
14. Can leaky bucket allow zero burst?
15. How does weighted cost work for batch APIs?

### Distributed systems

16. Why in-memory `HashMap` fails with multiple servers?
17. How does Redis Lua provide atomicity?
18. Why single-key scripts on Redis Cluster?
19. What is a hash tag `{tenant}`?
20. Race: two servers read same counter — what breaks?
21. Clock skew between app and Redis?
22. Sticky sessions as rate limit strategy — pitfalls?
23. How to rate limit without central Redis?
24. Gossip / approximate global limits?
25. Rate limiting at API gateway vs service?

### Redis

26. `HMGET`/`HSET` vs `INCR` for token bucket?
27. Why `PEXPIRE` on rate limit keys?
28. Hot key on single tenant — mitigations?
29. Redis down — fail open or closed for payments?
30. LOCAL_FALLBACK when Redis recovers — split brain?
31. How to test Lua without Redis?

### Spring / API

32. Filter vs interceptor vs `@RateLimit` annotation?
33. Where to extract tenant/client identity?
34. Why not trust `X-Client-Id` without auth?
35. HTTP 429 vs 503 for rate limit?
36. Headers clients expect?
37. Composite multi-level — order of evaluation?
38. Dynamic config — cache eviction on policy change?

### Operations

39. Metrics to emit?
40. Alerting on sustained 429 rate?
41. Load test methodology?
42. Config: 100 req/min with burst 20 — map to policy fields?

### Staff / trade-offs

43. Global rate limit 1M/hr + per-user 100/min — key explosion?
44. Fairness between tenants on shared Redis?
45. Rate limit + idempotency keys interaction?
46. GDPR / delete tenant — purge keys?
47. Replace Redis with DynamoDB / CRDB?
48. Admission control vs rate limit at overload?

---

## Design distributed rate limiter (whiteboard)

```text
[Client] → [LB] → [App] → RateLimitFilter
                              ↓
                    CompositeRateLimiter
                              ↓
              TokenBucketRateLimiter (per policy)
                              ↓
                    RedisRateLimitStore
                              ↓
                    Lua token_bucket.lua
```

**Say out loud:** atomic consume, key per scope, fail policy per route, playground to compare algorithms, tests under contention.
