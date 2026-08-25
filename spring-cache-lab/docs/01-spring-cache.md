# 01 — Spring Cache abstraction

Spring Cache is **not** a cache implementation. It is an abstraction:

```text
@EnableCaching → CacheInterceptor (AOP) → CacheManager → Cache provider
```

Providers: ConcurrentMap, Caffeine, Redis, Hazelcast, Ehcache, custom.

**Interview line:** Local vs distributed is decided by the backend, not by `@Cacheable`.
