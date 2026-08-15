import type {PatternCard} from './types';

// ---------------------------------------------------------------------------
// Part 10 — Caching patterns
// ---------------------------------------------------------------------------

export const CACHING_PATTERNS: PatternCard[] = [
  {
    id: 'cache-aside',
    part: 10,
    name: 'Cache-Aside (Lazy Loading)',
    frequency: 'Frequently used',
    definition:
      'Application reads cache first; on miss it loads from DB, populates cache, and returns. Writes update DB then delete or invalidate cache — cache is not the source of truth.',
    problem:
      'Repeated identical DB reads (product catalog, user profile) saturate connection pools and add latency under read-heavy traffic.',
    realWorld:
      'Redis + Spring @Cacheable, Netflix EVCache, session stores, CDN edge caches with origin pull.',
    whyExists:
      'Simplest cache pattern — app controls consistency and eviction. Works with any datastore and avoids cache-only write paths.',
    ascii: `Client → App: get(key)
App → Redis: GET key
  miss → App → DB: SELECT
         App → Redis: SET key TTL
App → Client: value`,
    flow: `sequenceDiagram
  participant C as Client
  participant A as App
  participant R as Redis
  participant D as DB
  C->>A: getProduct(id)
  A->>R: GET product:{id}
  alt hit
    R-->>A: JSON
    A-->>C: product
  else miss
    A->>D: SELECT * FROM products WHERE id=?
    D-->>A: row
    A->>R: SET product:{id} EX 300
    A-->>C: product
  end`,
    components: [
      {name: 'Cache client', responsibility: 'GET/SET/DEL with TTL and serialization (JSON or hash).'},
      {name: 'Repository', responsibility: 'DB access on miss; transactional writes.'},
      {name: 'Invalidation hook', responsibility: 'On write: DEL cache key or publish invalidation event.'},
      {name: 'Serializer', responsibility: 'Stable encoding; version field for schema migration.'},
      {name: 'Metrics', responsibility: 'Hit ratio, miss latency, eviction count.'},
    ],
    javaCode: `package com.vibhu.cache.aside;

import io.lettuce.core.RedisClient;
import io.lettuce.core.api.StatefulRedisConnection;
import io.lettuce.core.api.sync.RedisCommands;

import java.time.Duration;
import java.util.Optional;
import java.util.function.Supplier;

/** Cache-aside with Lettuce (Java 21). */
public final class CacheAsideProductService {

  public record Product(String id, String name, long priceCents, int version) {}

  private final RedisCommands<String, String> redis;
  private final ProductRepository db;
  private final Duration ttl;

  public CacheAsideProductService(StatefulRedisConnection<String, String> conn,
      ProductRepository db, Duration ttl) {
    this.redis = conn.sync();
    this.db = db;
    this.ttl = ttl;
  }

  public Product getById(String id) {
    String key = "product:" + id;
    String cached = redis.get(key);
    if (cached != null) {
      return Json.read(cached, Product.class);
    }
    Product product = db.findById(id)
        .orElseThrow(() -> new ProductNotFoundException(id));
    redis.setex(key, ttl.getSeconds(), Json.write(product));
    return product;
  }

  public Product updatePrice(String id, long newPriceCents) {
    Product updated = db.updatePrice(id, newPriceCents);
    redis.del("product:" + id);
    return updated;
  }

  public <T> T cacheAside(String key, Duration entryTtl, Supplier<Optional<T>> loader, Class<T> type) {
    String raw = redis.get(key);
    if (raw != null) {
      return Json.read(raw, type);
    }
    Optional<T> loaded = loader.get();
  if (loaded.isEmpty()) {
      return null;
    }
    redis.setex(key, entryTtl.getSeconds(), Json.write(loaded.get()));
    return loaded.get();
  }

  public interface ProductRepository {
    Optional<Product> findById(String id);
    Product updatePrice(String id, long priceCents);
  }

  public static final class ProductNotFoundException extends RuntimeException {
    public ProductNotFoundException(String id) { super("Product not found: " + id); }
  }

  static final class Json {
    static String write(Object o) { return "{\"id\":\"" + ((Product)o).id + "\"}"; }
    static <T> T read(String s, Class<T> type) { return (T) new Product("p1", "Widget", 9900L, 1); }
  }
}`,
    springCode: `@Service
public class ProductService {
  private final RedisTemplate<String, Product> redis;
  private final ProductRepository repo;

  @Cacheable(value = "products", key = "#id", unless = "#result == null")
  public Product find(String id) {
    return repo.findById(id).orElseThrow();
  }

  @CacheEvict(value = "products", key = "#id")
  public Product updatePrice(String id, long cents) {
    return repo.updatePrice(id, cents);
  }
}

@Configuration
@EnableCaching
public class CacheConfig {
  @Bean
  RedisCacheManager cacheManager(RedisConnectionFactory factory) {
    return RedisCacheManager.builder(factory)
        .cacheDefaults(RedisCacheConfiguration.defaultCacheConfig()
            .entryTtl(Duration.ofMinutes(5)))
        .build();
  }
}`,
    config: `spring.data.redis.host: redis
spring.data.redis.port: 6379
spring.cache.type: redis
spring.cache.redis.time-to-live: 300000
spring.cache.redis.cache-null-values: false`,
    restApi: `GET  /products/{id}     — cache-aside read
PUT  /products/{id}/price — DB write + cache evict`,
    redisCode: `GET product:{id}
SETEX product:{id} 300 <json>
DEL product:{id}   — on update`,
    dbCode: `SELECT id, name, price_cents, version FROM products WHERE id = $1;
UPDATE products SET price_cents = $2, version = version + 1 WHERE id = $1;`,
    unitTest: `package com.vibhu.cache.aside;

import org.junit.jupiter.api.Test;
import java.time.Duration;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;

class CacheAsideProductServiceTest {
  @Test
  void secondReadHitsCache() {
    var repo = new InMemoryProductRepo();
    var conn = TestRedis.connection();
    var svc = new CacheAsideProductService(conn, repo, Duration.ofMinutes(5));
    svc.getById("p1");
    repo.clearCallCount();
    Product p = svc.getById("p1");
    assertEquals(0, repo.callCount());
    assertEquals("p1", p.id());
  }

  @Test
  void updateEvictsCache() {
    var repo = new InMemoryProductRepo();
    var conn = TestRedis.connection();
    var svc = new CacheAsideProductService(conn, repo, Duration.ofMinutes(5));
    svc.getById("p1");
    svc.updatePrice("p1", 12000L);
    repo.setPrice("p1", 12000L);
    Product p = svc.getById("p1");
    assertEquals(12000L, p.priceCents());
  }
}`,
    integrationTest: `@SpringBootTest
@Testcontainers
class CacheAsideIT {
  @Container static GenericContainer<?> redis = new GenericContainer<>("redis:7-alpine").withExposedPorts(6379);
  @Test void missThenHit() { /* assert DB called once */ }
}`,
    failureTest: `@Test void redisDown_fallsBackToDb() {
  brokenRedis.simulateConnectionFailure();
  Product p = svc.getById("p1");
  assertNotNull(p);
}`,
    concurrencyTest: `@Test void parallelMiss_singleLoader() throws Exception {
  ExecutorService pool = Executors.newFixedThreadPool(16);
  List<Future<Product>> futures = new ArrayList<>();
  for (int i = 0; i < 32; i++) {
    futures.add(pool.submit(() -> svc.getById("hot")));
  }
  for (Future<Product> f : futures) assertEquals("hot", f.get().id());
}`,
    edgeCases: [
      'Cache miss storm on cold start — warm cache or staggered deploy',
      'Stale read after write if eviction fails — TTL bounds staleness',
      'Null caching disabled — repeated misses for non-existent keys',
      'Large objects — compress or use hash fields',
    ],
    failureScenarios: [
      'Redis unavailable — degrade to DB with circuit breaker',
      'DB write succeeds but cache DEL fails — stale until TTL',
      'Race: two threads miss and both load DB — duplicate work',
    ],
    retry: 'Redis GET/SET retries on connection reset (1–2 attempts); DB load not retried on not-found.',
    idempotency: 'Read path is naturally idempotent; write + evict safe to retry if DB update is idempotent.',
    timeout: 'Redis command timeout 50–200ms; DB query timeout 2s; fail-fast to DB if Redis slow.',
    observability: 'Metrics: cache_hit_ratio, cache_miss_latency_ms, evictions; trace span cache.layer=redis.',
    security: 'Do not cache secrets or PII without encryption; ACL per Redis key prefix.',
    performance: 'Sub-ms Redis vs 5–50ms DB; 90%+ hit ratio typical for catalog reads.',
    scalability: 'Horizontal app replicas share Redis cluster; shard hot keys.',
    production: 'Monitor hit ratio drop after deploy; version field in cached JSON for rolling upgrades.',
    mistakes: [
      'Update cache on write without DB transaction ordering',
      'Infinite TTL with no invalidation',
      'Caching exceptions as null',
    ],
    antiPatterns: ['Cache-aside for strongly consistent financial balances', 'Dual write DB + cache without eviction'],
    alternatives: ['Read-through', 'CQRS read model', 'CDN'],
    tradeoffs:
      'Pros: simple, flexible TTL. Cons: app owns consistency; miss path adds latency; stampede risk on expiry.',
    interviewQs: [
      'Cache-aside vs read-through?',
      'When do you invalidate vs update cache?',
      'What happens on Redis failure?',
    ],
    trickyQs: [
      'Two instances update same key — how stale can reads be?',
      'Delete vs update cache on write?',
    ],
    seniorFollowUps: [
      'Design cache-aside with pub/sub invalidation across regions',
      'SLA when hit ratio drops from 95% to 60%',
    ],
    deepLabHref: '/distributed-caching',
  },
  {
    id: 'read-through',
    part: 10,
    name: 'Read-Through Cache',
    frequency: 'Frequently used',
    definition:
      'Cache layer owns the miss path: on GET miss the cache library synchronously loads from DB, stores entry, and returns — application only talks to cache.',
    problem:
      'Every service duplicating cache-aside miss logic leads to inconsistent TTLs, loaders, and error handling.',
    realWorld:
      'Redis with custom loader, Hazelcast near-cache, Spring Cache sync=true, Caffeine LoadingCache with Redis backing.',
    whyExists:
      'Centralizes load semantics in one component; simplifies app code to a single get() call.',
    ascii: `App → Cache API: get(key)
Cache → Redis: GET
  miss → Cache → Loader → DB
         Cache → Redis: SET
Cache → App: value`,
    flow: `sequenceDiagram
  participant A as App
  participant C as ReadThroughCache
  participant R as Redis
  participant D as DB
  A->>C: get(key)
  C->>R: GET
  alt miss
    C->>D: load(key)
    D-->>C: row
    C->>R: SETEX
  end
  C-->>A: value`,
    components: [
      {name: 'ReadThroughCache', responsibility: 'Orchestrates GET; invokes loader on miss.'},
      {name: 'Loader function', responsibility: 'DB fetch; must be side-effect free.'},
      {name: 'Redis backing store', responsibility: 'Distributed cache storage with TTL.'},
      {name: 'Single-flight guard', responsibility: 'Optional coalescing on concurrent miss.'},
      {name: 'Serializer', responsibility: 'Encode/decode cached entries.'},
    ],
    javaCode: `package com.vibhu.cache.readthrough;

import java.time.Duration;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Function;

/** Read-through: cache owns loader on miss (Java 21). */
public final class ReadThroughCache<K, V> {

  private final Function<K, Optional<V>> loader;
  private final Map<K, CacheEntry<V>> local = new ConcurrentHashMap<>();
  private final RedisStringStore remote;
  private final Duration ttl;

  public ReadThroughCache(Function<K, Optional<V>> loader, RedisStringStore remote, Duration ttl) {
    this.loader = loader;
    this.remote = remote;
    this.ttl = ttl;
  }

  public Optional<V> get(K key) {
    String redisKey = key.toString();
    Optional<String> remoteHit = remote.get(redisKey);
    if (remoteHit.isPresent()) {
      V value = deserialize(remoteHit.get());
      local.put(key, new CacheEntry<>(value, Instant.now().plus(ttl)));
      return Optional.of(value);
    }
    Optional<V> loaded = loader.apply(key);
    if (loaded.isEmpty()) {
      return Optional.empty();
    }
    V value = loaded.get();
    remote.setex(redisKey, ttl, serialize(value));
    local.put(key, new CacheEntry<>(value, Instant.now().plus(ttl)));
    return Optional.of(value);
  }

  private record CacheEntry<V>(V value, Instant expiresAt) {
    boolean valid() { return Instant.now().isBefore(expiresAt); }
  }

  public interface RedisStringStore {
    Optional<String> get(String key);
    void setex(String key, Duration ttl, String value);
  }

  private String serialize(V v) { return Json.write(v); }
  private V deserialize(String s) { return Json.read(s); }

  static final class Json {
    static String write(Object o) { return o.toString(); }
    @SuppressWarnings("unchecked")
    static <V> V read(String s) { return (V) s; }
  }
}`,
    springCode: `@Bean
public CacheManager readThroughManager(RedisConnectionFactory factory, ProductLoader loader) {
  RedisCacheWriter writer = RedisCacheWriter.nonLockingRedisCacheWriter(factory);
  RedisCacheConfiguration defaults = RedisCacheConfiguration.defaultCacheConfig()
      .entryTtl(Duration.ofMinutes(10));
  return new ReadThroughRedisCacheManager(writer, defaults, loader);
}`,
    config: `spring.cache.redis.time-to-live: 600000
spring.cache.redis.enable-statistics: true`,
    redisCode: `GET user:{id}
SETEX user:{id} 600 <payload>  — populated by cache layer on miss`,
    dbCode: `SELECT id, email, tier FROM users WHERE id = $1;`,
    unitTest: `@Test void missInvokesLoaderOnce() {
  AtomicInteger loads = new AtomicInteger();
  var cache = new ReadThroughCache<>(
      k -> { loads.incrementAndGet(); return Optional.of("v"); },
      inMemoryRedis(), Duration.ofMinutes(1));
  cache.get("k1");
  cache.get("k1");
  assertEquals(1, loads.get());
}`,
    integrationTest: `@SpringBootTest class ReadThroughIT { @Test void loaderCalledOnMissOnly() {} }`,
    failureTest: `@Test void loaderThrows_noPoisonCache() {
  var cache = new ReadThroughCache<>(k -> { throw new RuntimeException("db"); }, redis, Duration.ofMinutes(1));
  assertThrows(RuntimeException.class, () -> cache.get("x"));
  assertFalse(redis.exists("x"));
}`,
    concurrencyTest: `@Test void concurrentMiss_coalescedLoader() throws Exception {
  AtomicInteger loads = new AtomicInteger();
  var cache = new ReadThroughCache<>(k -> { loads.incrementAndGet(); Thread.sleep(50); return Optional.of(1); }, redis, Duration.ofMinutes(1));
  runParallel(20, () -> cache.get("hot"));
  assertEquals(1, loads.get());
}`,
    edgeCases: [
      'Loader timeout blocks all readers on miss — set loader deadline',
      'Negative cache for missing keys optional in read-through layer',
      'Loader returns null — do not cache unless configured',
    ],
    failureScenarios: [
      'Loader slow — all miss threads pile up; use single-flight',
      'Partial Redis write — reader may miss again',
      'Loader returns stale during DB failover',
    ],
    retry: 'Loader retries transient DB errors 2×; Redis SET retried once.',
    idempotency: 'Loader must be read-only; safe to invoke multiple times for same key.',
    timeout: 'Loader deadline 2s; Redis op 100ms; overall get timeout 3s.',
    observability: 'loader_invocations, loader_latency_ms, cache_layer=read-through.',
    security: 'Loader enforces authz before returning sensitive rows.',
    performance: 'First reader pays DB cost; followers hit Redis.',
    scalability: 'Redis cluster scales storage; coalescing limits DB spikes.',
    production: 'Alert when loader QPS exceeds baseline — possible cache flush or TTL issue.',
    mistakes: ['Loader with side effects', 'No timeout on loader', 'Caching errors'],
    antiPatterns: ['Read-through loader that calls another microservice synchronously'],
    alternatives: ['Cache-aside', 'Materialized view', 'CDC to cache'],
    tradeoffs: 'Pros: uniform miss handling. Cons: cache layer is critical path; harder to customize per endpoint.',
    interviewQs: ['Read-through vs cache-aside?', 'Who calls the database on miss?'],
    trickyQs: ['How does read-through interact with cache stampede?'],
    seniorFollowUps: ['Implement read-through with per-key single-flight in Redis'],
    deepLabHref: '/distributed-caching',
  },
  {
    id: 'write-through',
    part: 10,
    name: 'Write-Through Cache',
    frequency: 'Occasionally used',
    definition:
      'Writes go to cache first; cache synchronously persists to DB before acknowledging — cache and DB stay aligned on every write.',
    problem:
      'Cache-aside write path can leave cache stale or require careful eviction; some domains need write latency bounded by cache+DB sync.',
    realWorld:
      'Session stores with DB backing, embedded caches with write-through to disk, some Redis Enterprise modules.',
    whyExists:
      'Guarantees cache holds latest committed value after write returns; simplifies read path (always read cache).',
    ascii: `App → Cache: write(key,val)
Cache → DB: INSERT/UPDATE (sync)
DB ok → Cache: SET key
Cache → App: ack`,
    flow: `sequenceDiagram
  participant A as App
  participant C as WriteThroughCache
  participant R as Redis
  participant D as DB
  A->>C: put(key, value)
  C->>D: UPSERT
  D-->>C: committed
  C->>R: SETEX key
  C-->>A: ok`,
    components: [
      {name: 'WriteThroughCache', responsibility: 'Dual-write orchestration DB then cache.'},
      {name: 'Transactional DB', responsibility: 'Source of durability.'},
      {name: 'Redis', responsibility: 'Fast read path after write.'},
      {name: 'Write coordinator', responsibility: 'Rollback cache if DB fails.'},
      {name: 'Conflict handler', responsibility: 'Version checks on concurrent writes.'},
    ],
    javaCode: `package com.vibhu.cache.writethrough;

import java.time.Duration;
import java.util.Objects;

public final class WriteThroughInventoryService {

  public record Stock(String sku, int quantity, int version) {}

  private final RedisStore redis;
  private final InventoryRepository db;
  private final Duration ttl;

  public WriteThroughInventoryService(RedisStore redis, InventoryRepository db, Duration ttl) {
    this.redis = Objects.requireNonNull(redis);
    this.db = Objects.requireNonNull(db);
    this.ttl = ttl;
  }

  public Stock setQuantity(String sku, int quantity) {
    Stock saved = db.upsert(sku, quantity);
    redis.setex(key(sku), ttl, Json.write(saved));
    return saved;
  }

  public Stock getQuantity(String sku) {
    return redis.get(key(sku))
        .map(json -> Json.read(json, Stock.class))
        .orElseGet(() -> {
          Stock row = db.findBySku(sku).orElseThrow(() -> new IllegalArgumentException(sku));
          redis.setex(key(sku), ttl, Json.write(row));
          return row;
        });
  }

  private static String key(String sku) { return "stock:" + sku; }

  public interface RedisStore {
    void setex(String key, Duration ttl, String value);
    java.util.Optional<String> get(String key);
  }

  public interface InventoryRepository {
    Stock upsert(String sku, int quantity);
    java.util.Optional<Stock> findBySku(String sku);
  }

  static final class Json {
    static String write(Stock s) { return s.sku() + ":" + s.quantity(); }
    static Stock read(String s, Class<Stock> c) {
      String[] p = s.split(":");
      return new Stock(p[0], Integer.parseInt(p[1]), 1);
    }
  }
}`,
    springCode: `@Transactional
public Stock writeThroughUpdate(String sku, int qty) {
  Stock s = repo.upsert(sku, qty);
  redis.opsForValue().set("stock:" + sku, s, Duration.ofMinutes(10));
  return s;
}`,
    config: `spring.data.redis.timeout: 100ms
spring.datasource.hikari.connection-timeout: 2000`,
    redisCode: `SETEX stock:{sku} 600 <json>  — after DB commit`,
    dbCode: `INSERT INTO inventory (sku, quantity, version) VALUES ($1,$2,1)
ON CONFLICT (sku) DO UPDATE SET quantity = $2, version = inventory.version + 1;`,
    unitTest: `@Test void writeUpdatesDbAndCache() {
  var svc = new WriteThroughInventoryService(redis, repo, Duration.ofMinutes(5));
  svc.setQuantity("SKU1", 42);
  assertEquals(42, svc.getQuantity("SKU1").quantity());
  assertEquals(42, repo.findBySku("SKU1").get().quantity());
}`,
    integrationTest: `@SpringBootTest class WriteThroughIT { @Test void readAfterWriteConsistent() {} }`,
    failureTest: `@Test void dbFails_cacheNotUpdated() {
  repo.simulateFailure();
  assertThrows(DataAccessException.class, () -> svc.setQuantity("x", 1));
  assertTrue(redis.get("stock:x").isEmpty());
}`,
    concurrencyTest: `@Test void concurrentWrites_lastWriterWins() throws Exception {
  runParallel(10, () -> svc.setQuantity("SKU1", ThreadLocalRandom.current().nextInt(100)));
  Stock finalStock = svc.getQuantity("SKU1");
  assertEquals(repo.findBySku("SKU1").get().quantity(), finalStock.quantity());
}`,
    edgeCases: [
      'DB commit slow — write latency equals DB + Redis',
      'Cache SET fails after DB commit — readers hit DB on miss',
      'Large write volume — DB becomes bottleneck',
    ],
    failureScenarios: [
      'DB succeeds, Redis fails — inconsistent until TTL/miss reload',
      'Two-phase need if cache and DB not same transaction',
      'Network partition to Redis — writes may fail after DB commit',
    ],
    retry: 'Retry Redis SET once; DB write idempotent via UPSERT.',
    idempotency: 'UPSERT by sku makes retries safe; version column detects conflicts.',
    timeout: 'DB transaction 3s; Redis SET 100ms.',
    observability: 'write_through_latency_ms split db vs redis; dual_write_failures counter.',
    security: 'Encrypt sensitive fields before cache SET.',
    performance: 'Write latency 2× vs cache-only; read always fast.',
    scalability: 'Write-through limits write throughput to DB capacity.',
    production: 'Reconciliation job compares Redis hash vs DB nightly.',
    mistakes: ['Cache write before DB commit', 'No rollback path', 'Write-through for high-write counters'],
    antiPatterns: ['Write-through without transactional outbox for downstream'],
    alternatives: ['Write-behind', 'Cache-aside with evict', 'CQRS'],
    tradeoffs: 'Pros: consistent reads from cache. Cons: slow writes; dual-failure modes.',
    interviewQs: ['Write-through vs write-behind?', 'When is write-through appropriate?'],
    trickyQs: ['DB committed but Redis SET failed — what do readers see?'],
    seniorFollowUps: ['Two-phase commit vs saga for cache+DB'],
    deepLabHref: '/distributed-caching',
  },
  {
    id: 'write-behind',
    part: 10,
    name: 'Write-Behind (Write-Back) Cache',
    frequency: 'Occasionally used',
    definition:
      'Application writes to cache immediately; cache asynchronously batches and flushes updates to DB — absorbs write spikes.',
    problem:
      'Bursty writes (analytics counters, IoT telemetry) overwhelm DB if every write hits disk synchronously.',
    realWorld:
      'Redis counters flushed periodically, write-back filesystems, session persistence with delayed DB sync.',
    whyExists:
      'Decouples write acknowledgment from DB durability; improves write throughput when loss window acceptable.',
    ascii: `App → Cache: write (fast ack)
Cache → queue/buffer
async worker → DB: batch flush`,
    flow: `sequenceDiagram
  participant A as App
  participant C as WriteBehindCache
  participant R as Redis
  participant W as Flusher
  participant D as DB
  A->>C: increment(key)
  C->>R: HINCRBY
  C-->>A: ack
  W->>R: read dirty keys
  W->>D: BATCH UPDATE
  W->>R: mark clean`,
    components: [
      {name: 'WriteBehindCache', responsibility: 'Accept writes; mark dirty.'},
      {name: 'Flush worker', responsibility: 'Periodic or threshold-based DB batch.'},
      {name: 'Dirty set', responsibility: 'Track keys pending persistence.'},
      {name: 'Recovery log', responsibility: 'Replay unflushed on crash.'},
      {name: 'Coalescer', responsibility: 'Merge multiple writes to same key.'},
    ],
    javaCode: `package com.vibhu.cache.writebehind;

import java.time.Duration;
import java.util.Set;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;

public final class WriteBehindCounterService implements AutoCloseable {

  private final RedisCounterStore redis;
  private final CounterRepository db;
  private final ScheduledExecutorService flusher =
      Executors.newSingleThreadScheduledExecutor(r -> new Thread(r, "write-behind-flush"));
  private final AtomicBoolean running = new AtomicBoolean(true);

  public WriteBehindCounterService(RedisCounterStore redis, CounterRepository db, Duration flushInterval) {
    this.redis = redis;
    this.db = db;
    flusher.scheduleAtFixedRate(this::flushDirty, flushInterval.toMillis(),
        flushInterval.toMillis(), TimeUnit.MILLISECONDS);
  }

  public long increment(String metricId, long delta) {
    long newVal = redis.increment(metricId, delta);
    redis.markDirty(metricId);
    return newVal;
  }

  public long read(String metricId) {
    return redis.get(metricId);
  }

  private void flushDirty() {
    if (!running.get()) return;
    Set<String> dirty = redis.dirtyKeys();
    for (String id : dirty) {
      long value = redis.get(id);
      db.upsertCounter(id, value);
      redis.clearDirty(id);
    }
  }

  @Override
  public void close() {
    running.set(false);
    flusher.shutdown();
    flushDirty();
  }

  public interface RedisCounterStore {
    long increment(String id, long delta);
    long get(String id);
    void markDirty(String id);
    Set<String> dirtyKeys();
    void clearDirty(String id);
  }

  public interface CounterRepository {
    void upsertCounter(String id, long value);
  }
}`,
    springCode: `@Scheduled(fixedDelay = 5000)
public void flushCounters() {
  for (String key : redis.keys("dirty:*")) {
    long v = Long.parseLong(redis.get(key));
    repo.upsert(key, v);
    redis.delete(key);
  }
}`,
    config: `write-behind.flush-interval-ms: 5000
write-behind.max-dirty-keys: 10000`,
    redisCode: `HINCRBY metrics:{id} count 1
SADD dirty:metrics {id}
# flusher
SMEMBERS dirty:metrics → DB UPSERT → SREM dirty:metrics`,
    dbCode: `INSERT INTO metrics (id, count) VALUES ($1,$2)
ON CONFLICT (id) DO UPDATE SET count = $2, updated_at = now();`,
    unitTest: `@Test void flushPersistsToDb() {
  var svc = new WriteBehindCounterService(redis, repo, Duration.ofMillis(100));
  svc.increment("m1", 5);
  await().atMost(Duration.ofSeconds(2)).until(() -> repo.get("m1") == 5L);
  svc.close();
}`,
    integrationTest: `@SpringBootTest class WriteBehindIT { @Test void burstWritesCoalesced() {} }`,
    failureTest: `@Test void crashBeforeFlush_dataLossBounded() {
  svc.increment("m1", 10);
  svc.close(); // no flush simulated
  assertTrue(repo.get("m1") < 10L || repo.get("m1") == 10L);
}`,
    concurrencyTest: `@Test void parallelIncrements_coalescedFlush() {
  runParallel(100, () -> svc.increment("hot", 1));
  svc.close();
  assertEquals(100L, repo.get("hot"));
}`,
    edgeCases: [
      'Crash before flush — data loss within flush window',
      'Flush order vs read-your-writes from DB',
      'Dirty set grows unbounded — cap and force flush',
    ],
    failureScenarios: [
      'Flusher dies — dirty keys never reach DB',
      'DB flush fails — retry with exponential backoff',
      'Redis memory full — writes rejected',
    ],
    retry: 'Flusher retries failed batches 3×; increment is local to Redis.',
    idempotency: 'UPSERT with last value wins; coalescing may skip intermediate counts.',
    timeout: 'Flush batch deadline 30s; increment Redis op 50ms.',
    observability: 'dirty_key_count, flush_lag_seconds, flush_failures.',
    security: 'Flush worker uses DB credentials with write-only role.',
    performance: 'Write ack sub-ms; DB sees 1/N write rate.',
    scalability: 'Partition dirty sets per shard; multiple flushers with locking.',
    production: 'Persist Redis AOF + monitor flush lag; alert if dirty > threshold.',
    mistakes: ['Write-behind for financial balances', 'No crash recovery', 'Flush single-threaded bottleneck'],
    antiPatterns: ['Write-behind without durability window SLA'],
    alternatives: ['Kafka buffer', 'Write-through', 'Timeseries DB'],
    tradeoffs: 'Pros: write throughput. Cons: durability window; complexity on recovery.',
    interviewQs: ['Write-behind data loss window?', 'How to recover after crash?'],
    trickyQs: ['Reader hits DB while cache has newer value?'],
    seniorFollowUps: ['Exactly-once flush with idempotent UPSERT + offset'],
    deepLabHref: '/distributed-caching',
  },
  {
    id: 'refresh-ahead',
    part: 10,
    name: 'Refresh-Ahead Cache',
    frequency: 'Specialized',
    definition:
      'Proactively reloads cache entries before TTL expiry when access pattern predicts imminent miss — user rarely sees miss latency.',
    problem:
      'Large TTL entries expire simultaneously causing latency spikes; hot keys near expiry trigger stampede on reload.',
    realWorld:
      'Caffeine refreshAfterWrite, Netflix cache warming, CDN stale-while-revalidate with background refresh.',
    whyExists:
      'Smooths latency for predictable hot data; trades background load for stable p99 read latency.',
    ascii: `access → TTL almost expired?
  yes → async refresh (single-flight)
  no  → return cached value`,
    flow: `stateDiagram-v2
  [*] --> Valid
  Valid --> Refreshing: access near expiry
  Refreshing --> Valid: reload ok
  Valid --> Expired: TTL elapsed
  Expired --> Loading: sync load`,
    components: [
      {name: 'RefreshScheduler', responsibility: 'Trigger background reload before hard expiry.'},
      {name: 'Access tracker', responsibility: 'Detect hot keys eligible for refresh.'},
      {name: 'Single-flight', responsibility: 'One refresher per key.'},
      {name: 'Stale reader', responsibility: 'Serve old value while refresh in flight.'},
      {name: 'Loader', responsibility: 'DB/API fetch for refresh.'},
    ],
    javaCode: `package com.vibhu.cache.refreshahead;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.function.Function;

public final class RefreshAheadCache<K, V> {

  private final Function<K, V> loader;
  private final Duration ttl;
  private final Duration refreshBeforeExpiry;
  private final Map<K, Entry<V>> store = new ConcurrentHashMap<>();
  private final Map<K, Boolean> refreshing = new ConcurrentHashMap<>();
  private final ExecutorService refreshPool = Executors.newFixedThreadPool(4);

  public RefreshAheadCache(Function<K, V> loader, Duration ttl, Duration refreshBeforeExpiry) {
    this.loader = loader;
    this.ttl = ttl;
    this.refreshBeforeExpiry = refreshBeforeExpiry;
  }

  public V get(K key) {
    Entry<V> entry = store.get(key);
    if (entry == null) {
      return loadSync(key);
    }
    if (entry.shouldRefresh(refreshBeforeExpiry)) {
      triggerRefresh(key);
    }
    if (entry.isExpired()) {
      return loadSync(key);
    }
    return entry.value();
  }

  private V loadSync(K key) {
    V value = loader.apply(key);
    store.put(key, new Entry<>(value, Instant.now().plus(ttl)));
    return value;
  }

  private void triggerRefresh(K key) {
    if (refreshing.putIfAbsent(key, true) != null) return;
    refreshPool.submit(() -> {
      try {
        V value = loader.apply(key);
        store.put(key, new Entry<>(value, Instant.now().plus(ttl)));
      } finally {
        refreshing.remove(key);
      }
    });
  }

  private record Entry<V>(V value, Instant expiresAt) {
    boolean isExpired() { return Instant.now().isAfter(expiresAt); }
    boolean shouldRefresh(Duration before) {
      return Instant.now().isAfter(expiresAt.minus(before));
    }
  }
}`,
    springCode: `@Bean
CaffeineCache refreshAheadCache() {
  return Caffeine.newBuilder()
      .expireAfterWrite(Duration.ofMinutes(10))
      .refreshAfterWrite(Duration.ofMinutes(8))
      .build(key -> loader.load(key));
}`,
    config: `cache.refresh-ahead.ttl-seconds: 600
cache.refresh-ahead.refresh-before-seconds: 120`,
    redisCode: `GET config:{id}
# background: SETEX before TTL when accessed within refresh window`,
    dbCode: `SELECT * FROM config WHERE id = $1;`,
    unitTest: `@Test void servesStaleWhileRefreshing() {
  AtomicInteger loads = new AtomicInteger();
  var cache = new RefreshAheadCache<>(k -> { loads.incrementAndGet(); return "v"; },
      Duration.ofMillis(200), Duration.ofMillis(50));
  cache.get("k");
  Thread.sleep(160);
  String v = cache.get("k");
  assertEquals("v", v);
}`,
    integrationTest: `@SpringBootTest class RefreshAheadIT { @Test void p99StableNearExpiry() {} }`,
    failureTest: `@Test void refreshFails_keepsStaleUntilExpiry() {
  loader.failNext();
  cache.get("k"); // trigger refresh
  assertNotNull(cache.get("k"));
}`,
    concurrencyTest: `@Test void manyReaders_oneRefresh() {
  warm(cache, "hot");
  nearExpiry(cache, "hot");
  runParallel(50, () -> cache.get("hot"));
  assertEquals(2, loader.count()); // initial + one refresh
}`,
    edgeCases: [
      'Refresh storm if all keys share TTL',
      'Loader slower than access rate — multiple stale serves',
      'Cold key never refreshed — only hot keys benefit',
    ],
    failureScenarios: [
      'Refresh fails — stale served until hard expiry',
      'Refresh pool exhausted — delayed proactive reload',
      'Loader returns null — poison entry risk',
    ],
    retry: 'Failed refresh retried on next access near expiry.',
    idempotency: 'Loader read-only; multiple refreshes safe.',
    timeout: 'Refresh async no user deadline; sync load 2s.',
    observability: 'refresh_ahead_triggered, refresh_latency_ms, stale_served_count.',
    security: 'Refresh uses same auth context as sync load.',
    performance: 'p99 read stable; background DB load increases.',
    scalability: 'Limit refresh pool; prioritize by access frequency.',
    production: 'Tune refreshBeforeExpiry from access logs; avoid refresh on cold keys.',
    mistakes: ['Refresh-ahead on rarely accessed keys', 'Same TTL for all keys'],
    antiPatterns: ['Refresh without single-flight'],
    alternatives: ['TTL jitter', 'Cron cache warmer', 'CDN SWR'],
    tradeoffs: 'Pros: smooth latency. Cons: extra load; stale window near expiry.',
    interviewQs: ['Refresh-ahead vs TTL jitter?', 'When to serve stale during refresh?'],
    trickyQs: ['Refresh returns older data than cache — which wins?'],
    seniorFollowUps: ['Adaptive refresh based on access frequency ML'],
    deepLabHref: '/distributed-caching',
  },
  {
    id: 'cache-stampede',
    part: 10,
    name: 'Cache Stampede (Lock · Coalescing · TTL Jitter)',
    frequency: 'Frequently used',
    definition:
      'When a hot cache entry expires, many threads miss simultaneously and hammer the DB. Mitigations: distributed lock, request coalescing (single-flight), and TTL jitter.',
    problem:
      'A viral product or config key expiry causes N concurrent DB queries — DB CPU spikes, timeouts cascade.',
    realWorld:
      'Redis SETNX lock around loader, Guava single-flight, Facebook memcache lease, per-key mutex in Caffeine.',
    whyExists:
      'Protects origin datastore from correlated miss storms; essential for hot keys with shared TTL.',
    ascii: `TTL expires on hot key
Thread1 → acquire lock → load DB → SET cache
Thread2..N → wait / coalesce → read fresh cache`,
    flow: `sequenceDiagram
  participant T1 as Thread 1
  participant T2 as Thread 2
  participant L as Redis Lock
  participant D as DB
  T1->>L: SETNX lock:hot NX EX 5
  T2->>L: SETNX fails → spin/wait
  T1->>D: SELECT
  T1->>Redis: SETEX hot
  T1->>L: DEL lock:hot
  T2->>Redis: GET hot → hit`,
    components: [
      {name: 'Distributed lock', responsibility: 'Only one loader per key (SETNX + token).'},
      {name: 'Single-flight', responsibility: 'In-process Future map coalesces local threads.'},
      {name: 'TTL jitter', responsibility: 'Randomize expiry to spread reload times.'},
      {name: 'Stale-while-revalidate', responsibility: 'Serve old value while one thread reloads.'},
      {name: 'Probabilistic early refresh', responsibility: 'XFetch algorithm spreads refresh.'},
    ],
    javaCode: `package com.vibhu.cache.stampede;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.FutureTask;
import java.util.concurrent.ThreadLocalRandom;
import java.util.function.Supplier;

/** Stampede protection: lock + coalescing + jitter (Java 21). */
public final class StampedeSafeCache {

  private final RedisLockRedisStore redis;
  private final Map<String, FutureTask<String>> inflight = new ConcurrentHashMap<>();
  private final Duration baseTtl;

  public StampedeSafeCache(RedisLockRedisStore redis, Duration baseTtl) {
    this.redis = redis;
    this.baseTtl = baseTtl;
  }

  public String get(String key, Supplier<String> loader) throws Exception {
    String cached = redis.get(key);
    if (cached != null) return cached;

    FutureTask<String> task = new FutureTask<>(() -> loadWithLock(key, loader));
    FutureTask<String> existing = inflight.putIfAbsent(key, task);
    if (existing != null) return existing.get();
    task.run();
    try {
      return task.get();
    } finally {
      inflight.remove(key);
    }
  }

  private String loadWithLock(String key, Supplier<String> loader) {
    String lockKey = "lock:" + key;
    String token = java.util.UUID.randomUUID().toString();
    boolean acquired = redis.setNxEx(lockKey, token, Duration.ofSeconds(5));
    if (!acquired) {
      for (int i = 0; i < 20; i++) {
        String retry = redis.get(key);
        if (retry != null) return retry;
        Thread.sleep(25);
      }
      return loader.get();
    }
    try {
      String again = redis.get(key);
      if (again != null) return again;
      String value = loader.get();
      Duration jittered = baseTtl.plusMillis(ThreadLocalRandom.current().nextLong(0, 60_000));
      redis.setex(key, jittered, value);
      return value;
    } finally {
      redis.delIfValue(lockKey, token);
    }
  }

  public interface RedisLockRedisStore {
    String get(String key);
    boolean setNxEx(String key, String value, Duration ttl);
    void setex(String key, Duration ttl, String value);
    void delIfValue(String key, String expectedToken);
  }
}`,
    springCode: `@Bean
public CacheStampedeGuard stampedeGuard(StringRedisTemplate redis) {
  return new CacheStampedeGuard(redis, Duration.ofMinutes(5));
}`,
    config: `cache.stampede.lock-ttl-seconds: 5
cache.stampede.ttl-jitter-max-seconds: 60`,
    redisCode: `SET lock:product:123 <token> NX EX 5
GET product:123
SETEX product:123 360 <json>  — TTL + random jitter
EVAL compare-and-del lock script`,
    dbCode: `SELECT * FROM products WHERE id = $1;  — single query under lock`,
    unitTest: `@Test void concurrentMiss_singleDbLoad() throws Exception {
  AtomicInteger loads = new AtomicInteger();
  var cache = new StampedeSafeCache(testRedis(), Duration.ofMinutes(5));
  runParallel(32, () -> cache.get("hot", () -> { loads.incrementAndGet(); return "v"; }));
  assertEquals(1, loads.get());
}`,
    integrationTest: `@SpringBootTest class StampedeIT { @Test void expiryNoDbSpike() {} }`,
    failureTest: `@Test void lockHolderCrashes_lockExpiresOthersLoad() {
  redis.simulateCrashAfterLock();
  String v = cache.get("k", () -> "loaded");
  assertEquals("loaded", v);
}`,
    concurrencyTest: `@Test void lockContention_coalescingAndJitter() throws Exception {
  var cache = new StampedeSafeCache(testRedis(), Duration.ofSeconds(10));
  List<Future<String>> futures = submitParallel(64, () -> cache.get("k", () -> slowLoad()));
  for (Future<String> f : futures) assertEquals("data", f.get(5, TimeUnit.SECONDS));
}`,
    edgeCases: [
      'Lock holder crashes before SET — lock TTL releases others',
      'Lock too short — second stampede mid-load',
      'Coalescing only in-process — need Redis lock cross-node',
    ],
    failureScenarios: [
      'Lock never released — zombie until EX',
      'Loader throws — followers must not cache error',
      'Jitter too small — still correlated expiry',
    ],
    retry: 'Waiters poll cache 25ms × 20; then fallback load without lock.',
    idempotency: 'Loader read-only; multiple loads safe but wasteful.',
    timeout: 'Lock TTL 5s; loader deadline 3s inside lock.',
    observability: 'stampede_lock_wait_ms, coalesced_requests, loader_under_lock_count.',
    security: 'Lock token prevents deleting another holder\'s lock.',
    performance: '1 DB query vs N; lock wait adds ms for followers.',
    scalability: 'Redis lock scales; DB still bottleneck if lock too wide.',
    production: 'Grafana alert on miss_latency spike + lock_wait p99.',
    mistakes: ['No jitter on hot keys', 'Local-only coalescing in multi-instance', 'Lock without token'],
    antiPatterns: ['Synchronized on key in JVM only', 'Infinite lock retry'],
    alternatives: ['Probabilistic early expiration', 'Never expire hot keys + pub/sub refresh'],
    tradeoffs: 'Pros: protects DB. Cons: lock complexity; follower latency; tuning jitter.',
    interviewQs: ['What is cache stampede?', 'Lock vs coalescing vs jitter?'],
    trickyQs: ['Lock expires while loader still running?'],
    seniorFollowUps: ['XFetch probabilistic early expiration math'],
    deepLabHref: '/distributed-caching',
  },
  {
    id: 'cache-penetration',
    part: 10,
    name: 'Cache Penetration (Bloom Filter + Negative Cache)',
    frequency: 'Frequently used',
    definition:
      'Queries for keys that never exist bypass cache and hit DB repeatedly. Bloom filter rejects known-absent keys; negative cache stores short-TTL null markers.',
    problem:
      'Attackers or bugs request random IDs (user/999999999) — every request queries DB for non-existent rows.',
    realWorld:
      'Redis Bloom module (RedisBloom), Guava BloomFilter + negative TTL, CDN 404 caching.',
    whyExists:
      'Cheap O(1) rejection before DB; negative cache stops repeat misses for same bad key.',
    ascii: `GET id
Bloom says absent? → return 404 (no DB)
Redis negative key? → return 404
miss → DB → if null SET negative EX 60`,
    flow: `sequenceDiagram
  participant A as App
  participant B as Bloom
  participant R as Redis
  participant D as DB
  A->>B: mightExist(id)
  alt definitely absent
    B-->>A: false
  else maybe exist
    A->>R: GET user:{id}
    A->>D: SELECT
    alt not found
      A->>R: SETEX user:{id}:neg 60 ""
    end
  end`,
    components: [
      {name: 'Bloom filter', responsibility: 'Probabilistic set membership for existing IDs.'},
      {name: 'Negative cache', responsibility: 'Short TTL entry for known misses.'},
      {name: 'ID loader', responsibility: 'Populate Bloom on startup / CDC.'},
      {name: 'False positive handler', responsibility: 'Rare DB hit when Bloom says maybe.'},
      {name: 'Rebuild job', responsibility: 'Periodic Bloom refresh from DB snapshot.'},
    ],
    javaCode: `package com.vibhu.cache.penetration;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.BitSet;
import java.util.Optional;

public final class PenetrationSafeUserService {

  private final BloomFilter bloom;
  private final RedisCache redis;
  private final UserRepository db;
  private final Duration negativeTtl;

  public PenetrationSafeUserService(BloomFilter bloom, RedisCache redis,
      UserRepository db, Duration negativeTtl) {
    this.bloom = bloom;
    this.redis = redis;
    this.db = db;
    this.negativeTtl = negativeTtl;
  }

  public Optional<User> findUser(String userId) {
    if (!bloom.mightContain(userId)) {
      return Optional.empty();
    }
    String key = "user:" + userId;
    if (redis.isNegative(key)) {
      return Optional.empty();
    }
    Optional<String> cached = redis.get(key);
    if (cached.isPresent()) {
      return Optional.of(Json.read(cached.get(), User.class));
    }
    Optional<User> fromDb = db.findById(userId);
    if (fromDb.isEmpty()) {
      redis.setNegative(key, negativeTtl);
      return Optional.empty();
    }
    redis.setPositive(key, Duration.ofMinutes(10), Json.write(fromDb.get()));
    return fromDb;
  }

  public record User(String id, String email) {}

  public interface UserRepository {
    Optional<User> findById(String id);
  }

  /** Simple Bloom for demo — production: RedisBloom or Guava with tuned fpp. */
  public static final class BloomFilter {
    private final BitSet bits = new BitSet(1_000_000);
    private final int hashCount = 7;

    public boolean mightContain(String id) {
      for (int i = 0; i < hashCount; i++) {
        int h = hash(id, i);
        if (!bits.get(h)) return false;
      }
      return true;
    }

    public void add(String id) {
      for (int i = 0; i < hashCount; i++) bits.set(hash(id, i));
    }

    private int hash(String id, int seed) {
      return Math.abs((id.hashCode() ^ seed * 31) % bits.size());
    }
  }

  public interface RedisCache {
    boolean isNegative(String key);
    void setNegative(String key, Duration ttl);
    Optional<String> get(String key);
    void setPositive(String key, Duration ttl, String json);
  }

  static final class Json {
    static String write(User u) { return u.id() + ":" + u.email(); }
    static User read(String s, Class<User> c) {
      String[] p = s.split(":");
      return new User(p[0], p[1]);
    }
  }
}`,
    springCode: `@PostConstruct
void warmBloom() {
  repo.streamAllIds().forEach(bloom::add);
}`,
    config: `cache.negative-ttl-seconds: 60
bloom.expected-insertions: 10000000
bloom.false-positive-probability: 0.01`,
    redisCode: `GET user:{id}
SETEX user:{id}:neg 60 ""   — negative cache marker
BF.ADD users_bloom {id}     — RedisBloom`,
    dbCode: `SELECT id, email FROM users WHERE id = $1;
-- Bloom built from: SELECT id FROM users`,
    unitTest: `@Test void absentId_noDbCall() {
  var bloom = new PenetrationSafeUserService.BloomFilter();
  bloom.add("real-1");
  var svc = new PenetrationSafeUserService(bloom, redis, repo, Duration.ofSeconds(60));
  assertTrue(svc.findUser("fake-999").isEmpty());
  assertEquals(0, repo.callCount());
}`,
    integrationTest: `@SpringBootTest class PenetrationIT { @Test void bloomRejectsAbsent() {} }`,
    failureTest: `@Test void bloomFalsePositive_dbStillWorks() {
  bloomNeverAdded("edge");
  assertTrue(svc.findUser("edge").isPresent());
}`,
    concurrencyTest: `@Test void parallelBadIds_singleNegativeSet() {
  runParallel(20, () -> svc.findUser("bad"));
  assertEquals(1, redis.negativeSetCount("user:bad"));
}`,
    edgeCases: [
      'Bloom false positive — rare extra DB hit acceptable',
      'New user created — Bloom not updated until add()',
      'Negative TTL too long — delayed visibility of new row',
    ],
    failureScenarios: [
      'Stale Bloom after bulk delete — false negatives if not rebuilt',
      'Negative cache blocks legitimate late insert',
      'Bloom memory pressure on huge ID space',
    ],
    retry: 'DB read once per negative TTL window.',
    idempotency: 'Read path idempotent; negative SET idempotent.',
    timeout: 'Bloom check <1ms; DB 1s for miss.',
    observability: 'bloom_reject_count, negative_cache_hits, penetration_db_queries.',
    security: 'Rate limit still needed — Bloom does not stop DDoS volume.',
    performance: 'Bloom ~1μs; eliminates DB for absent keys.',
    scalability: 'Partition Bloom per shard; RedisBloom scales horizontally.',
    production: 'Rebuild Bloom nightly; CDC add() on new IDs.',
    mistakes: ['Bloom never rebuilt', 'Negative TTL infinite', 'No Bloom for hot attack surface'],
    antiPatterns: ['Only negative cache without Bloom on huge ID space'],
    alternatives: ['WAF rate limit', 'UUID-only IDs', 'HMAC ticket tokens'],
    tradeoffs: 'Pros: cheap rejection. Cons: Bloom maintenance; false positives; new ID lag.',
    interviewQs: ['Cache penetration vs avalanche?', 'Bloom false positive impact?'],
    trickyQs: ['User created after negative cache — how long blocked?'],
    seniorFollowUps: ['Counting Bloom vs classic Bloom for deletions'],
    deepLabHref: '/bloom-filter',
  },
  {
    id: 'cache-avalanche',
    part: 10,
    name: 'Cache Avalanche (Random TTL)',
    frequency: 'Frequently used',
    definition:
      'Mass expiry or Redis restart drops large fraction of cache simultaneously — DB overloaded by synchronized misses. Random TTL per key spreads reload over time.',
    problem:
      'Deploy flush + uniform 300s TTL causes every key to expire together at T+300s.',
    realWorld:
      'TTL base + random offset, Redis volatile-lru with staggered writes, cache warming after cold start.',
    whyExists:
      'Decorrelates expiry times without per-key manual scheduling; cheap to implement.',
    ascii: `key1 TTL=300+17s
key2 TTL=300+41s
key3 TTL=300+8s
→ reloads spread over 60s window`,
    flow: `sequenceDiagram
  participant A as App
  participant R as Redis
  A->>A: ttl = base + random(0, jitterMax)
  A->>R: SETEX key ttl value`,
    components: [
      {name: 'TTL policy', responsibility: 'baseTtl + uniform random jitter.'},
      {name: 'Cache warmer', responsibility: 'Preload after deploy/restart.'},
      {name: 'Circuit breaker', responsibility: 'Protect DB during avalanche.'},
      {name: 'Monitoring', responsibility: 'Alert miss ratio spike.'},
      {name: 'Graceful deploy', responsibility: 'Avoid global FLUSHDB.'},
    ],
    javaCode: `package com.vibhu.cache.avalanche;

import java.time.Duration;
import java.util.concurrent.ThreadLocalRandom;

public final class AvalancheSafeCacheWriter {

  private final RedisStore redis;
  private final Duration baseTtl;
  private final Duration maxJitter;

  public AvalancheSafeCacheWriter(RedisStore redis, Duration baseTtl, Duration maxJitter) {
    this.redis = redis;
    this.baseTtl = baseTtl;
    this.maxJitter = maxJitter;
  }

  public void put(String key, String value) {
    long jitterMs = ThreadLocalRandom.current().nextLong(0, maxJitter.toMillis() + 1);
    Duration effectiveTtl = baseTtl.plusMillis(jitterMs);
    redis.setex(key, effectiveTtl, value);
  }

  public Duration computeTtl() {
    long jitterMs = ThreadLocalRandom.current().nextLong(0, maxJitter.toMillis() + 1);
    return baseTtl.plusMillis(jitterMs);
  }

  public interface RedisStore {
    void setex(String key, Duration ttl, String value);
  }
}`,
    springCode: `public Duration redisTtl() {
  return Duration.ofSeconds(300 + ThreadLocalRandom.current().nextInt(0, 60));
}`,
    config: `cache.ttl-base-seconds: 300
cache.ttl-jitter-max-seconds: 60`,
    redisCode: `SETEX product:1 317 <json>  — 300 + random(0,60)
# avoid: FLUSHDB on deploy`,
    dbCode: `-- monitor: sudden spike in SELECT rate correlates with TTL window`,
    unitTest: `@Test void ttlSpreadAcrossKeys() {
  var writer = new AvalancheSafeCacheWriter(redis, Duration.ofSeconds(300), Duration.ofSeconds(60));
  Set<Long> ttls = new HashSet<>();
  for (int i = 0; i < 100; i++) ttls.add(writer.computeTtl().getSeconds());
  assertTrue(ttls.size() > 10);
}`,
    integrationTest: `@SpringBootTest class AvalancheIT { @Test void noSynchronizedExpiry() {} }`,
    failureTest: `@Test void redisRestart_warmerReducesMissStorm() {
  redis.restart();
  warmer.run();
  assertTrue(metrics.missRatio() < 0.3);
}`,
    concurrencyTest: `@Test void massInsert_uniqueTtls() {
  runParallel(100, i -> writer.put("k" + i, "v"));
  assertTrue(redis.distinctTtls() > 50);
}`,
    edgeCases: [
      'Jitter max too small — still correlated',
      'Keys written at same second still share write time correlation',
      'Redis memory pressure evicts together — different problem (LRU storm)',
    ],
    failureScenarios: [
      'Full cluster restart — all cold; need warmer',
      'FLUSHALL during deploy — avalanche guaranteed',
      'Jitter + stampede on individual hot key still possible',
    ],
    retry: 'Miss loaders use stampede lock independently per key.',
    idempotency: 'Re-SET with new jitter safe.',
    timeout: 'Standard cache timeouts apply.',
    observability: 'miss_ratio, db_qps, ttl_distribution histogram.',
    security: 'No security-specific concerns.',
    performance: 'Spreads DB load; slightly uneven cache age.',
    scalability: 'Works at any cache size; combine with sharding.',
    production: 'Never FLUSHDB in prod; blue/green with dual cache layers.',
    mistakes: ['Identical TTL for millions of keys', 'Flush cache on every deploy'],
    antiPatterns: ['cron SET all keys at midnight same TTL'],
    alternatives: ['Per-key logical expiry in value', 'Never expire + async refresh'],
    tradeoffs: 'Pros: simple, effective. Cons: does not help single hot key; uneven staleness.',
    interviewQs: ['Avalanche vs stampede?', 'How much jitter is enough?'],
    trickyQs: ['Redis LRU eviction vs TTL avalanche?'],
    seniorFollowUps: ['Combine jitter with proactive warming SLAs'],
    deepLabHref: '/distributed-caching',
  },
  {
    id: 'hot-key',
    part: 10,
    name: 'Hot Key Problem',
    frequency: 'Frequently used',
    definition:
      'A single cache key receives disproportionate traffic — one Redis shard or CPU melts while cluster is idle. Mitigations: local cache, key replication, read replicas, random suffix sharding.',
    problem:
      'Celebrity product, global config, or rate-limit counter on one key exceeds single-node Redis 100k+ OPS.',
    realWorld:
      'Twitter fanout, WeChat hot key detection, Redis Cluster hash-tag replication, Caffeine L1 in app.',
    whyExists:
      'Hash partitioning spreads keys but not hot keys within one slot; needs application-level splitting.',
    ascii: `hot key "product:123" → 1 Redis shard
split: product:123:{0..7} replicas
L1 local cache absorbs 80% reads`,
    flow: `sequenceDiagram
  participant A as App
  participant L1 as Local Cache
  participant R as Redis Replica
  A->>L1: get
  alt L1 miss
    A->>R: GET random replica shard
  end`,
    components: [
      {name: 'L1 near cache', responsibility: 'Caffeine per instance absorbs hot reads.'},
      {name: 'Key splitting', responsibility: 'product:123:0..N duplicate values.'},
      {name: 'Read replica', responsibility: 'Redis replica for read scaling.'},
      {name: 'Hot key detector', responsibility: 'Proxy metrics flag keys > threshold OPS.'},
      {name: 'Broadcast refresh', responsibility: 'Pub/sub update all L1 on change.'},
    ],
    javaCode: `package com.vibhu.cache.hotkey;

import com.github.benmanes.caffeine.cache.Caffeine;
import java.time.Duration;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

public final class HotKeyProductReader {

  private static final int REPLICA_COUNT = 8;
  private final com.github.benmanes.caffeine.cache.Cache<String, String> local =
      Caffeine.newBuilder().maximumSize(10_000).expireAfterWrite(Duration.ofSeconds(2)).build();
  private final List<RedisShard> redisShards;

  public HotKeyProductReader(List<RedisShard> redisShards) {
    this.redisShards = redisShards;
  }

  public String getProduct(String productId) {
    return local.get(productId, this::loadFromRedisReplica);
  }

  private String loadFromRedisReplica(String productId) {
    int replica = ThreadLocalRandom.current().nextInt(REPLICA_COUNT);
    String replicaKey = productId + ":" + replica;
    for (RedisShard shard : redisShards) {
      String v = shard.get(replicaKey);
      if (v != null) return v;
    }
    String value = fetchFromOrigin(productId);
    int target = ThreadLocalRandom.current().nextInt(REPLICA_COUNT);
    redisShards.get(target % redisShards.size()).setex(replicaKey, Duration.ofMinutes(5), value);
    return value;
  }

  private String fetchFromOrigin(String productId) {
    return "product-data-" + productId;
  }

  public interface RedisShard {
    String get(String key);
    void setex(String key, Duration ttl, String value);
  }
}`,
    springCode: `@Bean
Cache<String, Product> hotKeyLocalCache() {
  return Caffeine.newBuilder().maximumSize(5000).expireAfterWrite(Duration.ofSeconds(1)).build();
}`,
    config: `hot-key.replica-count: 8
hot-key.local-ttl-ms: 2000
hot-key.detection-threshold-ops: 10000`,
    redisCode: `GET product:123:3   — random replica suffix
SETEX product:123:0..7 300 <same json>
INFO commandstats | grep product:123`,
    dbCode: `SELECT * FROM products WHERE id = $1;  — only on full cache miss`,
    unitTest: `@Test void localCacheReducesRedisCalls() {
  var reader = new HotKeyProductReader(List.of(mockRedis));
  reader.getProduct("hot");
  reader.getProduct("hot");
  verify(mockRedis, times(1)).get(any());
}`,
    integrationTest: `@SpringBootTest class HotKeyIT { @Test void replicaKeysSpreadLoad() {} }`,
    failureTest: `@Test void singleShardDown_fallbackReplica() {
  shards.get(0).fail();
  assertNotNull(reader.getProduct("hot"));
}`,
    concurrencyTest: `@Test void highQps_localAbsorbs() {
  runParallel(1000, () -> reader.getProduct("viral"));
  assertTrue(redis.getCallCount() < 100);
}`,
    edgeCases: [
      'L1 stale 1–2s on update — pub/sub invalidate',
      'Replica keys inconsistent during write — short L1 TTL',
      'Hot key shifts — detector must adapt',
    ],
    failureScenarios: [
      'All replicas on same shard — splitting fails',
      'L1 too large — JVM heap pressure',
      'Update only one replica — readers see stale',
    ],
    retry: 'Random replica retry on connection error.',
    idempotency: 'Read path idempotent.',
    timeout: 'L1 instant; Redis 50ms; origin 2s.',
    observability: 'hot_key_ops, l1_hit_ratio, per-key commandstats.',
    security: 'Hot keys often public catalog — still rate limit.',
    performance: 'L1 + replicas multiply effective OPS capacity.',
    scalability: 'Multi-layer: L1 → replica keys → origin.',
    production: 'Redis hot-key dashboard; auto-split when OPS > 50k.',
    mistakes: ['Only bigger Redis instance', 'No L1 for known hot keys'],
    antiPatterns: ['Single global counter key for all traffic'],
    alternatives: ['CDN edge', 'Dedicated in-memory cluster for hot set'],
    tradeoffs: 'Pros: handles viral traffic. Cons: consistency window; operational complexity.',
    interviewQs: ['How to detect hot keys?', 'L1 vs key splitting?'],
    trickyQs: ['Update product during viral read — staleness SLA?'],
    seniorFollowUps: ['Redis Cluster hot slot migration live'],
    deepLabHref: '/distributed-caching',
  },
];

// ---------------------------------------------------------------------------
// Part 11 — Distributed locking
// ---------------------------------------------------------------------------

export const LOCKING_PATTERNS: PatternCard[] = [
  {
    id: 'db-lock',
    part: 11,
    name: 'Database Lock (SELECT FOR UPDATE · Advisory)',
    frequency: 'Frequently used',
    definition:
      'Uses DB row locks or advisory locks for mutual exclusion — SELECT FOR UPDATE, pessimistic JPA lock, or PostgreSQL pg_advisory_lock.',
    problem:
      'Two app instances concurrently debit the same account or assign the same inventory row without coordination.',
    realWorld:
      'Banking transfers, seat booking, inventory reservation, job queue claim with SKIP LOCKED.',
    whyExists:
      'No extra infrastructure; ACID transaction + lock row = strong exclusion within DB boundary.',
    ascii: `TX begin
SELECT * FROM accounts WHERE id=1 FOR UPDATE
-- row locked until commit
UPDATE ... COMMIT`,
    flow: `sequenceDiagram
  participant A as App A
  participant D as PostgreSQL
  participant B as App B
  A->>D: BEGIN
  A->>D: SELECT FOR UPDATE id=1
  B->>D: SELECT FOR UPDATE id=1
  Note over B,D: blocks
  A->>D: UPDATE COMMIT
  B->>D: acquires lock`,
    components: [
      {name: 'Transaction boundary', responsibility: 'Lock held until commit/rollback.'},
      {name: 'Row lock', responsibility: 'FOR UPDATE on specific rows.'},
      {name: 'Advisory lock', responsibility: 'pg_advisory_xact_lock for logical resources.'},
      {name: 'SKIP LOCKED', responsibility: 'Worker queues without blocking.'},
      {name: 'Lock timeout', responsibility: 'lock_timeout prevents indefinite wait.'},
    ],
    javaCode: `package com.vibhu.lock.db;

import jakarta.persistence.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class AccountLockService {

  private final AccountRepository repo;

  public AccountLockService(AccountRepository repo) { this.repo = repo; }

  @Transactional
  public void transfer(String fromId, String toId, long cents) {
    Account from = repo.findByIdForUpdate(fromId)
        .orElseThrow(() -> new IllegalArgumentException(fromId));
    Account to = repo.findByIdForUpdate(toId)
        .orElseThrow(() -> new IllegalArgumentException(toId));
    if (from.balanceCents() < cents) throw new InsufficientFundsException();
    repo.save(from.debit(cents));
    repo.save(to.credit(cents));
  }

  @Transactional
  public Optional<Job> claimNextJob() {
    return repo.findFirstClaimableJobForUpdateSkipLocked();
  }

  public record Account(String id, long balanceCents) {
    Account debit(long c) { return new Account(id, balanceCents - c); }
    Account credit(long c) { return new Account(id, balanceCents + c); }
  }

  public interface AccountRepository {
    Optional<Account> findByIdForUpdate(String id);
    Account save(Account a);
    Optional<Job> findFirstClaimableJobForUpdateSkipLocked();
  }

  public record Job(String id, String status) {}
  public static class InsufficientFundsException extends RuntimeException {}
}`,
    springCode: `@Lock(LockModeType.PESSIMISTIC_WRITE)
@Query("SELECT a FROM Account a WHERE a.id = :id")
Optional<Account> findForUpdate(@Param("id") String id);

@Query(value = "SELECT * FROM jobs WHERE status='PENDING' ORDER BY id LIMIT 1 FOR UPDATE SKIP LOCKED", nativeQuery = true)
Optional<Job> claimJob();`,
    config: `spring.jpa.properties.hibernate.jdbc.time_zone: UTC
spring.datasource.hikari.maximum-pool-size: 20
# PostgreSQL session
lock_timeout: 5s`,
    dbCode: `BEGIN;
SELECT balance_cents FROM accounts WHERE id = $1 FOR UPDATE;
UPDATE accounts SET balance_cents = balance_cents - $2 WHERE id = $1;
COMMIT;

-- Advisory lock
SELECT pg_advisory_xact_lock(hashtext('inventory:SKU1'));

-- Queue worker
SELECT * FROM jobs WHERE status = 'PENDING' ORDER BY id LIMIT 1 FOR UPDATE SKIP LOCKED;`,
    unitTest: `@Test void concurrentTransfer_noOverdraft() {
  repo.seed("a1", 100L);
  runParallel(10, () -> svc.transfer("a1", "a2", 30L));
  assertTrue(repo.find("a1").balanceCents() >= 0);
}`,
    integrationTest: `@DataJpaTest class DbLockIT { @Test void secondTxBlocksUntilCommit() {} }`,
    failureTest: `@Test void lockTimeout_throws() {
  holdLockInOtherTx();
  assertThrows(LockTimeoutException.class, () -> svc.transfer("a1", "a2", 1));
}`,
    concurrencyTest: `@Test void skipLocked_workersGetDistinctJobs() {
  seedJobs(5);
  Set<String> claimed = runParallelWorkers(5, svc::claimNextJob);
  assertEquals(5, claimed.size());
}`,
    edgeCases: [
      'Lock order deadlock — always lock accounts in sorted id order',
      'Long TX holds lock — minimize work inside lock',
      'Connection pool exhaustion when many threads block on lock',
    ],
    failureScenarios: [
      'Timeout — client retries; risk double spend without idempotency',
      'Crash before commit — lock released, no partial update if TX rolled back',
      'Partition — DB primary unavailable, no lock progress',
      'Expiration — lock_timeout aborts waiter',
      'Zombie — none at DB layer if connection dropped (lock released)',
      'Split brain — only if multi-primary (avoid); single primary is safe',
    ],
    retry: 'Retry transfer with idempotency key on lock_timeout or serialization_failure.',
    idempotency: 'Idempotency table for transferId prevents duplicate debit on retry.',
    timeout: 'lock_timeout 5s; statement_timeout 10s; app TX timeout 8s.',
    observability: 'pg_locks view; wait_event lock; transfer_lock_wait_ms metric.',
    security: 'Least privilege DB user; no superuser for app.',
    performance: 'Row lock serializes hot rows — bottleneck on single account.',
    scalability: 'Shard by account id; advisory locks for cross-shard logical keys.',
    production: 'Alert on lock wait p99; avoid hot row updates.',
    mistakes: ['FOR UPDATE on full table scan', 'No lock_timeout', 'Different lock order → deadlock'],
    antiPatterns: ['Distributed lock when single DB TX suffices', 'Long running report inside FOR UPDATE'],
    alternatives: ['Redis lock', 'Optimistic locking', 'SERIALIZABLE isolation'],
    tradeoffs: 'Pros: strong, simple. Cons: DB dependency; contention; not cross-DB.',
    interviewQs: ['FOR UPDATE vs advisory lock?', 'SKIP LOCKED use case?'],
    trickyQs: ['App crashes after lock acquired — when released?'],
    seniorFollowUps: ['Deadlock detection graph in high-contention ledger'],
    deepLabHref: '/distributed-locking',
  },
  {
    id: 'redis-lock',
    part: 11,
    name: 'Redis Distributed Lock (SET NX EX)',
    frequency: 'Frequently used',
    definition:
      'Acquire lock with SET key token NX EX ttl; release with Lua compare-and-del only if token matches — mutual exclusion across JVMs.',
    problem:
      'Multi-instance cron, cache stampede loader, or inventory gate needs exclusion without DB row contention.',
    realWorld:
      'Redis SET NX, Redlock debate implementations, Spring Integration RedisLockRegistry.',
    whyExists:
      'Fast, widely available; good for short-lived coarse locks when fencing not required.',
    ascii: `SET lock:job token NX EX 30
... work ...
EVAL if GET==token then DEL`,
    flow: `sequenceDiagram
  participant A as Instance A
  participant R as Redis
  participant B as Instance B
  A->>R: SET lock:k token NX EX 30
  R-->>A: OK
  B->>R: SET lock:k token2 NX EX 30
  R-->>B: nil
  A->>R: EVAL del-if-token
  B->>R: SET lock:k token2 NX EX 30
  R-->>B: OK`,
    components: [
      {name: 'Lock key', responsibility: 'Unique resource identifier.'},
      {name: 'Token', responsibility: 'Random value proves ownership on release.'},
      {name: 'TTL', responsibility: 'Auto-release if holder crashes.'},
      {name: 'Lua unlock', responsibility: 'Atomic compare-and-delete.'},
      {name: 'Renewal', responsibility: 'Optional watchdog extends TTL for long work.'},
    ],
    javaCode: `package com.vibhu.lock.redis;

import io.lettuce.core.SetArgs;
import io.lettuce.core.api.sync.RedisCommands;

import java.time.Duration;
import java.util.UUID;

public final class RedisDistributedLock {

  private static final String UNLOCK_SCRIPT =
      "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end";

  private final RedisCommands<String, String> redis;

  public RedisDistributedLock(RedisCommands<String, String> redis) {
    this.redis = redis;
  }

  public LockHandle tryAcquire(String resource, Duration ttl) {
    String key = "lock:" + resource;
    String token = UUID.randomUUID().toString();
    String result = redis.set(key, token, SetArgs.Builder.nx().ex(ttl.getSeconds()));
    if ("OK".equals(result)) {
      return new LockHandle(key, token);
    }
    return null;
  }

  public boolean release(LockHandle handle) {
    Long deleted = redis.eval(UNLOCK_SCRIPT, io.lettuce.core.ScriptOutputType.INTEGER,
        new String[]{handle.key()}, handle.token());
    return deleted != null && deleted == 1L;
  }

  public <T> T withLock(String resource, Duration ttl, Duration wait,
      java.util.function.Supplier<T> work) throws InterruptedException {
    long deadline = System.nanoTime() + wait.toNanos();
    LockHandle handle;
    while ((handle = tryAcquire(resource, ttl)) == null) {
      if (System.nanoTime() > deadline) throw new LockNotAcquiredException(resource);
      Thread.sleep(50);
    }
    try {
      return work.get();
    } finally {
      release(handle);
    }
  }

  public record LockHandle(String key, String token) {}
  public static class LockNotAcquiredException extends RuntimeException {
    LockNotAcquiredException(String r) { super("Lock not acquired: " + r); }
  }
}`,
    springCode: `@Bean
RedisLockRegistry lockRegistry(RedisConnectionFactory cf) {
  return new RedisLockRegistry(cf, "app-locks", 30000);
}`,
    config: `redis.lock.default-ttl-ms: 30000
redis.lock.wait-ms: 5000`,
    redisCode: `SET lock:inventory:SKU1 <uuid> NX EX 30
EVAL unlock_script 1 lock:inventory:SKU1 <uuid>`,
    unitTest: `@Test void onlyOneHolder() {
  var lock = new RedisDistributedLock(redis);
  var h1 = lock.tryAcquire("r", Duration.ofSeconds(10));
  assertNotNull(h1);
  assertNull(lock.tryAcquire("r", Duration.ofSeconds(10)));
  lock.release(h1);
  assertNotNull(lock.tryAcquire("r", Duration.ofSeconds(10)));
}`,
    integrationTest: `@Testcontainers class RedisLockIT { @Test void crossProcessExclusion() {} }`,
    failureTest: `@Test void releaseWrongToken_lockRemains() {
  var h = lock.tryAcquire("r", Duration.ofSeconds(10));
  lock.release(new LockHandle(h.key(), "wrong"));
  assertNull(lock.tryAcquire("r", Duration.ofSeconds(1)));
}`,
    concurrencyTest: `@Test void parallelAcquire_oneWinner() throws Exception {
  AtomicInteger winners = new AtomicInteger();
  runParallel(20, () -> {
    var h = lock.tryAcquire("hot", Duration.ofSeconds(5));
    if (h != null) { winners.incrementAndGet(); lock.release(h); }
  });
  assertEquals(1, winners.get());
}`,
    edgeCases: [
      'TTL expires before work done — second acquirer runs concurrently',
      'Clock skew irrelevant — Redis TTL authoritative',
      'Forgot token on unlock — DEL without compare breaks safety',
    ],
    failureScenarios: [
      'Crash after acquire — lock expires at TTL (zombie work risk)',
      'Partition — client thinks lock held, Redis expired (split execution)',
      'Expiration too short — overlap of two holders',
      'No fencing — stale holder may write after lock lost',
      'Split brain — two holders if TTL overlap + slow work',
    ],
    retry: 'Poll acquire every 50ms until wait budget.',
    idempotency: 'Work inside lock should still be idempotent if TTL expires.',
    timeout: 'Lock TTL 30s; acquire wait 5s; work should finish < TTL.',
    observability: 'lock_acquire_success, lock_wait_ms, lock_hold_duration, ttl_expired_while_holding.',
    security: 'Redis AUTH; lock keys not guessable for multi-tenant.',
    performance: 'Sub-ms acquire; single Redis bottleneck for lock key.',
    scalability: 'Fine-grained lock keys; avoid global lock.',
    production: 'Monitor hold time vs TTL; watchdog renew for batch jobs.',
    mistakes: ['DEL without token check', 'No TTL', 'Redlock without understanding tradeoffs'],
    antiPatterns: ['Redis lock for financial correctness without fencing'],
    alternatives: ['DB lock', 'Redisson', 'Zookeeper/etcd'],
    tradeoffs: 'Pros: fast, simple. Cons: TTL fencing gap; not CP under partition.',
    interviewQs: ['Why Lua on unlock?', 'What if holder crashes?'],
    trickyQs: ['Is Redlock safe? Martin Kleppmann critique'],
    seniorFollowUps: ['Design lock renewal watchdog without extending wrong holder'],
    deepLabHref: '/distributed-locking',
  },
  {
    id: 'redisson-lock',
    part: 11,
    name: 'Redisson Distributed Lock (RLock · Watchdog)',
    frequency: 'Frequently used',
    definition:
      'Redisson RLock wraps Redis with reentrant lock semantics, automatic lease renewal (watchdog), and fair lock options — production-grade Redis locking for Java.',
    problem:
      'Manual SET NX lacks renewal, reentrancy, and structured unlock — long jobs lose lock mid-flight.',
    realWorld:
      'Spring + Redisson for schedulers, stock deduction, distributed rate limit coordination.',
    whyExists:
      'Encodes best practices: watchdog extends TTL while holder thread alive; built-in tryLock/wait.',
    ascii: `tryLock(wait, lease, unit)
Watchdog renews every lease/3
unlock() in same thread — reentrant count`,
    flow: `sequenceDiagram
  participant T as Thread
  participant R as Redisson
  participant Redis
  T->>R: tryLock(5s, 30s)
  R->>Redis: SET NX
  loop watchdog
    R->>Redis: EXPIRE extend
  end
  T->>R: unlock()
  R->>Redis: unlock script`,
    components: [
      {name: 'RLock', responsibility: 'Named distributed reentrant lock.'},
      {name: 'Watchdog', responsibility: 'Renews lease while holder thread running.'},
      {name: 'Fair lock', responsibility: 'FIFO acquire order optional.'},
      {name: 'MultiLock', responsibility: 'Acquire several locks atomically.'},
      {name: 'ReadWriteLock', responsibility: 'Separate read/write Redis keys.'},
    ],
    javaCode: `package com.vibhu.lock.redisson;

import org.redisson.api.RLock;
import org.redisson.api.RedissonClient;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.concurrent.TimeUnit;

@Service
public class RedissonInventoryService {

  private final RedissonClient redisson;
  private final InventoryRepository repo;

  public RedissonInventoryService(RedissonClient redisson, InventoryRepository repo) {
    this.redisson = redisson;
    this.repo = repo;
  }

  public void reserve(String sku, int qty) throws InterruptedException {
    RLock lock = redisson.getLock("inventory:" + sku);
    boolean acquired = lock.tryLock(5, 30, TimeUnit.SECONDS);
    if (!acquired) throw new LockBusyException(sku);
    try {
      int available = repo.getAvailable(sku);
      if (available < qty) throw new InsufficientStockException(sku);
      repo.setAvailable(sku, available - qty);
    } finally {
      if (lock.isHeldByCurrentThread()) {
        lock.unlock();
      }
    }
  }

  public interface InventoryRepository {
    int getAvailable(String sku);
    void setAvailable(String sku, int qty);
  }

  public static class LockBusyException extends RuntimeException {
    LockBusyException(String sku) { super("Lock busy: " + sku); }
  }
  public static class InsufficientStockException extends RuntimeException {
    InsufficientStockException(String sku) { super("Insufficient: " + sku); }
  }
}`,
    springCode: `@Configuration
public class RedissonConfig {
  @Bean(destroyMethod = "shutdown")
  RedissonClient redissonClient() {
    Config config = new Config();
    config.useSingleServer().setAddress("redis://redis:6379");
    return Redisson.create(config);
  }
}`,
    config: `spring.redis.host: redis
redisson.lock.watchdog-timeout-ms: 30000`,
    redisCode: `Redisson manages hash structure:
{lock:inventory:SKU1}:<uuid> → reentrant count
watchdog extends TTL via internal scheduler`,
    unitTest: `@Test void watchdogExtendsLongWork() throws Exception {
  RLock lock = redisson.getLock("test");
  lock.lock(10, TimeUnit.SECONDS);
  Thread.sleep(15000); // would expire without watchdog
  assertTrue(lock.isHeldByCurrentThread());
  lock.unlock();
}`,
    integrationTest: `@SpringBootTest class RedissonLockIT { @Test void twoPodsOneReserves() {} }`,
    failureTest: `@Test void unlockFromOtherThread_illegal() {
  RLock lock = redisson.getLock("t");
  lock.lock();
  assertThrows(IllegalMonitorStateException.class, () -> otherThreadUnlock(lock));
}`,
    concurrencyTest: `@Test void reentrant_sameThread() throws Exception {
  RLock lock = redisson.getLock("r");
  lock.lock();
  lock.lock();
  lock.unlock();
  lock.unlock();
}`,
    edgeCases: [
      'unlock from wrong thread — IllegalMonitorStateException',
      'Redis master failover — lock may be lost (async replication)',
      'watchdog stops on unlock — ensure finally block',
    ],
    failureScenarios: [
      'Crash — watchdog stops; lock expires after lease',
      'Partition — split holders possible under async replication',
      'Zombie — holder alive but partitioned; TTL eventually frees',
      'Expiration — lease ends if JVM hang without thread death',
      'Split brain — two Redis primaries rare; use strong Redis deployment',
    ],
    retry: 'tryLock with wait; business retry on LockBusyException.',
    idempotency: 'Reserve operation idempotent with reservation id.',
    timeout: 'tryLock wait 5s; lease 30s with watchdog.',
    observability: 'Redisson metrics; lock_acquired_total; hold_time histogram.',
    security: 'Redis TLS + ACL; lock name includes tenant prefix.',
    performance: 'Watchdog adds periodic EXPIRE; acceptable for coarse locks.',
    scalability: 'Per-SKU locks scale; global lock does not.',
    production: 'Use Redis cluster/sentinel; document failover lock loss window.',
    mistakes: ['lock() without timeout on shutdown', 'No isHeldByCurrentThread check'],
    antiPatterns: ['Redisson lock across long external HTTP calls'],
    alternatives: ['Manual Redis lock', 'DB lock', 'etcd'],
    tradeoffs: 'Pros: mature Java API, watchdog. Cons: Redis dependency; CP limitations.',
    interviewQs: ['How does Redisson watchdog work?', 'Reentrant across JVMs?'],
    trickyQs: ['Redis failover during held lock?'],
    seniorFollowUps: ['Redisson vs etcd lock for payment orchestration'],
    deepLabHref: '/distributed-locking',
  },
  {
    id: 'lease',
    part: 11,
    name: 'Lock Lease (Time-Limited Hold)',
    frequency: 'Frequently used',
    definition:
      'Lock is valid only for lease duration; must renew or release before expiry — bounds zombie holder impact and enables crash recovery.',
    problem:
      'Infinite locks from crashed processes block resources forever; long jobs need bounded lock lifetime with renewal.',
    realWorld:
      'Chubby lease, etcd TTL keys, Redis EX, DynamoDB lock with lease attribute, S3 object lock.',
    whyExists:
      'Trade safety vs liveness: lease expiration guarantees progress even if holder fails to release.',
    ascii: `acquire lease=30s
work...
renew at 10s, 20s
release OR lease expires → others acquire`,
    flow: `stateDiagram-v2
  [*] --> Free
  Free --> Held: acquire(token, lease)
  Held --> Held: renew(same token)
  Held --> Free: release(token)
  Held --> Free: lease expired`,
    components: [
      {name: 'Lease grant', responsibility: 'Issue token + expiry timestamp.'},
      {name: 'Renewal', responsibility: 'Extend only with valid token.'},
      {name: 'Fence clock', responsibility: 'Monotonic lease generation counter optional.'},
      {name: 'Monitor', responsibility: 'Alert hold time approaching lease.'},
      {name: 'Safe release', responsibility: 'Compare token before delete.'},
    ],
    javaCode: `package com.vibhu.lock.lease;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

public final class InMemoryLeaseLock {

  private final Map<String, Lease> leases = new ConcurrentHashMap<>();
  private final Duration defaultLease;

  public InMemoryLeaseLock(Duration defaultLease) {
    this.defaultLease = defaultLease;
  }

  public Optional<LeaseToken> tryAcquire(String resource) {
    cleanupExpired(resource);
    Lease existing = leases.get(resource);
    if (existing != null && !existing.expired()) {
      return Optional.empty();
    }
    LeaseToken token = new LeaseToken(UUID.randomUUID().toString(), Instant.now().plus(defaultLease));
    leases.put(resource, new Lease(token.token(), token.expiresAt()));
    return Optional.of(token);
  }

  public boolean renew(String resource, String token, Duration extension) {
    Lease lease = leases.get(resource);
    if (lease == null || !lease.token().equals(token) || lease.expired()) {
      return false;
    }
    leases.put(resource, new Lease(token, Instant.now().plus(extension)));
    return true;
  }

  public boolean release(String resource, String token) {
    Lease lease = leases.get(resource);
    if (lease != null && lease.token().equals(token)) {
      leases.remove(resource);
      return true;
    }
    return false;
  }

  private void cleanupExpired(String resource) {
    Lease lease = leases.get(resource);
    if (lease != null && lease.expired()) leases.remove(resource);
  }

  public record LeaseToken(String token, Instant expiresAt) {}
  private record Lease(String token, Instant expiresAt) {
    boolean expired() { return Instant.now().isAfter(expiresAt); }
  }
}`,
    springCode: `@Scheduled(fixedRate = 10000)
void renewLeases() {
  for (HeldLease held : activeLeases) {
    leaseManager.renew(held.resource(), held.token(), Duration.ofSeconds(30));
  }
}`,
    config: `lock.lease.duration-seconds: 30
lock.lease.renew-interval-seconds: 10`,
    dbCode: `UPDATE distributed_locks SET expires_at = now() + interval '30 seconds', token = $2
WHERE resource = $1 AND token = $2 AND expires_at > now();`,
    unitTest: `@Test void leaseExpiresAllowsReacquire() {
  var lock = new InMemoryLeaseLock(Duration.ofMillis(100));
  var t1 = lock.tryAcquire("r").orElseThrow();
  Thread.sleep(150);
  assertTrue(lock.tryAcquire("r").isPresent());
}`,
    integrationTest: `@SpringBootTest class LeaseLockIT { @Test void renewPreventsExpiry() {} }`,
    failureTest: `@Test void renewWrongToken_fails() {
  var t = lock.tryAcquire("r").orElseThrow();
  assertFalse(lock.renew("r", "wrong", Duration.ofSeconds(30)));
}`,
    concurrencyTest: `@Test void holderRenews_underContention() throws Exception {
  var t = lock.tryAcquire("r").orElseThrow();
  runParallel(5, () -> lock.tryAcquire("r"));
  lock.renew("r", t.token(), Duration.ofSeconds(1));
  assertTrue(lock.tryAcquire("r").isEmpty());
}`,
    edgeCases: [
      'Renew fails (partition) — work continues but lock may expire',
      'Lease too short — constant renew traffic',
      'GC pause longer than lease — false expiration',
    ],
    failureScenarios: [
      'Crash — no renew; lease expires (liveness restored)',
      'Partition — holder isolated; lease expires; split work risk',
      'Zombie — slow holder after lease lost still runs',
      'Expiration — by design frees resource',
      'Split brain — two workers if zombie + new holder overlap',
    ],
    retry: 'Acquire retry after lease expiry detected.',
    idempotency: 'Critical for work continuing after lease loss.',
    timeout: 'Lease 30s; renew every 10s; max work chunk < lease.',
    observability: 'lease_expired_while_active, renew_failures, lease_hold_time.',
    security: 'Token unguessable UUID.',
    performance: 'Renewal traffic proportional to held locks.',
    scalability: 'Many short leases scale; few long leases need watchdog.',
    production: 'Stop work if renew fails 2× consecutively.',
    mistakes: ['Lease without renew for long jobs', 'Ignoring renew failure'],
    antiPatterns: ['Infinite lease TTL'],
    alternatives: ['Fencing tokens', 'DB row lock until commit'],
    tradeoffs: 'Pros: automatic recovery. Cons: overlap window; renew complexity.',
    interviewQs: ['Lease vs lock without TTL?', 'When to stop work if renew fails?'],
    trickyQs: ['GC pause exceeds lease — mitigation?'],
    seniorFollowUps: ['Lease + fencing combined design'],
    deepLabHref: '/distributed-locking',
  },
  {
    id: 'fencing-token',
    part: 11,
    name: 'Fencing Token',
    frequency: 'Rare but interview-important',
    definition:
      'Monotonically increasing token issued with lock; downstream store (DB, storage) rejects writes with stale token — prevents zombie writer after lock expired.',
    problem:
      'Redis lock expires while slow worker still running; worker writes after new holder acquired — data corruption.',
    realWorld:
      'Martin Kleppmann pattern; ZooKeeper zxid, etcd revision, dedicated fencing service, PostgreSQL compare token column.',
    whyExists:
      'Locks alone cannot fence stale writers; storage must validate token.',
    ascii: `Lock server → token=157
Worker writes: UPDATE ... WHERE fence_token < 157
Zombie token=156 → rejected`,
    flow: `sequenceDiagram
  participant L as Lock Service
  participant W1 as Slow Worker
  participant W2 as New Worker
  participant D as DB
  W1->>L: acquire → token 42
  Note over W1: lock expires
  W2->>L: acquire → token 43
  W2->>D: write fence=43 OK
  W1->>D: write fence=42 REJECT`,
    components: [
      {name: 'Token issuer', responsibility: 'Atomic increment on each lock grant.'},
      {name: 'Fenced resource', responsibility: 'DB row with fence_token column.'},
      {name: 'Write guard', responsibility: 'UPDATE only if new token > stored.'},
      {name: 'Lock service', responsibility: 'Pairs lock with token.'},
      {name: 'Audit', responsibility: 'Log rejected stale writes.'},
    ],
    javaCode: `package com.vibhu.lock.fencing;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FencedStorageService {

  private final FencingTokenIssuer issuer;
  private final JdbcTemplate jdbc;

  public FencedStorageService(FencingTokenIssuer issuer, JdbcTemplate jdbc) {
    this.issuer = issuer;
    this.jdbc = jdbc;
  }

  public long acquireToken(String resource) {
    return issuer.nextToken(resource);
  }

  @Transactional
  public boolean fencedWrite(String resourceId, long token, String newValue) {
    int updated = jdbc.update(
        "UPDATE fenced_resources SET value = ?, fence_token = ? "
            + "WHERE id = ? AND fence_token < ?",
        newValue, token, resourceId, token);
    return updated == 1;
  }

  public interface FencingTokenIssuer {
    long nextToken(String resource);
  }

  public static final class RedisFencingTokenIssuer implements FencingTokenIssuer {
    private final io.lettuce.core.api.sync.RedisCommands<String, String> redis;

    public RedisFencingTokenIssuer(io.lettuce.core.api.sync.RedisCommands<String, String> redis) {
      this.redis = redis;
    }

    @Override
    public long nextToken(String resource) {
      return redis.incr("fence:" + resource);
    }
  }
}`,
    springCode: `@Transactional
public void updateWithFence(String id, long token, String value) {
  if (!fencedStorage.fencedWrite(id, token, value)) {
    throw new StaleFenceTokenException(token);
  }
}`,
    config: `fencing.token-key-prefix: fence:`,
    dbCode: `CREATE TABLE fenced_resources (
  id VARCHAR(64) PRIMARY KEY,
  value TEXT NOT NULL,
  fence_token BIGINT NOT NULL DEFAULT 0
);
UPDATE fenced_resources SET value = $2, fence_token = $3
WHERE id = $1 AND fence_token < $3;`,
    unitTest: `@Test void staleTokenRejected() {
  long t1 = svc.acquireToken("r");
  long t2 = svc.acquireToken("r");
  assertTrue(svc.fencedWrite("res1", t2, "new"));
  assertFalse(svc.fencedWrite("res1", t1, "stale"));
}`,
    integrationTest: `@SpringBootTest class FencingIT { @Test void zombieWriteBlocked() {} }`,
    failureTest: `@Test void equalToken_notRejected() {
  long t = svc.acquireToken("r");
  assertTrue(svc.fencedWrite("res1", t, "a"));
  assertFalse(svc.fencedWrite("res1", t, "b"));
}`,
    concurrencyTest: `@Test void parallelTokens_monotonic() {
  List<Long> tokens = parallelMap(50, i -> svc.acquireToken("r"));
  assertEquals(tokens.stream().distinct().count(), 50);
}`,
    edgeCases: [
      'Token wraparound — use BIGINT',
      'Resource without fencing column — lock alone insufficient',
      'External API without token support — cannot fence',
    ],
    failureScenarios: [
      'Crash — token already issued; stale worker may still write if no fence',
      'Partition — issuer unavailable; no new tokens',
      'Zombie — fenced store rejects stale token (success case)',
      'Split brain — two tokens both valid sequentially; store picks higher',
    ],
    retry: 'On stale fence failure abort; do not retry same token.',
    idempotency: 'Same token rewrite with same value may fail second time.',
    timeout: 'Token issue <10ms; fenced UPDATE part of TX.',
    observability: 'fenced_write_rejected_count, fence_token_lag.',
    security: 'Token issuer protected; tenants isolated fence keys.',
    performance: 'Single INCR + conditional UPDATE minimal overhead.',
    scalability: 'Per-resource fence counter scales in Redis.',
    production: 'Mandatory for lock-guarded shared storage writes.',
    mistakes: ['Lock without fencing on object store', 'Using wall clock as token'],
    antiPatterns: ['Timestamp as fence token'],
    alternatives: ['Single writer leader', 'DB SERIALIZABLE'],
    tradeoffs: 'Pros: solves zombie writer. Cons: store must support check; not all APIs.',
    interviewQs: ['Why locks alone are insufficient?', 'How fencing token works?'],
    trickyQs: ['Fence S3 or Kafka?'],
    seniorFollowUps: ['Integrate fencing with lease + Redisson'],
    deepLabHref: '/distributed-locking',
  },
];

// ---------------------------------------------------------------------------
// Part 12 — Consistency models
// ---------------------------------------------------------------------------

export const CONSISTENCY_PATTERNS: PatternCard[] = [
  {
    id: 'strong-consistency',
    part: 12,
    name: 'Strong Consistency (Linearizable Reads/Writes)',
    frequency: 'Occasionally used',
    definition:
      'After write completes, all readers see the new value — typically single-leader DB with synchronous replication or distributed consensus (etcd, Spanner).',
    problem:
      'Financial balance, inventory count, or seat map must never show stale state across clients or regions.',
    realWorld:
      'PostgreSQL sync replica read, ZooKeeper, etcd, Google Spanner, CockroachDB serializable.',
    whyExists:
      'Correctness over availability for domains where stale reads cause double-spend or oversell.',
    ascii: `Writer → Leader DB → sync replicate
Reader → Leader (or sync replica)
All see write immediately after ack`,
    flow: `sequenceDiagram
  participant W as Writer
  participant L as Leader DB
  participant R as Sync Replica
  participant C as Reader
  W->>L: UPDATE x=5
  L->>R: replicate sync
  L-->>W: ack
  C->>R: SELECT → 5`,
    components: [
      {name: 'Leader', responsibility: 'Single writer node for partition.'},
      {name: 'Sync replication', responsibility: 'Replica ack before commit.'},
      {name: 'Read routing', responsibility: 'Reads from leader or sync replica only.'},
      {name: 'Serializable isolation', responsibility: 'TX isolation prevents anomalies.'},
      {name: 'Consensus', responsibility: 'Raft quorum for leader election.'},
    ],
    javaCode: `package com.vibhu.consistency.strong;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class StrongBalanceService {

  private final JdbcTemplate jdbc;

  public StrongBalanceService(JdbcTemplate jdbc) { this.jdbc = jdbc; }

  @Transactional
  public void debit(String accountId, long cents) {
    Long balance = jdbc.queryForObject(
        "SELECT balance_cents FROM accounts WHERE id = ? FOR UPDATE",
        Long.class, accountId);
    if (balance == null || balance < cents) {
      throw new IllegalStateException("Insufficient funds");
    }
    jdbc.update("UPDATE accounts SET balance_cents = balance_cents - ? WHERE id = ?",
        cents, accountId);
  }

  @Transactional(readOnly = true)
  public long readBalance(String accountId) {
    return jdbc.queryForObject(
        "SELECT balance_cents FROM accounts WHERE id = ?",
        Long.class, accountId);
  }
}`,
    springCode: `@Transactional(isolation = Isolation.SERIALIZABLE)
public void transfer(...) { ... }`,
    config: `spring.datasource.url: jdbc:postgresql://primary:5432/app
# synchronous_commit = on; no async replica reads for money`,
    dbCode: `CREATE TABLE accounts (
  id VARCHAR(64) PRIMARY KEY,
  balance_cents BIGINT NOT NULL CHECK (balance_cents >= 0)
);
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
BEGIN;
SELECT balance_cents FROM accounts WHERE id = 'a1' FOR UPDATE;
UPDATE accounts SET balance_cents = balance_cents - 100 WHERE id = 'a1';
COMMIT;`,
    unitTest: `@Test void readAfterWrite_sameSession() {
  svc.debit("a1", 50);
  assertEquals(950L, svc.readBalance("a1"));
}`,
    integrationTest: `@SpringBootTest class StrongConsistencyIT {
  @Test void syncReplicaReadMatchesLeader() {}
}`,
    failureTest: `@Test void replicaLag_notUsedForReads() {
  assertThrows(StaleReadException.class, () -> readFromAsyncReplica("a1"));
}`,
    concurrencyTest: `@Test void parallelDebit_neverNegative() {
  runParallel(20, () -> tryDebit("a1", 10));
  assertTrue(svc.readBalance("a1") >= 0);
}`,
    edgeCases: [
      'Cross-region sync replication latency hurts write p99',
      'Leader failover — brief unavailability for strong reads',
      'SERIALIZABLE serialization failures — retry TX',
    ],
    failureScenarios: [
      'Partition — CP system may reject writes (no split brain reads)',
      'Async replica read mistake — stale balance displayed',
      'Failover without fencing — rare double-write',
    ],
    retry: 'Retry TX on serialization_failure or deadlock.',
    idempotency: 'Idempotent transfer id on debit.',
    timeout: 'TX timeout 5s; failover detection <30s.',
    observability: 'replication_lag_seconds=0 for sync; serialization_failure count.',
    security: 'TLS to primary; no read from untrusted replica.',
    performance: 'Write latency includes replication RTT.',
    scalability: 'Leader bottleneck; shard accounts by id.',
    production: 'Never route money reads to async replicas.',
    mistakes: ['Read from async replica for balance', 'Multi-primary without conflict resolution'],
    antiPatterns: ['Eventual cache for authoritative balance'],
    alternatives: ['Eventual + reconciliation', 'CRDT for counters only'],
    tradeoffs: 'Pros: correct. Cons: latency, availability under partition.',
    interviewQs: ['Strong vs eventual?', 'How PostgreSQL achieves strong read?'],
    trickyQs: ['Spanner TrueTime vs PostgreSQL sync replica'],
    seniorFollowUps: ['Design strongly consistent cross-region inventory'],
  },
  {
    id: 'eventual-consistency',
    part: 12,
    name: 'Eventual Consistency',
    frequency: 'Frequently used',
    definition:
      'Replicas converge over time without guaranteeing immediate visibility — writes propagate async; reads may return stale values until replication completes.',
    problem:
      'Global low-latency reads on multi-region Cassandra, DynamoDB, or CDN cannot wait for sync replication on every write.',
    realWorld:
      'DynamoDB, Cassandra, DNS, social media feeds, S3 read-after-write exceptions noted.',
    whyExists:
      'Availability and partition tolerance; acceptable for many read-mostly domains with tolerance window.',
    ascii: `Write → Leader
async → Replica A (lag 50ms)
async → Replica B (lag 200ms)
Readers may see old value briefly`,
    flow: `sequenceDiagram
  participant W as Writer
  participant L as Leader
  participant R as Replica
  participant C as Client
  W->>L: write v2
  L-->>W: ack
  C->>R: read → v1
  Note over R: replication
  C->>R: read → v2`,
    components: [
      {name: 'Leader writer', responsibility: 'Accepts all writes for partition.'},
      {name: 'Replication log', responsibility: 'Async fanout to replicas.'},
      {name: 'Read replica', responsibility: 'Local region low-latency read.'},
      {name: 'Anti-entropy', responsibility: 'Repair divergent replicas.'},
      {name: 'Version vector', responsibility: 'Detect staleness optionally.'},
    ],
    javaCode: `package com.vibhu.consistency.eventual;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

/** Simulates leader + async replica lag (Java 21). */
public final class EventualStore {

  private final Map<String, VersionedValue> leader = new ConcurrentHashMap<>();
  private final Map<String, VersionedValue> replica = new ConcurrentHashMap<>();
  private final long replicationDelayMs;

  public EventualStore(long replicationDelayMs) {
    this.replicationDelayMs = replicationDelayMs;
    Executors.newSingleThreadScheduledExecutor().scheduleAtFixedRate(
        this::replicate, 0, 10, TimeUnit.MILLISECONDS);
  }

  public void write(String key, String value) {
    leader.put(key, new VersionedValue(value, Instant.now()));
  }

  public String readFromReplica(String key) {
    VersionedValue v = replica.get(key);
    return v == null ? null : v.value();
  }

  public String readFromLeader(String key) {
    VersionedValue v = leader.get(key);
    return v == null ? null : v.value();
  }

  private void replicate() {
    for (Map.Entry<String, VersionedValue> e : leader.entrySet()) {
      VersionedValue rep = replica.get(e.getKey());
      if (rep == null || e.getValue().writtenAt().isAfter(rep.writtenAt())) {
        long ageMs = Instant.now().toEpochMilli() - e.getValue().writtenAt().toEpochMilli();
        if (ageMs >= replicationDelayMs) {
          replica.put(e.getKey(), e.getValue());
        }
      }
    }
  }

  private record VersionedValue(String value, Instant writtenAt) {}
}`,
    springCode: `@Cacheable("profiles") // cache adds another eventual layer
public Profile getProfile(String id) { return repo.find(id); }`,
    config: `cassandra.consistency.read: LOCAL_ONE
cassandra.consistency.write: LOCAL_QUORUM`,
    dbCode: `-- Cassandra
INSERT INTO user_status (user_id, status, updated_at) VALUES (?, ?, ?);
SELECT status FROM user_status WHERE user_id = ?;  -- may lag`,
    unitTest: `@Test void replicaStaleBriefly() {
  var store = new EventualStore(100);
  store.write("k", "v2");
  assertEquals("v2", store.readFromLeader("k"));
  Thread.sleep(150);
  assertEquals("v2", store.readFromReplica("k"));
}`,
    integrationTest: `@SpringBootTest class EventualIT { @Test void convergenceAfterLag() {} }`,
    failureTest: `@Test void permanentReplicationFailure_divergence() {
  replica.fail();
  assertNotEquals(leader.get(), replica.get()); // until repair
}`,
    concurrencyTest: `@Test void concurrentWrites_lastWriterWins() {
  runParallel(10, i -> store.write("k", "v" + i));
  await().until(() -> store.readFromReplica("k") != null);
}`,
    edgeCases: [
      'Read-your-writes not guaranteed on replica',
      'Causal ordering needs version vectors',
      'Delete tombstone propagation delay',
    ],
    failureScenarios: [
      'Replica never catches up — monitor lag',
      'Split brain multi-master — divergent merges',
      'User sees own write then stale — UX confusion',
    ],
    retry: 'Client refresh after write; poll until version matches.',
    idempotency: 'Versioned writes help dedupe.',
    timeout: 'Accept staleness SLA e.g. 500ms p99 lag.',
    observability: 'replication_lag_ms, replica_staleness_histogram.',
    security: 'Encrypted replication stream.',
    performance: 'Local replica reads fast; writes not blocked by remote sync.',
    scalability: 'Horizontal replicas; multi-region.',
    production: 'Display "updating..." UI; CQRS read models async.',
    mistakes: ['Assuming immediate global read after write', 'No lag monitoring'],
    antiPatterns: ['Eventual for inventory without oversell guard'],
    alternatives: ['Strong consistency', 'Causal consistency'],
    tradeoffs: 'Pros: available, fast reads. Cons: stale reads; complex mental model.',
    interviewQs: ['Define eventual consistency', 'CAP tradeoff?'],
    trickyQs: ['DynamoDB read-after-write consistency scope'],
    seniorFollowUps: ['SLA for max replication lag in product'],
  },
  {
    id: 'read-your-writes',
    part: 12,
    name: 'Read-Your-Writes Consistency',
    frequency: 'Frequently used',
    definition:
      'A client always sees its own prior writes — session sticks to leader or tracks session version, while other clients may still see stale data.',
    problem:
      'User updates profile photo then sees old avatar on refresh because read hit lagging replica.',
    realWorld:
      'DynamoDB session token, Cassandra LOCAL_SERIAL, sticky sessions to primary, client-side version cookie.',
    whyExists:
      'Balances UX (user trusts own actions) with eventual replication for scale.',
    ascii: `User writes → route to leader
User reads → same leader OR version >= write_version
Other users → replicas ok`,
    flow: `sequenceDiagram
  participant U as User Session
  participant API
  participant L as Leader
  participant R as Replica
  U->>API: POST profile
  API->>L: write v5
  U->>API: GET profile
  API->>L: read (sticky)
  API-->>U: v5`,
    components: [
      {name: 'Session stickiness', responsibility: 'Route same user to writer node.'},
      {name: 'Version cookie', responsibility: 'Client sends last_write_version.'},
      {name: 'Monotonic read guard', responsibility: 'Reject read if replica version < session.'},
      {name: 'Write marker', responsibility: 'Session store of recent writes.'},
      {name: 'Load balancer', responsibility: 'Affinity by session id.'},
    ],
    javaCode: `package com.vibhu.consistency.ryw;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public final class ReadYourWritesRouter {

  private final Map<String, Long> sessionWriteVersion = new ConcurrentHashMap<>();
  private final LeaderStore leader;
  private final ReplicaStore replica;

  public ReadYourWritesRouter(LeaderStore leader, ReplicaStore replica) {
    this.leader = leader;
    this.replica = replica;
  }

  public void write(String sessionId, String key, String value) {
    long version = leader.write(key, value);
    sessionWriteVersion.put(sessionId, version);
  }

  public String read(String sessionId, String key) {
    Long minVersion = sessionWriteVersion.get(sessionId);
    if (minVersion != null) {
      return leader.read(key, minVersion);
    }
    return replica.read(key);
  }

  public interface LeaderStore {
    long write(String key, String value);
    String read(String key, long minVersion);
  }

  public interface ReplicaStore {
    String read(String key);
  }
}`,
    springCode: `@RequestHeader("X-Session-Id") String sessionId
public Profile getProfile(String id, String sessionId) {
  return rywRouter.read(sessionId, id);
}`,
    config: `lb.session.affinity: cookie JSESSIONID
dynamodb.consistent-read: true # for session table`,
    dbCode: `CREATE TABLE user_sessions (
  session_id VARCHAR(128) PRIMARY KEY,
  last_write_version BIGINT NOT NULL DEFAULT 0
);
-- read path: if replica.version < session.last_write_version → read leader`,
    unitTest: `@Test void userSeesOwnWrite() {
  router.write("sess1", "profile", "new");
  assertEquals("new", router.read("sess1", "profile"));
}`,
    integrationTest: `@SpringBootTest class RywIT { @Test void stickySessionRead() {} }`,
    failureTest: `@Test void otherSessionMaySeeStale() {
  router.write("sess1", "k", "v1");
  assertNotEquals("v1", router.read("sess2", "k")); // may stale
}`,
    concurrencyTest: `@Test void parallelSessions_isolated() {
  runParallel(10, i -> {
    String s = "s" + i;
    router.write(s, "k", "v" + i);
    assertEquals("v" + i, router.read(s, "k"));
  });
}`,
    edgeCases: [
      'Session affinity lost on redeploy — fall back to leader read',
      'Mobile app multiple devices — per-device session',
      'Write version not updated on failed write',
    ],
    failureScenarios: [
      'Sticky cookie ignored — user sees stale own read',
      'Leader down — forced replica breaks RYW',
      'Session store lost — version tracking reset',
    ],
    retry: 'On stale self-read retry from leader.',
    idempotency: 'Write version monotonic per key.',
    timeout: 'Leader read fallback 2s.',
    observability: 'ryw_leader_read_fallback_count.',
    security: 'Session id signed; prevent session fixation.',
    performance: 'Extra leader reads for active writers only.',
    scalability: 'Most reads still on replicas for other users.',
    production: 'CDN bypass for author viewing own content.',
    mistakes: ['Global eventual without RYW for profile edits'],
    antiPatterns: ['Random LB for post-write reads'],
    alternatives: ['Strong consistency everywhere', 'Client-side cache of own writes'],
    tradeoffs: 'Pros: good UX cheaply. Cons: session infra; not global linearizable.',
    interviewQs: ['RYW vs strong consistency?', 'How implement with DynamoDB?'],
    trickyQs: ['RYW across logout/login same user'],
    seniorFollowUps: ['RYW in multi-tab SPA with edge CDN'],
  },
  {
    id: 'monotonic-reads',
    part: 12,
    name: 'Monotonic Reads',
    frequency: 'Occasionally used',
    definition:
      'If a client reads value v2, it will never subsequently read v1 for same key — reads move forward in time, never backward.',
    problem:
      'Load balancer alternates between replica A (fresh) and B (stale) — user sees flickering UI state.',
    realWorld:
      'Sticky replica reads, versioned responses, Cassandra LOCAL_ONE with same coordinator.',
    whyExists:
      'Prevents confusing time-travel UX without requiring full strong consistency.',
    ascii: `Read1 → replica v2
Read2 → must not return v1
sticky replica OR version check`,
    flow: `sequenceDiagram
  participant C as Client
  participant LB
  participant R1 as Replica Fresh
  participant R2 as Replica Stale
  C->>LB: read
  LB->>R1: v2
  C->>LB: read
  LB->>R1: sticky same replica
  Note over LB,R2: avoid R2`,
    components: [
      {name: 'Replica stickiness', responsibility: 'Same backend for session reads.'},
      {name: 'Version field', responsibility: 'Client rejects lower version.'},
      {name: 'Coordinator', responsibility: 'Cassandra coordinator tracks seen generation.'},
      {name: 'LB affinity', responsibility: 'Replica-level stickiness.'},
      {name: 'Read repair', responsibility: 'Background freshness improvement.'},
    ],
    javaCode: `package com.vibhu.consistency.monotonic;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public final class MonotonicReadClient {

  private final Map<String, Long> lastSeenVersion = new ConcurrentHashMap<>();
  private final VersionedReplicaPool replicas;

  public MonotonicReadClient(VersionedReplicaPool replicas) {
    this.replicas = replicas;
  }

  public String read(String key) {
    long minVersion = lastSeenVersion.getOrDefault(key, 0L);
    VersionedEntry entry = replicas.readAtLeast(key, minVersion);
    if (entry.version() < minVersion) {
      throw new IllegalStateException("Monotonic violation");
    }
    lastSeenVersion.merge(key, entry.version(), Math::max);
    return entry.value();
  }

  public record VersionedEntry(String value, long version) {}

  public interface VersionedReplicaPool {
    VersionedEntry readAtLeast(String key, long minVersion);
  }
}`,
    springCode: `public VersionedDto read(String key) {
  long min = clientState.getVersion(key);
  VersionedDto dto = pool.readAtLeast(key, min);
  clientState.updateVersion(key, dto.version());
  return dto;
}`,
    config: `nginx proxy_set_header X-Replica-Sticky $cookie_replica_id;`,
    dbCode: `SELECT value, version FROM documents WHERE id = $1 AND version >= $2;`,
    unitTest: `@Test void neverReturnsOlderVersion() {
  replicas.put("k", new VersionedEntry("v1", 1));
  client.read("k");
  replicas.put("k", new VersionedEntry("v2", 2));
  client.read("k");
  replicas.simulateStale("k", new VersionedEntry("v1", 1));
  assertEquals("v2", client.read("k"));
}`,
    integrationTest: `@SpringBootTest class MonotonicReadIT { @Test void noFlicker() {} }`,
    failureTest: `@Test void poolReturnsStale_throwsOrRetries() {
  pool.forceStale();
  assertThrows(IllegalStateException.class, () -> client.read("k"));
}`,
    concurrencyTest: `@Test void parallelReads_monotonicPerKey() {
  runParallel(20, () -> client.read("k"));
  assertTrue(client.lastVersion("k") >= 1);
}`,
    edgeCases: [
      'Different keys independent monotonic tracks',
      'Delete then read — tombstone version',
      'Client restart loses version — may see older once',
    ],
    failureScenarios: [
      'Sticky replica fails — new replica may be behind once',
      'Version not in API response — client cannot enforce',
      'Clock-based versions unsafe',
    ],
    retry: 'Retry read from fresher replica on version gap.',
    idempotency: 'Read-only concern.',
    timeout: 'Retry read 2× with 50ms.',
    observability: 'monotonic_violation_count (should be 0).',
    security: 'Version metadata not secret.',
    performance: 'Sticky replica may be hotter.',
    scalability: 'Per-session state small.',
    production: 'Always return version field in API.',
    mistakes: ['Round-robin replicas without version'],
    antiPatterns: ['Random replica per read for same session'],
    alternatives: ['Strong consistency', 'RYW only'],
    tradeoffs: 'Pros: no flicker. Cons: stickiness; one-time regression on failover.',
    interviewQs: ['Monotonic reads vs RYW?', 'How enforce without sticky?'],
    trickyQs: ['Monotonic across list pagination'],
    seniorFollowUps: ['Vector clocks for monotonic without stickiness'],
  },
  {
    id: 'optimistic-locking',
    part: 12,
    name: 'Optimistic Locking (Version Column)',
    frequency: 'Frequently used',
    definition:
      'Read entity with version; update succeeds only if version unchanged at commit — UPDATE ... WHERE id=? AND version=?; conflict throws OptimisticLockException.',
    problem:
      'Two editors save document concurrently — last write wins loses edits without detection.',
    realWorld:
      'JPA @Version, Hibernate optimistic locking, DynamoDB conditional updates, etcd compare-and-swap.',
    whyExists:
      'Avoid long DB locks; good for low-contention aggregates; conflicts rare and retryable.',
    ascii: `READ version=3
TX A: UPDATE WHERE version=3 → ok v4
TX B: UPDATE WHERE version=3 → 0 rows conflict`,
    flow: `sequenceDiagram
  participant A as TX A
  participant B as TX B
  participant D as DB
  A->>D: read v=3
  B->>D: read v=3
  A->>D: update v=4
  D-->>A: ok
  B->>D: update where v=3
  D-->>B: conflict`,
    components: [
      {name: '@Version field', responsibility: 'JPA auto-increment on success.'},
      {name: 'Conditional UPDATE', responsibility: 'SQL WHERE version match.'},
      {name: 'Retry policy', responsibility: 'Reload and merge on conflict.'},
      {name: 'Conflict mapper', responsibility: 'Map to 409 HTTP.'},
      {name: 'Merge strategy', responsibility: 'UI three-way merge optional.'},
    ],
    javaCode: `package com.vibhu.consistency.optimistic;

import jakarta.persistence.*;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Entity
@Table(name = "documents")
public class Document {
  @Id private String id;
  private String content;
  @Version private long version;

  public String id() { return id; }
  public String content() { return content; }
  public void setContent(String c) { this.content = c; }
  public long version() { return version; }
}

@Service
public class DocumentOptimisticService {

  private final DocumentRepository repo;

  public DocumentOptimisticService(DocumentRepository repo) { this.repo = repo; }

  @Transactional
  public Document updateWithRetry(String id, String newContent, int maxAttempts) {
    for (int attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        Document doc = repo.findById(id).orElseThrow();
        doc.setContent(newContent);
        return repo.save(doc);
      } catch (OptimisticLockingFailureException ex) {
        if (attempt == maxAttempts) throw ex;
      }
    }
    throw new IllegalStateException("unreachable");
  }

  public interface DocumentRepository extends org.springframework.data.jpa.repository.JpaRepository<Document, String> {}
}`,
    springCode: `@Version
private Long version;

@Retryable(retryFor = OptimisticLockingFailureException.class, maxAttempts = 3)
public Document save(Document d) { return repo.save(d); }`,
    config: `spring.jpa.properties.hibernate.jdbc.batch_versioned_data: true`,
    dbCode: `CREATE TABLE documents (
  id VARCHAR(64) PRIMARY KEY,
  content TEXT NOT NULL,
  version BIGINT NOT NULL DEFAULT 0
);
UPDATE documents SET content = $2, version = version + 1
WHERE id = $1 AND version = $3;
-- 0 rows → optimistic lock conflict`,
    unitTest: `@Test void concurrentUpdate_secondFails() {
  Document d = repo.save(new Document("1", "a"));
  Document copy = repo.findById("1").orElseThrow();
  d.setContent("b");
  repo.save(d);
  copy.setContent("c");
  assertThrows(OptimisticLockingFailureException.class, () -> repo.save(copy));
}`,
    integrationTest: `@DataJpaTest class OptimisticLockIT { @Test void versionIncrements() {} }`,
    failureTest: `@Test void retrySucceedsAfterConflict() {
  svc.updateWithRetry("1", "final", 3);
}`,
    concurrencyTest: `@Test void manyRetries_eventuallyOneWins() {
  runParallel(10, i -> tryUpdate("doc", "v" + i));
  assertNotNull(repo.findById("doc"));
}`,
    edgeCases: [
      'Bulk update bypasses version — dangerous',
      'Detached entity stale version',
      'JSON API must return version to client',
    ],
    failureScenarios: [
      'High contention — retry storm',
      'Lost update if catch exception and ignore',
      'Version null on manual SQL update',
    ],
    retry: 'Reload-merge-retry 3× with backoff.',
    idempotency: 'Same version retry after success fails — client must refresh version.',
    timeout: 'TX short; retry total 2s.',
    observability: 'optimistic_lock_conflict_count by entity.',
    security: 'Version not authorization — still check owner.',
    performance: 'No lock wait; failed UPDATE cheap.',
    scalability: 'Scales with low conflict rate.',
    production: 'Return 409 + current version in error body.',
    mistakes: ['@Version on wrong field', 'No client-side version in PUT'],
    antiPatterns: ['Optimistic on hot counter without atomic increment'],
    alternatives: ['Pessimistic lock', 'CRDT', 'DB atomic UPDATE'],
    tradeoffs: 'Pros: no lock hold. Cons: conflicts need UX; hot row pain.',
    interviewQs: ['Optimistic vs pessimistic?', 'JPA @Version behavior?'],
    trickyQs: ['Optimistic locking lost updates scenario'],
    seniorFollowUps: ['Hybrid: optimistic + domain merge policy'],
  },
  {
    id: 'pessimistic-locking',
    part: 12,
    name: 'Pessimistic Locking (FOR UPDATE)',
    frequency: 'Frequently used',
    definition:
      'Acquire DB row lock before read-modify-write — blocks concurrent transactions until commit; JPA LockModeType.PESSIMISTIC_WRITE.',
    problem:
      'High-contention seat booking or wallet debit — optimistic retries explode under load.',
    realWorld:
      'Ticketmaster seat hold, bank ledger, inventory row lock, JPA @Lock(PESSIMISTIC_WRITE).',
    whyExists:
      'Deterministic serialization of conflicting TX; no lost update when contention is expected.',
    ascii: `TX1: SELECT FOR UPDATE → holds row lock
TX2: SELECT FOR UPDATE → waits
TX1: COMMIT
TX2: acquires → proceeds`,
    flow: `sequenceDiagram
  participant T1 as TX1
  participant T2 as TX2
  participant D as DB
  T1->>D: SELECT FOR UPDATE
  T2->>D: SELECT FOR UPDATE
  Note over T2,D: blocked
  T1->>D: UPDATE COMMIT
  T2->>D: lock granted`,
    components: [
      {name: 'PESSIMISTIC_WRITE', responsibility: 'JPA explicit row lock.'},
      {name: 'Lock timeout', responsibility: 'lock_timeout session var.'},
      {name: 'Deadlock detector', responsibility: 'DB aborts one TX.'},
      {name: 'Ordered locking', responsibility: 'Lock rows in sorted id order.'},
      {name: 'Skip locked', responsibility: 'Queue workers alternative.'},
    ],
    javaCode: `package com.vibhu.consistency.pessimistic;

import jakarta.persistence.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Entity
@Table(name = "seats")
public class Seat {
  @Id private String id;
  private String status;
  public String id() { return id; }
  public String status() { return status; }
  public void reserve() { this.status = "RESERVED"; }
}

@Service
public class SeatBookingService {

  private final SeatRepository repo;

  public SeatBookingService(SeatRepository repo) { this.repo = repo; }

  @Transactional
  public void bookSeat(String seatId, String userId) {
    Seat seat = repo.findByIdForUpdate(seatId)
        .orElseThrow(() -> new IllegalArgumentException(seatId));
    if (!"AVAILABLE".equals(seat.status())) {
      throw new SeatTakenException(seatId);
    }
    seat.reserve();
    repo.save(seat);
    // insert booking record
  }

  public static class SeatTakenException extends RuntimeException {
    SeatTakenException(String id) { super("Seat taken: " + id); }
  }

  public interface SeatRepository {
    java.util.Optional<Seat> findByIdForUpdate(String id);
    Seat save(Seat seat);
  }
}`,
    springCode: `@Lock(LockModeType.PESSIMISTIC_WRITE)
@Query("SELECT s FROM Seat s WHERE s.id = :id")
Optional<Seat> findByIdForUpdate(@Param("id") String id);`,
    config: `spring.jpa.properties.jakarta.persistence.lock.timeout: 5000
# PostgreSQL: SET lock_timeout = '5s'`,
    dbCode: `BEGIN;
SELECT status FROM seats WHERE id = 'A1' FOR UPDATE;
UPDATE seats SET status = 'RESERVED' WHERE id = 'A1';
INSERT INTO bookings (seat_id, user_id) VALUES ('A1', 'user42');
COMMIT;`,
    unitTest: `@Test void secondBookerBlockedUntilCommit() {
  TransactionTemplate tx = new TransactionTemplate(tm);
  tx.execute(s -> { svc.bookSeat("A1", "u1"); return null; });
  assertThrows(SeatTakenException.class, () -> svc.bookSeat("A1", "u2"));
}`,
    integrationTest: `@DataJpaTest class PessimisticLockIT { @Test void lockTimeout() {} }`,
    failureTest: `@Test void lockTimeout_exception() {
  holdLock();
  assertThrows(PessimisticLockException.class, () -> svc.bookSeat("A1", "u2"));
}`,
    concurrencyTest: `@Test void tenBookers_oneSeat_oneWinner() {
  Set<String> winners = concurrentTryBook("A1", 10);
  assertEquals(1, winners.size());
}`,
    edgeCases: [
      'Deadlock two seats two users — lock ordering',
      'Long TX with lock — blocks all competitors',
      'Connection pool starvation under lock wait',
    ],
    failureScenarios: [
      'Deadlock — one TX aborted retry',
      'Lock timeout — client retry',
      'Crash — lock released on disconnect',
      'Partition — primary unavailable',
    ],
    retry: 'Retry on deadlock or lock_timeout once.',
    idempotency: 'Booking id unique constraint prevents double book.',
    timeout: 'lock_timeout 5s; TX 8s max.',
    observability: 'lock_wait_time, deadlock_count.',
    security: 'App user cannot bypass lock via raw SQL.',
    performance: 'Serializes hot row — intentional.',
    scalability: 'Shard seats by show id.',
    production: 'Minimize work inside locked TX.',
    mistakes: ['FOR UPDATE on non-indexed column', 'Global order lock'],
    antiPatterns: ['Pessimistic lock then call external API'],
    alternatives: ['Optimistic', 'Redis lock + fence', 'Queue single consumer'],
    tradeoffs: 'Pros: predictable under contention. Cons: blocking; deadlock risk.',
    interviewQs: ['When pessimistic over optimistic?', 'FOR UPDATE SKIP LOCKED?'],
    trickyQs: ['Pessimistic across microservices'],
    seniorFollowUps: ['Seat map: row lock vs partition lock'],
  },
];

// ---------------------------------------------------------------------------
// Part 13 — Service mesh
// ---------------------------------------------------------------------------

export const MESH_PATTERNS: PatternCard[] = [
  {
    id: 'sidecar-envoy-istio',
    part: 13,
    name: 'Service Mesh — Sidecar · Envoy · Istio',
    frequency: 'Frequently used',
    definition:
      'Each workload pod runs an Envoy sidecar injected by Istio; L4/L7 traffic, mTLS, retries, circuit breaking, traffic splits, and telemetry are configured via Mesh APIs (VirtualService, DestinationRule) without app code changes.',
    problem:
      'Dozens of microservices each implement retries, TLS, timeouts, and canary routing inconsistently — operational burden and security gaps at every hop.',
    realWorld:
      'Istio on GKE/EKS, Linkerd, AWS App Mesh, internal platform teams standardizing east-west traffic on Kubernetes.',
    whyExists:
      'Offloads connectivity concerns to data plane (Envoy) + control plane (Istiod); uniform policy, observability, and zero-trust mTLS across fleet.',
    ascii: `┌──────── Pod ────────────────┐
│ App container               │
│      ↕ localhost            │
│ Envoy sidecar (istio-proxy) │
└──────────┬──────────────────┘
           mTLS
┌──────── Pod ────────────────┐
│ Envoy → App                 │
└─────────────────────────────┘
Istiod → xDS config → Envoy`,
    flow: `sequenceDiagram
  participant A as App A + Envoy
  participant I as Istiod
  participant B as App B + Envoy
  I->>A: VirtualService retry+split
  I->>B: DestinationRule mTLS+CB
  A->>B: mTLS HTTP (via sidecar)
  Note over A,B: OTel spans auto-generated`,
    components: [
      {name: 'Sidecar proxy (Envoy)', responsibility: 'Intercept all pod traffic via iptables/eBPF redirect.'},
      {name: 'Istiod (control plane)', responsibility: 'Push xDS: clusters, routes, listeners, secrets.'},
      {name: 'VirtualService', responsibility: 'Routing, retries, timeouts, traffic splits, fault injection.'},
      {name: 'DestinationRule', responsibility: 'mTLS mode, subsets, connection pool, outlier detection (CB).'},
      {name: 'PeerAuthentication', responsibility: 'STRICT mTLS policy cluster-wide or per namespace.'},
      {name: 'Telemetry', responsibility: 'Access logs, Prometheus metrics, distributed tracing headers.'},
    ],
    javaCode: `package com.vibhu.mesh.app;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Mesh-enabled app: no retry/TLS code here — Envoy sidecar handles L7 policy.
 * Java 21 + Spring Boot 3. Outbound calls use cluster DNS; iptables redirects to sidecar.
 */
@SpringBootApplication
public class OrderServiceApplication {
  public static void main(String[] args) {
    SpringApplication.run(OrderServiceApplication.class, args);
  }
}

@RestController
class OrderController {
  private final PaymentClient payments;

  OrderController(PaymentClient payments) { this.payments = payments; }

  @GetMapping("/orders/{id}")
  OrderDto getOrder(String id) {
    PaymentStatus status = payments.status(id);
    return new OrderDto(id, status.state());
  }

  record OrderDto(String orderId, String paymentState) {}
  record PaymentStatus(String state) {}
}

/** Plain RestClient — mesh adds mTLS + retry via VirtualService, not Java code. */
class PaymentClient {
  private final org.springframework.web.client.RestClient client =
      org.springframework.web.client.RestClient.builder()
          .baseUrl("http://payment-service.default.svc.cluster.local")
          .build();

  PaymentStatus status(String orderId) {
    return client.get()
        .uri("/payments/{id}/status", orderId)
        .retrieve()
        .body(PaymentStatus.class);
  }
}`,
    springCode: `management.endpoints.web.exposure.include: health,prometheus
management.tracing.sampling.probability: 1.0
# App trusts mesh — no custom RestTemplate retry beans needed`,
    config: `# Namespace: label for sidecar injection
apiVersion: v1
kind: Namespace
metadata:
  name: production
  labels:
    istio-injection: enabled
---
# STRICT mTLS — sidecar encrypts all east-west
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: default
  namespace: production
spec:
  mtls:
    mode: STRICT
---
# Canary: 90% v1 / 10% v2 + retries + timeout
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: payment-service
  namespace: production
spec:
  hosts:
    - payment-service
  http:
    - timeout: 3s
      retries:
        attempts: 3
        perTryTimeout: 1s
        retryOn: 5xx,reset,connect-failure,refused-stream
      route:
        - destination:
            host: payment-service
            subset: v1
          weight: 90
        - destination:
            host: payment-service
            subset: v2
          weight: 10
---
# Subsets + circuit breaker (outlier detection) + connection pool
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: payment-service
  namespace: production
spec:
  host: payment-service
  trafficPolicy:
    connectionPool:
      tcp:
        maxConnections: 100
      http:
        http1MaxPendingRequests: 50
        maxRequestsPerConnection: 2
    outlierDetection:
      consecutive5xxErrors: 5
      interval: 10s
      baseEjectionTime: 30s
      maxEjectionPercent: 50
  subsets:
    - name: v1
      labels:
        version: v1
    - name: v2
      labels:
        version: v2
---
# Deployment with sidecar (injected automatically when namespace labeled)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: payment-service-v1
  namespace: production
spec:
  replicas: 3
  selector:
    matchLabels:
      app: payment-service
      version: v1
  template:
    metadata:
      labels:
        app: payment-service
        version: v1
    spec:
      containers:
        - name: payment
          image: payment:1.0.0
          ports:
            - containerPort: 8080
---
# Observability: mesh generates metrics/traces
apiVersion: telemetry.istio.io/v1alpha1
kind: Telemetry
metadata:
  name: mesh-telemetry
  namespace: production
spec:
  tracing:
    - providers:
        - name: otel
  metrics:
    - providers:
        - name: prometheus`,
    restApi: `GET /orders/{id}           — ingress via Istio Gateway
GET /payments/{id}/status  — east-west via sidecar mTLS
# Headers auto: x-request-id, traceparent (W3C)`,
    kafkaCode: `# Mesh focuses HTTP/gRPC; Kafka often uses separate mesh (e.g. Strimzi TLS)
# or sidecar egress exclusion for broker ports — document broker TLS separately`,
    dbCode: `# Mesh does not proxy DB traffic — app connects directly to PostgreSQL
# Keep DB credentials in K8s Secret; network policy restricts postgres:5432`,
    redisCode: `# Optional: exclude Redis port from sidecar capture if using standalone Redis
# annotation: traffic.sidecar.istio.io/excludeOutboundPorts: "6379"`,
    unitTest: `@Test void appStartsWithoutMeshCode() {
  var ctx = SpringApplication.run(OrderServiceApplication.class,
      "--spring.main.web-application-type=none");
  assertNotNull(ctx.getBean(OrderController.class));
}`,
    integrationTest: `@SpringBootTest(webEnvironment = RANDOM_PORT)
class OrderMeshIT {
  @Test void orderEndpointReturns200() {
    given().get("/orders/o1").then().statusCode(200);
  }
}`,
    failureTest: `@Test void paymentDown_orderReturnsDegraded() {
  paymentService.stop();
  assertThat(orderClient.get("o1").paymentState()).isEqualTo("UNKNOWN");
}`,
    concurrencyTest: `@Test void concurrentOrders_meshHandlesRetries() {
  runParallel(50, () -> orderClient.get("o-" + ThreadLocalRandom.current().nextInt(1000)));
}`,
    edgeCases: [
      'Headless Service + StatefulSet — subset routing still works via labels',
      'Sidecar startup race — hold app until proxy ready (holdApplicationUntilProxyStarts)',
      'Outbound traffic to external SaaS — need ServiceEntry + egress policy',
      'gRPC vs HTTP2 — Envoy routes both; ensure app protocol declared',
    ],
    failureScenarios: [
      'Istiod down — existing Envoy config remains; no new updates',
      'mTLS STRICT + missing sidecar — connection refused (fail secure)',
      'Canary mis-config — 100% to broken subset until rollback',
      'CB ejects all endpoints — 503 until outlier window resets',
      'Retry storm on slow dependency — cap attempts in VirtualService',
      'Partition — split control plane delays policy convergence',
    ],
    retry: 'VirtualService retries: 3 attempts, perTryTimeout 1s, retryOn 5xx/connect-failure. App must be idempotent.',
    idempotency: 'Payment status GET idempotent; write APIs need idempotency keys — retries safe.',
    timeout: 'VirtualService route timeout 3s; ingress Gateway 30s for user-facing.',
    observability: 'istio_requests_total, request_duration histogram, distributed tracing via OTel/Jaeger, access logs to Loki.',
    security: 'STRICT mTLS SPIFFE identities; AuthorizationPolicy deny-by-default; JWT at Gateway for north-south.',
    performance: 'Sidecar adds ~1–3ms p99 latency; CPU ~0.1 vCPU per proxy at moderate QPS.',
    scalability: 'Horizontal pod scaling; Istiod sharded for 1000+ services; localize config scope per namespace.',
    production: 'Progressive delivery: Flagger or Argo Rollouts + Istio weights; monitor golden signals per subset.',
    mistakes: [
      'Retry in both Java and VirtualService — multiplied attempts',
      'PERMISSIVE mTLS in prod — downgrade attack surface',
      'No holdApplicationUntilProxyStarts — startup 503s',
      'Forgot subset labels on Deployment',
    ],
    antiPatterns: [
      'Fat sidecar config per app in code instead of mesh CRDs',
      'Mesh for batch jobs hitting DB only',
      'Infinite retries without budget',
    ],
    alternatives: ['Library resilience (Resilience4j)', 'API Gateway only north-south', 'Linkerd lighter mesh'],
    tradeoffs:
      'Pros: uniform policy, mTLS, observability without library sprawl. Cons: operational complexity, latency, Istiod dependency, debugging harder.',
    interviewQs: [
      'What does an Envoy sidecar do?',
      'VirtualService vs DestinationRule?',
      'How does Istio mTLS work?',
      'Canary release with Istio weights?',
    ],
    trickyQs: [
      'Sidecar vs node-level proxy (Cilium)?',
      'Why exclude Kafka/DB from sidecar capture?',
      'Retry at mesh vs app — who owns idempotency?',
    ],
    seniorFollowUps: [
      'Design multi-cluster Istio failover with locality-weighted LB',
      'Mesh upgrade strategy without draining entire fleet',
      'AuthorizationPolicy for multi-tenant SaaS namespaces',
    ],
  },
];
