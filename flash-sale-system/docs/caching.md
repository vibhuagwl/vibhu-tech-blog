# Caching

Redis roles in this system (do not mix them in one key):

| Role                | Keys                                            | Truth?                    |
|---------------------|-------------------------------------------------|---------------------------|
| Inventory gate      | `inv:gate:{productId}`                          | No — counter for shedding |
| Rate limit          | `rl:user:{id}`, `rl:ip:{ip}`, `rl:api:purchase` | Policy                    |
| Distributed lock    | `lock:{name}`                                   | Coordination only         |
| Cache-aside catalog | `cache:sale:{saleId}`, `cache:product:{id}`     | No — DB is source         |

## Cache-aside (catalog / sale status)

Read: get → miss → DB → set TTL. Write (admin): update DB → evict.

Stampede (10k misses at TTL expiry on sale start):

- **TTL jitter** (`ttl + random(0, 30s)`) so keys do not expire together
- **Single-flight lock** only on the miss path (`lock:cache:sale:{id}`, 200ms)
- **Warm-up** job 60s before `saleStartsAt` writes sale + gate counter

Do not lock every cache GET.

## Failure vocabulary

| Term          | Meaning                                         | Mitigation                           |
|---------------|-------------------------------------------------|--------------------------------------|
| Penetration   | Miss on keys that never exist (`productId=foo`) | Bloom / negative cache short TTL     |
| Avalanche     | Many keys expire together                       | Jitter + warm-up                     |
| Inconsistency | Gate 0 but DB has stock (or reverse)            | Reconciliation job + DB is authority |

## Redis down

Gate and rate limiter fail **closed** (`503 SERVICE_UNAVAILABLE`) on the purchase path. Catalog reads fall through to DB
with a local bulkhead. We do not “just skip Redis” under 1M RPS — that is how you kill Postgres at 12:00:00.
