import type {TopicCard} from './types';

export const TOPICS_C: TopicCard[] = [
  {
    id: 'chm',
    title: 'ConcurrentHashMap',
    since: 'Java 5 / redesign Java 8',
    status: 'FINAL',
    story: 'Concurrent account registry: many tellers update different bins; compound verbs are atomic.',
    whenToUse: 'Concurrent keyed state; computeIfAbsent/merge.',
    whenAvoid: 'containsKey+put; nulls; cross-key transactions.',
    methods: ['putIfAbsent','computeIfAbsent','compute','merge','replace','forEach','reduce'],
    internals: 'table bins; CAS; synchronized on bin nodes; TreeBin; forwarding nodes on resize.',
    mermaid: `flowchart TB
  T[table] --> B0[bin Node]
  T --> B1[bin Node→Node]
  T --> B2[TreeBin]`,
    brokenCode: `if (!map.containsKey(k)) map.put(k, load(k));`,
    fixedCode: `import java.util.concurrent.*;

public class SessionChmDemo {
  static final ConcurrentHashMap<String, String> CACHE = new ConcurrentHashMap<>();
  static String load(String k) {
    System.out.println(Thread.currentThread().getName() + " load");
    return "S-" + k;
  }
  public static void main(String[] args) throws Exception {
    ExecutorService ex = Executors.newFixedThreadPool(8);
    for (int i = 0; i < 8; i++) ex.submit(() -> CACHE.computeIfAbsent("u1", SessionChmDemo::load));
    ex.shutdown();
    ex.awaitTermination(2, TimeUnit.SECONDS);
    System.out.println(CACHE.get("u1"));
  }
}`,
    timeline: `one load wins; others observe same value`,
    expectedOutput: `... load (typically once)
S-u1`,
    production: 'Idempotency maps, local caches (with eviction strategy elsewhere).',
    pros: ['Scalable reads/writes','Atomic compounds'],
    cons: ['Nested compute deadlock risk','No nulls'],
    interview30s: 'CHM uses bins/CAS/sync; never DIY check-then-act — use compute*.',
    followUp: 'Java 7 segments vs Java 8 bins — what changed for interviews?',
    memoryTrick: 'CHM = concurrent dictionary with atomic verbs.',
    whatHappensInternally: `computeIfAbsent → locate bin → CAS/sync → init once → publish`,
  },
  {
    id: 'bq',
    title: 'BlockingQueue',
    since: 'Java 5',
    status: 'FINAL',
    story: 'Waiting line between order takers and kitchen. put waits if full; take waits if empty.',
    whenToUse: 'Producer/consumer; decoupling stages; bounded handoff.',
    whenAvoid: 'DIY wait/notify queues in new code.',
    methods: ['put','take','offer','poll','offer(timeout)','poll(timeout)','add','remove'],
    internals: 'ArrayBQ: single lock+conditions; LinkedBQ: dual lock; SyncQ: handoff; TransferQ: optional wait.',
    mermaid: `flowchart LR
  P[Producer put] --> Q[BlockingQueue]
  Q --> C[Consumer take]`,
    fixedCode: `import java.util.concurrent.*;

public class OrderQueueDemo {
  public static void main(String[] args) throws Exception {
    BlockingQueue<String> q = new ArrayBlockingQueue<>(2);
    Thread consumer = new Thread(() -> {
      try {
        System.out.println("got " + q.take());
      } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
    });
    consumer.start();
    q.put("ORDER-1");
    consumer.join();
  }
}`,
    timeline: `consumer may block → put → take returns`,
    expectedOutput: `got ORDER-1`,
    production: 'Ingestion pipelines; isolate producers from slow consumers.',
    pros: ['Backpressure','Clear API'],
    cons: ['Wrong capacity hurts latency'],
    interview30s: 'Prefer BlockingQueue over wait/notify. Know throw/special/block/timeout method families.',
    followUp: 'SynchronousQueue vs ArrayBlockingQueue(1)?',
    memoryTrick: 'BlockingQueue = the waiting line.',
    whatHappensInternally: `put → if full await notFull → enqueue → signal notEmpty`,
  },
  {
    id: 'semaphore',
    title: 'Semaphore',
    since: 'Java 5',
    status: 'FINAL',
    story: 'Parking lot with N spaces — permits, not ownership of a specific car stall unless you map them.',
    whenToUse: 'Bulkheads; limit outbound gateway/DB concurrency.',
    whenAvoid: 'Need exclusive ownership of a specific resource identity.',
    methods: ['acquire','tryAcquire','release','availablePermits'],
    internals: 'AQS shared mode; state = permits.',
    mermaid: `flowchart TB
  R[100 requests] --> S[Semaphore 10]
  S --> RUN[10 running]
  S --> WAIT[90 waiting]`,
    fixedCode: `import java.util.concurrent.*;

public class GatewaySemaphoreDemo {
  static final Semaphore SEM = new Semaphore(10);
  public static void main(String[] args) throws Exception {
    ExecutorService ex = Executors.newFixedThreadPool(32);
    for (int i = 0; i < 50; i++) {
      int id = i;
      ex.submit(() -> {
        try {
          SEM.acquire();
          try { System.out.println("gw " + id); }
          finally { SEM.release(); }
        } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
      });
    }
    ex.shutdown();
    ex.awaitTermination(5, TimeUnit.SECONDS);
  }
}`,
    timeline: `at most 10 concurrent acquires`,
    expectedOutput: `gw ... (interleaved)`,
    production: 'Protect payment gateway / JDBC pool from VT amplification.',
    pros: ['Simple bulkhead','Fair option'],
    cons: ['Not a mutex for invariants'],
    interview30s: 'Semaphore limits concurrency via permits (AQS shared).',
    followUp: 'Fair vs unfair under burst?',
    memoryTrick: 'Semaphore = N parking slots.',
    whatHappensInternally: `acquire shared → dec permits or enqueue → release → wake`,
  },
  {
    id: 'vt',
    title: 'Virtual Threads',
    since: 'Java 21 FINAL',
    status: 'FINAL',
    story: 'Hire a lightweight teller per customer request; a few carrier employees actually stand at the counters.',
    whenToUse: 'Massive blocking I/O concurrency; thread-per-request style.',
    whenAvoid: 'Expecting CPU speedups; unbounded fan-out to DB; ignoring pinning.',
    methods: ['Thread.startVirtualThread','Executors.newVirtualThreadPerTaskExecutor','Thread.ofVirtual'],
    internals: 'JVM schedules VTs onto carrier platform threads; park unmounts; synchronized/native may pin.',
    mermaid: `flowchart TB
  VT1 --> C1[Carrier1]
  VT2 --> C1
  VT3 --> C2[Carrier2]
  VT4 --> C2`,
    fixedCode: `import java.util.concurrent.*;
import java.util.concurrent.atomic.LongAdder;

public class VirtualThreadFanOutDemo {
  public static void main(String[] args) throws Exception {
    LongAdder done = new LongAdder();
    try (var ex = Executors.newVirtualThreadPerTaskExecutor()) {
      for (int i = 0; i < 10_000; i++) {
        ex.submit(() -> {
          try { Thread.sleep(10); } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
          }
          done.increment();
        });
      }
    }
    System.out.println("done=" + done.sum());
  }
}`,
    timeline: `10k VTs sleep → unmount → remount → done=10000`,
    expectedOutput: `done=10000`,
    production: 'Spring MVC request handling; still Semaphore/limit DB pool.',
    pros: ['Cheap blocking concurrency','Readable code'],
    cons: ['Does not add CPU','Amplifies downstream','Pinning'],
    interview30s: 'VT multiplex onto carriers. Great for wait-bound work; not more cores for CPU; throttle IO sinks.',
    followUp: 'How do you detect pinning with JFR?',
    memoryTrick: 'VT = lightweight employee per customer.',
    whatHappensInternally: `block → unmount → carrier runs other VT → I/O ready → remount`,
  },
  {
    id: 'scoped',
    title: 'Scoped Values',
    since: 'Java 25 FINAL (JEP 506)',
    status: 'FINAL',
    story: 'Request ID badge valid only for this bounded job — not a sticky note left in the drawer (ThreadLocal).',
    whenToUse: 'Immutable request context with VT / structured tasks.',
    whenAvoid: 'Mutable per-thread caches; pretending ThreadLocal is fine forever.',
    methods: ['ScopedValue.newInstance','where','run','get'],
    internals: 'Bound immutable bindings; designed for VT-friendly context.',
    mermaid: `flowchart TB
  R[Request] --> SV[ScopedValue REQUEST_ID]
  SV --> A[ServiceA]
  SV --> B[ServiceB]`,
    fixedCode: `// Java 25+ (final). Compile/run without preview flags.
public class ScopedValueDemo {
  static final ScopedValue<String> REQUEST_ID = ScopedValue.newInstance();

  static void handle() {
    System.out.println("id=" + REQUEST_ID.get());
  }

  public static void main(String[] args) {
    ScopedValue.where(REQUEST_ID, "REQ-42").run(ScopedValueDemo::handle);
  }
}`,
    timeline: `bind REQUEST_ID → run → get sees REQ-42 → binding ends`,
    expectedOutput: `id=REQ-42`,
    production: 'Replace ThreadLocal request context on VT-heavy services.',
    pros: ['Bounded lifetime','Immutable','VT-friendly'],
    cons: ['Ecosystem migration','Libs may still use ThreadLocal'],
    interview30s: 'ScopedValue finalized in 25 (JEP 506): immutable bounded context vs ThreadLocal leaks.',
    followUp: 'How do you bridge MDC logging during migration?',
    memoryTrick: 'ScopedValue = temporary badge, not sticky note.',
    whatHappensInternally: `where binds → run with binding → nested calls get → scope exit clears`,
  },
  {
    id: 'structured',
    title: 'Structured Concurrency',
    since: 'Java 25 PREVIEW (JEP 505, 5th)',
    status: 'PREVIEW',
    story: 'Manager owns child tasks for one request — when parent fails/cancels, children do not outlive the meeting.',
    whenToUse: 'Experiment behind flags; design APIs for future finalization.',
    whenAvoid: 'Shipping as paved-road platform API while still preview.',
    methods: ['StructuredTaskScope (API evolves across previews)','fork','join','ShutdownOnFailure'],
    internals: 'Structured task lifetimes + cancellation; pairs with VT.',
    mermaid: `flowchart TB
  P[Parent] --> U[User]
  P --> O[Order]
  P --> PAY[Payment]
  U --> J[join]
  O --> J
  PAY --> J`,
    fixedCode: `// Java 25 PREVIEW — requires --enable-preview
// API shape evolves; verify against your JDK 25 build before production.
// Conceptual example (illustrative):
/*
try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
  Subtask<User> user = scope.fork(() -> loadUser(id));
  Subtask<Order> order = scope.fork(() -> loadOrder(id));
  scope.join().throwIfFailed();
  return new Page(user.get(), order.get());
}
*/
public class StructuredConcurrencyStatus {
  public static void main(String[] args) {
    System.out.println("Structured Concurrency is PREVIEW in JDK 25 (JEP 505).");
    System.out.println("Use --enable-preview only in experiments; do not standardize yet.");
  }
}`,
    timeline: `fork children → join → cancel on failure → parent completes`,
    expectedOutput: `Structured Concurrency is PREVIEW in JDK 25 (JEP 505).`,
    production: 'Abstract now; adopt when final. Prefer CF/VT until then for paved road.',
    pros: ['Clear lifetimes','Cancellation'],
    cons: ['Still preview in 25','API churn'],
    interview30s: 'In JDK 25, Structured Concurrency remains preview (JEP 505). Do not call it final.',
    followUp: 'How does it improve on CompletableFuture cancellation trees?',
    memoryTrick: 'Structured concurrency = manager owns the whole meeting.',
    whatHappensInternally: `scope owns forks → join waits → shutdown policy cancels siblings`,
  },
  {
    id: 'threadlocal',
    title: 'ThreadLocal',
    since: 'Java 1.2',
    status: 'FINAL',
    story: 'Personal sticky note in each employee’s pocket — dangerous when employees are reused (pools) or multiplied (VTs).',
    whenToUse: 'Legacy context; always remove() in finally.',
    whenAvoid: 'New VT architectures — prefer ScopedValue.',
    methods: ['withInitial','get','set','remove'],
    internals: 'Thread.threadLocals → ThreadLocalMap; weak keys; strong values can leak.',
    mermaid: `flowchart TB
  TH[Thread] --> MAP[ThreadLocalMap]
  MAP --> E1[Entry TL→value]`,
    brokenCode: `tl.set(ctx); // no remove in pooled thread`,
    fixedCode: `public class ThreadLocalCleanupDemo {
  static final ThreadLocal<String> CTX = new ThreadLocal<>();
  public static void main(String[] args) {
    try {
      CTX.set("REQ-1");
      System.out.println(CTX.get());
    } finally {
      CTX.remove();
    }
  }
}`,
    timeline: `set → use → remove prevents pool contamination`,
    expectedOutput: `REQ-1`,
    production: 'MDC bridges; always clean on request end.',
    pros: ['Simple per-thread storage'],
    cons: ['Leaks','VT cost','Mutable'],
    interview30s: 'ThreadLocalMap can retain values on pooled threads — remove() or use ScopedValue.',
    followUp: 'Why is ThreadLocal painful with virtual threads at scale?',
    memoryTrick: 'ThreadLocal = sticky note in the pocket.',
    whatHappensInternally: `get → map in current Thread → weak key lookup`,
  },
  {
    id: 'fjp',
    title: 'ForkJoinPool',
    since: 'Java 7',
    status: 'FINAL',
    story: 'Team of chefs steals leftover prep tasks from each other’s cutting boards.',
    whenToUse: 'CPU divide-and-conquer; parallel streams backend.',
    whenAvoid: 'Blocking I/O on commonPool.',
    methods: ['fork','join','invoke','invokeAll','RecursiveTask'],
    internals: 'Work-stealing deques; commonPool shared by parallel streams & CF defaults.',
    mermaid: `flowchart LR
  W1[Worker1 deque] -->|steal| W3[Worker3 empty]`,
    fixedCode: `import java.util.concurrent.*;

public class SumTask extends RecursiveTask<Long> {
  static final int THRESHOLD = 10_000;
  final long[] arr; final int lo, hi;
  SumTask(long[] arr, int lo, int hi) { this.arr=arr; this.lo=lo; this.hi=hi; }
  protected Long compute() {
    if (hi - lo <= THRESHOLD) {
      long s = 0; for (int i = lo; i < hi; i++) s += arr[i]; return s;
    }
    int mid = (lo + hi) >>> 1;
    SumTask left = new SumTask(arr, lo, mid);
    left.fork();
    long right = new SumTask(arr, mid, hi).compute();
    return left.join() + right;
  }
  public static void main(String[] args) {
    long[] arr = new long[1_000_000];
    for (int i = 0; i < arr.length; i++) arr[i] = 1;
    System.out.println(new ForkJoinPool().invoke(new SumTask(arr, 0, arr.length)));
  }
}`,
    timeline: `split → steal → join → sum`,
    expectedOutput: `1000000`,
    production: 'Pure CPU aggregation; isolate blocking elsewhere.',
    pros: ['Work stealing','Good for CPU'],
    cons: ['Blocking starves workers'],
    interview30s: 'FJP steals from others’ deques. Never park commonPool on JDBC.',
    followUp: 'How do parallel streams relate to commonPool?',
    memoryTrick: 'ForkJoin = steal from the next chef’s board.',
    whatHappensInternally: `fork push → idle worker steals → join waits/helps`,
  },
];
