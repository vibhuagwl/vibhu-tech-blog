/** Failures, advanced Spring, ecommerce/fintech, lab pointer. */

export const FAILURES = `Stampede: popular key expires → N requests miss → N DB loads.
  Mitigate: sync=true (per JVM), single-flight, Redis lock, soft TTL + refresh, L1.

Penetration: nonexistent id → forever MISS → DB every time.
  Mitigate: negative caching (short TTL null/sentinel), Bloom filter, input validation.

Avalanche: many keys same TTL → simultaneous expiry → DB spike.
  Mitigate: TTL jitter (base + random), staggered warmup, multi-level cache.

Hot key: one id gets millions of hits.
  Mitigate: L1 local, replicate, key sharding, coalescing, CDN for public reads.

Redis DOWN: fail-open to DB (availability) vs fail-closed (strict freshness).
  Demo: CacheErrorHandler fail-open + keep serving from DB/L1.

MEMORY: Stampede=thundering herd · Penetration=ghost keys · Avalanche=mass expiry`;

export const ADVANCED = `Self-invocation:
  methodA() { this.methodB(); }  // @Cacheable on B skipped — no proxy
  Fix: move B to another bean · inject self proxy · AspectJ weaving

Transaction + cache:
  DB commit then cache put fails → stale miss OK (refill)
  Cache put then DB rollback → cache lies — prefer evict after commit / TransactionSynchronization

Multiple CacheManagers:
  @Cacheable(cacheNames="users", cacheManager="redisCacheManager")
  vs caffeine for local reference data

CacheResolver: choose Cache(s) dynamically (tenant, region) beyond fixed cacheManager name.

Null values: caching null stops penetration but can hide newly created rows —
  short TTL + disableCachingNullValues trade-off.

Warmup: ApplicationReadyEvent / scheduler preferred over heavy @PostConstruct
  (context may not be fully ready; blocks startup).

Security: do not cache passwords/tokens/raw PII; Redis AUTH + TLS + network isolation.
Version keys: user:v2:123 on breaking serialization changes; flush or dual-read on deploy.

JVM synchronized ≠ distributed lock across pods.`;

export const ECOMMERCE = `Product Service
  GET    /products/{id}  → @Cacheable
  POST   /products       → @CachePut / no cache
  PUT    /products/{id}  → @CachePut or @CacheEvict
  DELETE /products/{id}  → @CacheEvict

Stack in lab: Caffeine L1 (+ optional Redis L2) + in-memory/Postgres repo
Show HIT/MISS counters on /api/products/{id}/_stats`;

export const FINTECH = `Good cache candidates:
  Instrument metadata · currency · holiday calendar · config · static lookups

Careful / usually avoid as sole cache:
  Balances · open orders · authorization decisions · anything requiring strong consistency
  for money movement without invalidation guarantees

Statement for interviews:
  Never add cache only because "it's slow" — prove read-heavy workload,
  acceptable staleness, and that query/index layer is already sane.
  DB = source of truth · Cache = optimization.`;

export const LAB = `Runnable project: spring-cache-lab/
Browse in browser: /spring-cache-demo

  algorithms/   SimpleCache, LruCache, LfuCache, TtlCache + tests
  product/      @Cacheable/@CachePut/@CacheEvict ProductService
  config/       Caffeine + optional Redis CacheManagers, KeyGenerator, metrics
  aside/        manual cache-aside service
  protection/   negative caching, TTL jitter helper, sync stampede demo
  docs/         01–09 markdown curriculum

Quick start:
  cd spring-cache-lab && mvn test
  mvn spring-boot:run
  curl localhost:8080/api/products/1
  curl localhost:8080/api/products/1   # expect HIT
  docker compose up -d redis
  mvn spring-boot:run -Dspring-boot.run.profiles=redis

Also see: spring-distributed-cache-demo/ (stampede locks, Kafka invalidate)
  and hub /distributed-caching`;

export const NEGATIVE_CODE = `// Negative caching sketch
@Cacheable(cacheNames = "products", key = "#id", unless = "#result == null")
// OR allow null with short Redis TTL for missing ids to block penetration

public Product getOrNegative(Long id) {
  return repo.findById(id).orElse(Product.ABSENT); // sentinel with short TTL cache
}`;

export const JITTER_CODE = `Duration ttlWithJitter(Duration base, Duration jitter) {
  long j = ThreadLocalRandom.current().nextLong(jitter.toMillis() + 1);
  return base.plusMillis(j);
}`;
