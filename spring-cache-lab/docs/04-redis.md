# 04 — Redis

Distributed cache via `RedisCacheManager` (profile `redis`).

- JSON serialization (`GenericJackson2JsonRedisSerializer`)
- Key prefix `cache:v1:` for versioning
- `disableCachingNullValues` by default in lab
- Fail-open `CacheErrorHandler` so Redis outages do not crash reads

```bash
docker compose up -d
./mvnw spring-boot:run -Dspring-boot.run.profiles=redis
redis-cli SCAN 0 MATCH 'cache:v1:*' COUNT 100
```

Prefer `SCAN` over `KEYS *` in production.
