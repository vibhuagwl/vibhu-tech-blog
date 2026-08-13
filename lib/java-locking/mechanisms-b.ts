import type {Mechanism} from './types';

export const MECHANISMS_B: Mechanism[] = [
  {
    id: 'read-write-lock',
    name: 'ReentrantReadWriteLock',
    since: 'Java 5',
    problemTitle: 'Product Catalog / Config Cache',
    problem: '1000 threads read config; rare updates. A single exclusive lock serializes readers unnecessarily.',
    brokenCode: `private final Object lock = new Object();
private Map<String, String> catalog = Map.of();

public String get(String sku) {
  synchronized (lock) { // readers block each other
    return catalog.get(sku);
  }
}`,
    bugTrace: `T1 READ ─┐
T2 READ ─┼── all serialized on one monitor
T3 READ ─┘
Throughput tanks on read-heavy path
❌ BUG: Over-locking readers`,
    bugLabel: '❌ BUG: Exclusive lock for read-heavy workload',
    fixedCode: `import java.util.*;
import java.util.concurrent.locks.*;

public class CatalogReadWriteDemo {
  private final ReentrantReadWriteLock rw = new ReentrantReadWriteLock();
  private Map<String, String> catalog = new HashMap<>();

  public String get(String sku) {
    rw.readLock().lock();
    try {
      return catalog.get(sku);
    } finally {
      rw.readLock().unlock();
    }
  }

  public void put(String sku, String name) {
    rw.writeLock().lock();
    try {
      Map<String, String> copy = new HashMap<>(catalog);
      copy.put(sku, name);
      catalog = copy;
    } finally {
      rw.writeLock().unlock();
    }
  }

  public static void main(String[] args) {
    CatalogReadWriteDemo c = new CatalogReadWriteDemo();
    c.put("SKU-1", "Coffee");
    System.out.println(c.get("SKU-1"));
  }
}`,
    fixTrace: `Many readers hold read lock together
Writer needs exclusive write lock
Readers block writer; writer blocks new readers
✅ FIXED`,
    expectedOutput: `Coffee`,
    mermaid: `flowchart LR
  R1[Reader1] --> RL[ReadLock]
  R2[Reader2] --> RL
  R3[Reader3] --> RL
  RL --> DATA[Shared Catalog]
  W1[Writer] --> WL[WriteLock]
  WL -.->|exclusive| DATA`,
    whyFixWorks: 'Read lock is shared; write lock is exclusive. Improves read throughput when writes are rare.',
    whenNot: 'Extremely short critical sections (overhead may lose); write-heavy; need optimistic read → StampedLock.',
    alternative: 'StampedLock for optimistic reads; ConcurrentHashMap for many map cases; immutable snapshot publish.',
    interview30s: 'ReadWriteLock allows concurrent readers and exclusive writers — use for read-mostly shared state in one JVM.',
    seniorFollowUp: 'Can a thread upgrade read→write? (generally no — deadlock risk)',
    productionFollowUp: 'How do you detect writer starvation?',
    memoryTrick: 'ReadWriteLock = “Library: many readers, one librarian shelving.”',
    beforeAfter: [
      {without: 'Readers serialize', with: 'Concurrent readers'},
      {without: 'Low read throughput', with: 'Higher read throughput'},
    ],
  },
  {
    id: 'stamped-lock',
    name: 'StampedLock',
    since: 'Java 8',
    problemTitle: 'High-read geo / location cache',
    problem: 'Reads dominate. Optimistic read avoids acquiring a read lock if no write occurred.',
    brokenCode: `// Always taking write lock for tiny reads
lock.writeLock();
try { return lat; } finally { lock.unlockWrite(); }`,
    bugTrace: `All readers contend like writers
❌ BUG: Pessimistic by default on a read ocean`,
    bugLabel: '❌ BUG: No optimistic path',
    fixedCode: `import java.util.Arrays;
import java.util.concurrent.locks.StampedLock;

public class GeoStampedLockDemo {
  private final StampedLock lock = new StampedLock();
  private double lat;
  private double lon;

  public void update(double lat, double lon) {
    long stamp = lock.writeLock();
    try {
      this.lat = lat;
      this.lon = lon;
    } finally {
      lock.unlockWrite(stamp);
    }
  }

  public double[] read() {
    long stamp = lock.tryOptimisticRead();
    double la = lat, lo = lon;
    if (!lock.validate(stamp)) {
      stamp = lock.readLock();
      try {
        la = lat; lo = lon;
      } finally {
        lock.unlockRead(stamp);
      }
    }
    return new double[]{la, lo};
  }

  public static void main(String[] args) {
    GeoStampedLockDemo g = new GeoStampedLockDemo();
    g.update(12.97, 77.59);
    System.out.println(Arrays.toString(g.read()));
  }
}`,
    fixTrace: `Optimistic read → copy fields → validate stamp
If writer ran → fall back to read lock
✅ FIXED`,
    expectedOutput: `[12.97, 77.59]`,
    mermaid: `sequenceDiagram
  participant R as Reader
  participant L as StampedLock
  participant W as Writer
  R->>L: tryOptimisticRead
  R->>R: copy lat/lon
  W->>L: writeLock
  W->>W: update
  W->>L: unlockWrite
  R->>L: validate = false
  R->>L: readLock
  R->>R: re-read
  R->>L: unlockRead`,
    whyFixWorks: 'Optimistic read is stamp-validated. No blocking if no write conflicted during the read window.',
    whenNot: 'Need reentrancy; complex code that calls unknown methods while optimistic; write-heavy.',
    alternative: 'ReadWriteLock for simpler reentrant reads; immutable snapshots.',
    interview30s: 'StampedLock adds optimistic reads validated by stamp — great for read-heavy, non-reentrant scenarios when measured.',
    seniorFollowUp: 'Why is StampedLock not reentrant, and how does that bite you?',
    productionFollowUp: 'How do you benchmark optimistic success rate?',
    memoryTrick: 'StampedLock = “Read first, verify the ticket later.”',
    beforeAfter: [
      {without: 'Always lock', with: 'Optimistic then validate'},
    ],
  },
  {
    id: 'lock-support',
    name: 'LockSupport',
    since: 'Java 5',
    problemTitle: 'Building a tiny gate (park/unpark)',
    problem: 'wait/notify require a monitor and are easy to misuse when implementing synchronizers.',
    brokenCode: `// Busy spin until flag flips
while (!ready) { /* burn CPU */ }`,
    bugTrace: `CPU pegged waiting for a signal
❌ BUG: No efficient park`,
    bugLabel: '❌ BUG: Spin instead of park',
    fixedCode: `import java.util.concurrent.locks.LockSupport;

public class LockSupportGateDemo {
  static volatile boolean ready = false;
  static Thread waiter;

  public static void main(String[] args) throws Exception {
    waiter = new Thread(() -> {
      while (!ready) {
        LockSupport.park(); // may still need loop for spurious/race
      }
      System.out.println("opened");
    }, "waiter");
    waiter.start();
    Thread.sleep(50);
    ready = true;
    LockSupport.unpark(waiter); // permit (sticky)
    waiter.join();
  }
}`,
    fixTrace: `Waiter parks
Main sets ready + unpark
Waiter proceeds
✅ FIXED`,
    expectedOutput: `opened`,
    mermaid: `sequenceDiagram
  participant W as Waiter
  participant LP as LockSupport
  participant M as Main
  W->>LP: park
  M->>M: ready=true
  M->>LP: unpark(W)
  LP-->>W: resume`,
    whyFixWorks: 'unpark is permit-based and does not require owning a monitor; used inside AQS synchronizers.',
    whenNot: 'Application business logic — prefer higher-level constructs.',
    alternative: 'CountDownLatch, BlockingQueue, Lock+Condition.',
    interview30s: 'LockSupport.park/unpark is the low-level parking API behind AQS — prefer latches/queues in app code.',
    seniorFollowUp: 'How does unpark-before-park still work (permit)?',
    productionFollowUp: 'When would you read park blocker info in a thread dump?',
    memoryTrick: 'LockSupport = “Valet ticket for a thread.”',
    beforeAfter: [
      {without: 'CPU spin', with: 'Parked wait'},
    ],
  },
  {
    id: 'semaphore',
    name: 'Semaphore',
    since: 'Java 5',
    problemTitle: 'Max 10 Payment Gateway Calls',
    problem: '100 requests hit an external gateway that allows only 10 concurrent connections.',
    brokenCode: `// unbounded fan-out
executor.submit(() -> paymentGateway.process(req)); // ×100`,
    bugTrace: `100 concurrent outbound calls
Gateway 429/timeouts / local thread pileup
❌ BUG: No concurrency limit`,
    bugLabel: '❌ BUG: Unbounded external concurrency',
    fixedCode: `import java.util.concurrent.*;

public class PaymentGatewaySemaphoreDemo {
  static final Semaphore GATEWAY = new Semaphore(10); // permits, not ownership

  static void process(String id) {
    try {
      GATEWAY.acquire();
      try {
        System.out.println(Thread.currentThread().getName() + " calling gateway " + id);
        // paymentGateway.charge(id);
      } finally {
        GATEWAY.release();
      }
    } catch (InterruptedException e) {
      Thread.currentThread().interrupt();
    }
  }

  public static void main(String[] args) throws Exception {
    ExecutorService ex = Executors.newFixedThreadPool(32);
    for (int i = 0; i < 100; i++) {
      int id = i;
      ex.submit(() -> process("PAY-" + id));
    }
    ex.shutdown();
    ex.awaitTermination(5, TimeUnit.SECONDS);
  }
}`,
    fixTrace: `100 requests → Semaphore(10)
10 running, 90 waiting for permits
✅ FIXED`,
    expectedOutput: `pool-1-thread-1 calling gateway PAY-0
... (at most 10 concurrent in flight)`,
    outputNote: 'Semaphore limits concurrency; it does not mean a thread owns a specific connection object unless you map permits yourself.',
    mermaid: `flowchart TB
  R[100 Requests] --> S[Semaphore 10]
  S --> RUN[10 running]
  S --> WAIT[90 waiting]`,
    whyFixWorks: 'Semaphore counts permits. acquire blocks when none left; release returns a permit.',
    whenNot: 'Need mutual exclusion for a specific invariant (use Lock); need ownership/fencing across nodes (distributed lock).',
    alternative: 'Resilience4j bulkhead; bounded queue + workers; gateway-side rate limit.',
    interview30s: 'Semaphore limits concurrent access by permits — ideal for external API/connection bulkheads in one JVM.',
    seniorFollowUp: 'Fair vs unfair Semaphore under bursty traffic?',
    productionFollowUp: 'What metric proves the bulkhead is saving the gateway?',
    memoryTrick: 'Semaphore = “Limited parking slots.”',
    beforeAfter: [
      {without: '100 concurrent calls', with: 'Max 10 in flight'},
    ],
  },
  {
    id: 'count-down-latch',
    name: 'CountDownLatch',
    since: 'Java 5',
    problemTitle: 'Application Startup',
    problem: 'App must wait until config, DB, Kafka, and secrets probes succeed once.',
    brokenCode: `// polling flags with sleep
while (!(cfg && db && kafka && secrets)) Thread.sleep(10);`,
    bugTrace: `Racy flags, wasted wakeups, easy to miss a dependency
❌ BUG: Ad-hoc barrier`,
    bugLabel: '❌ BUG: Homegrown startup wait',
    fixedCode: `import java.util.concurrent.*;

public class StartupLatchDemo {
  public static void main(String[] args) throws Exception {
    CountDownLatch ready = new CountDownLatch(4);
    ExecutorService ex = Executors.newFixedThreadPool(4);
    ex.submit(() -> { /* load config */ ready.countDown(); });
    ex.submit(() -> { /* ping DB */ ready.countDown(); });
    ex.submit(() -> { /* ping Kafka */ ready.countDown(); });
    ex.submit(() -> { /* load secrets */ ready.countDown(); });

    boolean ok = ready.await(5, TimeUnit.SECONDS);
    System.out.println(ok ? "Application Ready" : "Startup timed out");
    ex.shutdown();
  }
}`,
    fixTrace: `4 deps countDown
Main await → open once
✅ FIXED (one-shot)`,
    expectedOutput: `Application Ready`,
    mermaid: `flowchart LR
  CFG[Config] --> L[Latch 4]
  DB[Database] --> L
  K[Kafka] --> L
  S[Secrets] --> L
  L --> READY[Application Ready]`,
    whyFixWorks: 'Latch starts at N; countDown decrements; await blocks until zero. Cannot reset — one-shot by design.',
    whenNot: 'Need reuse → CyclicBarrier/Phaser; need permit limiting → Semaphore.',
    alternative: 'Spring lifecycle / readiness probes; Phaser for multi-phase.',
    interview30s: 'CountDownLatch is a one-shot gate: wait until N events happen, then proceed.',
    seniorFollowUp: 'Why can’t you reset a CountDownLatch?',
    productionFollowUp: 'How do you fail startup if one dependency hangs?',
    memoryTrick: 'CountDownLatch = “Wait until all checklist boxes are ticked.”',
    beforeAfter: [
      {without: 'Sleep polling', with: 'await/countDown'},
    ],
  },
  {
    id: 'cyclic-barrier',
    name: 'CyclicBarrier',
    since: 'Java 5',
    problemTitle: 'Parallel Batch Processing',
    problem: 'Four workers must finish phase-1 before any starts phase-2 — repeatedly.',
    brokenCode: `// each worker starts phase-2 on its own clock
processPhase1();
processPhase2(); // may run before peers finish phase1`,
    bugTrace: `Worker-3 enters phase2 while Worker-1 still in phase1
❌ BUG: No cohort barrier`,
    bugLabel: '❌ BUG: Missing phase sync',
    fixedCode: `import java.util.concurrent.*;

public class BatchBarrierDemo {
  public static void main(String[] args) throws Exception {
    int n = 4;
    CyclicBarrier barrier = new CyclicBarrier(n,
        () -> System.out.println("=== all finished phase → next ==="));
    ExecutorService ex = Executors.newFixedThreadPool(n);
    for (int i = 0; i < n; i++) {
      int id = i;
      ex.submit(() -> {
        try {
          System.out.println("W" + id + " phase1");
          barrier.await();
          System.out.println("W" + id + " phase2");
          barrier.await();
        } catch (Exception e) {
          Thread.currentThread().interrupt();
        }
      });
    }
    ex.shutdown();
    ex.awaitTermination(5, TimeUnit.SECONDS);
  }
}`,
    fixTrace: `Workers await at barrier
Barrier trips → reusable for next phase
✅ FIXED`,
    expectedOutput: `W0 phase1
...
=== all finished phase → next ===
W0 phase2
...`,
    mermaid: `flowchart TB
  W1[Worker1] --> B[Barrier]
  W2[Worker2] --> B
  W3[Worker3] --> B
  W4[Worker4] --> B
  B --> P2[Phase 2]`,
    whyFixWorks: 'All parties await; when the last arrives the barrier opens and resets for reuse.',
    whenNot: 'One-shot startup → CountDownLatch; dynamic party count → Phaser.',
    alternative: 'Phaser; ForkJoin task joins.',
    interview30s: 'CyclicBarrier synchronizes a fixed party repeatedly across phases; CountDownLatch is one-shot.',
    seniorFollowUp: 'What happens when one party times out at the barrier?',
    productionFollowUp: 'How do you avoid barrier deadlocks if a worker crashes?',
    memoryTrick: 'CyclicBarrier = “Everyone waits at the checkpoint.”',
    beforeAfter: [
      {without: 'Phases drift', with: 'Cohort sync'},
    ],
  },
  {
    id: 'phaser',
    name: 'Phaser',
    since: 'Java 7',
    problemTitle: 'Multi-stage ETL Pipeline',
    problem: 'Phases: Load → Validate → Process → Commit with a dynamic number of workers.',
    brokenCode: `// hard-coded CyclicBarrier(4) but workers come and go
CyclicBarrier b = new CyclicBarrier(4); // breaks when party size changes`,
    bugTrace: `Worker deregisters mid-job → barrier never trips
❌ BUG: Fixed party count`,
    bugLabel: '❌ BUG: Fixed parties',
    fixedCode: `import java.util.concurrent.*;

public class EtlPhaserDemo {
  public static void main(String[] args) {
    Phaser phaser = new Phaser(1); // self registered
    for (int i = 0; i < 3; i++) {
      phaser.register();
      int id = i;
      new Thread(() -> {
        System.out.println(id + " load");
        phaser.arriveAndAwaitAdvance();
        System.out.println(id + " validate");
        phaser.arriveAndAwaitAdvance();
        System.out.println(id + " process");
        phaser.arriveAndAwaitAdvance();
        System.out.println(id + " commit");
        phaser.arriveAndDeregister();
      }).start();
    }
    while (!phaser.isTerminated()) {
      if (phaser.getRegisteredParties() == 1) {
        phaser.arriveAndDeregister();
        break;
      }
      phaser.arriveAndAwaitAdvance();
    }
  }
}`,
    fixTrace: `Dynamic register/deregister across phases
✅ FIXED`,
    expectedOutput: `0 load
1 load
...
0 validate
...`,
    mermaid: `flowchart TD
  P1[Phase1 Load] --> P2[Phase2 Validate]
  P2 --> P3[Phase3 Process]
  P3 --> P4[Phase4 Commit]`,
    whyFixWorks: 'Phaser supports multiple phases and dynamic parties via register/deregister.',
    whenNot: 'Simple one-shot wait → latch; fixed small party → barrier.',
    alternative: 'CyclicBarrier; workflow engines for long ETL.',
    interview30s: 'Phaser is a flexible multi-phase synchronizer with dynamic party registration.',
    seniorFollowUp: 'When is Phaser overkill vs Barrier?',
    productionFollowUp: 'How do you observe a stuck phase in metrics?',
    memoryTrick: 'Phaser = “Multiple checkpoints with a changing team.”',
    beforeAfter: [
      {without: 'Fixed party barrier', with: 'Dynamic multi-phase'},
    ],
  },
];
