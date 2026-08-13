import type {CacheTopic} from './types';

export const TOPICS_C: CacheTopic[] = [
  {
    id: 'penetration',
    title: 'Cache Penetration',
    badge: 'Failure Mode',
    problem: 'Attacker queries random IDs → always miss → DB flooded.',
    whenToUse: 'Public ID lookup APIs; untrusted traffic.',
    whenAvoid: 'Internal trusted IDs with rate limits only — still consider null caching.',
    mermaid: `flowchart TD
  ATT[random-id] --> BF{Bloom?}
  BF -->|absent| REJ[Reject]
  BF -->|maybe| CACHE
  CACHE -->|MISS| DB
  DB -->|null| NEG[Cache empty marker TTL]`,
    code: `// Null / empty marker
public Optional<Payment> getSafe(String id) {
  String v = redis.opsForValue().get(key(id));
  if ("__NULL__".equals(v)) return Optional.empty();
  if (v != null) return Optional.of(decode(v));
  Optional<Payment> p = repo.findById(id);
  if (p.isEmpty()) {
    redis.opsForValue().set(key(id), "__NULL__", Duration.ofMinutes(2));
    return Optional.empty();
  }
  putCache(id, p.get());
  return p;
}

// Bloom filter (Guava) pre-check for known IDs
if (!bloom.mightContain(id)) return Optional.empty();`,
    failure: 'Caching null forever → real insert invisible. Bloom false negatives rare if built wrong.',
    production: 'Short null TTL + Bloom for huge ID space + WAF/rate limit.',
    interview30s: 'Invalid keys bypass cache; cache negative results briefly or filter with Bloom.',
    followUp: 'False positive Bloom impact?',
    tradeoff: 'Extra memory vs DB protection.',
    memoryTrick: 'Penetration = ghost keys walk through walls.',
  },
  {
    id: 'avalanche',
    title: 'Cache Avalanche',
    badge: 'Failure Mode',
    problem: 'Millions of keys share same TTL → expire together → DB cliff.',
    whenToUse: 'Any bulk warm/TTL strategy.',
    whenAvoid: 'Fixed identical TTL without jitter at scale.',
    mermaid: `flowchart TD
  SAME[Same TTL 10:00] --> EXPIRE[All expire]
  EXPIRE --> DB[(DB cliff)]
  JIT[TTL + random jitter] --> SMOOTH[Staggered expiry]`,
    code: `Duration ttlWithJitter() {
  long base = 300;
  long jitter = ThreadLocalRandom.current().nextLong(30, 120);
  return Duration.ofSeconds(base + jitter);
}

redis.opsForValue().set(key, json, ttlWithJitter());`,
    failure: 'Redis restart empties all → avalanche without soft-load / limiter.',
    production: 'Jitter + stampedes guards + DB bulkhead + gradual warm.',
    interview30s: 'Synchronized expiry → synchronized misses. Add jitter and protect loaders.',
    followUp: 'Cold start after Redis failover?',
    tradeoff: 'Slightly uneven freshness vs cliff avoidance.',
    memoryTrick: 'Avalanche = snow shelf collapses together.',
  },
  {
    id: 'hot-key',
    title: 'Hot Key Problem',
    badge: 'Failure Mode',
    problem: 'product:iphone gets 1M RPS on one Redis shard/node.',
    whenToUse: 'Viral products, FX rates, config flags.',
    whenAvoid: 'Assuming Cluster auto-solves single-key heat.',
    mermaid: `flowchart TB
  HOT[hot key] --> L1[L1 Caffeine per pod]
  HOT --> REP[Replicate N keys]
  HOT --> COAL[Request coalescing]
  HOT --> READ[Read replicas]`,
    code: `// Local L1 for known hot keys
if (hotKeys.isHot(id)) {
  return l1.get(id, k -> loadAside(k));
}

// Artificial sharding: product:iphone#0..#15
String shard = "product:" + id + "#" + (hash(userId) % 16);
// write updates all shards or use pub/sub refresh`,
    failure: 'Only sharding reads without update fan-out → inconsistency.',
    production: 'Detect via Redis MONITOR/hotkeys; L1 + coalescing + replicas.',
    interview30s: 'One key heats one CPU/slot. Mitigate with L1, copies, coalesce.',
    followUp: 'How auto-detect hot keys?',
    tradeoff: 'Complexity vs single-node ceiling.',
    memoryTrick: 'Hot key = one celebrity, one door.',
  },
  {
    id: 'eviction',
    title: 'Eviction Policies & TTL',
    badge: 'Ops',
    problem: 'Redis maxmemory hit — which keys die?',
    whenToUse: 'Tune maxmemory-policy to workload.',
    whenAvoid: 'noeviction on cache tier if you need write availability.',
    mermaid: `flowchart LR
  LRU[LRU sessions] --> POL[maxmemory-policy]
  LFU[LFU products] --> POL
  TTL[TTL OTP] --> POL
  POL --> EVICT[Evict under pressure]`,
    code: `# redis.conf (cache tier)
maxmemory 4gb
maxmemory-policy allkeys-lru
# or volatile-lru if only TTL keys may leave
# allkeys-lfu for popularity-skewed catalogs

# Spring RedisCacheConfiguration
RedisCacheConfiguration.defaultCacheConfig()
  .entryTtl(Duration.ofMinutes(10))
  .disableCachingNullValues();`,
    failure: 'Wrong policy evicts hot keys; TTL too long → stale money status.',
    production: 'Separate Redis for cache vs sessions; monitor evicted_keys.',
    interview30s: 'LRU recency, LFU frequency, TTL time — pick per domain.',
    followUp: 'volatile-* vs allkeys-*?',
    tradeoff: 'Memory vs hit ratio vs freshness.',
    memoryTrick: 'Eviction = who gets kicked when hotel is full.',
  },
  {
    id: 'serialization',
    title: 'Serialization Choices',
    badge: 'Data',
    problem: 'Payload size, evolution, and security of cached bytes.',
    whenToUse: 'Every distributed cache — choose format deliberately.',
    whenAvoid: 'Java native serialization in Redis (gadgets / brittle).',
    mermaid: `flowchart LR
  OBJ[Payment] --> SER[Jackson/JSON or Protobuf]
  SER --> BYTES[bytes]
  BYTES --> REDIS[(Redis)]`,
    code: `@Bean
RedisTemplate<String, Payment> paymentRedisTemplate(
    RedisConnectionFactory f, ObjectMapper om) {
  RedisTemplate<String, Payment> t = new RedisTemplate<>();
  t.setConnectionFactory(f);
  t.setKeySerializer(new StringRedisSerializer());
  Jackson2JsonRedisSerializer<Payment> val =
      new Jackson2JsonRedisSerializer<>(om, Payment.class);
  t.setValueSerializer(val);
  t.afterPropertiesSet();
  return t;
}
// Prefer JSON/Protobuf; avoid JdkSerializationRedisSerializer in prod caches`,
    failure: 'Class rename breaks JDK ser; huge JSON burns RAM; insecure deserialize.',
    production: 'Versioned DTO (`v1.Payment`); Jackson; schema for Protobuf/Avro.',
    interview30s: 'Serialize to portable bytes; never trust JDK serialization for cache.',
    followUp: 'Rolling deploy N vs N+1 cache compat?',
    tradeoff: 'Size/speed vs compatibility.',
    memoryTrick: 'Serialize = packing for the shared suitcase.',
  },
  {
    id: 'distributed-lock',
    title: 'Distributed Locking with Redis',
    badge: 'Coordination',
    problem: 'synchronized / ReentrantLock only covers one JVM.',
    whenToUse: 'Cross-pod single-flight, leader jobs, stampede guard.',
    whenAvoid: 'As a distributed transaction substitute for money transfers.',
    mermaid: `sequenceDiagram
  participant A as Pod A
  participant R as Redis
  participant B as Pod B
  A->>R: SET lock:k token NX PX 5000
  R-->>A: OK
  B->>R: SET lock:k token NX PX 5000
  R-->>B: nil
  A->>A: critical section
  A->>R: DEL if token matches`,
    code: `public boolean tryLock(String name, String token, Duration ttl) {
  return Boolean.TRUE.equals(
    redis.opsForValue().setIfAbsent("lock:" + name, token, ttl));
}
public void unlock(String name, String token) {
  String lua = """
    if redis.call('get', KEYS[1]) == ARGV[1] then
      return redis.call('del', KEYS[1])
    else return 0 end
    """;
  redis.execute(
    (RedisCallback<Long>) c -> c.eval(
      lua.getBytes(), ReturnType.INTEGER, 1,
      ("lock:" + name).getBytes(), token.getBytes()));
}`,
    failure: 'TTL expiry mid-critical → two holders. Unlock without token check → steal.',
    production: 'Short critical sections; fencing tokens for writes; Redlock caveats known.',
    interview30s: 'SET NX PX + owner token; JVM locks do not span pods.',
    followUp: 'Redis lock vs ZooKeeper/DB lock?',
    tradeoff: 'Simple vs formal consensus locks.',
    memoryTrick: 'Distributed lock = one bathroom key for the hotel floor.',
  },
];
