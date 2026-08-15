import type {BeforeAfter} from './types';

/** Java collections, concurrency, JVM, GC — senior/staff interview content. */

export const COLLECTIONS_ROWS: string[][] = [
  ['Structure', 'Get / contains', 'Add / insert', 'Remove', 'Notes (interview)'],
  ['ArrayList', 'O(1) index; O(n) contains', 'Amortized O(1) end; O(n) middle', 'O(n)', 'Contiguous; prefer over LinkedList for almost all list use'],
  ['LinkedList', 'O(n)', 'O(1) at ends if node held', 'O(1) at ends if node held', 'Poor cache locality; almost never faster than ArrayList in practice'],
  ['HashMap', 'Avg O(1); worst O(n)', 'Avg O(1)', 'Avg O(1)', 'Java 8+: treeify bins at 8; resize cost; null key OK'],
  ['LinkedHashMap', 'Avg O(1)', 'Avg O(1)', 'Avg O(1)', 'Insertion/access order; LRU via removeEldestEntry'],
  ['TreeMap', 'O(log n)', 'O(log n)', 'O(log n)', 'Sorted; Comparator cost; no null keys with natural order'],
  ['ConcurrentHashMap', 'Avg O(1)', 'Avg O(1)', 'Avg O(1)', 'No nulls; size() not exact under concurrency; prefer compute*'],
  ['HashSet / TreeSet', 'As map', 'As map', 'As map', 'Set = map of keys; same Big-O as backing map'],
  ['ArrayDeque', 'O(n) contains', 'O(1) ends', 'O(1) ends', 'Best general Queue/Deque; avoid Stack/Vector'],
  ['PriorityQueue', 'O(n) contains', 'O(log n) offer', 'O(log n) poll', 'Heap; not a full sorted set — no efficient arbitrary remove'],
  ['CopyOnWriteArrayList', 'O(n) contains; O(1) get', 'O(n) copy', 'O(n) copy', 'Read-heavy rare writes only; else ConcurrentHashMap / sync'],
];

export const JAVA_ANTIPATTERNS: BeforeAfter[] = [
  {
    id: 'string-plus',
    title: 'String concatenation in a loop',
    problem: 'Building large strings with + inside loops creates many intermediate String objects.',
    bad: `// Java 21 — anti-pattern
String report = "";
for (Order o : orders) {          // 10k–100k iterations in batch jobs
  report = report + o.id() + ","; // each + copies the growing string
}
return report;`,
    whySlow:
      'String is immutable; each + allocates a new char[] and copies O(n) so far → overall O(n²) time and allocation pressure → GC thrash under load.',
    good: `// Java 21 — prefer StringBuilder (or StringJoiner / Collectors.joining)
StringBuilder sb = new StringBuilder(orders.size() * 16); // size hint
for (Order o : orders) {
  sb.append(o.id()).append(',');
}
return sb.toString();

// Or: orders.stream().map(Order::id).collect(Collectors.joining(","));`,
    whyFaster:
      'Single buffer with amortized doubling; linear time and far fewer allocations. Collectors.joining uses StringBuilder under the hood.',
    tradeoff:
      'StringBuilder is not thread-safe (fine for local). For concurrent appenders use ThreadLocal builders or join after parallel map — do not share one builder.',
    interview:
      'Say: “+ in a loop is quadratic; StringBuilder or joining. The compiler may rewrite simple + chains, not loops.”',
    validate:
      'JMH or allocation profiler on representative N; compare young-GC rate and P99 of the batch endpoint before/after.',
  },
  {
    id: 'streams-boxing',
    title: 'Stream boxing / accidental object churn',
    problem: 'Using Stream<Integer> or mapToObj on hot numeric paths boxes every value and defeats CPU cache.',
    bad: `// Java 21 — boxed stream on a hot path
List<Integer> ids = fetchIds();
long sum = ids.stream()
    .filter(i -> i % 2 == 0)
    .map(i -> i * 2)           // still boxed
    .reduce(0, Integer::sum);  // unbox/box repeatedly`,
    whySlow:
      'Each Integer is a heap object; filter/map allocate and GC. Autoboxing hides cost until flame graphs show java.lang.Integer and GC.',
    good: `// Java 21 — primitive specialization
int[] ids = fetchIdsAsIntArray(); // or IntStream from source
long sum = IntStream.of(ids)
    .filter(i -> i % 2 == 0)
    .map(i -> i * 2)
    .sum();

// If stuck with List<Integer>, convert once at boundary:
long sum2 = ids.stream().mapToInt(Integer::intValue).filter(i -> i % 2 == 0).map(i -> i * 2).sum();`,
    whyFaster:
      'IntStream keeps data in primitives; less allocation, better vectorization opportunities, lower GC.',
    tradeoff:
      'Primitive streams are less composable with object APIs. Convert at boundaries; don’t rewrite every casual stream.',
    interview:
      '“Boxing is a real cost on hot paths; IntStream/LongStream or arrays. Profile before rewriting business code.”',
    validate:
      'Allocation flame graph + JMH; confirm young GC pause rate drops under the same QPS. Heuristic — benchmark.',
  },
  {
    id: 'nested-loops',
    title: 'Nested loops over collections (O(n²) lookup)',
    problem: 'Checking membership with nested loops turns O(n) work into O(n²) as data grows.',
    bad: `// Java 21
List<String> allowed = loadAllowed();      // 50k
List<Order> orders = loadOrders();         // 50k
List<Order> filtered = new ArrayList<>();
for (Order o : orders) {
  for (String a : allowed) {               // linear scan each time
    if (a.equals(o.customerId())) {
      filtered.add(o);
      break;
    }
  }
}`,
    whySlow:
      '50k × 50k comparisons in worst case. Works in tests with tiny lists; melts in production as catalogs grow.',
    good: `// Java 21 — hash set for O(1) average contains
Set<String> allowed = Set.copyOf(loadAllowed()); // or HashSet
List<Order> filtered = orders.stream()
    .filter(o -> allowed.contains(o.customerId()))
    .toList();`,
    whyFaster:
      'HashSet.contains is average O(1); total work ~O(n + m). Memory trades for CPU.',
    tradeoff:
      'Extra memory for the set; choose TreeSet only if you need sorted order (O(log n)).',
    interview:
      '“I look for nested loops over lists that should be Set/Map lookups. Complexity beats micro-opts.”',
    validate:
      'Time with production-sized N; show CPU drop and P99. Complexity change should dominate any JVM flag tweak.',
  },
  {
    id: 'unnecessary-objects',
    title: 'Unnecessary object allocation in hot paths',
    problem: 'Creating formatters, mappers, or DTOs per call adds allocation and init cost under high RPS.',
    bad: `// Java 21 — per-request heavy construction
public String format(Instant t) {
  DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss'Z'")
      .withZone(ZoneOffset.UTC); // pattern parse every call
  return fmt.format(t);
}

public Money toMoney(BigDecimal amount) {
  return new Money(amount, Currency.getInstance("USD"), Locale.US, true);
}`,
    whySlow:
      'DateTimeFormatter.ofPattern parses and builds a tree each call. Extra objects increase young-gen traffic and CPU.',
    good: `// Java 21 — reuse immutable/thread-safe formatters
private static final DateTimeFormatter ISO_UTC =
    DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss'Z'").withZone(ZoneOffset.UTC);

public String format(Instant t) {
  return ISO_UTC.format(t);
}

// Prefer flyweight / cached Currency; avoid per-call Locale/Currency lookup when fixed
private static final Currency USD = Currency.getInstance("USD");`,
    whyFaster:
      'Static/shared immutable formatters are thread-safe and parse once. Fewer allocations → stabler P99.',
    tradeoff:
      'Don’t cache mutable objects (SimpleDateFormat is not thread-safe — prefer DateTimeFormatter). ThreadLocal only when necessary.',
    interview:
      '“Reuse thread-safe immutables; never SimpleDateFormat without ThreadLocal. Prove with allocation profiling.”',
    validate:
      'Async-profiler alloc mode; compare allocation rate MB/s and P99 under fixed RPS.',
  },
  {
    id: 'sync-contention',
    title: 'Coarse synchronized on a hot shared structure',
    problem: 'One global lock serializes all threads; latency cliffs appear as concurrency rises.',
    bad: `// Java 21
public final class Stats {
  private final Map<String, Long> counts = new HashMap<>();

  public synchronized void increment(String key) {
    counts.merge(key, 1L, Long::sum);
  }

  public synchronized long get(String key) {
    return counts.getOrDefault(key, 0L);
  }
}`,
    whySlow:
      'Every increment/get contends on one monitor. Under high RPS, threads park/unpark; CPU looks busy but throughput flatlines.',
    good: `// Java 21 — concurrent structure + striped counters
public final class Stats {
  private final ConcurrentHashMap<String, LongAdder> counts = new ConcurrentHashMap<>();

  public void increment(String key) {
    counts.computeIfAbsent(key, k -> new LongAdder()).increment();
  }

  public long get(String key) {
    LongAdder a = counts.get(key);
    return a == null ? 0L : a.sum();
  }
}`,
    whyFaster:
      'ConcurrentHashMap allows concurrent updates across keys; LongAdder reduces CAS contention on hot keys via cells.',
    tradeoff:
      'sum() is eventually consistent under concurrent updates (fine for metrics). Need exact snapshot? Use LongAdder.sumThenReset carefully or a different design.',
    interview:
      '“Avoid one big synchronized. Prefer ConcurrentHashMap, LongAdder, or striped locks; measure contention with JFR.”',
    validate:
      'JFR ContendedMonitor / cpu flame; throughput vs thread count curve. Heuristic — benchmark before declaring sizing.',
  },
  {
    id: 'sync-logging',
    title: 'Synchronous expensive logging on the request path',
    problem: 'Logging large payloads or using toString on entities blocks the request thread and floods I/O.',
    bad: `// Java 21 — Spring service hot path
log.info("order={}", order);                    // triggers heavy toString / Jackson
log.debug("payload={}", objectMapper.writeValueAsString(body)); // even if DEBUG off? still builds if not guarded
for (LineItem li : order.lines()) {
  log.info("line {}", li);                      // N log lines per request
}`,
    whySlow:
      'String building and JSON serialization happen before the log level check if you call writeValueAsString eagerly. Sync appenders block on disk/network; P99 spikes under load.',
    good: `// Java 21 — level guards, parameterized logs, async appender
if (log.isDebugEnabled()) {
  log.debug("orderId={} items={}", order.id(), order.lines().size());
}
log.info("orderId={} status={}", order.id(), order.status()); // parameters, not full graph

// logback.xml: AsyncAppender wrapping file/JSON appender; never log secrets/PII
// Prefer structured fields over dumping entities`,
    whyFaster:
      'Parameterized logging skips formatting when level disabled; fewer bytes and no per-line I/O wait on the request thread with async appenders.',
    tradeoff:
      'Async logging can lose messages on crash; size the queue and decide discard policy. DEBUG in prod still costs if enabled.',
    interview:
      '“Logging is part of the latency budget. Guard expensive work, log IDs not graphs, async appenders, sample if needed.”',
    validate:
      'Compare P99 with logging on/off; watch disk util and appender queue. Load test must include production log level.',
  },
  {
    id: 'stream-overcollect',
    title: 'Streams that materialize huge intermediates',
    problem: 'Chaining filter/map/sorted/collect on large datasets pulls everything into memory when a loop or DB pushdown would do.',
    bad: `// Java 21
List<Event> all = eventRepo.findAll(); // loads 2M rows
Map<String, Long> counts = all.stream()
    .filter(e -> e.type() == Type.CLICK)
    .sorted(Comparator.comparing(Event::ts)) // full sort materialization
    .collect(Collectors.groupingBy(Event::userId, Collectors.counting()));`,
    whySlow:
      'Heap blow-up, GC thrash, and CPU on a full sort you may not need. Repository findAll is an architecture smell at scale.',
    good: `// Prefer DB aggregation / pagination / streaming query
// SQL: SELECT user_id, COUNT(*) FROM event WHERE type='CLICK' GROUP BY user_id

// Or stream from JDBC without holding all rows:
try (Stream<Event> s = eventRepo.streamByType(Type.CLICK)) {
  Map<String, Long> counts = s.collect(
      Collectors.groupingBy(Event::userId, Collectors.counting()));
} // ensure @Transactional + close stream; don't sort entire set unless required`,
    whyFaster:
      'Push filters/aggregations to the database; constant app memory; less GC. Stream API is not a substitute for SQL.',
    tradeoff:
      'JPA Stream must be closed inside a transaction; misuse leaks connections. For true ETL, use batch jobs / Spark / Flink.',
    interview:
      '“Streams don’t fix loading millions of entities. Pushdown, paginate, or reactive/chunked IO.”',
    validate:
      'Heap usage and GC under same dataset size; query time via EXPLAIN. Prove DB plan uses indexes.',
  },
];

export const THREAD_POOL_ASCII = `
Thread pool sizing (platform threads) — starting point, then BENCHMARK

CPU-bound (pure compute, little waiting)
  threads ≈ availableProcessors()          // sometimes + small constant
  Example: 8 vCPU → start with 8 workers
  Too many threads → context-switch thrash, cache misses, no gain

IO-bound (JDBC, HTTP, file — threads block waiting)
  threads ≈ processors × (1 + wait/compute)
  Rule of thumb: if wait is 9× compute, ~10× processors
  Example: 8 vCPU, mostly DB wait → try 32–64 — STARTING POINT — BENCHMARK
  Cap by: DB max_connections, downstream limits, memory per thread (~1MB stack)

Little’s Law check
  concurrency ≈ throughput × latency
  If P99 target 100ms at 2k RPS → ~200 in-flight; pool must cover that + queue policy

Queue & rejection
  Bounded queue + AbortPolicy/CallerRuns with metrics — never Silent unbounded LinkedBlockingQueue
  Queueing hides overload until P99 explodes; prefer fail fast + backpressure

Spring notes
  Tomcat: server.tomcat.threads.max — protects HTTP ingress
  @Async / TaskExecutor: separate pools per workload (CPU vs IO)
  Hikari maximum-pool-size: often << HTTP threads (DB is the scarce resource)

Virtual threads (Java 21)
  Prefer VT for high-count blocking IO; don’t size like platform pools
  Still size CONNECTION pools; VT ≠ infinite DB capacity
`.trim();

export const VIRTUAL_THREADS_NOTE = `
Virtual threads (Java 21) — interview-accurate mental model

What they improve
  Concurrency for blocking-style code: millions of cheap VT can wait on IO
  without tying up one OS thread each. Great for request-per-thread Spring MVC
  style when the bottleneck is waiting (JDBC, HTTP clients, locks that park).

What they do NOT improve
  They do not make the database, disk, or remote API faster. A 200ms SQL query
  still takes 200ms; you just hold a VT instead of a platform thread while waiting.
  CPU-bound work still needs ~processor count of carriers; VT won’t speed pure math.

Pinning (critical staff topic)
  A virtual thread that enters a synchronized block or native frame can PIN its
  carrier thread — that carrier cannot service other VTs until unpin.
  Prefer java.util.concurrent locks over synchronized in VT-heavy code when
  contention or long holds are possible. Watch JFR VirtualThreadPinned events.

Pools & backpressure
  Unlimited VT + fixed Hikari pool = request threads wait on getConnection().
  You moved the queue. Size DB/HTTP connection pools; use semaphores for scarce
  resources; keep timeouts.

When to say “use VT” in an interview
  “High fan-out blocking IO, simpler than reactive, after measuring that the
   limit was platform-thread count — then validate P99 and pinning under load.”
`.trim();

export const JVM_FLAGS = `# Java 21 container-aware baseline (ECS/K8s) — STARTING POINT — BENCHMARK
# Prefer explicit heap tied to cgroup memory; enable container support (default JDK 17+)

JAVA_TOOL_OPTIONS="\\
  -XX:+UseG1GC \\
  -XX:MaxGCPauseMillis=200 \\
  -XX:+UseStringDeduplication \\
  -XX:+HeapDumpOnOutOfMemoryError \\
  -XX:HeapDumpPath=/tmp/heapdump.hprof \\
  -XX:+ExitOnOutOfMemoryError \\
  -Xlog:gc*:file=/var/log/gc.log:time,uptime,level,tags:filecount=5,filesize=20M \\
  -XX:+UseContainerSupport \\
  -XX:InitialRAMPercentage=50.0 \\
  -XX:MaxRAMPercentage=50.0 \\
  -XX:MaxMetaspaceSize=256m \\
  -Djava.security.egd=file:/dev/./urandom"

# Optional for very large heaps / ultra-low pause (validate!):
#   -XX:+UseZGC
# Optional CPU-bound batch:
#   -XX:+UseParallelGC
# Always align MaxRAMPercentage with pod memory limit and native/direct/metaspace headroom.`;

export const JVM_FLAG_ROWS: string[][] = [
  ['Flag / setting', 'Role', 'Interview tip'],
  [
    'UseContainerSupport + Initial/MaxRAMPercentage',
    'Heap sized from cgroup memory limit, not host RAM',
    'Leaving -Xmx unset on host JVM in Docker was a classic OOM; percentage leaves room for metaspace/direct/threads',
  ],
  [
    'UseG1GC + MaxGCPauseMillis',
    'Default server GC; pause target is a soft goal',
    'Lower pause target ≠ always better — can increase CPU. STARTING POINT — BENCHMARK',
  ],
  [
    'UseZGC / UseShenandoahGC',
    'Ultra-low pause concurrent collectors',
    'Great for large heaps/tail latency; measure throughput cost on your workload',
  ],
  [
    'HeapDumpOnOutOfMemoryError + ExitOnOutOfMemoryError',
    'Diagnostics + fail fast so orchestrator restarts cleanly',
    'Ensure dump volume exists; disk full = silent failure',
  ],
  [
    'Xlog:gc*',
    'Unified GC logging for regression analysis',
    'Ship logs to observability; alert on pause time and allocation rate',
  ],
  [
    'MaxMetaspaceSize',
    'Cap class metadata growth (leaks from dynamic class gen)',
    'OOM: Metaspace often = classloader leak, not ‘need more heap’',
  ],
  [
    'UseStringDeduplication (G1)',
    'Dedup identical char[] in heap',
    'Helps chatty string workloads; measure CPU overhead',
  ],
];

export const GC_ASCII = `
Generational heap (HotSpot mental model) — still the interview baseline

  ┌─────────────────────────────────────────────────────────────┐
  │                         HEAP                                │
  │  ┌────────────────────────────┐  ┌────────────────────────┐ │
  │  │     YOUNG GENERATION       │  │   OLD GENERATION       │ │
  │  │  Eden → Survivor (S0/S1)   │  │   long-lived objects   │ │
  │  │  Minor GC: copy live Eden  │  │   Major/Full/mixed     │ │
  │  │  + survivor; promote aged  │  │   (collector-specific) │ │
  │  └────────────────────────────┘  └────────────────────────┘ │
  │                                                             │
  │  Allocation: mostly in Eden (bump pointer / TLAB)           │
  │  Short-lived → die in young → cheap collection              │
  │  Long-lived / survivors → promote to old → more expensive   │
  └─────────────────────────────────────────────────────────────┘

  Metaspace (native): class metadata — separate from heap
  Thread stacks / direct ByteBuffers: also outside -Xmx

Staff narrative
  High allocation rate → frequent minor GC (CPU). Premature promotion /
  old-gen pressure → longer pauses or concurrent GC work. Fix allocation
  and object lifetime before cranking heap blindly.
`.trim();

export const GC_ROWS: string[][] = [
  ['Collector', 'Best for', 'Pause character', 'Watch-outs'],
  [
    'G1 (default server)',
    'Most Spring services, medium–large heaps',
    'Region-based; aims for pause target',
    'Tuning MaxGCPauseMillis without measuring; to-space exhaustion',
  ],
  [
    'ZGC (Java 21 production-ready)',
    'Large heaps, tight P99',
    'Sub-ms–low-ms concurrent',
    'Slightly more CPU; validate throughput — STARTING POINT — BENCHMARK',
  ],
  [
    'Shenandoah',
    'Low pause alternative (distro-dependent)',
    'Concurrent compaction',
    'Same: measure; not always in every vendor JDK story',
  ],
  [
    'Parallel (throughput)',
    'Batch / offline max throughput',
    'Longer stop-the-world OK',
    'Bad default for user-facing P99 SLOs',
  ],
  [
    'Serial',
    'Tiny heaps / single CPU constrained',
    'Simple STW',
    'Avoid for multi-core services',
  ],
];

export const CONCURRENCY_ROWS: string[][] = [
  ['Tool', 'When to use', 'Cost / semantics', 'Interview trap'],
  [
    'synchronized',
    'Simple mutual exclusion, short critical sections',
    'Intrinsic lock; can pin virtual threads if held long',
    'Coarse locks on hot maps; nesting → deadlock',
  ],
  [
    'ReentrantLock / ReadWriteLock',
    'Need tryLock, fairness, condition queues, interruptibility',
    'Explicit unlock in finally; more flexible than synchronized',
    'Forgetting unlock; RW lock write starvation under heavy writes',
  ],
  [
    'LongAdder / LongAccumulator',
    'Hot shared counters (metrics, rate)',
    'Striped cells; sum() weakly consistent under concurrency',
    'Using AtomicLong under extreme contention instead',
  ],
  [
    'ConcurrentHashMap',
    'Concurrent map keyed updates; compute/merge',
    'No nulls; compound ops via compute* not get+put',
    'Iterating and mutating without compute; size() exactness myths',
  ],
  [
    'Semaphore',
    'Bound concurrency to scarce resource (DB, third-party QPS)',
    'Backpressure primitive with VT or platform threads',
    'Unlimited VT without a semaphore in front of Hikari',
  ],
  [
    'StampedLock',
    'Read-mostly with optimistic read',
    'Powerful but easy to misuse',
    'Using it without understanding conversion/optimistic failure paths',
  ],
];
