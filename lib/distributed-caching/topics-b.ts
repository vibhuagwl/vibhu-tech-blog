import type {CacheTopic} from './types';

export const TOPICS_B: CacheTopic[] = [
  {
    id: 'redis',
    title: 'Redis Architecture',
    badge: 'Redis',
    problem: 'Need shared, fast KV across Payment Service pods.',
    whenToUse: 'Distributed cache, sessions, locks, rate limits, pub/sub invalidation.',
    whenAvoid: 'Primary system of record for money without durability design.',
    mermaid: `flowchart TB
  SB[Spring Boot] --> LT[Lettuce]
  LT --> RC[Redis Cluster]
  RC --> N1[Node1 slots]
  RC --> N2[Node2 slots]
  RC --> N3[Node3 slots]
  N1 -.-> R1[Replica]
  N2 -.-> R2[Replica]`,
    code: `# Redis CLI
SET payments:P100 '{"id":"P100","status":"SETTLED"}' EX 300
GET payments:P100
TTL payments:P100
DEL payments:P100

# Spring
@Bean
RedisConnectionFactory redisConnectionFactory() {
  return new LettuceConnectionFactory(
    new RedisStandaloneConfiguration("redis", 6379));
}`,
    failure: 'Single node = SPOF. No timeout → thread pileup. Persistence off → empty after restart stampede.',
    production: 'Cluster or Sentinel, timeouts, pool limits, fail-open CacheErrorHandler.',
    interview30s: 'In-memory store with optional AOF/RDB; Cluster shards by hash slot; Spring uses Lettuce by default.',
    followUp: 'Sentinel vs Cluster?',
    tradeoff: 'Speed vs durability/ops complexity.',
    memoryTrick: 'Redis = shared RAM with a protocol.',
  },
  {
    id: 'redis-cluster',
    title: 'Redis Cluster & Hash Slots',
    badge: 'Redis',
    problem: 'Scale beyond one node RAM/CPU; survive node loss.',
    whenToUse: 'Large keyspaces, horizontal scale.',
    whenAvoid: 'Tiny datasets — ops overhead dominates.',
    mermaid: `flowchart TD
  K[Key] --> CRC[CRC16]
  CRC --> S[slot = CRC % 16384]
  S --> N1[Node A 0-5460]
  S --> N2[Node B 5461-10922]
  S --> N3[Node C 10923-16383]`,
    code: `// Related keys same slot via hash tag
// {customer}:100 and {customer}:profile share slot of "customer"
String balanceKey = "{cust:" + custId + "}:balance";
String profileKey = "{cust:" + custId + "}:profile";

// MULTI/EXEC only works on same slot — hash tags required for multi-key ops`,
    failure: 'Cross-slot MULTI fails. Hot slot (one key) ≠ cluster helps CPU on that key.',
    production: 'Hash tags for related keys; monitor slot imbalance; reshard carefully.',
    interview30s: '16384 slots; key → CRC16 → slot → node. Hash tags {..} pin related keys together.',
    followUp: 'What happens on MOVED/ASK redirects?',
    tradeoff: 'Scale vs multi-key transaction limits.',
    memoryTrick: '{tag} = family stays on one shelf.',
  },
  {
    id: 'l1l2',
    title: 'Multi-Level Cache (L1 Caffeine + L2 Redis)',
    badge: 'Architecture',
    problem: 'Redis network hop still too hot for ultra-hot keys / 10k RPS per pod.',
    whenToUse: 'Hot reads, multi-pod shared truth in L2, micro-latency in L1.',
    whenAvoid: 'Strong consistency across pods without invalidation bus.',
    mermaid: `flowchart TD
  REQ --> L1{Caffeine L1}
  L1 -->|HIT| OK[Response]
  L1 -->|MISS| L2{Redis L2}
  L2 -->|HIT| FILL1[Fill L1] --> OK
  L2 -->|MISS| DB[(PG)]
  DB --> FILL2[Fill L2+L1] --> OK`,
    code: `@Service
public class MultiLevelPaymentCache {
  private final Cache<String, Payment> l1 = Caffeine.newBuilder()
      .maximumSize(10_000).expireAfterWrite(Duration.ofSeconds(30)).build();
  private final StringRedisTemplate redis;
  private final PaymentRepository repo;
  private final ObjectMapper om;

  public Payment get(String id) throws Exception {
    Payment local = l1.getIfPresent(id);
    if (local != null) return local;
    String json = redis.opsForValue().get("payments:" + id);
    if (json != null) {
      Payment p = om.readValue(json, Payment.class);
      l1.put(id, p);
      return p;
    }
    Payment p = repo.findById(id).orElseThrow();
    redis.opsForValue().set("payments:" + id, om.writeValueAsString(p), Duration.ofMinutes(5));
    l1.put(id, p);
    return p;
  }

  public void invalidate(String id) {
    l1.invalidate(id);
    redis.delete("payments:" + id);
  }
}`,
    failure: 'L1 stale after other pod writes — need pub/sub or Kafka invalidate.',
    production: 'Short L1 TTL + Redis pub/sub or Kafka to bust L1 cluster-wide.',
    interview30s: 'L1 JVM, L2 Redis, L3 DB. Invalidate both layers on write events.',
    followUp: 'How sync L1 across 50 pods?',
    tradeoff: 'Latency vs coherence complexity.',
    memoryTrick: 'L1 desk drawer, L2 shared vault, L3 archive.',
  },
  {
    id: 'consistency',
    title: 'Cache Consistency Models',
    badge: 'Consistency',
    problem: 'Payment status SETTLED in DB but cache still PENDING.',
    whenToUse: 'Decide RYW / eventual / strong per read path.',
    whenAvoid: 'Pretending Redis cache is linearizable for money.',
    mermaid: `flowchart LR
  A[Service A write DB] --> C[Commit]
  C --> K[Kafka / CDC]
  K --> B[Service B]
  B --> I[Invalidate Redis]
  I --> R[Next read fresh]`,
    code: `// Prefer invalidate-after-commit
@Transactional
public void settle(String id) {
  Payment p = repo.findById(id).orElseThrow();
  p.setStatus("SETTLED");
  repo.save(p);
  TransactionSynchronizationManager.registerSynchronization(
    new TransactionSynchronization() {
      public void afterCommit() {
        redis.delete("payments:" + id);
        kafka.send("cache.invalidate", id);
      }
    });
}`,
    failure: 'Update cache inside TX then rollback → poison.',
    production: 'Invalidate on commit; CDC/outbox for multi-service.',
    interview30s: 'Caches are usually eventually consistent; RYW via sticky session or version tokens.',
    followUp: 'How design read-your-write for profile updates?',
    tradeoff: 'Correctness windows vs latency.',
    memoryTrick: 'Cache = rumor; DB = court record.',
  },
  {
    id: 'kafka-invalidate',
    title: 'Kafka-Based Cache Invalidation',
    badge: 'Eventing',
    problem: '50 microservices hold copies; need coherent bust.',
    whenToUse: 'Multi-service shared entities; CDC/outbox already exists.',
    whenAvoid: 'Single service — Redis pub/sub may suffice.',
    mermaid: `flowchart TB
  DB[(PG)] --> CDC[CDC/Outbox]
  CDC --> K[Kafka topic cache.invalidate]
  K --> S1[Payment]
  K --> S2[Fraud]
  K --> S3[Ledger]
  S1 --> R[(Redis)]
  S2 --> R
  S3 --> R`,
    code: `@KafkaListener(topics = "cache.invalidate", groupId = "payment-cache")
public void onInvalidate(ConsumerRecord<String, String> rec) {
  String paymentId = rec.value();
  multiLevel.invalidate(paymentId);
  log.info("invalidated payment cache id={} offset={}", paymentId, rec.offset());
}

// Producer after commit
kafkaTemplate.send("cache.invalidate", paymentId, paymentId);`,
    failure: 'Non-idempotent consumers; poison messages; lag → long stale window.',
    production: 'Idempotent invalidate; DLQ; monitor lag; include version in event.',
    interview30s: 'DB change → Kafka → all services delete key. Eventual coherence.',
    followUp: 'Pub/Sub vs Kafka for invalidation?',
    tradeoff: 'Fan-out reliability vs complexity.',
    memoryTrick: 'Kafka = fire alarm to every floor.',
  },
  {
    id: 'stampede',
    title: 'Cache Stampede (Thundering Herd)',
    badge: 'Failure Mode',
    problem: 'Hot key expires → 1000 concurrent misses → 1000 DB loads.',
    whenToUse: 'Always protect hot keys at scale.',
    whenAvoid: 'N/A — ignore and you will page.',
    mermaid: `flowchart TD
  M[1000 misses same key] --> DB[(DB melt)]
  M2[Misses] --> LOCK{SET lock NX}
  LOCK -->|1 winner| LOAD[Load DB]
  LOCK -->|losers| WAIT[Wait / retry cache]
  LOAD --> FILL[Fill Redis]
  FILL --> UNLOCK[DEL lock]`,
    code: `public Payment getWithStampedeGuard(String id) {
  Payment hit = getFromCache(id);
  if (hit != null) return hit;
  String lockKey = "lock:payments:" + id;
  String token = UUID.randomUUID().toString();
  Boolean ok = redis.opsForValue()
      .setIfAbsent(lockKey, token, Duration.ofSeconds(5));
  if (Boolean.TRUE.equals(ok)) {
    try {
      Payment p = repo.findById(id).orElseThrow();
      putCache(id, p);
      return p;
    } finally {
      // release only if still owner
      String cur = redis.opsForValue().get(lockKey);
      if (token.equals(cur)) redis.delete(lockKey);
    }
  }
  // loser: brief wait then re-read cache
  sleep(50);
  Payment again = getFromCache(id);
  return again != null ? again : repo.findById(id).orElseThrow();
}`,
    failure: 'Lock without TTL → deadlock. Release others’ locks → corruption.',
    production: 'NX+PX lock + token check; probabilistic early expiration; refresh-ahead.',
    interview30s: 'Only one loader; others wait/retry. Combine with TTL jitter.',
    followUp: 'Singleflight vs Redis lock?',
    tradeoff: 'Extra Redis ops vs DB protection.',
    memoryTrick: 'Stampede = everyone rushes the bakery at once.',
  },
];
