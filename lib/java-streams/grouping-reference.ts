/** Complete Collectors.groupingBy / groupingByConcurrent reference for #grouping. */

export const GROUPING_INTRO =
  'Every JDK overload of groupingBy and groupingByConcurrent, plus the downstream collectors and map factories Staff interviews expect. Problems g01–g35 exercise each flavour.';

export const GROUPING_OVERLOADS = `Collectors.groupingBy — sequential (HashMap by default)

1) groupingBy(classifier)
     → Map<K, List<T>>

2) groupingBy(classifier, downstream)
     → Map<K, D>   // D = downstream result type

3) groupingBy(classifier, mapFactory, downstream)
     → M extends Map<K, D>   // TreeMap, LinkedHashMap, EnumMap, …

Collectors.groupingByConcurrent — parallel-friendly (ConcurrentMap)

1) groupingByConcurrent(classifier)
     → ConcurrentMap<K, List<T>>

2) groupingByConcurrent(classifier, downstream)
     → ConcurrentMap<K, D>

3) groupingByConcurrent(classifier, mapFactory, downstream)
     → M extends ConcurrentMap<K, D>   // usually ConcurrentHashMap::new

partitioningBy(predicate[, downstream]) is the boolean specialization
(always both true/false keys) — see #partitioning.`;

export const GROUPING_DOWNSTREAM = `Downstream collectors commonly nested under groupingBy

DEFAULT
  toList()                         — implicit when 1-arg groupingBy

AGGREGATES
  counting()                       → Long
  summingInt / Long / Double       → int/long/double
  averagingInt / Long / Double     → double
  summarizingInt / Long / Double   → *SummaryStatistics
  reducing(...) / reducing(id,op)  → Optional / identity type (BigDecimal totals)
  maxBy / minBy(Comparator)        → Optional<T> (often + collectingAndThen)

RESHAPE
  mapping(mapper, down)            — change element type in the group
  flatMapping(mapper, down)        — Java 9+ flatten nested streams
  filtering(pred, down)            — Java 9+ filter inside the group
  collectingAndThen(down, finisher)— unwrap Optional, sort/limit, freeze

STRINGS / SETS / NEST
  mapping(f, joining(...))         — CSV per group
  mapping(f, toSet()|toCollection())
  groupingBy(inner)                — nested Map
  partitioningBy(pred[, down])     — Map<K, Map<Boolean, …>>
  teeing(c1, c2, merger)           — Java 12+ multi-aggregate per group`;

export const GROUPING_MAP_FACTORIES = `mapFactory (3-arg overload) — pick Map semantics

HashMap::new              default — unordered
LinkedHashMap::new        encounter-order keys (first-seen)
TreeMap::new              sorted keys (Comparator or Comparable)
() -> new EnumMap<>(E.class)  enum classifiers — dense & fast
ConcurrentHashMap::new    with groupingByConcurrent only

Never pass a non-concurrent map factory to groupingByConcurrent.`;

export const GROUPING_EDGES = `Edge cases interviewers probe

• null classifier → NPE (HashMap forbids null keys in compute path) — filter/Objects.requireNonNull first
• empty stream → empty Map (not null)
• grouping never creates empty groups for missing keys (unlike partitioningBy)
• parallelStream + groupingBy(HashMap) is unsafe if you mutate; prefer groupingByConcurrent
• ordering: HashMap/ConcurrentHashMap not encounter-ordered; LinkedHashMap is
• money: prefer reducing(BigDecimal.ZERO, BigDecimal::add) over averagingDouble
• composite keys: record Key(String a, String b) or Map.entry — not string concat
• unique values? toMap may be clearer than groupingBy+mapping+toList
• deep nesting (3+) → name intermediate types / DTOs`;

export const GROUPING_CHEAT: [string, string][] = [
  ['1-arg', 'Map<K, List<T>>'],
  ['2-arg', 'Map<K, D> via downstream'],
  ['3-arg', 'custom Map + downstream'],
  ['Concurrent', 'groupingByConcurrent → ConcurrentMap'],
  ['Boolean split', 'partitioningBy (not groupingBy(Boolean))'],
  ['Stable key order', 'LinkedHashMap::new'],
  ['Sorted keys', 'TreeMap::new'],
  ['Enum keys', 'EnumMap'],
  ['Per-group max', 'maxBy + collectingAndThen'],
  ['Money total', 'reducing(BigDecimal.ZERO, BigDecimal::add)'],
  ['Nested report', 'groupingBy(a, groupingBy(b))'],
  ['Parallel group', 'groupingByConcurrent'],
];
