import type {LockTopic} from './types';

export const TOPICS_B: LockTopic[] = [
  {
    id: 'zookeeper',
    title: 'ZooKeeper / Apache Curator',
    badge: 'ZK',
    problem: 'Need coordination with ephemeral ownership and fair queueing.',
    whenToUse: 'Leader election, strong coordination already on ZK/Curator stack.',
    whenAvoid: 'Simple short mutex — Redis/DB usually enough; ZK ops heavy.',
    mermaid: `flowchart TB
  subgraph ZK[ZooKeeper Ensemble]
    Z1 --- Z2 --- Z3
  end
  A1 -->|create lock-000001| ZK
  A2 -->|create lock-000002| ZK
  A3 -->|create lock-000003| ZK
  A1 -->|smallest seq = owner| CS[Critical]
  A1 -.->|crash ephemeral gone| A2`,
    code: `CuratorFramework client = CuratorFrameworkFactory
    .newClient(zkConnect, new ExponentialBackoffRetry(1000, 3));
client.start();

InterProcessMutex lock =
    new InterProcessMutex(client, "/locks/account/" + accountId);

if (lock.acquire(5, TimeUnit.SECONDS)) {
  try {
    debitInDb(accountId, amount);
  } finally {
    lock.release();
  }
}
// Ephemeral sequential nodes; smallest sequence wins; crash → node vanishes`,
    failure: 'Session expiry mid-work; herd on watch; ZK outage blocks locking.',
    production: 'Curator recipes; short critical; session timeout tuned; monitor ZK.',
    interview30s: 'Ephemeral sequential children under a path; min seq owns; death releases.',
    followUp: 'How watches avoid thundering herd in Curator?',
    tradeoff: 'Stronger coordination model vs operational cost.',
    memoryTrick: 'ZK lock = take a ticket; lowest number is served.',
  },
  {
    id: 'hazelcast',
    title: 'Hazelcast ILock',
    badge: 'IMDG',
    problem: 'Apps already form a Hazelcast cluster and need a named mutex.',
    whenToUse: 'Hazelcast already in architecture for data/compute.',
    whenAvoid: 'Adding full IMDG just for locks.',
    mermaid: `flowchart LR
  A1 --> HZ[(Hazelcast Cluster)]
  A2 --> HZ
  A3 --> HZ
  HZ --> L[ILock account:A100]`,
    code: `@Bean
HazelcastInstance hazelcast() {
  return Hazelcast.newHazelcastInstance();
}

ILock lock = hazelcast.getLock("account:" + accountId);
if (lock.tryLock(5, TimeUnit.SECONDS)) {
  try {
    debitInDb(accountId, amount);
  } finally {
    lock.unlock();
  }
}
// Prefer CP Subsystem FencedLock in modern Hazelcast for stronger guarantees`,
    failure: 'Split-brain without CP config; unlock mistakes; long holds.',
    production: 'Use CP FencedLock when available; keep sections short.',
    interview30s: 'Cluster-wide named lock API when Hazelcast is already the fabric.',
    followUp: 'ILock vs FencedLock?',
    tradeoff: 'Fits IMDG stack vs another failure domain.',
    memoryTrick: 'Hazelcast lock = mutex living inside the grid.',
  },
  {
    id: 'infinispan',
    title: 'Infinispan Clustered Lock',
    badge: 'IMDG',
    problem: 'Infinispan/JBoss stack needs clustered coordination.',
    whenToUse: 'Already on Infinispan; clustered locks API available.',
    whenAvoid: 'Greenfield Spring Boot where Redis/DB is simpler.',
    mermaid: `flowchart TB
  SB[Spring Boot] --> IS[(Infinispan)]
  IS --> N1[Node-1]
  IS --> N2[Node-2]`,
    code: `// Infinispan clustered lock (conceptual Spring wiring)
ClusteredLockManager clm = embed.getClusteredLockManager().get();
ClusteredLock lock = clm.defineLock("account:" + accountId);
if (lock.tryLock(5, TimeUnit.SECONDS).get()) {
  try { debitInDb(accountId, amount); }
  finally { lock.unlock(); }
}`,
    failure: 'Cluster membership changes mid-hold; misconfigured owners.',
    production: 'Prefer ecosystem-native locks; document failure domain.',
    interview30s: 'Clustered lock API in Infinispan for apps already on that grid.',
    followUp: 'When pick Infinispan vs Hazelcast vs Redis?',
    tradeoff: 'Native fit vs learning/ops curve.',
    memoryTrick: 'Infinispan lock = lock beside your cached entries.',
  },
  {
    id: 'file-lock',
    title: 'File / Shared Filesystem Lock',
    badge: 'Legacy',
    problem: 'Legacy batch jobs coordinating via NFS file locks.',
    whenToUse: 'Rare special cases; single shared FS with known semantics.',
    whenAvoid: 'Cloud-native multi-AZ microservices — FS locks are unreliable across NFS.',
    mermaid: `flowchart LR
  A1 --> FS[/shared/account.lock]
  A2 --> FS
  A3 --> FS`,
    code: `try (FileChannel ch = FileChannel.open(path, CREATE, WRITE);
     FileLock fl = ch.tryLock()) {
  if (fl == null) throw new LockNotAcquiredException(path.toString());
  debitInDb(accountId, amount);
}
// Do NOT rely on this across Kubernetes pods + cloud NFS`,
    failure: 'NFS lock semantics vary; stale locks; not multi-region safe.',
    production: 'Migrate to Redis/DB/ZK; treat file locks as legacy.',
    interview30s: 'OS file locks are process/FS local semantics — poor cloud fit.',
    followUp: 'Why Kubernetes + EFS locking is painful?',
    tradeoff: 'Zero new deps vs correctness in distributed FS.',
    memoryTrick: 'File lock = bathroom lock on a shared cabin that moves.',
  },
  {
    id: 'behaviors',
    title: 'Blocking · Non-Blocking · Timed',
    badge: 'API',
    problem: 'API choice changes caller thread and backpressure behavior.',
    whenToUse: 'Match UX: fail-fast vs wait-budget vs park forever (rare).',
    whenAvoid: 'Unbounded lock() on request threads without timeout.',
    mermaid: `flowchart TD
  L[Lock API] --> B[lock — block]
  L --> N[tryLock — non-blocking]
  L --> T[tryLock timeout — timed]`,
    code: `// Blocking — avoid on Tomcat request threads without timeout strategy
lock.lock();
try { work(); } finally { lock.unlock(); }

// Non-blocking
if (!lock.tryLock()) return ResponseEntity.status(409).body("busy");

// Timed — production default for APIs
if (!lock.tryLock(200, TimeUnit.MILLISECONDS)) {
  throw new LockNotAcquiredException(accountId);
}`,
    failure: 'Blocked request threads → pool exhaustion under contention.',
    production: 'Prefer timed tryLock; return 409/429; metric wait time.',
    interview30s: 'lock parks; tryLock returns immediately; timed tryLock caps wait.',
    followUp: 'How size wait timeout vs p99 debit latency?',
    tradeoff: 'Fairness/wait vs fail-fast UX.',
    memoryTrick: 'Timed tryLock = knock, wait a bit, leave.',
  },
  {
    id: 'reentrant',
    title: 'Reentrant vs Non-Reentrant',
    badge: 'Semantics',
    problem: 'Same owner calls into code that acquires the same lock again.',
    whenToUse: 'Reentrant when layered methods share a lock name.',
    whenAvoid: 'Assuming all distributed locks are reentrant.',
    mermaid: `flowchart TD
  T[Owner] --> A[acquire count=1]
  A --> M[method A → method B]
  M --> R{Reentrant?}
  R -->|yes| C[count=2]
  R -->|no| D[block/fail]`,
    code: `RLock lock = redisson.getLock("account:" + id); // reentrant for same thread
lock.lock();
try {
  outer();
  lock.lock(); // same thread OK — hold count++
  try { inner(); }
  finally { lock.unlock(); }
} finally { lock.unlock(); }

// Non-reentrant recipes deadlock yourself on nested acquire`,
    failure: 'Non-reentrant nested acquire → self-deadlock.',
    production: 'Know recipe semantics; prefer flat critical sections.',
    interview30s: 'Reentrant = same owner can nest; count must unwind to zero.',
    followUp: 'Is Curator InterProcessMutex reentrant?',
    tradeoff: 'Convenience vs accidental deep hold times.',
    memoryTrick: 'Reentrant = same badge swipes the door again.',
  },
];
