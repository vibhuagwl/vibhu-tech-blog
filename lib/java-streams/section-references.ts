/** Per-section JDK API / overload / edge-case references (Staff interview density).
 *  Keys match PROBLEM_GROUPS ids. Grouping lives in grouping-reference.ts. */

export type SectionRef = {
  intro: string;
  overloads: string; // ascii diagram of APIs / overloads / flavours
  downstream?: string; // optional second block
  edges: string;
  cheat: [string, string][];
};

export const SECTION_REFS: Partial<Record<string, SectionRef>> = {
  fundamentals: {
    intro:
      'Stream sources and factories Staff interviews expect — of/empty/builder, iterate/generate, Collection/Arrays/Files, primitives, StreamSupport.',
    overloads: `Stream / primitive sources (Java 8–21)

FINITE
  Stream.of(T... values)              // varargs; of() → empty
  Stream.of(T t)                      // single element
  Stream.empty()
  Stream.builder() → accept / add → build()
  Stream.concat(a, b)                 // lazy; closes both
  Stream.ofNullable(T)                // Java 9 — 0 or 1 element

INFINITE / SEEDED
  Stream.iterate(seed, UnaryOperator)           // 2-arg, unbounded
  Stream.iterate(seed, Predicate, UnaryOperator)// 3-arg Java 9 — takeWhile-style
  Stream.generate(Supplier)                     // unbounded; pair with limit

COLLECTIONS / ARRAYS
  Collection.stream() / parallelStream()
  Arrays.stream(T[])
  Arrays.stream(T[], from, to)
  Arrays.stream(int[]|long[]|double[]) → Int/Long/DoubleStream
  Stream.of(array)  // ONE element (the array) — trap vs Arrays.stream

PRIMITIVES
  IntStream.range(start, end)           // exclusive end
  IntStream.rangeClosed(start, end)     // inclusive
  IntStream.of / LongStream.of / DoubleStream.of
  Random.ints() / longs() / doubles()

I/O & SPLITERATORS
  Files.lines(Path[, Charset])          // try-with-resources!
  BufferedReader.lines()
  StreamSupport.stream(spliterator, parallel)
  BitSet.stream() / CharSequence chars/codePoints`,
    downstream: `Builder & concat notes

Stream.builder()
  accept(T) / add(T) → Builder; build() once
  after build() → IllegalStateException on further accept

concat(a,b)
  sequential if both sequential; ordered if both ordered
  closing the concat stream closes both inputs
  prefer flatMap for many streams (concat is binary only)`,
    edges: `Edge cases interviewers probe

• Stream.of(array) wraps the array as one element — use Arrays.stream
• iterate 2-arg never terminates alone — always limit/takeWhile/find*
• generate + stateful Supplier is not parallel-safe unless concurrent
• Files.lines must be closed (try-with-resources) or leak file handles
• parallelStream() on tiny lists is often slower (commonPool overhead)
• range vs rangeClosed — off-by-one is a classic interview trap
• empty() is a shared singleton; of() with zero args same idea
• ofNullable(null) → empty stream, not NPE`,
    cheat: [
      ['of / empty / builder', 'finite sources'],
      ['ofNullable', 'Java 9 — null → empty'],
      ['iterate 2-arg', 'unbounded — need limit'],
      ['iterate 3-arg', 'Java 9 — predicate stop'],
      ['generate', 'Supplier + limit'],
      ['Collection.stream', 'default sequential'],
      ['Arrays.stream', 'arrays / slices / primitives'],
      ['range / rangeClosed', 'IntStream exclusive vs inclusive'],
      ['Files.lines', 'close the stream'],
      ['StreamSupport', 'custom Spliterator'],
      ['concat', 'binary only; closes both'],
      ['of(array) trap', 'one element — use Arrays.stream'],
    ],
  },

  filter: {
    intro:
      'filter(Predicate) plus Predicate composition (and/or/negate/not) and null-safe patterns Staff expect.',
    overloads: `filter family

Stream.filter(Predicate<? super T> predicate)
IntStream / LongStream / DoubleStream.filter(Int/Long/DoublePredicate)

Predicate composition (java.util.function.Predicate)
  p.and(q)          // short-circuit &&
  p.or(q)           // short-circuit ||
  p.negate()        // !
  Predicate.not(p)  // Java 11 static — clearer than p.negate()
  Predicate.isEqual(target)  // Objects.equals semantics
  Predicate.not(Objects::isNull)  // keep non-null

Compose styles
  .filter(p.and(q).or(r))
  .filter(active).filter(premium)   // same as and — prefer and for one pass clarity
  .filter(Predicate.not(String::isBlank))`,
    downstream: `Null-safe patterns

  .filter(Objects::nonNull)
  .filter(Objects::nonNull).map(Optional::orElseThrow)  // rare
  .map(Optional::ofNullable).flatMap(Optional::stream)  // Java 9
  Optional.filter(pred)  // not Stream — know the parallel API

Avoid
  filter(x -> x != null && x.flag())  without NPE plan on flag()
  → filter(Objects::nonNull).filter(X::flag)`,
    edges: `Edge cases interviewers probe

• filter never short-circuits the whole pipeline alone — use find*/match/limit
• Predicate.and/or short-circuit left-to-right like && / ||
• negate vs Predicate.not — not() reads better with method refs (Java 11+)
• filtering(pred, down) inside collectors is Java 9+ (downstream, not mid-pipeline)
• parallel filter must be stateless & side-effect free
• empty stream → filter yields empty (no NPE on predicate)
• null elements: Predicate receives null unless you filtered them`,
    cheat: [
      ['filter(pred)', 'keep matching elements'],
      ['p.and(q)', 'both true (short-circuit)'],
      ['p.or(q)', 'either true'],
      ['p.negate()', 'invert'],
      ['Predicate.not', 'Java 11 — method-ref friendly'],
      ['isEqual(t)', 'Objects.equals'],
      ['Objects::nonNull', 'drop nulls'],
      ['Optional.stream', 'null → 0/1 then flatMap'],
      ['two filters', '≈ and — one Predicate often clearer'],
      ['stateless', 'required for parallel'],
      ['Collector filtering', 'Java 9+ nested under grouping'],
      ['empty → empty', 'predicate never called'],
    ],
  },

  map: {
    intro:
      '1:1 transforms — map, mapToInt/Long/Double, boxed/as*, and mapMulti (Java 16) for selective expansion.',
    overloads: `map family

REFERENCE
  Stream.map(Function<? super T, ? extends R>)

TO PRIMITIVE
  Stream.mapToInt(ToIntFunction)
  Stream.mapToLong(ToLongFunction)
  Stream.mapToDouble(ToDoubleFunction)

PRIMITIVE → PRIMITIVE / REF
  IntStream.map(IntUnaryOperator)
  IntStream.mapToLong / mapToDouble
  IntStream.mapToObj(IntFunction<? extends U>)  // unbox path out
  LongStream / DoubleStream analogous

WIDEN / BOX
  IntStream.asLongStream() / asDoubleStream()
  LongStream.asDoubleStream()
  IntStream.boxed() → Stream<Integer>   (also Long/Double)

Java 16+
  Stream.mapMulti(BiConsumer<T, Consumer<R>>)
  mapMultiToInt / ToLong / ToDouble
    // replace flatMap for 0..n fan-out without Stream allocation`,
    downstream: `map vs mapMulti vs flatMap

map          exactly 1 output per input
flatMap      0..n via Stream (allocates Stream per element)
mapMulti     0..n via Consumer.accept (Java 16 — often faster)

Typical mapMulti
  (item, sink) -> { if (ok) sink.accept(proj); }
  replaces filter+map or flatMap(Optional::stream) in hot paths`,
    edges: `Edge cases interviewers probe

• mapToInt then sum/average/summaryStatistics — avoid boxing
• boxed() after mapToInt if you need object Collectors
• map must not mutate shared state in parallel
• mapMulti requires Java 16; interview may ask flatMap alternative
• asLongStream on IntStream is widening — not boxing
• Function identity: map(Function.identity()) vs map(x -> x)
• null return from map is allowed but poisonous downstream`,
    cheat: [
      ['map', '1:1 reference transform'],
      ['mapToInt/Long/Double', 'avoid boxing'],
      ['mapToObj', 'primitive → reference'],
      ['boxed()', 'IntStream → Stream<Integer>'],
      ['asLongStream', 'widen int→long'],
      ['mapMulti', 'Java 16 — 0..n no Stream'],
      ['mapMultiTo*', 'primitive mapMulti'],
      ['sum after mapToInt', 'IntStream.sum'],
      ['DTO projection', 'map(e -> new Dto(...))'],
      ['filter+map', 'often mapMulti or flatMap Optional'],
      ['identity', 'Function.identity()'],
      ['null from map', 'legal but risky'],
    ],
  },

  flatmap: {
    intro:
      '1:many flattening — flatMap / flatMapTo*, Optional.stream (Java 9), and when map is wrong.',
    overloads: `flatMap family

REFERENCE
  Stream.flatMap(Function<? super T, ? extends Stream<? extends R>>)

TO PRIMITIVE
  Stream.flatMapToInt(Function → IntStream)
  Stream.flatMapToLong(Function → LongStream)
  Stream.flatMapToDouble(Function → DoubleStream)

PRIMITIVE
  IntStream.flatMap(IntFunction<? extends IntStream>)
  LongStream / DoubleStream.flatMap analogous

OPTIONAL (Java 9+)
  optional.stream() → Stream of 0 or 1
  stream.flatMap(Optional::stream)  // unwrap present values

Collector-side (Java 9+)
  Collectors.flatMapping(mapper, downstream)  // under groupingBy`,
    downstream: `map vs flatMap — interview board

map(f) where f returns Stream/List/Optional
  → Stream<Stream<T>> / Stream<List<T>> / Stream<Optional<T>>  WRONG shape

flatMap(x -> list.stream())
flatMap(x -> Arrays.stream(arr))
flatMap(opt -> opt.stream())          // Java 9
flatMap(opt -> opt.map(Stream::of).orElseGet(Stream::empty))  // Java 8

Prefer mapMulti (16+) when fan-out is simple accept/skip — less allocation.`,
    edges: `Edge cases interviewers probe

• returning null from flatMap mapper → NPE (must return empty stream)
• flatMap is intermediate; empty inner streams just contribute nothing
• order: flatMap preserves encounter order of outer then inner
• parallel flatMap: inner streams are sequential by default; overhead adds up
• Optional.stream needs Java 9; Java 8 uses orElseGet(Stream::empty) pattern
• confuse with map(Collection::stream) → nested Stream — need flatMap
• Files / I/O inside flatMap: resource lifetime is per-inner-stream`,
    cheat: [
      ['flatMap', '1:many via Stream'],
      ['flatMapToInt', 'flatten to IntStream'],
      ['Optional.stream', 'Java 9 — 0/1 unwrap'],
      ['map(List::stream)', 'WRONG — nested Stream'],
      ['null inner', 'NPE — return empty()'],
      ['Arrays.stream', 'common inner source'],
      ['flatMapping', 'Java 9 collector nested'],
      ['mapMulti alt', 'Java 16 less alloc'],
      ['Java 8 Optional', 'orElseGet(Stream::empty)'],
      ['order', 'outer then inner'],
      ['empty inner', 'contributes zero'],
      ['nested lists', 'orders.flatMap(o -> o.items().stream())'],
    ],
  },

  distinct: {
    intro:
      'distinct() uniqueness via equals/hashCode; distinct-by-key patterns; stateful pipeline cost.',
    overloads: `distinct family

Stream.distinct()
IntStream / LongStream / DoubleStream.distinct()

Semantics
  reference: Object.equals + hashCode (HashSet-backed state)
  primitives: value equality
  stable for ordered streams — keeps first encounter
  unordered() may drop encounter-order guarantee (cheaper parallel)

No JDK "distinctBy(key)" — roll your own:

  // sequential encounter-order friendly
  .filter(new HashSet<>()::add)           // side-effect — interview caution
  .collect(toMap(key, identity(), (a,b)->a, LinkedHashMap::new))
       .values().stream()

  Collector distinctBy (custom) or groupingBy(key, collectingAndThen(...))`,
    downstream: `Stateful ops cost

distinct is STATEFUL intermediate:
  may buffer all seen keys
  parallel distinct → expensive concurrent structures
  after sorted, distinct can be cheaper on sorted runs (impl-dependent)

Pairings
  sorted().distinct()  // unique sorted
  distinct().sorted()  // unique then sort
  limit after distinct still may scan far for enough uniques`,
    edges: `Edge cases interviewers probe

• mutable objects as keys: mutating after insert breaks HashSet contract
• distinct uses equals/hashCode — override both or use records
• distinct-by-field with filter(Set::add) is not parallel-safe
• null: at most one null in distinct() for reference streams
• infinite stream + distinct without limit may never terminate if all unique
• TreeSet collector ≠ distinct (sorted unique, Comparator-based)
• parallel + unordered().distinct() — throughput vs first-wins semantics`,
    cheat: [
      ['distinct()', 'equals/hashCode uniqueness'],
      ['first wins', 'ordered streams keep first'],
      ['no distinctBy', 'JDK — use toMap / custom'],
      ['Set::add filter', 'seq only — side effect'],
      ['toMap merge', 'LinkedHashMap keep first'],
      ['stateful', 'buffers seen keys'],
      ['parallel cost', 'high — prefer seq or key set'],
      ['null', 'at most one null'],
      ['records', 'auto equals/hashCode'],
      ['sorted+distinct', 'unique ordered'],
      ['unordered', 'may speed parallel'],
      ['override both', 'equals AND hashCode'],
    ],
  },

  sort: {
    intro:
      'sorted() natural order and sorted(Comparator) with thenComparing, nulls, reverse/natural helpers.',
    overloads: `sorted family

Stream.sorted()                         // Comparable; CCE if not
Stream.sorted(Comparator<? super T>)
IntStream / LongStream / DoubleStream.sorted()  // natural numeric

Comparator factories (java.util.Comparator)
  naturalOrder() / reverseOrder()
  comparing(keyExtractor)
  comparing(key, keyComparator)
  comparingInt / Long / Double(ToXFunction)     // avoid boxing
  thenComparing / thenComparingInt/Long/Double  // tie-break chain
  nullsFirst(cmp) / nullsLast(cmp)
  reversed()                                    // on a Comparator instance
  Comparator.comparing(...).reversed()

Primitives: no Comparator overload — sort values, then mapToObj if needed.`,
    downstream: `Stable sort & encounter order

Java Stream sorted is stable for ordered streams (TimSort-like).
sorted() is STATEFUL + typically BARRIER — full materialization before downstream.

Common chains
  sorted(comparing(User::age).thenComparing(User::name))
  sorted(comparing(User::name, nullsLast(naturalOrder())))
  sorted(reverseOrder())                      // Comparable desc
  sorted(comparing(User::score).reversed())`,
    edges: `Edge cases interviewers probe

• sorted() without Comparable → ClassCastException at terminal
• null elements + naturalOrder → NPE; wrap nullsFirst/Last
• parallel sorted: still correct, but expensive merge
• sorted is eager barrier — limit(10) after sorted still sorts ALL (unless short-circuit optimizations — don't rely)
• thenComparing order matters — primary key first
• Enum order is declaration order via naturalOrder
• Comparator.comparing null keyExtractor result → NPE unless nulls*`,
    cheat: [
      ['sorted()', 'Comparable natural'],
      ['sorted(cmp)', 'custom order'],
      ['comparing', 'key extractor'],
      ['comparingInt', 'unboxed keys'],
      ['thenComparing', 'tie-break'],
      ['nullsFirst/Last', 'null-safe order'],
      ['reverseOrder', 'Comparable desc'],
      ['reversed()', 'flip a Comparator'],
      ['stable', 'equal elements keep order'],
      ['barrier', 'buffers before emit'],
      ['parallel', 'correct but costly'],
      ['CCE risk', 'sorted() needs Comparable'],
    ],
  },

  'limit-skip': {
    intro:
      'limit / skip windows plus takeWhile / dropWhile (Java 9) short-circuit semantics and costs.',
    overloads: `window / prefix ops

Stream.limit(n)     // first n; n < 0 → IAE
Stream.skip(n)      // drop first n; n < 0 → IAE
Int/Long/DoubleStream.limit / skip   // same

Java 9+
  Stream.takeWhile(Predicate)  // longest prefix matching; short-circuit
  Stream.dropWhile(Predicate)  // drop prefix while match; then pass-through
  primitive *Stream takeWhile / dropWhile

Pagination pattern
  stream.sorted(...).skip(page * size).limit(size)

Top-N (ordered)
  sorted(cmp.reversed()).limit(N)`,
    downstream: `Short-circuit & laziness

limit / takeWhile — SHORT-CIRCUIT capable on ordered sequential sources
skip(n) — must discard n elements (costly on sequential linked sources)
dropWhile — stops dropping at first failure; rest unlimited

infinite sources
  iterate/generate + limit        OK
  iterate/generate + skip(huge)  may hang / OOM time
  takeWhile on unbounded        terminates when predicate fails`,
    edges: `Edge cases interviewers probe

• limit(0) / skip(0) → empty / identity
• skip on parallel ordered stream is expensive (preserve order)
• unordered().skip may be cheaper (encounter order waived)
• takeWhile ≠ filter: filter checks all; takeWhile stops at first false
• dropWhile then filter still processes remainder
• sorted().limit(N) generally sorts entire input (no magic top-N heap in Stream API)
• negative n → IllegalArgumentException
• after skip+limit, findFirst is classic page peek`,
    cheat: [
      ['limit(n)', 'first n — short-circuit'],
      ['skip(n)', 'drop n — must consume'],
      ['takeWhile', 'Java 9 — prefix while true'],
      ['dropWhile', 'Java 9 — skip prefix'],
      ['takeWhile≠filter', 'stops at first false'],
      ['page', 'skip(page*size).limit(size)'],
      ['top-N', 'sorted+limit (full sort)'],
      ['limit(0)', 'empty stream'],
      ['parallel skip', 'ordered = costly'],
      ['unordered', 'may speed skip'],
      ['infinite+limit', 'required to terminate'],
      ['n < 0', 'IllegalArgumentException'],
    ],
  },

  'find-match': {
    intro:
      'any/all/noneMatch and findFirst/findAny — short-circuit terminals, vacuous truth, parallel findAny.',
    overloads: `match terminals

  boolean anyMatch(Predicate)   // true if ≥1 match; empty → false
  boolean allMatch(Predicate)   // true if all match; empty → TRUE (vacuous)
  boolean noneMatch(Predicate)  // true if none match; empty → TRUE
  primitive streams: same with *Predicate

find terminals

  Optional<T> findFirst()       // first in encounter order
  Optional<T> findAny()         // any; freer in parallel
  OptionalInt findFirst/Any()   // IntStream — OptionalInt etc.

Short-circuit: may not evaluate the whole stream once answer known.`,
    downstream: `Vacuous truth (empty stream)

  allMatch(p)  → true
  noneMatch(p) → true
  anyMatch(p)  → false
  findFirst()  → Optional.empty()

Interview line: "allMatch on empty is true — same as mathematics ∀ on ∅."

Parallel
  findAny() preferred when order irrelevant
  findFirst() on parallel ordered still respects order (more sync)`,
    edges: `Edge cases interviewers probe

• allMatch ≡ !anyMatch(p.negate()) only when careful with empty — both vacuous-true
• noneMatch(p) ≡ allMatch(p.negate())
• findFirst on unordered source — still "some" element; order not defined
• predicate side effects may run partially due to short-circuit
• parallel anyMatch can stop early across threads
• OptionalInt vs Optional<Integer> — don't confuse with boxed find
• filter+findFirst vs anyMatch — anyMatch when you only need boolean`,
    cheat: [
      ['anyMatch', '≥1 — empty false'],
      ['allMatch', 'all — empty TRUE'],
      ['noneMatch', 'none — empty TRUE'],
      ['vacuous truth', 'empty all/none → true'],
      ['findFirst', 'encounter order'],
      ['findAny', 'parallel-friendly'],
      ['Optional empty', 'no element'],
      ['short-circuit', 'may skip remainder'],
      ['OptionalInt', 'primitive find'],
      ['unordered findFirst', 'no order promise'],
      ['boolean need', 'prefer anyMatch'],
      ['side effects', 'partial execution OK'],
    ],
  },

  reduce: {
    intro:
      '1/2/3-arg reduce — identity, accumulator, combiner — vs collect; parallel associativity rules.',
    overloads: `reduce overloads

1-arg  Optional<T> reduce(BinaryOperator<T> op)
         // no identity; empty → Optional.empty()

2-arg  T reduce(T identity, BinaryOperator<T> op)
         // identity for empty; always returns T

3-arg  <U> U reduce(U identity,
                    BiFunction<U,? super T,U> accumulator,
                    BinaryOperator<U> combiner)
         // map-reduce style; U may differ from T
         // parallel: accumulator per partition, combiner merges

Primitives
  IntStream.reduce(int identity, IntBinaryOperator)
  OptionalInt reduce(IntBinaryOperator)
  sum() / min() / max() / count() — specialized reduces`,
    downstream: `identity · accumulator · combiner

identity
  must be identity for combiner: combiner(id, u) == u
  empty stream → identity (2/3-arg)

accumulator
  fold one element into partial result

combiner
  ONLY needed for parallel partials; sequential may ignore
  must be associative with accumulator

reduce vs collect
  reduce: immutable fold values
  collect: mutable container + supplier/accumulator/combiner (Collectors)
  parallel mutable → collect; reduce with mutable accumulator is a trap`,
    edges: `Edge cases interviewers probe

• non-associative op (minus, average DIY) breaks parallel reduce
• 1-arg reduce on empty → empty Optional — callers forget
• identity 0 for product is WRONG (use 1); "" for string concat OK
• 3-arg with mutable U without copying → race in parallel
• prefer summingInt / joining / Collectors over hand-rolled reduce
• max/min via reduce(Integer::max) vs max(Comparator) / IntStream.max
• BigDecimal: reduce(ZERO, BigDecimal::add) — never double money`,
    cheat: [
      ['1-arg', 'Optional — no identity'],
      ['2-arg', 'identity + op'],
      ['3-arg', 'identity + acc + combiner'],
      ['empty 1-arg', 'Optional.empty()'],
      ['empty 2/3-arg', 'returns identity'],
      ['combiner', 'parallel partials'],
      ['associative', 'required for parallel'],
      ['vs collect', 'immutable vs mutable'],
      ['sum shortcut', 'IntStream.sum'],
      ['product id', '1 not 0'],
      ['BigDecimal', 'reduce(ZERO, add)'],
      ['mutable trap', 'use collect'],
    ],
  },

  collectors: {
    intro:
      'Core Collectors — toList/toSet/toCollection, numeric aggregates, collectingAndThen, teeing overview (groupingBy → grouping-reference).',
    overloads: `Collectors — core catalogue

TO COLLECTIONS
  toList()                 // mutable ArrayList (unmodifiable in practice? — JDK: mutable)
  toSet()                  // HashSet
  toCollection(Supplier)   // LinkedList, TreeSet, …
  toUnmodifiableList/Set() // Java 10 — truly unmodifiable
  toList() Java 16 Stream.toList() — unmodifiable, NOT Collector

AGGREGATES
  counting() → Long
  summingInt / Long / Double
  averagingInt / Long / Double
  summarizingInt / Long / Double → *SummaryStatistics
  reducing(...) / minBy / maxBy(Comparator)

RESHAPE
  mapping(fn, down)
  flatMapping(fn, down)    // Java 9+
  filtering(pred, down)    // Java 9+
  collectingAndThen(down, finisher)
  teeing(c1, c2, merger)   // Java 12+

GROUPING — see grouping-reference.ts
  groupingBy / groupingByConcurrent
  partitioningBy → #partitioning`,
    downstream: `collectingAndThen & teeing

collectingAndThen(down, finisher)
  unwrap Optional from maxBy
  Collections::unmodifiableList
  list → list.get(0) / sort copy / DTO

teeing(c1, c2, merger)  // Java 12
  single pass two collectors
  e.g. counting + summingInt → report
  nest under groupingBy for per-key dual stats

Stream.toList() (16) vs Collectors.toList()
  toList(): unmodifiable, allows nulls
  Collectors.toList(): mutable ArrayList`,
    edges: `Edge cases interviewers probe

• Collectors.toList() ≠ Stream.toList() (modifiability)
• averaging empty → 0.0; counting empty → 0
• summarizing empty → count 0, sum 0, min/max sentinel extremes
• toSet loses order; toCollection(LinkedHashSet::new) keeps
• teeing needs Java 12; before: two passes or custom Collector
• finisher runs once at end — not per element
• parallel collect needs CONCURRENT characteristics or thread-confined partials
• point interviewers to groupingBy page for classifier overloads`,
    cheat: [
      ['toList/toSet', 'standard sinks'],
      ['toCollection', 'custom Supplier'],
      ['toUnmodifiable*', 'Java 10'],
      ['Stream.toList', 'Java 16 unmodifiable'],
      ['counting', 'Long'],
      ['summing/averaging', 'numeric'],
      ['summarizing', '*SummaryStatistics'],
      ['collectingAndThen', 'finish/transform'],
      ['teeing', 'Java 12 dual collect'],
      ['mapping', 'reshape elements'],
      ['filtering/flatMapping', 'Java 9 nested'],
      ['groupingBy', 'see grouping-reference'],
    ],
  },

  partitioning: {
    intro:
      'partitioningBy — boolean specialization of grouping; always both keys; 1/2-arg and vs groupingBy(Boolean).',
    overloads: `Collectors.partitioningBy

1) partitioningBy(Predicate<? super T> predicate)
     → Map<Boolean, List<T>>
        keys ALWAYS true and false (even if a side empty)

2) partitioningBy(Predicate<? super T> predicate,
                  Collector<? super T, A, D> downstream)
     → Map<Boolean, D>

No mapFactory overload (unlike groupingBy 3-arg).
Downstream examples
  counting() / summingInt / mapping / toSet
  collectingAndThen(toList(), List::copyOf)`,
    downstream: `vs groupingBy(Boolean classifier)

partitioningBy
  always inserts both Boolean.TRUE and FALSE
  optimized boolean path
  Map has size 2

groupingBy(x -> condition)
  missing key if no elements classified there
  HashMap — possibly size 0, 1, or 2
  Prefer partitioningBy for true/false splits

Nested
  groupingBy(dept, partitioningBy(Employee::active))
  partitioningBy(pred, groupingBy(key))`,
    edges: `Edge cases interviewers probe

• empty stream → {false=[], true=[]} (both keys, empty lists)
• empty + downstream counting → {false=0, true=0}
• null predicate → NPE; null elements passed to predicate — NPE risk
• not Concurrent — parallel uses non-concurrent Map merge of partials
• cannot choose LinkedHashMap — fixed Map<Boolean, …> impl
• partitioningBy is not a substitute for 3-way enums — use groupingBy
• true/false list identity: don't assume shared emptyList sentinel across JDKs`,
    cheat: [
      ['1-arg', 'Map<Boolean, List<T>>'],
      ['2-arg', 'Map<Boolean, D>'],
      ['both keys', 'always true & false'],
      ['empty stream', 'both keys empty'],
      ['vs groupingBy', 'grouping may omit keys'],
      ['no mapFactory', 'fixed boolean map'],
      ['downstream count', 'both sides Long'],
      ['nested', 'group then partition'],
      ['3-way split', 'use groupingBy'],
      ['null element', 'predicate NPE risk'],
      ['parallel', 'partial maps merged'],
      ['active/inactive', 'classic use'],
    ],
  },

  'tomap-joining': {
    intro:
      'toMap 2/3/4-arg, merge functions, mapFactory, toUnmodifiableMap; joining 1/2/3-arg for strings.',
    overloads: `Collectors.toMap / toUnmodifiableMap

2) toMap(keyMapper, valueMapper)
     // duplicate key → IllegalStateException

3) toMap(keyMapper, valueMapper, BinaryOperator merge)
     // merge(old, new) on collision

4) toMap(keyMapper, valueMapper, merge, Supplier mapFactory)
     // LinkedHashMap / TreeMap / EnumMap / …

toUnmodifiableMap(key, value[, merge])  // Java 10 — no mapFactory
  null keys/values forbidden → NPE

joining (CharSequence elements)

1) joining()              // "" concat
2) joining(delimiter)
3) joining(delimiter, prefix, suffix)

mapping(fn, joining(...)) under groupingBy for per-group CSV`,
    downstream: `merge & mapFactory patterns

keep first   (a, b) -> a
keep last    (a, b) -> b
sum ints     Integer::sum
concat       (a, b) -> a + "|" + b

LinkedHashMap::new   encounter-order keys
TreeMap::new         sorted keys
() -> new EnumMap<>(E.class)

toMap vs groupingBy
  unique key → toMap
  multi values per key → groupingBy
  duplicate without merge → ISE at collect time`,
    edges: `Edge cases interviewers probe

• duplicate keys without merge → IllegalStateException (not silent)
• null key/value in toMap → NPE (HashMap allows null key but Collector forbids)
• toUnmodifiableMap rejects nulls; result throws on put
• parallel toMap: merge must be associative/order-safe if needed
• joining on non-CharSequence → compile error — map(Object::toString) first
• empty joining → "" (or prefix+suffix only for 3-arg)
• TreeMap + null key → NPE from TreeMap
• ConcurrentHashMap as mapFactory — nulls forbidden anyway`,
    cheat: [
      ['2-arg toMap', 'dup → ISE'],
      ['3-arg', 'merge on collision'],
      ['4-arg', 'custom Map supplier'],
      ['keep first', '(a,b)->a'],
      ['toUnmodifiableMap', 'Java 10'],
      ['LinkedHashMap', 'encounter order'],
      ['TreeMap', 'sorted keys'],
      ['joining()', 'bare concat'],
      ['joining(delim)', 'CSV-ish'],
      ['joining 3-arg', 'prefix/suffix'],
      ['null key', 'NPE in toMap'],
      ['vs groupingBy', 'unique vs multi'],
    ],
  },

  'topn-nth': {
    intro:
      'max/min, Nth via sorted+skip+findFirst, and PriorityQueue / heap alternatives Stream lacks.',
    overloads: `max / min / nth patterns

Stream.max(Comparator) → Optional<T>
Stream.min(Comparator) → Optional<T>
IntStream.max/min() → OptionalInt (natural)

Top-1
  .max(comparing(Order::total))
  .collect(maxBy(...)) + collectingAndThen unwrap

Top-N (JDK Stream — simple, not heap)
  .sorted(cmp.reversed()).limit(N)

Nth highest (1-based n)
  .sorted(cmp.reversed()).skip(n - 1).findFirst()

Nth with distinct values
  .map(key).distinct().sorted(cmp.reversed()).skip(n-1).findFirst()`,
    downstream: `PriorityQueue alternative (O(M log N) top-N)

Stream API has no built-in heap top-N.
Interview expectation:

  PriorityQueue<T> heap = new PriorityQueue<>(cmp); // min-heap of size N
  for (T x : data) {
    heap.offer(x);
    if (heap.size() > N) heap.poll();
  }

Or collect custom Collector / manual loop.
sorted().limit(N) is O(M log M) — fine until M huge.

maxBy vs max — same idea; max is terminal, maxBy is Collector.`,
    edges: `Edge cases interviewers probe

• empty → max/min Optional.empty() — orElseThrow in interviews
• sorted+skip+findFirst sorts ALL — costly for huge M, small n
• ties: define Comparator thenComparing id for deterministic Nth
• parallel sorted top-N still full sort barrier
• IntStream.max empty → empty OptionalInt (not 0)
• "2nd highest salary" often wants distinct salaries — ask clarifying
• limit(N) without sorted is NOT top-N — just first N encounter`,
    cheat: [
      ['max(cmp)', 'Optional top-1'],
      ['min(cmp)', 'Optional bottom-1'],
      ['top-N', 'sorted.reversed().limit(N)'],
      ['Nth', 'skip(n-1).findFirst'],
      ['empty max', 'Optional.empty()'],
      ['full sort cost', 'O(M log M)'],
      ['PriorityQueue', 'true top-N heap'],
      ['ties', 'thenComparing id'],
      ['distinct Nth', 'map+distinct first'],
      ['maxBy', 'Collector form'],
      ['IntStream.max', 'OptionalInt'],
      ['limit≠top', 'need sorted'],
    ],
  },

  'duplicates-freq': {
    intro:
      'Frequency maps via groupingBy+counting, duplicate detection, and keep-first / only-dupes patterns.',
    overloads: `frequency & duplicate patterns

Frequency map
  collect(groupingBy(Fn.identity(), counting()))
    → Map<T, Long>
  groupingBy(key, counting())
  groupingBy(key, TreeMap::new, counting())  // sorted keys

Mode (most frequent)
  entrySet().stream().max(Map.Entry.comparingByValue())

Duplicates only
  groupingBy → filter entry.getValue() > 1 → keySet

First duplicate (encounter)
  filter(!seen.add(x)) + findFirst  // sequential Set side-effect

Frequency then multi-key
  groupingBy(k, mapping(v, toList()))  // bag of values`,
    downstream: `Collectors & alternatives

  counting() under groupingBy — standard
  summingInt(e -> 1) — same idea, int
  Collections.frequency(list, o) — O(n) per call; avoid in loop
  toMap(k, v -> 1L, Long::sum) — frequency without groupingBy

Uniques vs dupes
  filter frequency == 1
  distinct() — uniques only, loses counts
  partitioningBy(x -> freq.get(x) > 1) after building map`,
    edges: `Edge cases interviewers probe

• identity grouping uses equals/hashCode — records help
• counting returns Long not Integer — watch map value types
• parallel frequency: groupingByConcurrent(key, counting())
• LinkedHashMap factory preserves first-seen key order
• null keys: groupingBy NPE on null classifier — filter first
• "find duplicates" clarify: all dup values vs keys with count>1
• Stream cannot mutate while computing freq in one pure pipeline easily — two-pass OK`,
    cheat: [
      ['groupingBy+counting', 'frequency map'],
      ['identity()', 'element frequencies'],
      ['count > 1', 'duplicate keys'],
      ['max by value', 'mode'],
      ['toMap sum 1L', 'alt frequency'],
      ['TreeMap factory', 'sorted keys'],
      ['LinkedHashMap', 'first-seen order'],
      ['distinct', 'uniques lose counts'],
      ['concurrent', 'groupingByConcurrent'],
      ['null classifier', 'NPE — filter'],
      ['Long counts', 'not Integer'],
      ['two-pass', 'freq then filter'],
    ],
  },

  parallel: {
    intro:
      'parallel / sequential / unordered, ForkJoin commonPool, and when parallelization hurts.',
    overloads: `parallel controls

  stream.parallel() / parallelStream()
  stream.sequential()
  stream.unordered()     // waive encounter order — helps some ops
  stream.isParallel()

Source matters
  ArrayList / array / IntStream.range — good split (SUBSIZED)
  LinkedList / Files.lines / Iterator — poor split
  Stream.iterate / generate — limited parallelism

Terminals & order
  forEach vs forEachOrdered
  findFirst vs findAny
  reduce/collect need associative combiner`,
    downstream: `commonPool & blocking

parallel() uses ForkJoinPool.commonPool() by default
  parallelism ≈ cores - 1
  blocking I/O in parallel stream starves commonPool (affects whole JVM)

Custom pool (advanced)
  forkJoinPool.submit(() -> list.parallelStream().… ).get()
  — isolates parallelism; still interview "prefer seq I/O"

Stateless lambdas only — no shared mutable without concurrency.`,
    edges: `Edge cases interviewers probe

• tiny N: parallel slower (setup > work)
• limit/skip/findFirst + parallel + ordered = expensive
• unordered().distinct/limit can improve throughput
• side-effect accumulate into ArrayList in parallel → race / corruption
• Files.lines().parallel() — still one file channel; often not worth it
• nested parallel streams → commonPool contention
• groupingBy vs groupingByConcurrent in parallel
• sequential() after parallel mid-pipeline resets mode for downstream`,
    cheat: [
      ['parallel()', 'commonPool FJP'],
      ['parallelStream()', 'Collection source'],
      ['sequential()', 'turn off'],
      ['unordered()', 'relax order'],
      ['findAny', 'prefer parallel'],
      ['forEachOrdered', 'keeps order'],
      ['good split', 'arrays / ArrayList'],
      ['bad split', 'LinkedList / I/O'],
      ['tiny N', 'stay sequential'],
      ['blocking I/O', 'starves commonPool'],
      ['stateful ops', 'distinct/sorted costly'],
      ['associative', 'required reduce'],
    ],
  },

  'advanced-collectors': {
    intro:
      'Collector.of, characteristics, teeing, collectingAndThen — building and composing custom collectors.',
    overloads: `Collector anatomy

Collector.of(supplier, accumulator, combiner[, finisher[, Characteristics…]])

4-arg  of(supplier, acc, combiner, characteristics…)
         // IDENTITY_FINISH implied if no finisher
5-arg  of(supplier, acc, combiner, finisher, characteristics…)

Characteristics (enum)
  CONCURRENT     — accumulator thread-safe; parallel may share container
  UNORDERED      — order irrelevant
  IDENTITY_FINISH — finisher is identity; A == R

JDK composition
  collectingAndThen(down, finisher)
  teeing(c1, c2, merger)              // Java 12
  mapping / flatMapping / filtering   // wrap downstream`,
    downstream: `Custom collector sketch

Collector.of(
  ArrayList::new,           // supplier
  List::add,                // accumulator
  (a,b) -> { a.addAll(b); return a; },  // combiner
  Collections::unmodifiableList,        // finisher
  /* no IDENTITY_FINISH */
)

CONCURRENT + UNORDERED example: ConcurrentLinkedQueue style sinks
Never mark CONCURRENT unless accumulator is truly thread-safe.

teeing(c1,c2,merger)
  runs both in one pass; merger(r1,r2) → final
  nest: groupingBy(k, teeing(counting(), summingInt(...), Report::new))`,
    edges: `Edge cases interviewers probe

• missing associative combiner → wrong parallel results
• IDENTITY_FINISH lied → ClassCastException or wrong type
• CONCURRENT without thread-safe acc → races
• finisher must not be skipped when A ≠ R
• teeing Java 12+; backport = custom dual accumulator
• collectingAndThen is the clean unwrap for Optional maxBy
• supplier must return NEW mutable container each call
• empty stream: supplier+finisher still run (acc never); know empty result`,
    cheat: [
      ['Collector.of', 'supplier/acc/combiner/fin'],
      ['IDENTITY_FINISH', 'A == R'],
      ['CONCURRENT', 'thread-safe acc'],
      ['UNORDERED', 'order free'],
      ['collectingAndThen', 'post-process'],
      ['teeing', 'Java 12 dual'],
      ['combiner', 'must be associative'],
      ['new supplier', 'fresh container'],
      ['no CONCURRENT lie', 'races'],
      ['mapping wrap', 'change element type'],
      ['empty stream', 'supplier+finisher'],
      ['maxBy unwrap', 'andThen Optional::orElseThrow'],
    ],
  },
};
