import type {ShardTopic} from './types';

export const TOPICS_B: ShardTopic[] = [
  {
    id: 'mysql',
    title: 'MySQL Partitioning Sketch',
    badge: 'SQL',
    problem: 'Same banking table on MySQL — show RANGE YEARS.',
    whenToUse: 'MySQL shops; KEY/HASH/RANGE/LIST supported flavors.',
    whenAvoid: 'Assuming PG syntax works unchanged.',
    mermaid: `flowchart LR
  T[transactions] --> P25[p2025]
  T --> P26[p2026]
  T --> PMAX[pmax]`,
    code: `CREATE TABLE transactions (
  id BIGINT,
  transaction_date DATE,
  amount DECIMAL(18,2)
)
PARTITION BY RANGE (YEAR(transaction_date)) (
  PARTITION p2025 VALUES LESS THAN (2026),
  PARTITION p2026 VALUES LESS THAN (2027),
  PARTITION pmax VALUES LESS THAN MAXVALUE
);

SELECT * FROM transactions WHERE transaction_date >= '2026-01-01';`,
    failure: 'UNIQUE keys must include partition expression columns (MySQL rules).',
    production: 'Document engine version constraints; test EXPLAIN PARTITIONS.',
    interview30s: 'MySQL RANGE/LIST/HASH/KEY — expression rules differ from PostgreSQL.',
    followUp: 'Oracle/SQL Server partition function/scheme at high level?',
    tradeoff: 'Portability vs native features.',
    memoryTrick: 'MySQL LESS THAN = year shelves.',
  },
  {
    id: 'nosql',
    title: 'NoSQL Partition Keys (Cassandra · Mongo · Dynamo)',
    badge: 'NoSQL',
    problem: 'Design keys so customer queries hit one partition/shard.',
    whenToUse: 'Access-pattern-first modeling.',
    whenAvoid: 'Low-cardinality keys (status, country) → hot partitions.',
    mermaid: `flowchart TB
  NOSQL --> CASS[Cassandra token ring]
  NOSQL --> MONGO[mongos + shards]
  NOSQL --> DDB[DynamoDB hash PK]`,
    code: `-- Cassandra
CREATE TABLE transactions (
  customer_id BIGINT,
  transaction_date DATE,
  transaction_id UUID,
  amount DECIMAL,
  PRIMARY KEY ((customer_id), transaction_date, transaction_id)
);
-- partition key = customer_id; clustering = date, id

// Mongo hashed shard key
sh.shardCollection("bank.transactions", { customerId: "hashed" });

// DynamoDB
// PK = CUSTOMER#1001  SK = TRANSACTION#20260813
// Query PK = CUSTOMER#1001`,
    failure: 'Hot PK (celebrity customer) melts one partition.',
    production: 'Salt high-volume keys; GSIs carefully; monitor throttles.',
    interview30s: 'NoSQL distributes by partition/shard key — choose by query pattern.',
    followUp: 'GSI vs LSI on Dynamo?',
    tradeoff: 'Scale vs single-key fan-out limits.',
    memoryTrick: 'Partition key = mailbox address on the ring.',
  },
  {
    id: 'range-shard',
    title: 'Range-Based Sharding',
    badge: 'Shard',
    problem: 'Customers 1–1M → DB1, 1M–2M → DB2.',
    whenToUse: 'Simple ops; range scans within shard.',
    whenAvoid: 'Monotonic IDs → newest shard always hot.',
    mermaid: `flowchart LR
  ID[customer_id] --> S1[1-1M Shard-1]
  ID --> S2[1M-2M Shard-2]
  ID --> S3[2M-3M Shard-3]
  S3 --> HOT[HOT SHARD]`,
    code: `int shardFor(long customerId) {
  if (customerId < 1_000_000) return 0;
  if (customerId < 2_000_000) return 1;
  return 2;
}
// New signups always hit last range → hotspot`,
    failure: 'Shard-3 overloaded with new customers.',
    production: 'Prefer hash/consistent hash for writes; range for analytics warehouses.',
    interview30s: 'Range sharding is simple but creates hot newest shards.',
    followUp: 'How split a hot range online?',
    tradeoff: 'Range queries easy vs imbalance.',
    memoryTrick: 'Range shard = numbered hotel floors — penthouse always busy.',
  },
  {
    id: 'hash-shard',
    title: 'Hash-Based Sharding',
    badge: 'Shard',
    problem: 'Evenly place customers across N databases.',
    whenToUse: 'Even distribution with stable N.',
    whenAvoid: 'Changing N with naive hash%N (massive move).',
    mermaid: `flowchart TD
  C[customer_id] --> H[hash]
  H --> M[mod N]
  M --> S1
  M --> S2
  M --> S3
  M --> S4`,
    code: `int shard = Math.floorMod(key.hashCode(), shardCount);
// Expanding 4 → 8 shards remaps most keys
// Prefer consistent hashing or directory for growth`,
    failure: 'Reshard with %N without dual-write → lost lookups.',
    production: 'Plan capacity; use consistent hash or virtual buckets.',
    interview30s: 'hash%N spreads evenly but remaps on N change.',
    followUp: 'Virtual buckets / shard map?',
    tradeoff: 'Evenness vs rebalance pain.',
    memoryTrick: 'Modulo = fixed parking lot size — enlarge and everyone moves.',
  },
  {
    id: 'consistent',
    title: 'Consistent Hashing for Shards',
    badge: 'Shard',
    problem: 'Add Shard-4 with minimal key movement.',
    whenToUse: 'Dynamic shard counts; caches; elastic clusters.',
    whenAvoid: 'Tiny static 2-shard systems where directory is simpler.',
    mermaid: `flowchart TB
  R[Hash Ring] --- S1
  R --- S2
  R --- S3
  R --- S4
  K[hash key] --> R`,
    code: `// See db-sharding-lab ConsistentHashShardRouter
SortedMap<Integer, Integer> ring; // hash → shardId
int h = key.hashCode();
Integer shard = ring.tailMap(h).isEmpty()
  ? ring.get(ring.firstKey())
  : ring.get(ring.tailMap(h).firstKey());
// Add node → only neighboring arc moves`,
    failure: 'Too few virtual nodes → imbalance.',
    production: 'Many vnodes; monitor skew; controlled migration of arc.',
    interview30s: 'Ring placement; add/remove moves only nearby keys.',
    followUp: 'Jump hash alternative?',
    tradeoff: 'Stability vs implementation complexity.',
    memoryTrick: 'Ring = circular bus; new stop only remaps nearby riders.',
  },
  {
    id: 'directory',
    title: 'Directory + Tenant Sharding',
    badge: 'Shard',
    problem: 'SaaS bank: Tenant A → Shard-1; move Tenant B without remapping world.',
    whenToUse: 'Flexible mapping; tenant isolation; controlled moves.',
    whenAvoid: 'Directory SPOF without cache/HA.',
    mermaid: `flowchart TD
  TID[Tenant ID] --> DIR[Shard Directory]
  DIR --> S1
  DIR --> S2
  DIR --> REDIS[(Redis cache)]`,
    code: `// Directory: tenantId → shardId (Postgres table + Redis)
// Spring:
ShardContext.set(directory.shardFor(tenantId));
try {
  return repo.findAccounts();
} finally {
  ShardContext.clear();
}`,
    failure: 'Stale Redis mapping after move → wrong DB / missing data.',
    production: 'Versioned map; dual-read during move; invalidate cache on cutover.',
    interview30s: 'Directory maps keys→shards flexibly; tenant sharding isolates SaaS.',
    followUp: 'Geo sharding vs tenant?',
    tradeoff: 'Flexibility vs lookup dependency.',
    memoryTrick: 'Directory = hotel room assignment book.',
  },
  {
    id: 'spring',
    title: 'Spring Boot AbstractRoutingDataSource',
    badge: 'Spring',
    problem: 'Route JPA calls to the correct shard DataSource.',
    whenToUse: 'App-managed sharding with Spring Data JPA.',
    whenAvoid: 'Forgetting ThreadLocal clear → cross-tenant leaks.',
    mermaid: `flowchart TB
  CTL[Controller] --> SVC
  SVC --> CTX[ShardContext ThreadLocal]
  CTX --> REPO
  REPO --> RDS[RoutingDataSource]
  RDS --> DB1
  RDS --> DB2
  RDS --> DB3`,
    code: `public class ShardRoutingDataSource extends AbstractRoutingDataSource {
  @Override protected Object determineCurrentLookupKey() {
    return ShardContext.getShardKey();
  }
}

public final class ShardContext {
  private static final ThreadLocal<String> KEY = new ThreadLocal<>();
  public static void set(String k) { KEY.set(k); }
  public static String getShardKey() { return KEY.get(); }
  public static void clear() { KEY.remove(); }
}

// @Transactional: connection acquired after key set — set BEFORE entering TX`,
    failure: 'Async/@Async loses ThreadLocal; set key after TX start → wrong DS.',
    production: 'Filter/interceptor sets key; finally clear; test isolation.',
    interview30s: 'Routing DS picks lookup key from ThreadLocal before getConnection.',
    followUp: 'How handle reactive WebFlux context?',
    tradeoff: 'App control vs platform-managed sharding.',
    memoryTrick: 'ThreadLocal = sticky note saying which vault.',
  },
  {
    id: 'cross-shard',
    title: 'Cross-Shard Queries & Transactions',
    badge: 'Hard',
    problem: 'SUM(amount) across all shards / transfer across customers on different shards.',
    whenToUse: 'Accept scatter-gather for reports; Saga for multi-shard business TX.',
    whenAvoid: 'Expecting single ACID TX across shards by default.',
    mermaid: `flowchart TD
  Q[SUM] --> R[Router]
  R --> S1
  R --> S2
  R --> S3
  S1 --> M[Merge]
  S2 --> M
  S3 --> M
  TX[Cross-shard TX] --> SAGA[Saga / Outbox]`,
    code: `BigDecimal sum = shards.parallelStream()
  .map(ds -> querySum(ds))
  .reduce(BigDecimal.ZERO, BigDecimal::add);
// Partial failure → decide fail-all vs approximate

// Payments: local TX per shard + saga compensations
// Unique idempotency_key per payment`,
    failure: '2PC across 100 shards → availability death.',
    production: 'Design APIs single-shard; async aggregates; saga for money moves.',
    interview30s: 'Cross-shard reads = scatter-gather; cross-shard writes = saga/outbox, not naive 2PC.',
    followUp: 'Pagination/sort across shards?',
    tradeoff: 'Global queries vs shard locality.',
    memoryTrick: 'Scatter-gather = call every branch, then add on a napkin.',
  },
  {
    id: 'reshard',
    title: 'Online Resharding / Migration',
    badge: 'Ops',
    problem: 'Grow from 4→8 shards without downtime.',
    whenToUse: 'Capacity or hot-shard splits.',
    whenAvoid: 'Big-bang cutover without dual-read.',
    mermaid: `flowchart LR
  OLD[Old Shard] -->|CDC/copy| NEW[New Shard]
  NEW --> DUAL[Dual read/validate]
  DUAL --> CUT[Switch routing]
  CUT --> STOP[Stop old writes]`,
    code: `// Phases: copy → dual-write → shadow read compare → flip map → drain
// Tools: DMS/CDC/Kafka; checksum row counts; abort gates
// Keep idempotent writers during dual-write`,
    failure: 'Flip map before catch-up → missing rows.',
    production: 'Per-tenant/shard move; feature flags; instant rollback map.',
    interview30s: 'Reshard with copy, dual-write, validate, cutover, drain.',
    followUp: 'How measure RPO during move?',
    tradeoff: 'Complexity vs downtime.',
    memoryTrick: 'Move house: boxes → dual address → change mail → cancel old.',
  },
  {
    id: 'hot',
    title: 'Hot Partition / Hot Shard',
    badge: 'Failure',
    problem: 'One celebrity customer or status key gets 1M RPS.',
    whenToUse: 'Detect via QPS/CPU per shard metrics.',
    whenAvoid: 'Boolean/status shard keys.',
    mermaid: `flowchart TB
  REQ --> R[Router]
  R --> S1[10K]
  R --> S2[10K]
  R --> S3[1M HOT]`,
    code: `// Mitigations:
// better key, hash, salt (customerId + bucket), split shard,
// cache hot reads, queue writes, adaptive capacity (Dynamo)`,
    failure: 'Caching alone does not fix hot writes.',
    production: 'Alert skew; auto-split playbooks; refuse low-cardinality keys.',
    interview30s: 'Hot shard = uneven key; fix key/salt/split/cache.',
    followUp: 'Salting vs query fan-out?',
    tradeoff: 'Write balance vs read fan-out.',
    memoryTrick: 'Hot shard = one teller with a celebrity line.',
  },
  {
    id: 'ids',
    title: 'Global ID Generation Across Shards',
    badge: 'IDs',
    problem: 'Two shards both issue id=100 → collision.',
    whenToUse: 'Always design global uniqueness with sharding.',
    whenAvoid: 'Central DB sequence SPOF without HA.',
    mermaid: `flowchart LR
  ID[Snowflake] --> TS[Timestamp]
  ID --> SH[Shard ID]
  ID --> SEQ[Sequence]`,
    code: `// shardId + local sequence OR Snowflake-style
long id = (timestamp << 22) | (shardId << 12) | sequence;
// UUID v7 / ULID also fine for many cases
// DB: UNIQUE(idempotency_key) still required for payments`,
    failure: 'Clock rollback → duplicate snowflake if unguarded.',
    production: 'NTP; wait-on-clock-back; document ID format.',
    interview30s: 'Embed shard + time + seq, or UUID — never naïve per-shard ints alone.',
    followUp: 'Pagination by snowflake time?',
    tradeoff: 'Sortable IDs vs randomness.',
    memoryTrick: 'ID = passport country code + serial.',
  },
];
