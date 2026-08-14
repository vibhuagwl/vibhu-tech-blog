# Spring Distributed Rate Limiter Lab

Production-shaped **token-bucket** rate limiter for **Senior/Staff system-design interviews**.

- `RateLimiter.allow(RequestContext)` with remaining quota + `Retry-After`
- Multi-level policies: global → tenant → client → user → API → service
- Atomic consume via `ConcurrentHashMap.compute` (in-memory) or **Redis Lua**
- Fail-open / fail-closed / local-fallback
- Dynamic config CRUD (`/api/rate-limits`) without restart
- Filter emits `X-RateLimit-*` headers and **HTTP 429**

Default store is **in-memory** so `mvn test` does not need Redis. Set `rate-limit.store=redis` to use the Lua script against a Redis node.

## Run

```bash
cd spring-rate-limiter-lab
mvn test
mvn spring-boot:run   # http://127.0.0.1:8098
```

## Demo curl

```bash
# Allowed payment (seeded: 100/min + burst 20 on /api/payments per client)
curl -i -X POST http://127.0.0.1:8098/api/payments \
  -H 'X-Tenant-Id: acme' \
  -H 'X-Client-Id: client-123' \
  -H 'X-User-Id: user-1'

# Exhaust a tiny user quota (after shrinking it)
curl -sS -X PUT http://127.0.0.1:8098/api/rate-limits/user-minute \
  -H 'Content-Type: application/json' \
  -d '{"id":"user-minute","scope":"USER","capacity":2,"refillRate":2,"refillPeriod":"MINUTE"}'

for i in 1 2 3; do
  curl -i -X POST http://127.0.0.1:8098/api/payments \
    -H 'X-Tenant-Id: acme' -H 'X-Client-Id: client-123' -H 'X-User-Id: burst-user'
done

# Config CRUD
curl -sS http://127.0.0.1:8098/api/rate-limits | jq .
curl -sS -X POST http://127.0.0.1:8098/api/rate-limits \
  -H 'Content-Type: application/json' \
  -d '{"id":"abuse-block","scope":"CLIENT","clientId":"bad-bot","capacity":1,"refillRate":1,"refillPeriod":"DAY","blocked":true}'
```

Rejected responses are **429** with:

```text
X-RateLimit-Limit
X-RateLimit-Remaining
X-RateLimit-Reset
Retry-After
```

## Redis

```yaml
rate-limit:
  store: redis
  redis:
    host: localhost
    port: 6379
```

Lua lives at `src/main/resources/lua/token_bucket.lua`. The script is single-key so Redis Cluster hash-slot routing stays local.

## Interview spine

```text
Shared quota  → Redis (not a HashMap on each JVM)
Atomic update → Lua (refill + consume in one eval)
Burst         → token-bucket capacity
Sustained     → refillRate / refillPeriod
Multi-level   → fail-fast AND of matching policies
Redis down    → fail-closed on payments, fail-open on public reads
```

Hub: `/rate-limiter` on the interview site.
