import type {ShardTopic} from './types';

export const TOPICS_C: ShardTopic[] = [
  {
    id: 'dr-ha',
    title: 'HA vs DR · RPO · RTO',
    badge: 'DR',
    problem: 'Bank wants RPO < 1 min and RTO < 5 min for payment DB.',
    whenToUse: 'Always quantify before picking backup vs Multi-AZ vs cross-region.',
    whenAvoid: 'Confusing HA (uptime) with DR (recover from disaster).',
    mermaid: `flowchart TB
  HA[HIGH AVAILABILITY] --> MAZ[Multi-AZ / replicas / failover]
  DR[DISASTER RECOVERY] --> BAK[Backup / PITR / DR region]
  D[Disaster] --> RPO[RPO data loss window]
  D --> RTO[RTO downtime window]`,
    code: `// Example target (not a guarantee — depends on config):
// RPO = 5 minutes → how much data can we lose?
// RTO = 30 minutes → how long until service back?
// Architecture ladder: backup < replica < Multi-AZ < cross-region < active-active`,
    failure: 'Replicas with lag 10m cannot meet RPO 1m.',
    production: 'Write RPO/RTO into runbooks; measure in game days.',
    interview30s: 'HA keeps service up; DR recovers after catastrophe; RPO/RTO size the design.',
    followUp: 'What architecture for RPO≈0, RTO minutes?',
    tradeoff: 'Lower RPO/RTO → cost/complexity.',
    memoryTrick: 'RPO = lost pages; RTO = time to reopen the bank.',
  },
  {
    id: 'replication',
    title: 'Replication: Sync · Async · Primary/Replica',
    badge: 'DR',
    problem: 'Choose durability vs latency for banking writes.',
    whenToUse: 'Sync/semi-sync for low RPO; async for distant replicas.',
    whenAvoid: 'Assuming replica protects against DELETE/corruption.',
    mermaid: `flowchart LR
  APP --> P[Primary]
  P -->|sync| R1[Replica]
  P -->|async| R2[Replica]
  P -->|promote| NP[New Primary]`,
    code: `-- WRITE → primary; READ → replica (with lag caveats)
-- Replication copies CURRENT state including bad DELETEs
-- Backup/PITR = historical recovery point
-- Monitor replication lag seconds`,
    failure: 'Promote lagging replica → lost commits (RPO realized).',
    production: 'Lag alerts; fencing old primary; connection drain.',
    interview30s: 'Sync lowers loss risk; async lowers latency; replica ≠ backup.',
    followUp: 'Semi-sync MySQL meaning?',
    tradeoff: 'Commit latency vs data loss.',
    memoryTrick: 'Replica = live mirror; backup = time machine.',
  },
  {
    id: 'failover',
    title: 'Failover · Multi-AZ · Multi-Region',
    badge: 'DR',
    problem: 'AZ-1 primary dies; apps must reconnect to new primary.',
    whenToUse: 'Multi-AZ for AZ failure; cross-region for region DR.',
    whenAvoid: 'Active-active without conflict strategy.',
    mermaid: `flowchart TB
  REG[Region] --> AZ1[AZ-1 Primary]
  REG --> AZ2[AZ-2 Standby]
  AZ1 -.->|replicate| AZ2
  FAIL[AZ-1 down] --> PROMO[Promote AZ-2]
  PROMO --> DNS[Endpoint/DNS flip]`,
    code: `// AWS RDS/Aurora Multi-AZ: managed failover; app uses stable endpoint
// Cross-region: promote DR replica; Route53/failover routing
// Active-passive simpler than active-active (conflicts, clocks, ownership)`,
    failure: 'Stale writer after split-brain without fencing.',
    production: 'Test failover; validate RPO; Spring pool eviction on failover.',
    interview30s: 'Multi-AZ handles AZ loss; multi-region is DR; promote + redirect traffic.',
    followUp: 'Failback procedure?',
    tradeoff: 'HA speed vs cross-region cost/lag.',
    memoryTrick: 'Multi-AZ = spare vault in next building; multi-region = other city.',
  },
  {
    id: 'backup',
    title: 'Backup · PITR · Snapshot · Clone',
    badge: 'DR',
    problem: 'Need recover to 10:44 after 10:45 bad DELETE.',
    whenToUse: 'PITR for logical mistakes; snapshots for env clones; clones for test.',
    whenAvoid: 'Only replicas — they replay the DELETE.',
    mermaid: `flowchart LR
  B[10:00 backup] --> W1[10:15 INSERT]
  W1 --> W2[10:30 UPDATE]
  W2 --> BAD[10:45 DELETE]
  BAD --> PITR[Replay WAL/binlog to 10:44]`,
    code: `# PostgreSQL logical
pg_dump bankdb > bankdb.sql
psql bankdb < bankdb.sql
# Physical: pg_basebackup + WAL archive → PITR

# MySQL
mysqldump bankdb > bankdb.sql
# + binary logs for PITR

# AWS: RDS snapshot / Aurora clone / DynamoDB PITR
# Clone ≠ continuous replica; Snapshot ≠ always PITR granularity`,
    failure: 'Unvalidated backups fail when you need them.',
    production: 'Immutable backups; restore drills; checksum apps.',
    interview30s: 'PITR = backup + logs to a timestamp; clone for envs; replica for HA.',
    followUp: 'Backup vs clone vs replica table?',
    tradeoff: 'Storage cost vs fine RPO.',
    memoryTrick: 'PITR = rewind the CCTV to before the mistake.',
  },
  {
    id: 'corruption',
    title: 'Corruption · Accidental DELETE · Ransomware',
    badge: 'DR',
    problem: 'DELETE replicated to all replicas; ransomware encrypts primary+connected replicas.',
    whenToUse: 'Immutable/offline backups; isolated restore env.',
    whenAvoid: 'Blind failover when replicas share the poison.',
    mermaid: `flowchart TD
  BAD[Bad DELETE / corruption] --> REP[Replicas copy bad state]
  BAD2[Ransomware] --> ISO[Immutable backup]
  ISO --> AIR[Air-gapped restore]
  AIR --> VAL[Security validation]
  VAL --> PROD[Return to prod]`,
    code: `-- Accidental DELETE at 10:16 with replicas → promote does NOT help
-- PITR to 10:14 → validate → selective restore
-- Unique audit + restricted prod creds + MFA break-glass`,
    failure: 'Restoring infected snapshot back into prod network.',
    production: 'Immutable S3/Object Lock; quarterly ransomware DR.',
    interview30s: 'If replicas have the bad state, use PITR/immutable backup — not promote.',
    followUp: 'How detect silent corruption?',
    tradeoff: 'Isolation delay vs safety.',
    memoryTrick: 'Poisoned mirrors need a clean photograph from the vault.',
  },
  {
    id: 'shard-dr',
    title: 'Shard-Level DR',
    badge: 'DR',
    problem: 'Shard-2 fails; other shards must keep serving.',
    whenToUse: 'Independent primary/replica per shard.',
    whenAvoid: 'One shared replica topology for all shards without isolation.',
    mermaid: `flowchart TB
  APP --> ROUTER
  ROUTER --> S1
  ROUTER --> S2
  ROUTER --> S3
  S2 --> X[FAIL]
  X --> P2[Promote S2 replica]
  P2 --> ROUTER`,
    code: `// Each shard: Primary + Replica(s) + backups
// Router metadata: shard2 → new endpoint after promote
// Region failure: promote DR replicas for ALL shards + flip global routing
// Partition failure ≠ shard failure (logical part vs whole DB instance)`,
    failure: 'Router still points to dead primary.',
    production: 'Per-shard health; automated promote; map versioning.',
    interview30s: 'Fail one shard independently; promote its replica; update router.',
    followUp: 'DR for 100 shards simultaneously?',
    tradeoff: 'Isolation vs many failure domains to operate.',
    memoryTrick: 'Shards = ships; sink one, fleet sails; launch that ship’s lifeboat.',
  },
  {
    id: 'spring-failover',
    title: 'Spring Boot Failover · Retry · Idempotency',
    badge: 'Spring',
    problem: 'Commit succeeded but client timed out; retry doubles payment.',
    whenToUse: 'Idempotency keys + bounded retries on failover.',
    whenAvoid: 'Unlimited retry storms into recovering primary.',
    mermaid: `flowchart TD
  APP -->|COMMIT OK| DB
  APP -->|timeout| RETRY
  RETRY --> ID[Idempotency-Key UNIQUE]
  POOL[Stale pool] --> EVICT[Validate/evict]
  CB[Circuit breaker] --> BACKOFF`,
    code: `CREATE UNIQUE INDEX idx_payment_idempotency ON payments(idempotency_key);

// Failover: DNS/endpoint changes; Hikari validationTimeout; connectionTimeout
// Retry only idempotent ops; exponential backoff + jitter; bulkhead
// Do NOT retry every TX blindly after failover`,
    failure: 'Retry storm → thundering herd on new primary.',
    production: 'Idempotency table; pool settings; game-day reconnect tests.',
    interview30s: 'Failover needs pool recovery + idempotent payments + bounded retries.',
    followUp: 'Hikari leakDetectionThreshold?',
    tradeoff: 'Aggressive reconnect vs overload.',
    memoryTrick: 'Idempotency = receipt number so Pay isn\'t pressed twice.',
  },
];
