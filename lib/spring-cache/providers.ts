/** Caffeine, Redis, L1/L2, patterns. */

export const CAFFEINE = `Spring Cache → CaffeineCacheManager → Caffeine (local, in-process)

Caffeine.newBuilder()
  .maximumSize(10_000)           // entry count bound (also maximumWeight)
  .expireAfterWrite(Duration.ofMinutes(10))   // TTL from write
  .expireAfterAccess(Duration.ofMinutes(5))   // TTI — timer resets on get
  .refreshAfterWrite(...)        // async reload (Caffeine-specific LoadingCache)
  .recordStats()
  .build();

TTL (expireAfterWrite): expires based on write time even if hot.
TTI (expireAfterAccess): each GET resets the idle timer.

GET 10:00, 10:05, 10:09 with TTI=5m → still alive; TTL=5m from 10:00 write → dead at 10:05.

Caffeine eviction ≈ Window TinyLFU (admission) — NOT "Spring Cache uses LRU".
MEMORY: Provider owns algorithm; Spring only delegates.`;

export const REDIS = `Spring Cache → RedisCacheManager → Redis (distributed)

RedisCacheConfiguration:
  entryTtl(Duration)                 // TTL
  serializeKeysWith(StringRedisSerializer)
  serializeValuesWith(GenericJackson2JsonRedisSerializer) // JSON preferred over JDK
  disableCachingNullValues() / allow nulls carefully
  prefixCacheNameWith("app:v1:")     // key namespace / versioning

Why serialize: Redis stores bytes — Java objects must become bytes (JSON/JDK/…).
JSON: readable, evolving schemas easier · JDK: brittle across app versions.

redis-cli:
  KEYS *     — avoid in prod on large datasets → use SCAN
  GET key · TTL key · DEL key · FLUSHDB (dev only)

MEMORY: Redis makes Spring Cache distributed; you now own network + serialization + failure.`;

export const LOCAL_VS_DIST: string[][] = [
  ['Aspect', 'Local (Caffeine)', 'Distributed (Redis)'],
  ['Consistency', 'Per pod; can diverge', 'Shared view'],
  ['Latency', 'Microseconds', 'Network ms'],
  ['Scale memory', 'Per JVM heap', 'Centralized'],
  ['Invalidation', 'Hard across pods', 'DEL / pub-sub / Kafka'],
  ['Failure', 'JVM death loses L1', 'Redis down → policy needed'],
  ['Best for', 'Ultra-hot / reference', 'Shared read models'],
];

export const L1L2 = `Request → L1 Caffeine → miss → L2 Redis → miss → DB → fill L2 → fill L1 → response

WHY: absorb hot keys locally; share colder/shared state via Redis; DB remains SoT.
Invalidate: on write, evict L1 locally + Redis key + publish so other pods drop L1.

MEMORY: L1 speed · L2 share · DB truth`;

export const PATTERNS = `Cache-aside (most common with Spring @Cacheable):
  Read: cache miss → DB → put
  Write: DB update → invalidate/update cache
  App owns load logic.

Read-through: cache loader fetches DB on miss (LoadingCache / custom Cache).
Write-through: write goes cache+DB synchronously via cache API.
Write-behind: write to cache, async flush to DB — fast writes, loss/consistency risk.

Spring @Cacheable ≈ cache-aside with AOP, not a true read-through Cache store.

MEMORY: Aside = app loads · Through = cache loads · Behind = async write.`;

export const CAFFEINE_CODE = `@Bean
CacheManager caffeineCacheManager() {
  CaffeineCacheManager cm = new CaffeineCacheManager("products", "users");
  cm.setCaffeine(Caffeine.newBuilder()
      .maximumSize(10_000)
      .expireAfterWrite(Duration.ofMinutes(10))
      .recordStats());
  return cm;
}`;

export const REDIS_CODE = `@Bean
RedisCacheManager redisCacheManager(RedisConnectionFactory factory) {
  RedisCacheConfiguration cfg = RedisCacheConfiguration.defaultCacheConfig()
      .entryTtl(Duration.ofMinutes(5))
      .prefixCacheNameWith("cache:v1:")
      .serializeKeysWith(RedisSerializationContext.SerializationPair
          .fromSerializer(new StringRedisSerializer()))
      .serializeValuesWith(RedisSerializationContext.SerializationPair
          .fromSerializer(new GenericJackson2JsonRedisSerializer()))
      .disableCachingNullValues();
  return RedisCacheManager.builder(factory).cacheDefaults(cfg).build();
}`;
