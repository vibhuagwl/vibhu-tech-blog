# 06 — Cache patterns

- **Cache-aside** — app loads on miss (`@Cacheable` / `CacheAsideProductService`)
- **Read-through** — cache loader fetches DB
- **Write-through** — sync cache+DB via cache API
- **Write-behind** — async DB flush (speed vs durability)

Spring annotations ≈ cache-aside with AOP.
