export const DOMAIN_MODELS = `// Java 21 records used across the catalog
record Employee(
    long id,
    String name,
    String department,
    String city,
    double salary,              // prefer BigDecimal in real FinTech
    int age,
    LocalDate joiningDate,
    List<String> skills
) {}

record Customer(long id, String name, String country, List<Order> orders) {}
record Order(long id, long customerId, OrderStatus status, LocalDateTime placedAt, List<OrderItem> items) {}
record OrderItem(long productId, int qty, BigDecimal unitPrice) {}
record Product(long id, String name, String category, BigDecimal price) {}

record Tx(
    String id,
    String accountId,
    String customerId,
    BigDecimal amount,
    String currency,
    String status,              // SUCCESS | FAILED | PENDING
    Instant ts,
    String type                 // DEBIT | CREDIT | REFUND
) {}`;

export const INTERNALS = `Stream pipeline (mental model)

  Source (Collection / array / generator / Files.lines / IntStream.range)
       ↓
  Spliterator (how elements are traversed / split for parallel)
       ↓
  Intermediate ops (lazy, form a pipeline — filter, map, flatMap, sorted, distinct, limit, skip, peek)
       ↓
  Sink chain (internal push-based stages fused into one pipeline)
       ↓
  Terminal op (triggers execution — collect, reduce, forEach, find*, match*, count, min/max)

Sink: each intermediate stage wraps a downstream Sink; terminal provides the root Sink.
Elements are pushed (tryAdvance / forEachRemaining), not "pulled" like an Iterator loop in user code —
except when you explicitly call iterator()/spliterator().

Lazy evaluation: nothing runs until a terminal operation.
Short-circuiting: findFirst / anyMatch / limit can stop early.
Stateful intermediates (sorted, distinct, limit, skip) may buffer — costly in parallel.
Stateless intermediates (filter, map, peek) fuse well.

A Stream is single-use. After a terminal op, IllegalStateException on reuse.`;

export const SPLITERATOR = `Spliterator — the parallel engine under Streams

  tryAdvance(Consumer)      — push one element
  forEachRemaining(Consumer)— push rest
  trySplit()                — hand half the work to another thread
  estimateSize()
  characteristics()         — ORDERED, DISTINCT, SORTED, SIZED, SUBSIZED, NONNULL, IMMUTABLE, CONCURRENT

Parallel streams recursively trySplit until tasks are "small enough", then run on ForkJoinPool.commonPool().

Custom Spliterator is rarely needed in apps — know it for Staff interviews explaining parallel speedups and why ORDERED + sorted fights parallelism.

Collector.Characteristics (Staff must-know)
  CONCURRENT      — accumulator may share one container across threads (ConcurrentMap)
  UNORDERED       — encounter order may be ignored
  IDENTITY_FINISH — finisher is identity; framework may cast A→R without calling finisher

Associativity of reduce/combiner: (a⊕b)⊕c = a⊕(b⊕c). Non-associative ops break under parallel.`;

export const OPS_CLASSIFICATION = `Intermediate (lazy)
  filter, map, flatMap, mapToInt/Long/Double, flatMapTo*, distinct, sorted, peek, limit, skip,
  takeWhile, dropWhile (Java 9), boxed, …

Terminal (eager)
  forEach, forEachOrdered, collect, reduce, count, min, max,
  findFirst, findAny, anyMatch, allMatch, noneMatch, toArray, iterator, spliterator

Stateless: filter, map, peek, flatMap (usually)
Stateful: sorted, distinct, limit, skip (may need buffers / coordination)

Short-circuiting terminals: find*, *Match, limit (as intermediate also short-circuits upstream)`;

export const PARALLEL_GUIDE = `When parallelStream() helps
  - CPU-bound, associative reductions (sum, large map+filter on in-memory data)
  - Enough elements to amortize fork/join overhead (often >> 10k, measure)
  - No shared mutable state
  - Prefer UNORDERED when order does not matter (findAny, unordered())

When it hurts
  - Tiny lists
  - Blocking IO on commonPool (starves the JVM)
  - ORDERED + sorted + limit interactions
  - Contended concurrent collectors without care
  - Virtual threads ≠ parallel streams (different problem)

Anti-pattern
  int[] total = {0};
  list.parallelStream().forEach(x -> total[0] += x);  // DATA RACE

Correct
  list.parallelStream().mapToInt(Integer::intValue).sum();
  or collect(Collectors.summingInt(...))`;

export const PERFORMANCE = `Optimize Stream pipelines like production code

  1. Filter early — shrink before map/sorted
  2. Prefer primitive streams for numeric heavy work (mapToInt, sum)
  3. Avoid unnecessary sorted/distinct (both stateful + memory)
  4. Don't traverse twice — teeing / multi-downstream collectors
  5. Short-circuit (findFirst, anyMatch, limit) when you can
  6. Don't peek for business logic
  7. Don't parallel by default
  8. Avoid boxing churn at hot boundaries
  9. For DB-sized data — push aggregation to SQL; don't findAll().stream()
  10. Measure with JMH before claiming "Streams are slower/faster"

skip(n) for deep pagination on huge in-memory lists is O(n); use DB OFFSET/keyset pagination.`;

export const STREAM_VS_LOOP = `Streams vs loops — Staff judgment

  Streams win: declarative transforms, grouping, parallel CPU work, fluent DTO mapping
  Loops win: complex early exits, checked exceptions, hot tight loops, debugging, index algorithms

  Conclusion for 21+ years interviews:
  Use Streams where they clarify intent. Switch to loops or SQL when they clarify performance or control flow.
  Clever one-liners that hide N+1 or O(n log n) sorts are not senior engineering.`;

export const JPA_WARNINGS = `Streams + JPA / DB

  repository.findAll().stream()  → loads entire table into memory (and persistence context)
  Lazy associations inside map/flatMap → N+1 queries
  Stream from Spring Data must be closed (try-with-resources) on @Query stream results
  Aggregation of millions of rows belongs in SQL (GROUP BY, window functions)
  Pagination: Pageable / keyset — not skip on a giant entity stream

Staff answer: "Streams don't make IO free. Shape the query; stream only bounded batches."`;

export const FILE_STREAMS = `Files.lines(path) returns a Stream that MUST be closed.

  try (Stream<String> lines = Files.lines(path)) {
    return lines.filter(...).map(...).toList();
  }

Resource leak = open file descriptors under load.
For huge files consider buffered batching / Apache Commons CSV / Dataframe-style tools.`;

export const EXCEPTION_HANDLING = `Checked exceptions inside map/filter are awkward — lambdas can't throw them unchecked.

Patterns:
  1. Extract a wrapping helper that converts to RuntimeException (with care)
  2. Validate/parse before the stream
  3. flatMap to Stream of Try/Optional results
  4. Don't swallow exceptions inside peek/map

Hiding SQLException in a RuntimeException without context fails production debugging.`;

export const JAVA_VERSIONS = `Java 8  — Streams, Optional, default methods, java.time
Java 9  — takeWhile, dropWhile, ofNullable, iterate(seed,predicate,next), Optional.stream
Java 10 — var (local)
Java 16 — Stream.toList() (unmodifiable), records finalized
Java 17 — sealed classes, RandomGenerator
Java 21 — virtual threads, sequenced collections, pattern matching expansions
         Virtual threads are NOT a Stream feature — don't claim parallelStream uses them.

Prefer:
  .toList() (16+) over collect(toList()) when unmodifiable is OK
  records for DTOs in examples
  BigDecimal for money in FinTech problems`;

export const LEVELS = `What interviewers expect by experience

  ~5 years   — filter/map/collect, basic grouping, know terminal vs intermediate
  ~10 years  — collectors, nested groupingBy, toMap merge, complexity, Optional pitfalls
  ~15 years  — parallel correctness, boxing, JPA/N+1, when NOT to use Streams, JMH skepticism
  21+ years  — design judgment, Spliterator story, collector associativity, DB vs JVM aggregation,
               production failure modes, teaching juniors when loops/SQL are better`;

export const BAD_CODE: {title: string; bad: string; why: string; better: string; senior: string}[] = [
  {
    title: 'Side-effecting forEach as "map"',
    bad: `List<String> out = new ArrayList<>();
list.stream().forEach(x -> out.add(x.toUpperCase()));`,
    why: 'Not parallel-safe; non-idiomatic; races with parallelStream.',
    better: `List<String> out = list.stream().map(String::toUpperCase).toList();`,
    senior: 'Collectors exist so you do not mutate shared lists.',
  },
  {
    title: 'peek for business logic',
    bad: `stream.peek(this::chargeCard).collect(toList());`,
    why: 'peek is for debugging; may not run as you think with short-circuit/optimization.',
    better: `Explicit loop or map to result objects; charge in a transactional service method.`,
    senior: 'Side effects belong in clear imperative boundaries.',
  },
  {
    title: 'Blind parallelStream',
    bad: `users.parallelStream().map(this::callHttp).toList();`,
    why: 'Blocks commonPool on IO; latency collapses under load.',
    better: `Sequential stream, or virtual-thread executor for IO concurrency (Java 21), not parallelStream.`,
    senior: 'parallelStream is for CPU-bound in-memory work.',
  },
  {
    title: 'toMap without merge',
    bad: `emps.stream().collect(toMap(Employee::name, Employee::salary));`,
    why: 'Duplicate names → IllegalStateException.',
    better: `toMap(Employee::name, Employee::salary, (a,b) -> a); // or throw custom`,
    senior: 'Always discuss duplicate key policy.',
  },
  {
    title: 'findAll().stream() aggregation',
    bad: `repo.findAll().stream().collect(groupingBy(Tx::accountId, summing...));`,
    why: 'Loads entire table; GC death; holds persistence context.',
    better: `SQL GROUP BY / projection query / batch pagination.`,
    senior: 'Push aggregation to the database at scale.',
  },
  {
    title: 'Shared mutable in parallel',
    bad: `AtomicInteger weird; or worse int[] box; parallel forEach add`,
    why: 'Easy to get wrong; loses associativity benefits.',
    better: `reduce / collect / primitive sum`,
    senior: 'If you need Atomic*, rethink the collector.',
  },
];

export const CHEAT = `filter       → select elements
map          → 1:1 transform
flatMap      → 1:many flatten
distinct     → unique (equals/hashCode)
sorted       → order (O(n log n), stateful)
limit / skip → window / pagination (skip costly on huge lists)
reduce       → fold (need combiner for parallel)
collect      → materialize with Collectors
groupingBy   → Map classifier → downstream
partitioningBy → Map true/false
mapping      → transform downstream
joining      → concatenate Strings
toMap        → key/value (+ merge)
teeing       → two collectors → merge (Java 12+)
collectingAndThen → finish transform

Stream → Source → Intermediate (lazy) → Terminal (execute)

Performance: filter early · primitives · avoid needless sort/distinct · don't parallel IO · SQL for big aggregations
Concurrency: no shared mutable · care with ORDERED · groupingByConcurrent when applicable
Anti-patterns: peek business logic · findAll stream · blind parallel · toMap without merge`;
