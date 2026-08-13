import type {TopicCard} from './types';

export const TOPICS_B: TopicCard[] = [
  {
    id: 'atomic',
    title: 'Atomic / CAS / LongAdder',
    since: 'Java 5 / LongAdder Java 8',
    status: 'FINAL',
    story: 'Electronic counter that only flips if the expected number is still there — else retry. LongAdder = many mini-counters then sum.',
    whenToUse: 'Single-variable counters/state machines; LongAdder for hot metrics.',
    whenAvoid: 'Multi-account transfers; need waiting/conditions.',
    methods: ['get','set','compareAndSet','getAndIncrement','incrementAndGet','updateAndGet','sum (LongAdder)'],
    internals: 'CAS loop via VarHandle/intrinsics. LongAdder stripes cells under contention.',
    mermaid: `sequenceDiagram
  participant T1
  participant M as Memory
  participant T2
  T1->>M: CAS 10→11 SUCCESS
  T2->>M: CAS 10→11 FAIL
  T2->>M: reread 11
  T2->>M: CAS 11→12 SUCCESS`,
    brokenCode: `static int hits; hits++;`,
    fixedCode: `import java.util.concurrent.*;
import java.util.concurrent.atomic.*;

public class AtomicMetricsDemo {
  public static void main(String[] args) throws Exception {
    AtomicInteger auth = new AtomicInteger(1000);
    System.out.println(auth.compareAndSet(1000, 900));

    LongAdder hits = new LongAdder();
    ExecutorService ex = Executors.newFixedThreadPool(32);
    for (int i = 0; i < 10_000; i++) ex.submit(hits::increment);
    ex.shutdown();
    ex.awaitTermination(5, TimeUnit.SECONDS);
    System.out.println("hits=" + hits.sum());
  }
}`,
    timeline: `CAS success/fail → retries; LongAdder cells → sum()`,
    expectedOutput: `true
hits=10000`,
    production: 'Request counters, idempotency attempt counts, circuit breaker stats.',
    pros: ['Lock-free single var','Scales with LongAdder'],
    cons: ['ABA','Not multi-field'],
    interview30s: 'Atomics use CAS. LongAdder reduces contention via cells — prefer for hot metrics, not identity state machines needing exact get().',
    followUp: 'AtomicLong vs LongAdder — when is exact instantaneous get required?',
    memoryTrick: 'CAS = try sticker; retry if peeled. LongAdder = many stickers then count.',
    whatHappensInternally: `incrementAndGet → loop { v=get; if CAS(v,v+1) return }`,
  },
  {
    id: 'aba',
    title: 'ABA Problem',
    since: 'Classic / AtomicStampedReference Java 5',
    status: 'FINAL',
    story: 'Vault shows tag A, thief swaps A→B→A, guard’s CAS still succeeds — stamp catches the swap.',
    whenToUse: 'CAS algorithms where recycled values can fool compare.',
    whenAvoid: 'Ignoring ABA in lock-free stacks/queues.',
    methods: ['AtomicStampedReference.compareAndSet','getStamp'],
    internals: 'Pair (ref, stamp). CAS checks both.',
    mermaid: `sequenceDiagram
  participant T1
  participant M as Ref
  participant T2
  T1->>M: read A stamp0
  T2->>M: A→B→A stamp2
  T1->>M: CAS(A,C) without stamp SUCCEEDS wrongly
  Note over T1,M: stamped CAS fails`,
    fixedCode: `import java.util.concurrent.atomic.AtomicStampedReference;

public class AbaStampDemo {
  public static void main(String[] args) {
    AtomicStampedReference<String> ref = new AtomicStampedReference<>("A", 0);
    int[] stamp = new int[1];
    String v = ref.get(stamp);
    // simulate A->B->A with stamp bumps
    ref.compareAndSet("A", "B", 0, 1);
    ref.compareAndSet("B", "A", 1, 2);
    boolean ok = ref.compareAndSet(v, "C", stamp[0], stamp[0] + 1);
    System.out.println("naive stamp CAS ok=" + ok + " value=" + ref.getReference());
  }
}`,
    timeline: `T1 snapshots A@0 → T2 mutates stamps → T1 CAS with old stamp fails`,
    expectedOutput: `naive stamp CAS ok=false value=A`,
    production: 'Lock-free structures, GC-less recycled node pools.',
    pros: ['Detects ABA'],
    cons: ['More complex','Stamp overflow care'],
    interview30s: 'ABA: value returns to expected but history changed. Stamped/markable refs detect it.',
    followUp: 'Where have you seen ABA in production designs?',
    memoryTrick: 'Same door number, different building history — check the stamp.',
    whatHappensInternally: `CAS(ref+stamp) atomic pair update`,
  },
  {
    id: 'reentrant-lock',
    title: 'ReentrantLock + AQS',
    since: 'Java 5',
    status: 'FINAL',
    story: 'Security guard with a clipboard queue, tryLock timeout, and interruptible wait — not just a key.',
    whenToUse: 'tryLock, timed, interruptible, fairness, multiple Conditions.',
    whenAvoid: 'Simple critical sections (synchronized clearer); forgetting unlock.',
    methods: ['lock','lockInterruptibly','tryLock','tryLock(t)','unlock','newCondition','isHeldByCurrentThread'],
    internals: 'ReentrantLock → AQS state/owner + CLH-style wait queue + park/unpark.',
    mermaid: `flowchart TB
  RL[ReentrantLock] --> AQS[AQS state owner]
  AQS --> Q[Wait queue T2 T3 T4]
  Q --> P[LockSupport.park]`,
    fixedCode: `import java.util.concurrent.*;
import java.util.concurrent.locks.*;

public class TicketLockDemo {
  static final ReentrantLock LOCK = new ReentrantLock();
  static boolean seatTaken;

  static boolean book() throws InterruptedException {
    if (!LOCK.tryLock(100, TimeUnit.MILLISECONDS)) return false;
    try {
      if (seatTaken) return false;
      seatTaken = true;
      return true;
    } finally { LOCK.unlock(); }
  }

  public static void main(String[] args) throws Exception {
    ExecutorService ex = Executors.newFixedThreadPool(4);
    for (int i = 0; i < 4; i++) ex.submit(() -> {
      try { System.out.println(Thread.currentThread().getName() + " " + book()); }
      catch (InterruptedException e) { Thread.currentThread().interrupt(); }
    });
    ex.shutdown();
    ex.awaitTermination(2, TimeUnit.SECONDS);
  }
}`,
    timeline: `one true booking; others false; tryLock avoids infinite wait`,
    expectedOutput: `... true
... false`,
    production: 'Inventory reservation in-process; avoid holding across remote calls.',
    pros: ['Timed/interruptible','Conditions','Fairness option'],
    cons: ['Manual unlock','Fairness cost'],
    interview30s: 'ReentrantLock on AQS: CAS state, enqueue, park. Use when synchronized’s policy is insufficient.',
    followUp: 'Walk acquire when CAS fails — queue, pred, park, unpark.',
    memoryTrick: 'ReentrantLock = guard with clipboard.',
    whatHappensInternally: `lock → CAS state 0→1 → else addWaiter → acquireQueued → park → unpark → retry`,
  },
  {
    id: 'aqs',
    title: 'AbstractQueuedSynchronizer',
    since: 'Java 5',
    status: 'FINAL',
    story: 'The back-office queue machine powering many synchronizers: a state int + a wait line + park tickets.',
    whenToUse: 'Understanding locks/semaphores/latches; building rare custom synchronizers.',
    whenAvoid: 'Reinventing locks in app code — use j.u.c.',
    methods: ['tryAcquire','tryRelease','acquire','release','tryAcquireShared','releaseShared'],
    internals: 'Exclusive vs shared modes. CLH-style sync queue. LockSupport park/unpark.',
    mermaid: `flowchart TB
  AQS[AQS] --> S[state]
  AQS --> H[head]
  AQS --> T[tail]
  H --> N1[Node T1]
  N1 --> N2[Node T2]`,
    fixedCode: `import java.util.concurrent.locks.AbstractQueuedSynchronizer;

/** Educational mutex — not for production. */
public class TinyAqsLock {
  private final Sync sync = new Sync();
  static final class Sync extends AbstractQueuedSynchronizer {
    protected boolean tryAcquire(int acquires) {
      if (compareAndSetState(0, 1)) {
        setExclusiveOwnerThread(Thread.currentThread());
        return true;
      }
      return false;
    }
    protected boolean tryRelease(int releases) {
      setExclusiveOwnerThread(null);
      setState(0);
      return true;
    }
    protected boolean isHeldExclusively() {
      return getExclusiveOwnerThread() == Thread.currentThread();
    }
  }
  public void lock() { sync.acquire(1); }
  public void unlock() { sync.release(1); }

  public static void main(String[] args) {
    TinyAqsLock lock = new TinyAqsLock();
    Runnable r = () -> {
      lock.lock();
      try { System.out.println(Thread.currentThread().getName()); }
      finally { lock.unlock(); }
    };
    new Thread(r, "A").start();
    new Thread(r, "B").start();
  }
}`,
    timeline: `A acquire → B enqueued/parked → A release → B unparked`,
    expectedOutput: `A
B`,
    production: 'Know AQS to debug lock dumps and design fair/shared semantics.',
    pros: ['Battle-tested framework','Shared+exclusive'],
    cons: ['Easy to misuse custom Sync'],
    interview30s: 'AQS coordinates state + FIFO-ish waiters via CAS and park. Powers ReentrantLock, Semaphore, CountDownLatch, etc.',
    followUp: 'Exclusive vs shared acquire — examples?',
    memoryTrick: 'AQS = clipboard + state dial + park tickets.',
    whatHappensInternally: `acquire → tryAcquire → addWaiter → park loop → release → unpark successor`,
  },
  {
    id: 'tpe',
    title: 'ThreadPoolExecutor',
    since: 'Java 5',
    status: 'FINAL',
    story: 'Team of bank tellers + a waiting line. Wrong line type changes whether you hire more tellers or drown in paper.',
    whenToUse: 'Bounded concurrency for mixed/CPU work; explicit tuning.',
    whenAvoid: 'Blind Executors.newFixedThreadPool with unbounded queue for bursty APIs.',
    methods: ['execute','submit','shutdown','shutdownNow','awaitTermination','allowCoreThreadTimeOut'],
    internals: 'ctl packs runState+workerCount; Workers; workQueue; rejection handler.',
    mermaid: `flowchart TD
  T[task] --> C{workers < core?}
  C -->|yes| W[addWorker]
  C -->|no| Q{queue.offer?}
  Q -->|yes| queued[queued]
  Q -->|no| M{workers < max?}
  M -->|yes| W2[addWorker]
  M -->|no| R[reject]`,
    brokenCode: `Executors.newFixedThreadPool(8); // unbounded LinkedBlockingQueue — memory bomb under spike`,
    fixedCode: `import java.util.concurrent.*;

public class BoundedPoolDemo {
  public static void main(String[] args) throws Exception {
    ThreadPoolExecutor ex = new ThreadPoolExecutor(
        4, 8, 60, TimeUnit.SECONDS,
        new ArrayBlockingQueue<>(100),
        new ThreadPoolExecutor.CallerRunsPolicy());
    for (int i = 0; i < 200; i++) {
      final int id = i;
      ex.execute(() -> System.out.println(Thread.currentThread().getName() + " " + id));
    }
    ex.shutdown();
    ex.awaitTermination(10, TimeUnit.SECONDS);
  }
}`,
    timeline: `fill cores → fill queue → grow to max → CallerRuns slows producer`,
    expectedOutput: `pool threads process 0..199 (CallerRuns may run some on main)`,
    production: 'Size to CPU/DB; metrics: queue depth, active, rejected, wait time.',
    pros: ['Tunable','Backpressure via rejection'],
    cons: ['Easy to misconfigure','Queue choice critical'],
    interview30s: 'Admission: core → queue → max → reject. Unbounded queue can ignore max.',
    followUp: 'Why does LinkedBlockingQueue make maxPoolSize irrelevant for execute()?',
    memoryTrick: 'Pool = tellers + line + bouncer (rejection).',
    whatHappensInternally: `execute → workerCount/runState → addWorker/offer/reject → runWorker → getTask`,
  },
  {
    id: 'cf',
    title: 'CompletableFuture',
    since: 'Java 8',
    status: 'FINAL',
    story: 'Parallel service calls for one payment: fraud, account, FX — then combine. Stages are a graph, not a thread.',
    whenToUse: 'Async pipelines, fan-out/fan-in, timeouts, recovery.',
    whenAvoid: 'Blocking I/O on commonPool; ignoring exceptionally; no timeout.',
    methods: ['supplyAsync','thenApply','thenCompose','thenCombine','allOf','anyOf','exceptionally','handle','orTimeout'],
    internals: 'Completion graph; default async on ForkJoinPool.commonPool unless executor passed.',
    mermaid: `flowchart TB
  R[Request] --> F[Fraud CF]
  R --> A[Account CF]
  R --> X[FX CF]
  F --> C[thenCombine/allOf]
  A --> C
  X --> C
  C --> OUT[Decision]`,
    fixedCode: `import java.util.concurrent.*;

public class PaymentCfDemo {
  static String call(String name) {
    return name + "-OK";
  }
  public static void main(String[] args) throws Exception {
    ExecutorService io = Executors.newFixedThreadPool(8);
    CompletableFuture<String> fraud = CompletableFuture.supplyAsync(() -> call("fraud"), io);
    CompletableFuture<String> acct = CompletableFuture.supplyAsync(() -> call("acct"), io);
    CompletableFuture<String> fx = CompletableFuture.supplyAsync(() -> call("fx"), io);
    String result = fraud.thenCombine(acct, (a, b) -> a + "," + b)
        .thenCombine(fx, (ab, c) -> ab + "," + c)
        .orTimeout(2, TimeUnit.SECONDS)
        .join();
    System.out.println(result);
    io.shutdown();
    io.awaitTermination(2, TimeUnit.SECONDS);
  }
}`,
    timeline: `3 async calls → combine → timeout guard → join`,
    expectedOutput: `fraud-OK,acct-OK,fx-OK`,
    production: 'Always pass I/O executor; use orTimeout; map exceptions.',
    pros: ['Composition','Timeouts','Non-blocking style'],
    cons: ['Hard to cancel trees','CommonPool misuse'],
    interview30s: 'CF is a completion graph. thenCompose flatMaps nested futures; thenCombine joins independents; avoid blocking on commonPool.',
    followUp: 'thenApply vs thenApplyAsync — which thread runs?',
    memoryTrick: 'CF = orchestra score for async stages.',
    whatHappensInternally: `complete → pop dependent actions → run sync or async via executor`,
  },
];
