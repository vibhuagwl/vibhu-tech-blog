import type {CacheTopic} from './types';

export const TOPICS_D: CacheTopic[] = [
  {
    id: 'failures',
    title: 'Redis Failure Modes',
    badge: 'Resilience',
    problem: 'Redis down/slow must not take payments offline.',
    whenToUse: 'Always design fail-open for cache tier.',
    whenAvoid: 'Fail-closed cache for optional acceleration paths.',
    mermaid: `flowchart TD
  APP --> R{Redis}
  R -->|OK| HIT
  R -->|DOWN| DB[(DB fallback)]
  R -->|SLOW| CB[Circuit breaker] --> DB`,
    code: `@Component
public class FailOpenCacheErrorHandler implements CacheErrorHandler {
  public void handleCacheGetError(RuntimeException e, Cache c, Object key) {
    log.warn("cache get failed key={}", key, e);
  }
  public void handleCachePutError(RuntimeException e, Cache c, Object key, Object val) {
    log.warn("cache put failed key={}", key, e);
  }
  public void handleCacheEvictError(RuntimeException e, Cache c, Object key) {
    log.warn("cache evict failed key={}", key, e);
  }
  public void handleCacheClearError(RuntimeException e, Cache c) {
    log.warn("cache clear failed", e);
  }
}
// Also: lettuce timeouts, Resilience4j CB, bulkhead thread pool`,
    failure: 'Infinite wait on Redis → Tomcat threads exhausted → total outage.',
    production: 'Timeouts + CB + fail-open + DB rate limit after Redis loss.',
    interview30s: 'Cache is acceleration; protect threads; degrade to DB with shed.',
    followUp: 'When is fail-closed correct?',
    tradeoff: 'Availability vs possibly higher DB load.',
    memoryTrick: 'Cache broken → take stairs, don\'t halt building.',
  },
  {
    id: 'config',
    title: 'Spring Boot Production Configuration',
    badge: 'Spring',
    problem: 'Need wired CacheManager, serializers, pools, TTLs.',
    whenToUse: 'Every Spring Boot cache rollout.',
    whenAvoid: 'Default JDK serializer + infinite TTL.',
    mermaid: `flowchart TB
  YML[application.yml] --> CF[ConnectionFactory]
  CF --> RT[RedisTemplate]
  CF --> CM[RedisCacheManager]
  CAF[CaffeineCacheManager] --> L1
  CM --> L2`,
    code: `# application.yml
spring:
  data:
    redis:
      host: redis
      port: 6379
      timeout: 200ms
      lettuce:
        pool:
          max-active: 32
          max-idle: 16
  cache:
    type: redis
    redis:
      time-to-live: 5m
      key-prefix: "pay:"
      cache-null-values: false

@Configuration
@EnableCaching
public class CacheConfig {
  @Bean
  CacheManager cacheManager(RedisConnectionFactory f) {
    RedisCacheConfiguration cfg = RedisCacheConfiguration.defaultCacheConfig()
      .entryTtl(Duration.ofMinutes(5))
      .serializeValuesWith(RedisSerializationContext.SerializationPair
        .fromSerializer(new GenericJackson2JsonRedisSerializer()));
    return RedisCacheManager.builder(f).cacheDefaults(cfg).build();
  }
}`,
    failure: 'No timeout → hang. Shared prefix collisions across apps.',
    production: 'Per-cache TTLs, JSON ser, metrics, prefixes with service name.',
    interview30s: '@EnableCaching + RedisCacheManager + Lettuce pool + TTL + JSON.',
    followUp: 'Multiple CacheManagers L1/L2?',
    tradeoff: 'Convention vs explicit MultiCacheManager.',
    memoryTrick: 'Config = seatbelts before highway.',
  },
  {
    id: 'customization',
    title: 'KeyGenerator / CacheResolver / ErrorHandler',
    badge: 'Spring',
    problem: 'Default key = params only; multi-tenant needs tenant+id+region.',
    whenToUse: 'Composite keys, dynamic cache names, fail-open errors.',
    whenAvoid: 'Over-customizing when SpEL key suffices.',
    mermaid: `flowchart LR
  CALL[method call] --> KG[KeyGenerator]
  KG --> CR[CacheResolver]
  CR --> CM[CacheManager]
  CM --> EH[CacheErrorHandler]`,
    code: `@Component("tenantKeyGen")
public class TenantKeyGenerator implements KeyGenerator {
  public Object generate(Object target, Method method, Object... params) {
    String tenant = TenantContext.get();
    return tenant + ":" + Arrays.deepToString(params);
  }
}

@Cacheable(cacheNames = "customers", keyGenerator = "tenantKeyGen")
public Customer get(String customerId) { ... }`,
    failure: 'Missing tenant in key → cross-tenant leak.',
    production: 'Mandatory tenant prefix; tests for isolation.',
    interview30s: 'Custom KeyGenerator for tenant/region; ErrorHandler fail-open.',
    followUp: 'CacheResolver for read replica caches?',
    tradeoff: 'Safety vs SpEL simplicity.',
    memoryTrick: 'KeyGenerator = address label printer.',
  },
  {
    id: 'multi-tenant',
    title: 'Multi-Tenant Distributed Cache',
    badge: 'SaaS',
    problem: 'Tenant A must never read Tenant B\'s customer:100.',
    whenToUse: 'SaaS payment platforms.',
    whenAvoid: 'Shared flat keys without namespace.',
    mermaid: `flowchart TB
  TA[Tenant A] --> KA["tenant:A:customer:100"]
  TB[Tenant B] --> KB["tenant:B:customer:100"]
  KA --> R[(Redis)]
  KB --> R`,
    code: `String key(String tenant, String id) {
  return "tenant:" + tenant + ":payments:" + id;
}
// Quotas: per-tenant maxmemory via Redis logical DBs (weak) or key prefixes + monitoring
// Prefer separate clusters for noisy-neighbor isolation at large scale`,
    failure: 'Forgot tenant → data leak. One tenant hot key starves others.',
    production: 'Prefix + authz on read + rate limits + optional dedicated Redis.',
    interview30s: 'Namespace every key; isolate noisy tenants operationally.',
    followUp: 'Logical DB vs prefix vs cluster per tier?',
    tradeoff: 'Density vs blast-radius isolation.',
    memoryTrick: 'Tenant prefix = apartment number on mailbox.',
  },
  {
    id: 'tx-cache',
    title: 'Transactions + Cache Ordering',
    badge: 'Correctness',
    problem: '@CachePut inside TX then rollback → cache lies.',
    whenToUse: 'Any write that touches both DB and cache.',
    whenAvoid: 'Updating cache before commit.',
    mermaid: `flowchart TD
  BEGIN --> UPD[UPDATE DB]
  UPD --> RB{Rollback?}
  RB -->|yes| BAD[Cache already updated = POISON]
  RB -->|no| COMMIT --> INV[Invalidate/Put cache]`,
    code: `@Transactional
public void updateStatus(String id, String status) {
  Payment p = repo.findById(id).orElseThrow();
  p.setStatus(status);
  repo.save(p);
  if (TransactionSynchronizationManager.isSynchronizationActive()) {
    TransactionSynchronizationManager.registerSynchronization(
      new TransactionSynchronization() {
        public void afterCommit() {
          cache.evict("payments", id);
        }
      });
  } else {
    cache.evict("payments", id);
  }
}`,
    failure: 'Evict before commit → concurrent reader refills stale pre-commit row (rare races).',
    production: 'afterCommit invalidate; outbox for cross-service.',
    interview30s: 'Never trust cache updates that can roll back with the TX.',
    followUp: 'Cache put vs invalidate after commit?',
    tradeoff: 'Invalidate simpler than put for correctness.',
    memoryTrick: 'Commit first, then tell the rumor mill.',
  },
  {
    id: 'observability',
    title: 'Cache Observability',
    badge: 'Ops',
    problem: 'Hit ratio collapses and nobody notices until DB pages.',
    whenToUse: 'Always — SLOs on hit ratio, latency, errors.',
    whenAvoid: 'Flying blind on cache tier.',
    mermaid: `flowchart LR
  APP --> M[Micrometer]
  M --> H[hit/miss]
  M --> L[redis latency]
  M --> E[errors/evictions]`,
    code: `// spring-boot-starter-actuator + micrometer-registry-prometheus
// Cache metrics auto for known managers; custom:
meterRegistry.counter("cache.payments.hit").increment();
meterRegistry.timer("redis.get").record(duration);

// Alert: hit_ratio < 0.7 for 10m OR redis_p99 > 50ms OR reconnect_storm`,
    failure: 'No eviction metrics → silent memory thrash.',
    production: 'Dashboards: hit, miss, put, evict, redis_p99, pool wait, hot keys.',
    interview30s: 'Hit ratio + Redis latency + errors define cache health.',
    followUp: 'How attribute DB load to miss storms?',
    tradeoff: 'Cardinality of per-key metrics (avoid).',
    memoryTrick: 'If you can\'t see hits, you can\'t defend the DB.',
  },
  {
    id: 'testing',
    title: 'Testing Distributed Cache',
    badge: 'Quality',
    problem: 'Unit mocks miss serialization/TTL/stampede races.',
    whenToUse: 'CI with Testcontainers Redis for integration.',
    whenAvoid: 'Only mocking CacheManager forever.',
    mermaid: `flowchart TD
  T[JUnit] --> TC[Testcontainers Redis]
  T --> UT[Caffeine unit]
  T --> IT[Stampede / TTL IT]`,
    code: `@Testcontainers
@SpringBootTest
class PaymentCacheIT {
  @Container
  static GenericContainer<?> redis =
      new GenericContainer<>("redis:7.2").withExposedPorts(6379);

  @DynamicPropertySource
  static void props(DynamicPropertyRegistry r) {
    r.add("spring.data.redis.host", redis::getHost);
    r.add("spring.data.redis.port", () -> redis.getMappedPort(6379));
  }

  @Test
  void secondReadIsCacheHit(@Autowired PaymentService svc,
                            @Autowired PaymentRepository repo) {
    repo.save(new Payment("P1", "PENDING"));
    svc.get("P1");
    long before = repo.queryCount();
    svc.get("P1");
    assertThat(repo.queryCount()).isEqualTo(before);
  }
}`,
    failure: 'Flaky TTL tests without clock/awaitility.',
    production: 'IT for hit/miss/evict/lock; contract tests for JSON schema.',
    interview30s: 'Testcontainers Redis + assert second call skips DB.',
    followUp: 'How test fail-open?',
    tradeoff: 'CI Docker dependency vs fidelity.',
    memoryTrick: 'If it isn\'t tested with Redis, it isn\'t proven.',
  },
];
