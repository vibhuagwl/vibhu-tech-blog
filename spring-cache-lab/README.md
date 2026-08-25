# Spring Cache Master Lab

Interview-focused Spring Boot 3.4 / Java 21 lab for:

- Manual LRU / LFU / TTL caches
- `@Cacheable` / `@CachePut` / `@CacheEvict` / `@Caching`
- Caffeine (local) + optional Redis (distributed)
- Cache-aside, negative caching, TTL jitter
- HIT/MISS stats for Product API

## Quick start

```bash
./mvnw test
./mvnw spring-boot:run
curl -s localhost:8080/api/products/1
curl -s localhost:8080/api/products/1
curl -s localhost:8080/api/products/_stats
```

Second GET should show a cache HIT (dbLoads unchanged for that id path).

## Redis profile

```bash
docker compose up -d
./mvnw spring-boot:run -Dspring-boot.run.profiles=redis
redis-cli KEYS 'cache:v1:*'
```

## Docs

See `docs/` for the curriculum markdown (01–09).

## Companion

- Hub: `/spring-cache` on the blog
- Advanced distributed: `spring-distributed-cache-demo/` + `/distributed-caching`
