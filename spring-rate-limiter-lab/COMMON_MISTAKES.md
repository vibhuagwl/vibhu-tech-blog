# Common Rate Limiter Mistakes

## Implementation

1. **Non-atomic read-modify-write** — Two threads both see `count=9`, both increment to 10; limit was 10 but 11 requests pass. Fix: `ConcurrentHashMap.compute` or Redis Lua.

2. **Per-server counters** — Each JVM has its own map; 10 servers × 100 req/min = 1000 req/min actual. Fix: Redis or gateway-level limit.

3. **Fixed window without documenting boundary burst** — 5 req at 00:59 and 5 at 01:00 = 10 in one second. Fix: sliding window or educate stakeholders.

4. **Sliding window log without pruning** — Deque grows forever. Fix: remove timestamps older than window on each consume.

5. **Ignoring request cost** — Batch endpoint consumes 1 permit per 1000 records. Fix: `RequestContext.cost` or `WeightedRateLimiter`.

6. **Leaky bucket confused with token bucket** — Token bucket allows burst at arrival; leaky bucket smooths output. Pick intentionally.

## Redis

7. **Multi-key Lua on Cluster** — `CROSSSLOT` errors. Fix: single-key scripts; hash-tag related keys if needed later.

8. **No TTL on keys** — Redis memory grows with every client ever seen. Fix: `PEXPIRE` after update.

9. **Using Redis `INCR` alone for token bucket** — Loses refill semantics. Fix: full bucket math in Lua.

10. **Fail open on payments when Redis down** — Unlimited spend during outage. Fix: `FAIL_CLOSED` on financial routes.

11. **LOCAL_FALLBACK without understanding overshoot** — Each node enforces full quota locally. Fix: reduce local limit or accept temporary overshoot.

## API / Security

12. **Rate limit key from spoofable header** — Attacker rotates `X-Client-Id`. Fix: authenticated client ID from token.

13. **429 without `Retry-After`** — Clients retry immediately and amplify load. Fix: set header from `RateLimitResult.retryAfter()`.

14. **Rate limiting after expensive work** — DB query then check limit. Fix: filter early in request path.

## Testing

15. **Only sequential unit tests** — Race only appears under load. Fix: `CountDownLatch` + 100 threads tests (included in this lab).

16. **No test for policy config change** — Stale limiter cache after CRUD. Fix: `factory.evict(policyId)` on update.

## Operations

17. **One global limit for all tenants** — Noisy neighbor. Fix: tenant-scoped keys and policies.

18. **No metrics on degraded mode** — Silent fail-open during Redis incidents. Fix: `degraded` flag + Micrometer counters.

19. **Hot key on celebrity tenant** — Single Redis key maxes CPU. Fix: shard, local token bucket layer, or edge cache.

20. **Forgetting to compare algorithms in interview** — Saying "I'd use Redis" without naming token vs sliding window. Fix: use this lab's playground and comparison tests.
