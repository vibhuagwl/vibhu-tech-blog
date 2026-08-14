import type {BloomTopic} from './types';

export const TOPICS_B: BloomTopic[] = [
  {
    id: 'spring',
    title: '07. Spring Boot Integration',
    badge: 'UserService',
    problem: 'Wire a filter into DI, populate on startup, update on create, expose rebuild/stats.',
    whenToUse: 'Application-level negative cache in front of Redis/DB.',
    whenAvoid: 'Embedding a huge filter in every tiny serverless cold start without shared store.',
    mermaid: `flowchart TD
  Boot[ApplicationRunner] --> Load[SELECT ids]
  Load --> Rebuild[bloom.rebuildFromDatabase]
  API[GET /users/id] --> US[UserService]
  US --> BF{mightContain?}
  BF -->|no| 404
  BF -->|maybe| Cache --> DB`,
    code: `@Service
public class UserService {
  Optional<User> findUser(String id) {
    if (!bloom.mightContain(id)) return empty();
    return cache.get(id).or(() -> db.find(id));
  }
}`,
    failure: 'Creating a user in DB but forgetting bloom.add → false negatives until rebuild.',
    production: 'Lab beans: BloomFilterConfig, BloomFilter<String>, BloomFilterService, UserBloomSeeder.',
    interview30s:
      'Bean for filter sized by config; ApplicationRunner loads ids; create path adds id; lookup short-circuits on miss; rebuild endpoint for healing.',
    followUp: 'How do 10 app instances stay consistent?',
    tradeoff: 'Local filter speed vs shared Redis Bloom module consistency.',
    memoryTrick: 'Startup load + add-on-write + rebuild heal.',
  },
  {
    id: 'cache-penetration',
    title: '08. Bloom + Redis + DB',
    badge: 'Penetration',
    problem: 'Attackers query random missing ids → cache miss → DB storm. Bloom blocks definite misses.',
    whenToUse: 'Hot APIs with many invalid ids (bots, scrapers, broken clients).',
    whenAvoid: 'When almost all queried ids exist — Bloom adds little.',
    mermaid: `flowchart TD
  Req --> BF{Bloom}
  BF -->|NO| Fast404[404]
  BF -->|MAYBE| Redis
  Redis -->|hit| OK
  Redis -->|miss| DB
  DB -->|miss| FP[false positive cost]`,
    code: `// Without Bloom: every random id → DB
// With Bloom: ~99%+ of garbage ids stop at Bloom`,
    failure: 'Caching empty results forever without Bloom — helps, but still pays Redis; Bloom is cheaper.',
    production: 'Metrics: user.bloom.blocked vs user.db.queries prove value.',
    interview30s:
      'Cache penetration = queries for absent keys bypass cache. Bloom answers “definitely no” in RAM before Redis/DB. FPs only cause harmless extra lookups.',
    followUp: 'Bloom vs caching null with short TTL?',
    tradeoff: 'Null-cache uses Redis memory per miss key; Bloom amortizes all keys into bits.',
    memoryTrick: 'Penetration stops at the bit array.',
  },
  {
    id: 'storage-engines',
    title: '09. Storage Engines & Cassandra',
    badge: 'SSTables',
    problem: 'LSM engines have many SSTables; reading each for a miss is expensive.',
    whenToUse: 'Explaining RocksDB/Cassandra/HBase read path in interviews.',
    whenAvoid: 'Claiming Postgres B-Tree “is a Bloom filter”.',
    mermaid: `flowchart TD
  App --> Cas[Cassandra]
  Cas --> Mem[MemTable]
  Cas --> SST[SSTables]
  SST --> BF[Per-SSTable Bloom]
  BF -->|no| Skip[Skip file]
  BF -->|maybe| Index --> Data`,
    code: `// Key user-123
// BF1 miss → skip SST1
// BF2 maybe → check index/data
// Saves disk seeks on absent keys`,
    failure: 'Confusing application Bloom with engine-internal Bloom — different ownership/rebuild.',
    production:
      'RocksDB/Cassandra/HBase: built-in per-SSTable Blooms. Redis: RedisBloom module. Postgres/MySQL: not a default B-Tree replacement (extensions/experimental only). ES: some filter caches — not classic user Bloom API.',
    interview30s:
      'In LSM DBs each SSTable carries a Bloom filter so point reads skip files that definitely lack the key. App-level Bloom is a separate layer in front of cache/DB.',
    followUp: 'What happens after compaction?',
    tradeoff: 'Per-SSTable memory vs fewer disk reads.',
    memoryTrick: 'SSTable Bloom = skip disk; App Bloom = skip Redis/DB.',
  },
  {
    id: 'kafka',
    title: '10. Kafka & Idempotency',
    badge: 'Not SoT',
    problem: 'Consumers want cheap “have I processed eventId?” but FPs must not drop new events.',
    whenToUse: 'Optional pre-filter before Redis SET NX / DB unique processed_events.',
    whenAvoid: 'Using Bloom alone as idempotency store.',
    mermaid: `flowchart TD
  Ev[Kafka event] --> BF[Bloom hint]
  BF -->|no| Process
  BF -->|maybe| Truth[Redis/DB UNIQUE]
  Truth -->|seen| Skip
  Truth -->|new| Process
  Process --> Record[truth + bloom.add]`,
    code: `// IdempotencyGuard in lab
if (!bloom.mightContain(id)) { process; truth.add; bloom.add; }
else if (!truth.contains(id)) { process; truth.add; bloom.add; }
else skip;`,
    failure: 'if (bloom.mightContain(id)) skip; // FP drops a never-seen event',
    production: 'UNIQUE(event_id) remains the lock; Bloom only reduces truth-store hits for cold ids.',
    interview30s:
      'Bloom can cheaply say “never seen”. If it says maybe, consult Redis/DB. Never skip solely on Bloom true — that is how false positives lose messages.',
    followUp: 'At-least-once + Bloom interaction?',
    tradeoff: 'Extra truth round-trip on maybes vs correctness.',
    memoryTrick: 'Hint then UNIQUE — never Bloom-as-ledger.',
  },
  {
    id: 'comparisons',
    title: '11. Comparisons & Indexes',
    badge: 'vs everything',
    problem: 'Staff answers compare Bloom to HashSet, Cuckoo, Redis Set, and DB indexes.',
    whenToUse: 'Design tradeoff tables.',
    whenAvoid: 'Saying Bloom replaces B-Tree indexes.',
    mermaid: `flowchart TD
  App --> BF[App Bloom]
  BF --> Redis
  Redis --> DB
  DB --> Idx[B-Tree / Hash index]
  Idx --> Rows`,
    code: `-- Index finds the row among existing data
SELECT * FROM users WHERE user_id='123';
-- Bloom answers "is 123 even worth asking?"`,
    failure: 'Skipping the DB index because Bloom said true.',
    production: 'Layers compose: Bloom (negative) → cache → DB index (exact) → row.',
    interview30s:
      'HashSet exact but stores keys. Redis Set exact networked. Cuckoo supports delete better. DB index locates rows. Bloom only accelerates negative checks with FPs.',
    followUp: 'When is Cuckoo Filter better?',
    tradeoff: 'Exactness vs memory; delete support vs simplicity.',
    memoryTrick: 'Bloom ≠ index; Bloom ≠ source of truth.',
  },
  {
    id: 'deletion',
    title: '12. Deletion & Counting Bloom Filter',
    badge: 'Shared bits',
    problem: 'Clearing a bit on delete can erase evidence for another key that shared that bit → false negative.',
    whenToUse: 'Explain why classic BF is append-mostly; counting BF when deletes needed.',
    whenAvoid: 'Naive delete on classic BF in production.',
    mermaid: `flowchart TD
  Alice --> B5[bit 5]
  Bob --> B5
  Del[delete Alice clears bit 5] --> FN[Bob looks absent — BAD]`,
    code: `// Counting BF: counters 0 1 2 0 3 …
add → ++counters; remove → --counters
mightContain → all counters > 0`,
    failure: 'remove() on a key never added underflows shared counters.',
    production: 'Lab CountingBloomFilter with AtomicIntegerArray; prefer rebuild over deletes when possible.',
    interview30s:
      'Classic BF cannot delete safely because bits are shared. Counting BF stores counters; deletes decrement. Costs more memory; still probabilistic.',
    followUp: 'Saturating counters?',
    tradeoff: '~4–8× memory for delete support.',
    memoryTrick: 'Shared bit + clear = false negative.',
  },
];
