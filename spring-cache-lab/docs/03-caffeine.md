# 03 — Caffeine

Local in-process cache via `CaffeineCacheManager`.

- `maximumSize` — bound entries
- `expireAfterWrite` — TTL
- `expireAfterAccess` — TTI (idle timer resets on get)
- Eviction ≈ Window TinyLFU (admission), not pure LRU

See `CacheConfig.caffeineCacheManager`.
