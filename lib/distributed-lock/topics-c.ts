import type {LockTopic} from './types';

export const TOPICS_C: LockTopic[] = [
  {
    id: 'lease',
    title: 'Lease / TTL & Watchdog',
    badge: 'Correctness',
    problem: 'TTL 10s but debit work takes 30s → second owner appears.',
    whenToUse: 'Always size lease > p99 critical path OR renew (watchdog).',
    whenAvoid: 'Infinite locks without crash recovery.',
    mermaid: `sequenceDiagram
  participant A as App-1
  participant R as Lock Store
  participant B as App-2
  A->>R: acquire TTL=10s
  Note over A: work still running at t=11s
  R-->>R: expire
  B->>R: acquire
  Note over A,B: TWO OWNERS — danger`,
    code: `// Bad: lease shorter than work
lock.tryLock(1, 5, SECONDS); // lease 5s
Thread.sleep(30_000); // still "critical"

// Better: lease with renewal (Redisson watchdog) OR fence writes
boolean ok = lock.tryLock(5, -1, SECONDS); // Redisson: watchdog renews
// Still: pause > session can break assumptions — use fencing for SoR writes`,
    failure: 'GC pause / STW / network delay exceeds lease.',
    production: 'Short critical; renew; fencing token on durable writes.',
    interview30s: 'Lease auto-frees crashes; too short → dual owners; renew or fence.',
    followUp: 'Watchdog vs fixed lease?',
    tradeoff: 'Liveness (expiry) vs safety (no dual owners).',
    memoryTrick: 'Lease = parking meter; overstay and someone else parks.',
  },
  {
    id: 'fencing',
    title: 'Fencing Token',
    badge: 'Correctness',
    problem: 'Old lock holder wakes after expiry and must not overwrite new owner.',
    whenToUse: 'High-correctness writes (ledger); storage can validate token.',
    whenAvoid: 'Best-effort jobs where late write is harmless.',
    mermaid: `sequenceDiagram
  participant A as Client A
  participant L as Lock Service
  participant S as Storage
  participant B as Client B
  A->>L: acquire
  L-->>A: token=101
  Note over A: long pause
  L-->>L: lease expire
  B->>L: acquire
  L-->>B: token=102
  B->>S: write fence=102
  S-->>B: OK
  A->>S: write fence=101
  S-->>A: REJECT`,
    code: `public record LockToken(String key, long fence, String owner) {}

// Lock service increments fence on each grant
// Storage:
UPDATE account SET balance=?, fence=?
WHERE id=? AND fence < ?   -- or fence = expected
// Reject if incoming fence is stale`,
    failure: 'Lock without fencing on shared mutable storage → lost update after expiry.',
    production: 'Monotonic fence per resource; validate on every mutating SoR write.',
    interview30s: 'Newer lock issues higher token; storage rejects lower tokens.',
    followUp: 'How ZooKeeper/Hazelcast CP expose fencing?',
    tradeoff: 'Extra storage check vs silent corruption.',
    memoryTrick: 'Fence = boarding pass number; old pass denied.',
  },
  {
    id: 'failures',
    title: 'Failure Scenarios',
    badge: 'Ops',
    problem: 'Crash, Redis down, partition, expiry mid-flight.',
    whenToUse: 'Design every lock with explicit failure policy.',
    whenAvoid: 'Assuming lock store is always available and correct.',
    mermaid: `flowchart TD
  CRASH[Holder crashes] --> TTL[TTL/ephemeral frees]
  DOWN[Redis down] --> POL{Policy}
  POL -->|fail-closed| REJ[Reject debit]
  POL -->|naive continue| BAD[Dual debit risk]
  PART[Partition] --> RISK[Split brain risk]`,
    code: `try {
  if (!lock.tryLock(...)) throw new LockNotAcquiredException(id);
  debit();
} catch (RedisConnectionFailureException e) {
  // For money: usually FAIL CLOSED — do not debit without coordination
  metrics.increment("lock.redis.down");
  throw new ServiceUnavailableException("lock store unavailable", e);
}`,
    failure: 'Fail-open on money paths; blocked forever without timeout.',
    production: 'Fail-closed for correctness paths; CB; page on lock-store health.',
    interview30s: 'Crash → lease frees; store down → decide fail-closed vs open; partitions hurt.',
    followUp: 'Is Redis lock CP under partition?',
    tradeoff: 'Availability vs safety.',
    memoryTrick: 'If the referee disappears, stop the match for money games.',
  },
  {
    id: 'deadlock',
    title: 'Deadlock Across Accounts',
    badge: 'Concurrency',
    problem: 'Transfer A→B vs B→A grabs locks in opposite order.',
    whenToUse: 'Any multi-resource locking.',
    whenAvoid: 'Holding many locks for long nested calls.',
    mermaid: `flowchart LR
  A1[App-1] -->|Lock A| W1[wait B]
  A2[App-2] -->|Lock B| W2[wait A]`,
    code: `List<String> ids = Stream.of(from, to).sorted().toList(); // deterministic order
for (String id : ids) {
  if (!locks.tryLock(id, token, ttl)) { unlockAll(); throw busy(); }
}
try {
  transfer(from, to, amount);
} finally {
  unlockAll();
}`,
    failure: 'Sorted order forgotten for one code path.',
    production: 'Global order; timeouts; prefer single-row atomic updates when possible.',
    interview30s: 'Always acquire multiple locks in sorted key order; add timeouts.',
    followUp: 'Dining philosophers mapping?',
    tradeoff: 'Order discipline vs complexity of lock-free designs.',
    memoryTrick: 'Always pick up the lower account id first.',
  },
  {
    id: 'tx-order',
    title: 'Lock Ordering vs DB Transaction',
    badge: 'Correctness',
    problem: 'Release lock then TX rolls back — or update cache before commit.',
    whenToUse: 'Any lock wrapping a DB write.',
    whenAvoid: 'Releasing lock before commit when exclusivity must cover commit.',
    mermaid: `flowchart TD
  BAD[Acquire → Update → Release → Rollback] --> POISON[Another reader sees gap]
  GOOD[Acquire → BEGIN → Update → COMMIT → Release] --> OK[Safe]`,
    code: `String token = UUID.randomUUID().toString();
if (!lock.tryLock(key, token, Duration.ofSeconds(10))) throw busy();
try {
  transactionTemplate.executeWithoutResult(status -> {
    Account a = repo.findById(accountId).orElseThrow();
    a.debit(amount);
    repo.save(a);
  }); // commit inside
  kafka.publish(new Debited(accountId, amount)); // after commit ideally outbox
} finally {
  lock.unlock(key, token);
}`,
    failure: 'Lock released while TX still open elsewhere; dual writers.',
    production: 'Lock scope ≥ TX; prefer outbox after commit; keep hold short.',
    interview30s: 'Hold the distributed lock across the DB commit that needs exclusivity.',
    followUp: 'Can FOR UPDATE replace Redis here?',
    tradeoff: 'Longer lock hold vs correctness window.',
    memoryTrick: 'Don\'t drop the baton before the finish line (COMMIT).',
  },
  {
    id: 'vs-optimistic',
    title: 'Distributed Lock vs Optimistic Lock',
    badge: 'Compare',
    problem: 'Choose serialize-everyone vs detect-conflict-and-retry.',
    whenToUse: 'Optimistic when conflicts rare; distributed lock when must serialize.',
    whenAvoid: 'Distributed lock for every read-heavy path.',
    mermaid: `flowchart TD
  D[Distributed lock] --> S[Only one executes]
  O[Optimistic @Version] --> C[Many execute]
  C --> V{version OK?}
  V -->|no| R[Retry/fail]
  V -->|yes| W[Write]`,
    code: `@Entity
class Account {
  @Version Long version;
  BigDecimal balance;
}

@Transactional
public void debitOptimistic(String id, BigDecimal amt) {
  Account a = repo.findById(id).orElseThrow();
  a.debit(amt);
  repo.save(a); // OptimisticLockException on conflict → retry
}

// Sometimes best: atomic SQL
// UPDATE account SET balance = balance - :amt
// WHERE id=:id AND balance >= :amt`,
    failure: 'Optimistic retry storms on hot accounts; lock overuse on cold ones.',
    production: 'Hot account → lock or atomic SQL; cold → @Version.',
    interview30s: 'Lock prevents concurrency; optimistic detects it; SQL can enforce invariants.',
    followUp: 'When is neither needed?',
    tradeoff: 'Wait/fail-fast vs retry CPU.',
    memoryTrick: 'Optimistic = run then check; lock = wait for the lane.',
  },
  {
    id: 'vs-db',
    title: 'Redis Lock vs Database Lock',
    badge: 'Compare',
    problem: 'Pick lock store colocated with the invariant.',
    whenToUse: 'DB lock when critical section is the row; Redis for cross-resource/short app coordination.',
    whenAvoid: 'Redis lock + long DB work without fencing.',
    mermaid: `flowchart TB
  R[Redis lock] --> CS[App critical] --> DB[(DB)]
  DBL[DB FOR UPDATE] --> ROW[Locked row update]`,
    code: `// Prefer FOR UPDATE when debit is only a row mutation
@Transactional
public void debitDb(String id, BigDecimal amt) {
  repo.findByIdForUpdate(id).orElseThrow().debit(amt);
}

// Redis when coordinating non-DB side effects too (careful!)
// or multi-resource without 2PC`,
    failure: 'Double locking Redis+DB without clear ownership story.',
    production: 'One primary exclusion mechanism per invariant.',
    interview30s: 'If the DB row IS the truth, lock in the DB; Redis for faster/app-level coordination.',
    followUp: 'Latency and contention differences?',
    tradeoff: 'DB load vs Redis failure domain.',
    memoryTrick: 'Lock where the money lives when you can.',
  },
  {
    id: 'vs-saga',
    title: 'Distributed Lock vs Saga',
    badge: 'Compare',
    problem: 'Multi-service payment is not fixed by one mutex.',
    whenToUse: 'Saga for multi-service business TX; lock for single critical section.',
    whenAvoid: 'Using a global lock across services as fake distributed TX.',
    mermaid: `flowchart TD
  LOCK[Distributed lock] --> ONE[One critical section]
  SAGA[Saga] --> A[Service A]
  SAGA --> B[Service B]
  SAGA --> C[Service C]
  SAGA --> COMP[Compensations]`,
    code: `// WRONG: lock everything across Payment + Ledger + Notify for minutes
// RIGHT: local locks/TX per service + saga/outbox
payment.reserve();      // local TX
ledger.post();          // local TX + idempotency
notify.send();          // async
// compensate on failure`,
    failure: 'Long cross-service locks → deadlock & outages.',
    production: 'Saga + idempotency keys; locks stay local and short.',
    interview30s: 'Locks coordinate exclusion; sagas coordinate multi-step business outcomes.',
    followUp: 'Orchestration vs choreography?',
    tradeoff: 'Simpler mental model of lock vs real distributed TX needs.',
    memoryTrick: 'Saga = multi-act play with undo scenes; lock = one dressing room.',
  },
  {
    id: 'when-not',
    title: 'When NOT to Use Distributed Locking',
    badge: 'Decision',
    problem: 'Overengineering with Redis locks when a constraint suffices.',
    whenToUse: 'After asking: can DB enforce it?',
    whenAvoid: 'Defaulting to locks for every race.',
    mermaid: `flowchart TD
  N[Need concurrency control?] --> DB{DB can enforce?}
  DB -->|YES| C[Constraint / atomic SQL / @Version]
  DB -->|NO| CO{Need coordination?}
  CO -->|YES| L[Distributed lock]
  CO -->|NO| Q[Queue / partition / idempotency]`,
    code: `// Idempotency key unique constraint beats a lock for "process once"
INSERT INTO processed_request(id) VALUES (?)  -- conflict = already done

// Atomic conditional update beats lock for simple debit
UPDATE account SET balance = balance - ?
WHERE id = ? AND balance >= ?`,
    failure: 'Lock around everything → latency & outage amplifier.',
    production: 'Prefer constraints, atomic SQL, queues, partitions.',
    interview30s: 'Locks are a last resort after DB invariants and idempotency.',
    followUp: 'Example where lock is still required?',
    tradeoff: 'Fewer moving parts vs explicit exclusion.',
    memoryTrick: 'If SQL can say no, don\'t hire a lock bouncer.',
  },
  {
    id: 'observability',
    title: 'Lock Observability',
    badge: 'Ops',
    problem: 'Contention invisible until p99 explodes.',
    whenToUse: 'Always emit acquire/fail/hold metrics.',
    whenAvoid: 'Per-key unbounded cardinality labels.',
    mermaid: `flowchart LR
  APP --> M[Micrometer]
  M --> S[success/fail]
  M --> W[wait/hold]
  M --> T[timeouts]`,
    code: `Timer.Sample sample = Timer.start(registry);
try {
  if (!lock.tryLock(...)) {
    registry.counter("lock.acquire.fail", "resource", "account").increment();
    throw busy();
  }
  registry.counter("lock.acquire.ok", "resource", "account").increment();
  debit();
} finally {
  sample.stop(registry.timer("lock.hold", "resource", "account"));
  unlock();
}`,
    failure: 'No timeout metrics → silent thread pileups.',
    production: 'Alert on fail rate, hold p99, redis latency, hot lock keys.',
    interview30s: 'Measure acquire success/fail, wait, hold, timeouts, store latency.',
    followUp: 'How detect hot account locks?',
    tradeoff: 'Cardinality vs insight.',
    memoryTrick: 'If you can\'t see waits, you can\'t fix contention.',
  },
];
