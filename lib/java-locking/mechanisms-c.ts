import type {Mechanism} from './types';

export const MECHANISMS_C: Mechanism[] = [
  {
    id: 'atomic',
    name: 'Atomic classes & CAS',
    since: 'Java 5 (+ LongAdder Java 8)',
    problemTitle: 'Request Counter / Metrics',
    problem: '1000 threads increment a shared counter. synchronized works but contends; int++ loses updates.',
    brokenCode: `static int hits = 0;
// in each request:
hits++; // LOST UPDATES`,
    bugTrace: `Memory = 100
T1 READ 100 / CAS intent +10
T2 READ 100 / CAS intent +20
T1 SUCCESS → 110
T2 FAIL → reread 110 → SUCCESS → 130
Without CAS/Atomic: both write and lose an increment
❌ BUG: Non-atomic RMW`,
    bugLabel: '❌ BUG: Non-atomic increment',
    fixedCode: `import java.util.concurrent.*;
import java.util.concurrent.atomic.*;

public class AtomicCounterDemo {
  public static void main(String[] args) throws Exception {
    AtomicInteger balance = new AtomicInteger(1000);
    System.out.println("CAS 1000->900: " + balance.compareAndSet(1000, 900));

    LongAdder hits = new LongAdder();
    ExecutorService ex = Executors.newFixedThreadPool(32);
    for (int i = 0; i < 1000; i++) ex.submit(hits::increment);
    ex.shutdown();
    ex.awaitTermination(5, TimeUnit.SECONDS);
    System.out.println("hits=" + hits.sum());

    AtomicReference<String> state = new AtomicReference<>("NEW");
    state.compareAndSet("NEW", "AUTHORIZED");
    System.out.println("state=" + state.get());
  }
}

// Also: incrementAndGet, getAndIncrement, updateAndGet, accumulateAndGet`,
    fixTrace: `CAS retries until success — no mutex for single-variable updates
LongAdder stripes hot counters
✅ FIXED`,
    expectedOutput: `CAS 1000->900: true
hits=1000
state=AUTHORIZED`,
    mermaid: `sequenceDiagram
  participant T1 as Thread-1
  participant M as Memory
  participant T2 as Thread-2
  T1->>M: READ 100
  T2->>M: READ 100
  T1->>M: CAS 100 to 110 SUCCESS
  T2->>M: CAS 100 to 120 FAIL
  T2->>M: READ 110
  T2->>M: CAS 110 to 130 SUCCESS`,
    whyFixWorks: 'CAS is optimistic: update only if value unchanged. Atomics wrap CAS loops. LongAdder reduces contention via cells.',
    whenNot: 'Multi-variable invariants (transfer A and B); need waiting/conditions; coordinate across JVMs.',
    alternative: 'synchronized/Lock for multi-field; DB transaction for durable balance; LongAdder vs AtomicLong under contention — measure.',
    interview30s: 'Atomic*/CAS provide lock-free single-variable updates via compare-and-swap retries; LongAdder for hot counters.',
    seniorFollowUp: 'AtomicInteger vs LongAdder — when does striping win?',
    productionFollowUp: 'Can CAS replace a DB constraint for money? (No.)',
    memoryTrick: 'Atomic/CAS = “Try the update; retry if someone changed it.”',
    beforeAfter: [
      {without: 'Lost increments', with: 'Exact count'},
      {without: 'Heavy mutex', with: 'CAS / striped adder'},
    ],
  },
  {
    id: 'concurrent-hash-map',
    name: 'ConcurrentHashMap',
    since: 'Java 5 (Java 8+ redesign)',
    problemTitle: 'User Session Cache',
    problem: 'containsKey + put races create duplicate expensive loads.',
    brokenCode: `if (!cache.containsKey(key)) {
  cache.put(key, loadValue(key)); // race: two loads
}`,
    bugTrace: `T1 containsKey false
T2 containsKey false
T1 load + put
T2 load + put  (duplicate work / clobber)
❌ BUG: Non-atomic compound map op`,
    bugLabel: '❌ BUG: containsKey + put race',
    fixedCode: `import java.util.concurrent.*;

public class SessionCacheDemo {
  static final ConcurrentHashMap<String, String> cache = new ConcurrentHashMap<>();

  static String loadValue(String key) {
    System.out.println(Thread.currentThread().getName() + " loading " + key);
    return "session-" + key;
  }

  public static void main(String[] args) throws Exception {
    ExecutorService ex = Executors.newFixedThreadPool(8);
    for (int i = 0; i < 8; i++) {
      ex.submit(() -> cache.computeIfAbsent("user-1", SessionCacheDemo::loadValue));
    }
    ex.shutdown();
    ex.awaitTermination(2, TimeUnit.SECONDS);
    System.out.println("value=" + cache.get("user-1"));
  }
}

// Java 7: segmented locking narrative (historical)
// Java 8+: bins + CAS + synchronized on bin nodes for updates; reads mostly wait-free`,
    fixTrace: `computeIfAbsent runs mapping function once per key (under map’s atomicity rules)
✅ FIXED`,
    expectedOutput: `... loading user-1   (typically once)
value=session-user-1`,
    outputNote: 'Mapping function should be side-effect safe; avoid blocking forever inside compute*.',
    mermaid: `sequenceDiagram
  participant T1 as T1
  participant M as ConcurrentHashMap
  participant T2 as T2
  T1->>M: computeIfAbsent
  T2->>M: computeIfAbsent
  M->>M: only one load wins
  M-->>T1: value
  M-->>T2: same value`,
    whyFixWorks: 'CHM provides atomic compound operations. Do not assemble check-then-act yourself.',
    whenNot: 'Need cross-key transactions; null values (CHM disallows nulls); multi-JVM cache coherence.',
    alternative: 'Caffeine/Guava LoadingCache; Redis for distributed cache.',
    interview30s: 'ConcurrentHashMap allows concurrent reads/updates; use computeIfAbsent/merge — never containsKey+put for atomic init.',
    seniorFollowUp: 'What changed from Java 7 segments to Java 8+ bins/CAS?',
    productionFollowUp: 'How can computeIfAbsent deadlock with nested calls?',
    memoryTrick: 'CHM = “Concurrent dictionary with atomic verbs.”',
    beforeAfter: [
      {without: 'Double load', with: 'Single computeIfAbsent'},
    ],
  },
  {
    id: 'deadlock',
    name: 'Deadlock',
    since: 'Classic',
    problemTitle: 'Transfer A→B and B→A',
    problem: 'Two transfers lock accounts in opposite order and wedge forever.',
    brokenCode: `void transfer(Account from, Account to, int amount) {
  synchronized (from) {
    synchronized (to) {
      from.debit(amount);
      to.credit(amount);
    }
  }
}
// T1 transfer(A,B) locks A then B
// T2 transfer(B,A) locks B then A → DEADLOCK`,
    bugTrace: `Thread-1 owns Lock-A waits Lock-B
Thread-2 owns Lock-B waits Lock-A
❌ BUG: Deadlock cycle`,
    bugLabel: '❌ BUG: Deadlock',
    fixedCode: `import java.util.concurrent.locks.*;

public class DeadlockFixedTransfer {
  static class Account {
    final String id;
    int balance;
    final ReentrantLock lock = new ReentrantLock();
    Account(String id, int balance) { this.id = id; this.balance = balance; }
  }

  static boolean transfer(Account a, Account b, int amount) throws InterruptedException {
    Account first = a.id.compareTo(b.id) < 0 ? a : b;
    Account second = first == a ? b : a;
    if (!first.lock.tryLock(100, java.util.concurrent.TimeUnit.MILLISECONDS)) return false;
    try {
      if (!second.lock.tryLock(100, java.util.concurrent.TimeUnit.MILLISECONDS)) return false;
      try {
        if (a.balance < amount) return false;
        a.balance -= amount;
        b.balance += amount;
        return true;
      } finally { second.lock.unlock(); }
    } finally { first.lock.unlock(); }
  }

  public static void main(String[] args) throws Exception {
    Account a = new Account("A", 1000);
    Account b = new Account("B", 1000);
    Thread t1 = new Thread(() -> {
      try { System.out.println("t1 " + transfer(a, b, 100)); } catch (Exception e) {}
    });
    Thread t2 = new Thread(() -> {
      try { System.out.println("t2 " + transfer(b, a, 100)); } catch (Exception e) {}
    });
    t1.start(); t2.start(); t1.join(); t2.join();
    System.out.println("A=" + a.balance + " B=" + b.balance);
  }
}`,
    fixTrace: `Consistent ordering by account id OR tryLock timeouts
✅ FIXED`,
    expectedOutput: `t1 true
t2 true
A=1000 B=1000`,
    outputNote: 'Net may be zero if both succeed opposite ways; important part is no hang.',
    mermaid: `flowchart TB
  T1[Thread-1 owns A] -->|waits| B[Lock-B]
  T2[Thread-2 owns B] -->|waits| A[Lock-A]
  B -.-> A`,
    whyFixWorks: 'Breaks circular wait via global lock order and/or timed tryLock with retry/backoff.',
    whenNot: 'N/A — deadlock is a bug; prevention is the feature.',
    alternative: 'Single lock for both; actor model; DB transaction with consistent lock order.',
    interview30s: 'Deadlock needs circular wait. Prevent with lock ordering, smaller critical sections, and tryLock timeouts; detect with jstack/JFR.',
    seniorFollowUp: 'How do you detect deadlock in production without waiting for a customer incident?',
    productionFollowUp: 'Show me a deadlock thread dump and walk the cycle.',
    memoryTrick: 'Deadlock = “Two people holding each other’s keys.”',
    beforeAfter: [
      {without: 'Permanent hang', with: 'Ordered/timed locks'},
    ],
  },
  {
    id: 'livelock',
    name: 'Livelock',
    since: 'Classic',
    problemTitle: 'Two polite threads forever yielding',
    problem: 'Both see the other and repeatedly release — active but no progress.',
    brokenCode: `while (true) {
  if (otherWants) { yieldAndRetry(); continue; }
  doWork(); break;
}`,
    bugTrace: `T1 sees T2 → releases
T2 sees T1 → releases
Retry forever
❌ BUG: Livelock (active, no progress)`,
    bugLabel: '❌ BUG: Livelock',
    fixedCode: `import java.util.concurrent.ThreadLocalRandom;
import java.util.concurrent.atomic.AtomicBoolean;

public class LivelockFixedDemo {
  static final AtomicBoolean resource = new AtomicBoolean(false);

  static void politeWorker(String name) throws InterruptedException {
    for (int i = 0; i < 100; i++) {
      if (resource.compareAndSet(false, true)) {
        System.out.println(name + " worked");
        resource.set(false);
        return;
      }
      // randomized backoff breaks symmetry
      Thread.sleep(ThreadLocalRandom.current().nextInt(1, 5));
    }
    System.out.println(name + " gave up");
  }

  public static void main(String[] args) throws Exception {
    Thread t1 = new Thread(() -> { try { politeWorker("T1"); } catch (Exception e) {} });
    Thread t2 = new Thread(() -> { try { politeWorker("T2"); } catch (Exception e) {} });
    t1.start(); t2.start(); t1.join(); t2.join();
  }
}`,
    fixTrace: `Randomized backoff / priority / tryLock timeout breaks endless politeness
✅ FIXED`,
    expectedOutput: `T1 worked
T2 worked`,
    mermaid: `sequenceDiagram
  participant T1
  participant T2
  T1->>T2: sees contention → yield
  T2->>T1: sees contention → yield
  Note over T1,T2: no progress until asymmetry`,
    whyFixWorks: 'Livelock needs symmetry-breaking: backoff, fairness policy, or different priorities.',
    whenNot: 'N/A',
    alternative: 'Blocking locks with queues; exponential backoff with jitter.',
    interview30s: 'Deadlock = blocked cycle. Livelock = threads keep running but make no progress; fix with backoff/asymmetry.',
    seniorFollowUp: 'Where have you seen livelock in retry storms?',
    productionFollowUp: 'How do CPU-high + zero-throughput graphs suggest livelock?',
    memoryTrick: 'Livelock = “Two people continuously stepping aside in a hallway.”',
    beforeAfter: [
      {without: 'Busy no progress', with: 'Backoff / winner'},
    ],
  },
  {
    id: 'starvation',
    name: 'Starvation',
    since: 'Classic',
    problemTitle: 'Low-priority work never runs',
    problem: 'Writers or high-priority tasks keep winning; a waiter rarely acquires.',
    brokenCode: `// unfair lock + continuous high-priority acquire loops
while (true) highPriority.lock(); // low priority rarely enters`,
    bugTrace: `High priority repeatedly acquires
Low priority waits indefinitely
❌ BUG: Starvation`,
    bugLabel: '❌ BUG: Starvation',
    fixedCode: `import java.util.concurrent.locks.ReentrantLock;

public class FairLockStarvationDemo {
  // fairness helps scheduling order (throughput trade-off)
  static final ReentrantLock LOCK = new ReentrantLock(true);

  public static void main(String[] args) {
    Runnable low = () -> {
      LOCK.lock();
      try { System.out.println("low critical"); }
      finally { LOCK.unlock(); }
    };
    Runnable high = () -> {
      for (int i = 0; i < 3; i++) {
        LOCK.lock();
        try { System.out.println("high " + i); }
        finally { LOCK.unlock(); }
      }
    };
    new Thread(high, "high").start();
    new Thread(low, "low").start();
  }
}`,
    fixTrace: `Fair lock / bounded retries / separate queues reduce indefinite postponement
✅ Mitigated`,
    expectedOutput: `high 0
...
low critical`,
    outputNote: 'Fairness is not free — measure latency impact.',
    mermaid: `flowchart TB
  H[High priority loop] -->|acquires| L[Lock]
  Low[Low priority] -.->|rarely| L`,
    whyFixWorks: 'Fairness policies and avoiding infinite acquire loops give waiters a turn.',
    whenNot: 'Blindly enabling fairness everywhere (hurts throughput).',
    alternative: 'Priority aging; separate thread pools; RW lock writer preference tuning.',
    interview30s: 'Starvation is indefinite postponement under scheduling/lock unfairness; fairness and bounded critical sections help.',
    seniorFollowUp: 'How do you prove writer starvation on a ReadWriteLock?',
    productionFollowUp: 'What SLI shows a starved consumer group?',
    memoryTrick: 'Starvation = “One person never gets a turn.”',
    beforeAfter: [
      {without: 'Indefinite wait', with: 'Fair / aged scheduling'},
    ],
  },
  {
    id: 'distributed-locking',
    name: 'Distributed Locking',
    since: 'Systems concern',
    problemTitle: 'Three Spring Boot instances, one scheduled job',
    problem: 'synchronized only protects inside one JVM. Three pods all run @Scheduled.',
    brokenCode: `@Scheduled(cron = "0 * * * * *")
public synchronized void settle() {
  // still runs on EVERY pod — synchronized is per-JVM
}`,
    bugTrace: `JVM-1 synchronized
JVM-2 synchronized
JVM-3 synchronized
 → all mutate shared DB/Redis job
❌ BUG: JVM lock ≠ distributed lock`,
    bugLabel: '❌ BUG: synchronized across cluster',
    fixedCode: `// Conceptual production pattern (see /distributed-systems locking guides)
// 1) Try acquire lock with ownership token + TTL (lease)
// 2) Do work
// 3) Release only if still owner
// 4) Prefer fencing token so late holders cannot commit

public boolean runOnlyOnce(String jobId) {
  String token = UUID.randomUUID().toString();
  if (!redisLock.tryAcquire("job:" + jobId, token, Duration.ofSeconds(30))) {
    return false; // another instance owns it
  }
  try {
    settlePayments();
    return true;
  } finally {
    redisLock.release("job:" + jobId, token); // compare token
  }
}

// Failure modes to design for:
// - GC pause longer than TTL → two owners
// - clock issues
// - process kill after work before release
// - needing fencing tokens with DB write path`,
    fixTrace: `Only one instance acquires lease
Others skip
Fencing protects stale owners
✅ FIXED (with real failure design)`,
    expectedOutput: `instance-a acquired
instance-b skipped
instance-c skipped`,
    mermaid: `flowchart TB
  P1[Pod1] --> L[Distributed Lock Store]
  P2[Pod2] --> L
  P3[Pod3] --> L
  L --> DB[(Shared DB)]`,
    whyFixWorks: 'Cluster-wide exclusion needs a shared lock service plus lease/ownership/fencing — not a monitor.',
    whenNot: 'Single instance apps; prefer DB unique constraints/idempotency when they fit better than locks.',
    alternative: 'ShedLock; DB advisory locks; ZooKeeper/etcd; outbox + idempotency keys.',
    interview30s: 'synchronized cannot coordinate multiple JVMs. Distributed locks need lease, ownership, and usually fencing — naive SET NX is not enough.',
    seniorFollowUp: 'What is a fencing token and why do locks without it fail?',
    productionFollowUp: 'What happens when the lock holder GC-pauses past TTL?',
    memoryTrick: 'Distributed lock = “One bathroom key for the whole office building — with an expiry badge.”',
    beforeAfter: [
      {without: 'All pods run job', with: 'Single winner + fence'},
    ],
    tabs: {
      production: 'Deep dive already on this site: /distributed-systems (Redis/ZK/DB locking). This page focuses on when JVM locks stop being enough.',
    },
  },
  {
    id: 'db-locking',
    name: 'Database Locking',
    since: 'SQL / JPA',
    problemTitle: 'Two payment workers, same row',
    problem: 'Java locks do not protect rows seen by other services/pods.',
    brokenCode: `Account a = repo.findById(id); // no lock
a.setBalance(a.getBalance() - 100);
repo.save(a); // lost update across workers`,
    bugTrace: `Worker1 and Worker2 read version=1
Both write → last write wins
❌ BUG: Lost update`,
    bugLabel: '❌ BUG: No DB concurrency control',
    fixedCode: `// Optimistic
@Entity
class Account {
  @Id Long id;
  BigDecimal balance;
  @Version Long version; // UPDATE ... WHERE version=?
}

// Pessimistic
@Lock(LockModeType.PESSIMISTIC_WRITE)
@Query("select a from Account a where a.id = :id")
Account findForUpdate(@Param("id") Long id);

// Java lock protects in-memory structure in ONE process.
// DB lock/transaction protects durable shared state.`,
    fixTrace: `Optimistic: version check fails → retry
Pessimistic: SELECT FOR UPDATE blocks second worker
✅ FIXED at data layer`,
    expectedOutput: `Worker2 gets ObjectOptimisticLockingFailureException → retry
or waits on row lock`,
    mermaid: `sequenceDiagram
  participant W1 as Worker1
  participant DB as Database
  participant W2 as Worker2
  W1->>DB: SELECT FOR UPDATE id=1
  W2->>DB: SELECT FOR UPDATE id=1
  DB-->>W2: WAIT
  W1->>DB: UPDATE balance
  W1->>DB: COMMIT
  DB-->>W2: row lock granted`,
    whyFixWorks: 'Database enforces concurrency on shared durable state across processes.',
    whenNot: 'Pure in-memory single-JVM cache (Java lock/CHM enough).',
    alternative: 'Idempotency keys; serializable isolation; event sourcing.',
    interview30s: 'Use @Version for conflict detection and PESSIMISTIC_WRITE when you must serialize row changes across workers.',
    seniorFollowUp: 'When is optimistic locking the wrong choice for payments?',
    productionFollowUp: 'How do you tune lock wait timeouts vs fail-fast retries?',
    memoryTrick: 'DB lock = “The ledger’s own padlock — not your JVM’s.”',
    beforeAfter: [
      {without: 'Lost update', with: 'Version / row lock'},
    ],
  },
];
