import type {CacheTopic} from './types';

export const TOPICS_A: CacheTopic[] = [
  {
    id: 'spring-cache',
    title: 'Spring Cache Abstraction',
    badge: 'Core',
    problem: 'DB hit on every GET /payments/{id} at 10k RPS melts PostgreSQL.',
    whenToUse: 'Declarative caching via @Cacheable/@CacheEvict across Redis/Caffeine managers.',
    whenAvoid: 'Self-invocation (this.method()) bypasses proxy — cache never runs.',
    mermaid: `sequenceDiagram
  participant C as Client
  participant P as Spring Proxy
  participant R as Redis
  participant DB as PostgreSQL
  C->>P: GET /payments/P100
  P->>R: GET payments::P100
  alt HIT
    R-->>P: Payment JSON
    P-->>C: 200
  else MISS
    R-->>P: null
    P->>DB: SELECT
    DB-->>P: row
    P->>R: SET EX 300
    P-->>C: 200
  end`,
    code: `@Service
public class PaymentService {
  private final PaymentRepository repo;

  @Cacheable(cacheNames = "payments", key = "#id")
  public Payment get(String id) {
    return repo.findById(id).orElseThrow();
  }

  @CachePut(cacheNames = "payments", key = "#p.id")
  public Payment save(Payment p) {
    return repo.save(p);
  }

  @CacheEvict(cacheNames = "payments", key = "#id")
  public void evict(String id) {}

  // BAD: self-invocation skips AOP proxy
  public Payment bad(String id) {
    return get(id); // may bypass @Cacheable
  }
}

// FIX: inject self / ApplicationContext / separate bean / AspectJ`,
    failure: 'Self-call → always DB. Wrong key SpEL → collisions. Missing @EnableCaching → no-op.',
    production: '@EnableCaching + RedisCacheManager + CacheErrorHandler that fails open to DB.',
    interview30s: 'Spring Cache is AOP around public methods; HIT returns from CacheManager; MISS invokes method then puts.',
    followUp: 'How do you cache private methods? (You usually do not — extract collaborator bean.)',
    tradeoff: 'Declarative simplicity vs explicit control of TTL/jitter/stampede.',
    memoryTrick: '@Cacheable = AOP toll booth before DB.',
  },
  {
    id: 'cache-aside',
    title: 'Cache-Aside (Lazy Loading)',
    badge: 'Pattern',
    problem: 'App owns load path — most common Spring pattern.',
    whenToUse: 'Read-heavy APIs where app controls DB access (Spring Data).',
    whenAvoid: 'When cache product must load transparently (some grids).',
    mermaid: `flowchart TD
  REQ[Request] --> Q{Cache?}
  Q -->|HIT| R[Response]
  Q -->|MISS| DB[(PostgreSQL)]
  DB --> PUT[PUT Redis]
  PUT --> R`,
    code: `public Payment getAside(String id) {
  Payment cached = redisTemplate.opsForValue().get(key(id));
  if (cached != null) return cached;
  Payment p = repo.findById(id).orElseThrow();
  redisTemplate.opsForValue().set(key(id), p, ttlWithJitter());
  return p;
}`,
    failure: 'Race on miss → stampede. Write path forgets evict → stale.',
    production: 'Aside + TTL jitter + stampede lock + post-commit evict.',
    interview30s: 'App checks cache; on miss loads DB then populates. Simple and Spring-native.',
    followUp: 'Who wins on concurrent miss?',
    tradeoff: 'Flexibility vs duplicated load logic.',
    memoryTrick: 'Aside = app is the librarian.',
  },
  {
    id: 'read-through',
    title: 'Read-Through',
    badge: 'Pattern',
    problem: 'Want cache layer to load DB itself on miss.',
    whenToUse: 'Grid products (Hazelcast/Infinispan MapLoader) or custom CacheLoader.',
    whenAvoid: 'Simple Spring @Cacheable already acts app-aside.',
    mermaid: `flowchart LR
  APP --> CACHE
  CACHE -->|HIT| APP
  CACHE -->|MISS| LOADER --> DB
  LOADER --> CACHE`,
    code: `// Conceptual CacheLoader (Hazelcast-style)
public class PaymentLoader implements CacheLoader<String, Payment> {
  public Payment load(String id) {
    return repository.findById(id).orElse(null);
  }
}`,
    failure: 'Loader blocks all readers; slow DB → cache latency spike.',
    production: 'Timeouts + circuit breaker around loader; prefer aside in Spring Boot.',
    interview30s: 'Cache owns loading; app only talks to cache API.',
    followUp: 'Spring Cache vs MapLoader?',
    tradeoff: 'Encapsulation vs Spring ecosystem fit.',
    memoryTrick: 'Read-through = cache fetches for you.',
  },
  {
    id: 'write-through',
    title: 'Write-Through',
    badge: 'Pattern',
    problem: 'Need cache and DB updated together on write.',
    whenToUse: 'Stronger freshness on write path; low write volume.',
    whenAvoid: 'High write throughput — doubles latency.',
    mermaid: `flowchart TD
  W[Write] --> C[Cache PUT]
  C --> DB[(DB WRITE)]
  DB --> OK[Success]`,
    code: `@Transactional
@CachePut(cacheNames = "payments", key = "#p.id")
public Payment writeThrough(Payment p) {
  return repo.save(p); // cache put after method if no error — still watch TX!
}`,
    failure: 'Cache updated before TX commit → stale/invalid on rollback.',
    production: 'Invalidate/put after commit (TransactionSynchronization).',
    interview30s: 'Every write updates cache and DB in the same path; latency cost.',
    followUp: 'Order of cache vs DB?',
    tradeoff: 'Freshness vs write latency.',
    memoryTrick: 'Write-through = both doors, same key turn.',
  },
  {
    id: 'write-behind',
    title: 'Write-Behind (Write-Back)',
    badge: 'Pattern',
    problem: 'Absorb write spikes; flush DB async.',
    whenToUse: 'Metrics, counters, non-critical aggregates.',
    whenAvoid: 'Money movement / payment status of record.',
    mermaid: `flowchart LR
  APP --> CACHE --> Q[Async Queue] --> DB`,
    code: `// Pseudo production pattern
cache.put(id, payment);
writeQueue.offer(new PersistEvent(id, payment));
// worker batch INSERT/UPDATE — risk if crash before flush`,
    failure: 'Node death before flush → data loss unless WAL/outbox.',
    production: 'Outbox in DB or durable queue; never for ledger balances.',
    interview30s: 'Cache acknowledges write; DB lagged — durability risk.',
    followUp: 'How fence against double-apply?',
    tradeoff: 'Throughput vs durability.',
    memoryTrick: 'Write-behind = sticky note, later ledger.',
  },
  {
    id: 'write-around',
    title: 'Write-Around',
    badge: 'Pattern',
    problem: 'Write-heavy data rarely re-read immediately.',
    whenToUse: 'Audit logs, write-heavy streams with rare reads.',
    whenAvoid: 'Read-your-write UX right after write.',
    mermaid: `flowchart TD
  W[Write] --> DB
  DB -.->|bypass| CACHE
  R[Read] --> CACHE
  CACHE -->|MISS| DB`,
    code: `public void writeAround(Payment p) {
  repo.save(p); // no cache put
  // optional: redis.delete(key(p.id())) to avoid stale
}`,
    failure: 'Old cached value survives if not evicted → stale read.',
    production: 'Write-around + explicit evict on write.',
    interview30s: 'Write DB only; cache fills on next read miss.',
    followUp: 'Vs write-through for payments?',
    tradeoff: 'Write speed vs immediate cache warmth.',
    memoryTrick: 'Write-around = skip the fridge, go to pantry.',
  },
  {
    id: 'refresh-ahead',
    title: 'Refresh-Ahead',
    badge: 'Pattern',
    problem: 'TTL expiry causes latency spikes / stampedes.',
    whenToUse: 'Hot catalogs with predictable TTL.',
    whenAvoid: 'Cold keys — wasted refresh work.',
    mermaid: `flowchart TD
  T[TTL 60s] --> R[at T=50s refresh]
  R --> HOT[Cache stays warm]
  HOT --> U[Users never see miss]`,
    code: `@Scheduled(fixedDelay = 5_000)
public void refreshHotPayments() {
  for (String id : hotKeyTracker.topN(100)) {
    Payment p = repo.findById(id).orElse(null);
    if (p != null) redis.set(key(id), p, ttlWithJitter());
  }
}`,
    failure: 'Refreshing everything wastes DB; wrong hot set.',
    production: 'Refresh only proven hot keys; coalesce refreshes.',
    interview30s: 'Proactively reload before expiry so users rarely miss.',
    followUp: 'How discover hot keys?',
    tradeoff: 'Steady DB load vs bursty miss storms.',
    memoryTrick: 'Refresh-ahead = refill before empty.',
  },
];
