/** Gaps beyond the base custom-key curriculum — Senior/Lead completeness. */

export const INTERNALS_SPREAD = `HashMap hash spreading (Java 8+ style):
  static final int hash(Object key) {
    int h;
    return (key == null) ? 0 : (h = key.hashCode()) ^ (h >>> 16);
  }
Why: mix high bits into low bits used by (n-1) & hash when table length is a power of two.
Without spreading, keys that only differ in high bits collide in the same low bins.`;

export const INTERNALS_CAPACITY = `Capacity & load factor (typical defaults — verify your JDK):
  initialCapacity   default 16 (power of two)
  loadFactor        default 0.75f
  threshold         capacity * loadFactor → resize trigger

Resize / rehash:
  When size > threshold, table doubles; entries redistribute with new mask.
  Cost amortized across puts; a single resize is O(n).
  Keys with unstable hashCode during resize → undefined/lost behavior (don't mutate).`;

export const INTERNALS_TREEIFY = `Treeification constants (OpenJDK HashMap — names are source constants):
  TREEIFY_THRESHOLD      = 8   // bin list length → consider treeify
  UNTREEIFY_THRESHOLD    = 6   // tree → list on shrink/resize
  MIN_TREEIFY_CAPACITY   = 64  // if table too small, resize instead of treeify

Effect:
  Pathological collisions: linked-list bin was O(n); treeified bin ~ O(log n).
  Interview answer: average still O(1); worst-case with treeify ~ O(log n) per bin,
  not a free pass for hashCode(){return 1;}.

Comparable inside collision trees:
  When keys implement Comparable and share a bin, HashMap may use compareTo
  to order tree nodes (in addition to equals for identity). Inconsistent
  Comparable still hurts; prefer correct hash distribution first.`;

export const INHERITANCE_CODE = `// instanceof — can break symmetry with subclasses
class Point {
  final int x, y;
  Point(int x, int y) { this.x = x; this.y = y; }
  @Override public boolean equals(Object o) {
    if (!(o instanceof Point p)) return false;
    return x == p.x && y == p.y;
  }
  @Override public int hashCode() { return Objects.hash(x, y); }
}
class ColoredPoint extends Point {
  final String color;
  ColoredPoint(int x, int y, String color) { super(x, y); this.color = color; }
  @Override public boolean equals(Object o) {
    if (!(o instanceof ColoredPoint cp)) return false;
    return super.equals(cp) && Objects.equals(color, cp.color);
  }
}
// Point(1,2).equals(ColoredPoint(1,2,"red")) may be true
// ColoredPoint(...).equals(Point(1,2)) false → symmetry broken → HashMap chaos

// Safer for map keys: final class + getClass() check, or composition (not inheritance)
@Override public boolean equals(Object o) {
  if (o == null || getClass() != o.getClass()) return false;
  ...
}

// Lombok/Hibernate sometimes use canEqual():
protected boolean canEqual(Object other) { return other instanceof Point; }`;

export const MUTABLE_NESTED = `Mutable / nested / arrays in keys:

1) Field used in hashCode mutated after put → lost entry
2) Nested mutable object: Employee { Address addr } and hashCode uses addr
   → mutating addr.city breaks the key
3) Collection fields: List/Set inside key — if list mutates, hashCode changes
4) Arrays: MUST use Arrays.equals / Arrays.hashCode / Objects.deepEquals
   a.equals(b) on arrays is reference == (almost always wrong for keys)

record TagKey(String[] tags) { // DANGER: array still mutable contents
  // Prefer List.copyOf(tags) stored as immutable List
}`;

export const FLOAT_CODE = `// Floating-point & Double keys
Double.NaN != Double.NaN  // language ==
// But Double.equals: NaN equals NaN is TRUE (IEEE wrapper contract)
new Double(Double.NaN).equals(new Double(Double.NaN)); // true

// -0.0 vs +0.0
double a = 0.0, b = -0.0;
a == b; // true
Double.valueOf(a).equals(Double.valueOf(b)); // FALSE
Double.hashCode(+0.0) != Double.hashCode(-0.0);

// Comparators: Double.compare handles NaN ordering; don't use subtraction.
// Prefer not to use raw float/double as map keys — use scaled long / BigDecimal policy.`;

export const BIGDECIMAL_CODE = `BigDecimal — classic SortedMap interview trap:

BigDecimal a = new BigDecimal("1.0");
BigDecimal b = new BigDecimal("1.00");
a.equals(b);     // false  (scale differs)
a.compareTo(b);  // 0      (numerically equal)

HashMap<BigDecimal,String> hm = new HashMap<>();
hm.put(a, "A"); hm.put(b, "B");
// size == 2  (equals false)

TreeMap<BigDecimal,String> tm = new TreeMap<>();
tm.put(a, "A"); tm.put(b, "B");
// size == 1  (compareTo == 0) — second replaces first

Production: normalize with stripTrailingZeros() for equals-based maps,
or use Comparator.naturalOrder() knowingly and document scale policy.
Never mix equals-based and compareTo-based assumptions blindly.`;

export const NULL_MATRIX: string[][] = [
  ['HashMap', '1 null key', 'null values OK'],
  ['LinkedHashMap', '1 null key', 'null values OK'],
  ['Hashtable', 'No null key', 'No null value'],
  ['ConcurrentHashMap', 'No null key', 'No null value'],
  ['TreeMap (natural)', 'No null key', 'null values OK'],
  ['TreeMap (Comparator.nullsFirst)', 'Possible if Comparator allows', 'null values OK'],
  ['ConcurrentSkipListMap', 'No null key', 'No null value'],
  ['IdentityHashMap', '1 null key', 'null values OK'],
  ['EnumMap', 'No null key', 'null values OK'],
  ['WeakHashMap', 'null key discouraged / NPE paths', 'null values OK'],
];

export const REPLACE_CODE = `When key1.equals(key2) && same hash bucket:
  map.put(key1, "v1");
  map.put(key2, "v2");
→ size unchanged (for that logical key)
→ value becomes "v2"
→ key object retained is typically the ORIGINAL key1 (implementation detail:
   HashMap keeps the existing key node; only value updates)

Interview: "Does the key reference get replaced?"
Answer: value is replaced; the stored key instance is usually the first one.
Do not rely on getting key2 back from keySet() after replace.`;

export const CHM_RACE = `get()+put() is NOT computeIfAbsent:

// racy
if (map.get(k) == null) {
  map.put(k, create()); // two threads may both create
}

// atomic
map.computeIfAbsent(k, key -> create());

Also:
  compute / merge / replace — atomic per key
  Mapping functions must be short, non-blocking, non-reentrant into same map carefully
  Exceptions in remapping function can leave state unchanged (see JDK docs)`;

export const NAVIGABLE = `TreeMap / ConcurrentSkipListMap — NavigableMap ops:

  floorKey / floorEntry     ≤ key
  ceilingKey / ceilingEntry ≥ key
  lowerKey / lowerEntry     < key
  higherKey / higherEntry   > key
  firstEntry / lastEntry
  pollFirstEntry / pollLastEntry

Views (endpoints matter — inclusive/exclusive):
  subMap(from, fromInclusive, to, toInclusive)
  headMap(to, inclusive)
  tailMap(from, inclusive)

Use cases: time-range queries, price bands, leaderboards, "next appointment".
ConcurrentSkipListMap: same navigation, concurrent writers.`;

export const WEAK_CODE = `WeakHashMap<K,V>:
  Keys are weak references — if no strong ref to key remains, entry can disappear after GC
  Values are strong — if value strongly references key, entry never clears (leak pattern)
  Not for general caches under load (use Caffeine/Guava with explicit eviction)
  equals/hashCode still used while entry is alive
  Iteration may see entries vanish mid-flight

WeakHashMap<Employee, Meta> m = new WeakHashMap<>();
Employee e = new Employee("a");
m.put(e, meta);
e = null;
System.gc(); // may remove entry — not guaranteed timing`;

export const IDENTITY_DEEP = `IdentityHashMap deeper:
  System.identityHashCode(obj) — often derived from mark word / address-ish; NOT Object.hashCode override
  Equality test is reference ==
  Useful: object graph algorithms, serialization handles, JVM tooling maps
  NOT useful: business equality caches (you'll duplicate logical keys)
  Allows null key; not thread-safe; unexpected for most app code`;

export const LOMBOK_CODE = `Lombok pitfalls for map keys:

@Data                 // equals+hashCode on ALL fields — often too wide (includes mutable state)
@EqualsAndHashCode    // callSuper=true/false matters with inheritance
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
  @EqualsAndHashCode.Include Long id;

Problems:
  - Including collections/arrays without care
  - callSuper=false with subclasses → incomplete equality
  - callSuper=true with instanceof-style parents → symmetry issues
  - Regenerating equals when schema evolves → cache/map key drift across versions

Prefer: explicit record, or @Value / @EqualsAndHashCode on stable business id only.`;

export const JPA_CODE = `JPA/Hibernate entities as Map keys — usually a bad idea:

1) Generated ID: equals/hashCode before persist (id==null) vs after (id assigned)
   → entity changes identity in a Set/Map mid-flush
2) Proxies: Hibernate proxy vs real instance — getClass() vs instanceof traps
3) Mutable fields: dirty checking mutates state used in hashCode
4) Lazy collections in hashCode → LazyInitializationException

Patterns that work better:
  - Use business key / UUID assigned at creation (immutable)
  - equals/hashCode only on that stable id
  - Prefer Map<UUID, Entity> rather than Map<Entity, ?>
  - Never put managed entities into HashMap keys across session boundaries casually`;

export const CACHE_KEYS = `Cache keys (Caffeine / Redis / local CHM):

  Immutable composite keys: record CacheKey(String tenant, String op, String id, int version)
  Normalize: case, locale, trailing spaces
  Version the key schema when fields change
  Avoid collisions: tenant isolation in the key
  Don't use mutable entities or request objects as keys
  Distributed: same canonical string encoding everywhere
  Local CHM ≠ shared cluster cache`;

export const SERIALIZE = `Serialization / persistence of keys:

  After deserialize, equals/hashCode must match pre-serialize semantics
  Adding fields to equals without care → old serialized keys ≠ new keys
  serialVersionUID + documented equality contract
  Records/enums serialize cleanly; custom readObject must not break identity fields
  For distributed caches, prefer explicit string/byte encodings over Java serialization`;

export const SKIPLIST_DEEP = `ConcurrentSkipListMap vs ConcurrentHashMap:

  CHM: hashCode+equals, unordered, O(1) avg, no nulls
  CSLM: Comparable/Comparator, sorted + navigable, O(log n), no nulls
  CSLM shines for concurrent range queries / ordered scans
  Same compare↔equals consistency rule as TreeMap
  weakly consistent iterators`;
