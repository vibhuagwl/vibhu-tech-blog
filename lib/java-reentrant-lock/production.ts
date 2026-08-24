import type {ConceptBlock} from './types';

export const ATOMICS_CONCEPT: ConceptBlock = {
  id: 'atomics',
  title: 'Lock vs atomic classes',
  why: 'Single-variable CAS updates often do not need a Lock. Compound multi-step invariants do.',
  analogy: 'Turning one dial atomically vs rewriting three ledger lines that must stay consistent together.',
  flow: `counter++  →  AtomicInteger.incrementAndGet() / LongAdder

But:
check balance + update balance + create txn
→ needs one critical section (lock or DB txn)`,
  code: `AtomicInteger c = new AtomicInteger();
c.incrementAndGet(); // prefer over lock for single counter

// Compound — atomics alone insufficient without careful CAS loop / lock
lock.lock();
try {
  if (balance >= amt) {
    balance -= amt;
    txs.add(new Tx(amt));
  }
} finally {
  lock.unlock();
}`,
  diagram: `flowchart TB
  S[Single field update] --> A[Atomic* / LongAdder]
  C[Multi-step invariant] --> L[Lock or DB transaction]`,
  finance: 'Metrics counters → LongAdder. Account balance + booking → lock or DB.',
  failure: 'CAS loop on complex state → ABA / hard to reason; still use lock.',
  debug: 'Contention on Atomic* shows as CAS retries; locks show as blocked threads.',
  whenNot: 'Do not wrap every Atomic in a Lock "for safety".',
  interviewQ: 'When is AtomicInteger not enough for a balance update?',
  hook: 'Atomics for one field; locks for multi-step truth.',
};

export const DB_CONCEPT: ConceptBlock = {
  id: 'db',
  title: 'Java lock vs DB lock vs distributed lock',
  why: 'ReentrantLock only coordinates threads inside one JVM. Multi-instance systems need shared coordination.',
  analogy: 'A lock on your office door does not lock the same vault in another city branch.',
  flow: `Instance 1 ReentrantLock → Account 123  ✗ not seen by Instance 2

Compare:
ReentrantLock          — intra-JVM threads
DB row lock / @Version — durable shared rows
Redis lease + fencing  — cross-process short critical sections
Kafka partition key    — ordered single-writer per key`,
  code: `// WRONG assumption in Spring singleton across 20 pods
private final ReentrantLock lock = new ReentrantLock();
public void update(AccountId id) {
  lock.lock(); // only this pod!
  try { repo.save(...); }
  finally { lock.unlock(); }
}

// Multi-instance: SELECT … FOR UPDATE / optimistic @Version / idempotent txn`,
  diagram: `flowchart TB
  P1[Pod1 RL] --> A[Account 123]
  P2[Pod2 RL] --> A
  Note1[Two locks — no shared exclusion]`,
  finance: 'Two payment pods debiting same account — must be DB/idempotency, not ReentrantLock.',
  failure: 'Silent double-spend across instances.',
  debug: 'Duplicate txn IDs across pods; lock metrics per pod look fine.',
  whenNot: 'Single-process batch job — JVM lock may suffice.',
  interviewQ: 'Does ReentrantLock protect an account across 20 instances?',
  hook: 'Java lock stops at the JVM boundary.',
};

export const TRANSFER_CONCEPT: ConceptBlock = {
  id: 'transfer',
  title: 'Financial transfer — lock ordering',
  why: 'Cross-account transfers need multiple locks; inconsistent order → deadlock.',
  analogy: 'Two people each grab one door of a double door and wait for the other — neither enters.',
  flow: `T1: A → B     Lock A then B
T2: B → A     Lock B then A
→ Deadlock

Fix: always lock min(accountId) then max(accountId)`,
  code: `void transfer(Account a, Account b, long amt) {
  Account first = a.id.compareTo(b.id) < 0 ? a : b;
  Account second = first == a ? b : a;
  first.lock.lock();
  try {
    second.lock.lock();
    try {
      a.debit(amt);
      b.credit(amt);
      recordTxn(a, b, amt);
    } finally {
      second.lock.unlock();
    }
  } finally {
    first.lock.unlock();
  }
}`,
  diagram: `sequenceDiagram
  participant T1
  participant T2
  participant A
  participant B
  T1->>A: lock
  T2->>B: lock
  T1->>B: wait
  T2->>A: wait
  Note over T1,T2: deadlock`,
  finance: 'Classic bank transfer interview + real multi-leg settlement.',
  failure: 'Deadlock → thread dump with circular waiting; payment timeouts.',
  debug: 'jstack / ThreadMXBean.findDeadlockedThreads(); enforce ordered lock helper.',
  whenNot: 'Prefer single DB transaction with ordered row locks for multi-instance.',
  interviewQ: 'How do you prevent deadlock on A↔B transfers?',
  hook: 'Always lock accounts in deterministic order.',
};

export const TRADING_MAP: {data: string; tool: string; why: string}[] = [
  {data: 'Instrument static metadata', tool: 'Immutable / ConcurrentHashMap', why: 'Rarely changes; publish new snapshot'},
  {data: 'Order book (hot)', tool: 'Per-instrument ReentrantLock or striped locks', why: 'Mutating matching engine structure'},
  {data: 'Market data cache (read-heavy)', tool: 'RRWL or StampedLock / volatile snapshot', why: 'Many readers, rare writer'},
  {data: 'Positions counters', tool: 'LongAdder / Atomic* or per-account lock', why: 'Depends if compound invariants'},
  {data: 'Risk limits table', tool: 'RRWL + versioned snapshot', why: 'Read fan-out; admin writes'},
  {data: 'Cross-pod matching', tool: 'Partition ownership / DB — not JVM lock', why: 'Multi-instance'},
];

export const DEADLOCK_CONDITIONS = [
  'Mutual exclusion — resource not shareable',
  'Hold and wait — hold one, wait for another',
  'No preemption — locks not forcibly taken',
  'Circular wait — cycle in wait-for graph',
];

export const DEADLOCK_DUMP = `"pool-1-thread-1" WAITING
   java.util.concurrent.locks.ReentrantLock$NonfairSync
   - waiting to lock <0x...B>
   - locked <0x...A>
"pool-1-thread-2" WAITING
   - waiting to lock <0x...A>
   - locked <0x...B>
Found one Java-level deadlock`;

export const CONTENTION = `Low contention: lock usually free → acquire cheap
High contention: many waiters → park/unpark, context switches, p99 latency explodes

10 threads → same lock → 9 waiting, 1 running

Diagnose: jstack, async-profiler -e lock, JFR Java Monitor Inflate / Lock events, ThreadMXBean`;

export const GRANULARITY = `Coarse: one lock for entire AccountService → simple, low concurrency
Fine: lock per account → high concurrency, more deadlock risk, more memory
Striping: 100,000 accounts → 100 locks via accountId % 100
  + scalability vs one global lock
  - collisions (unrelated accounts share stripe)
  - still not cross-JVM`;

export const POOL_STARVATION: ConceptBlock = {
  id: 'pool',
  title: 'Locks + ExecutorService — pool starvation',
  why: 'Contended locks occupy pool threads; growing the pool does not fix the serial bottleneck and can worsen queues.',
  analogy: 'Ten cashiers all waiting for one stamp — hiring more cashiers does not create more stamps.',
  flow: `Pool = 10
T1 obtains lock → blocks on external API while holding lock
T2–T10 wait for lock
→ 10 threads occupied, 0 useful work → cascade outage`,
  code: `// BAD
lock.lock();
try {
  callPaymentGateway(); // I/O under lock
} finally {
  lock.unlock();
}

// BETTER: minimize lock scope
State snap;
lock.lock();
try { snap = prepare(); }
finally { lock.unlock(); }
callPaymentGateway(snap);
lock.lock();
try { commitLocal(snap); }
finally { lock.unlock(); }`,
  diagram: `flowchart TB
  L[Hold lock] --> IO[HTTP/DB/Kafka]
  IO --> Block[Pool threads stuck]
  Block --> Outage[Latency cascade]`,
  finance: 'Gateway call under account lock during peak — whole pod freezes.',
  failure: 'Increasing corePoolSize masks nothing; queue grows.',
  debug: 'Thread dump: many WAITING on same lock; one RUNNABLE in socketRead',
  whenNot: 'Tiny in-memory critical sections are fine under lock.',
  interviewQ: 'Why does enlarging the pool not fix lock contention?',
  hook: 'Do not hold locks across I/O — pools will starve.',
};

export const TX_SPRING: ConceptBlock = {
  id: 'spring',
  title: 'Locks + @Transactional + Spring singletons',
  why: 'Java lock duration vs DB txn duration vs proxy/@Async thread boundaries interact badly.',
  analogy: 'Two different lock systems (JVM + DB) taken in opposite orders across services → cross-layer deadlock.',
  flow: `Java lock then DB lock  vs  DB lock then Java lock
Inconsistent ordering across code paths → deadlock

@Transactional on singleton + private final ReentrantLock
→ protects only threads in THIS JVM
@Async → different thread; lock still JVM-local
Proxy: self-invocation may skip @Transactional`,
  code: `SERVICE //@Service singleton
private final ReentrantLock lock = new ReentrantLock();

@Transactional
public void process() {
  lock.lock();
  try {
    updateDatabase(); // DB locks inside Java lock
  } finally {
    lock.unlock();
  }
}`,
  diagram: `flowchart TB
  S[Spring singleton] --> RL[ReentrantLock field]
  RL --> JVM[One JVM only]
  TX[@Transactional] --> DB[DB locks]
  JVM -.->|no| Pods[Other pods]`,
  finance: 'Payment service scaled to 20 pods — per-bean lock gives false confidence.',
  failure: 'Cross-layer deadlock: thread holds Java lock waiting DB; other holds DB waiting Java.',
  debug: 'DB lock graphs + jstack together; compare lock order docs.',
  whenNot: 'Prefer one coordination layer for the invariant (usually DB for money).',
  interviewQ: 'What does a ReentrantLock inside a Spring @Service actually protect?',
  hook: 'Singleton lock ≠ cluster lock; mind Java↔DB lock order.',
};
