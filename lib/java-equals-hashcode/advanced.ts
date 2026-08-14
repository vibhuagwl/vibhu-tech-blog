/** Deep coverage beyond the classic equals×hashCode combo matrix. */

export const CORE_ROWS: string[][] = [
  ['hashCode()', 'Maps key → bucket index (hash maps)', 'Must be consistent with equals'],
  ['equals()', 'Logical equality inside a bucket / for Set membership', 'Reflexive, symmetric, transitive, consistent'],
  ['Comparable.compareTo()', 'Natural order for TreeMap / ConcurrentSkipListMap', 'compareTo==0 should match equals'],
  ['Comparator', 'External ordering strategy', 'Same consistency rule with equals'],
  ['Collision', 'Two keys, same hash bucket', 'Resolved by equals (or tree walk)'],
  ['Treeification', 'HashMap bin: list → balanced tree (Java 8+)', 'When collisions in a bin grow large'],
  ['Immutable key', 'Fields used in equals/hashCode never change after put', 'Prevents lost entries'],
];

export const HASHMAP_LOOKUP = `put/get key K:
  1. h = spread(K.hashCode())
  2. i = h & (table.length - 1)   // bucket index
  3. walk bin[i]: for each node N
       if N.hash == h && (N.key == K || K.equals(N.key)) → hit
  4. miss → insert (put) or return null (get)

Java 8+: when a bin's collision chain is long enough, convert linked list → red-black tree
(treeify). Worst-case lookup improves vs pure O(n) chains under pathological hashing.
Still: average remains O(1) with a good hash distribution.`;

export const CHM_ATOMICS = `ConcurrentHashMap atomic key ops (equality still uses hashCode+equals):

map.putIfAbsent(key, value);          // insert only if absent
map.compute(key, (k,v) -> ...);       // remapping under key lock/CAS
map.computeIfAbsent(key, k -> ...);   // lazy create
map.merge(key, value, (a,b) -> ...);  // combine
map.replace(key, oldVal, newVal);     // conditional replace

Thread-safety ≠ free from equals/hashCode bugs.
Mutable keys still lose entries. Null key/value → NPE.`;

export const LRU_CODE = `// Access-order LinkedHashMap as LRU (capacity 3)
LinkedHashMap<String,String> lru = new LinkedHashMap<>(16, 0.75f, true) {
  @Override protected boolean removeEldestEntry(Map.Entry<String,String> e) {
    return size() > 3;
  }
};
lru.put("a","1"); lru.put("b","2"); lru.put("c","3");
lru.get("a");           // a becomes most-recent
lru.put("d","4");       // evicts eldest (b)
// Lookup still: hashCode → equals. Broken contract → LRU lies.`;

export const TREEMAP_CODE = `// Natural order
final class Employee implements Comparable<Employee> {
  private final int id;
  private final String name;
  public Employee(int id, String name) { this.id = id; this.name = name; }
  @Override public int compareTo(Employee o) {
    return Integer.compare(id, o.id); // NOT this.id - o.id
  }
  @Override public boolean equals(Object o) {
    return o instanceof Employee e && id == e.id;
  }
  @Override public int hashCode() { return Integer.hashCode(id); }
}
TreeMap<Employee,String> byId = new TreeMap<>();

// External Comparator (multiple strategies)
TreeMap<Employee,String> byName =
  new TreeMap<>(Comparator.comparing(Employee::name).thenComparingInt(Employee::id));
TreeMap<Employee,String> byIdDesc =
  new TreeMap<>(Comparator.comparingInt(Employee::id).reversed());`;

export const EQ_VS_CMP = `// Inconsistent: equals false, but compareTo == 0
final class BadKey implements Comparable<BadKey> {
  final int id; final String tag;
  BadKey(int id, String tag) { this.id = id; this.tag = tag; }
  @Override public boolean equals(Object o) {
    return o instanceof BadKey b && id == b.id && Objects.equals(tag, b.tag);
  }
  @Override public int hashCode() { return Objects.hash(id, tag); }
  @Override public int compareTo(BadKey o) {
    return Integer.compare(id, o.id); // ignores tag!
  }
}

BadKey a = new BadKey(1, "x");
BadKey b = new BadKey(1, "y");
// a.equals(b) == false
// a.compareTo(b) == 0

HashMap: size can be 2 (different equals) — both stored.
TreeMap: second put replaces first — size 1. Silent data loss.

Rule: compareTo==0 ⇔ equals==true (and Comparator same).`;

export const COMPARATOR_CORNERS: string[][] = [
  ['One field', 'Comparator.comparing(Employee::dept)', 'Ties collapse — may return 0 for unequal equals'],
  ['Multi-field', 'comparing(dept).thenComparing(id)', 'Stabilize order; reduce false zeros'],
  ['Reverse', '.reversed()', 'Descending keys / newest-first'],
  ['Nulls', 'Comparator.nullsFirst(...)', 'Natural TreeMap forbids null keys; Comparator can allow'],
  ['Return 0', 'Means “same key” to TreeMap', 'Distinct objects disappear on put'],
  ['id - other.id', 'Overflow if ids near Integer extremes', 'Use Integer.compare / Comparator.comparingInt'],
];

export const RECORD_CODE = `record EmployeeKey(Long id, String department) {}

Map<EmployeeKey,String> hm = new HashMap<>();
hm.put(new EmployeeKey(1L, "PAY"), "ok");
hm.get(new EmployeeKey(1L, "PAY")); // works — generated equals+hashCode

ConcurrentHashMap<EmployeeKey,String> chm = new ConcurrentHashMap<>();
chm.putIfAbsent(new EmployeeKey(1L, "PAY"), "v1");

// TreeMap: record is NOT Comparable — need Comparator
TreeMap<EmployeeKey,String> tm = new TreeMap<>(
  Comparator.comparing(EmployeeKey::department).thenComparing(EmployeeKey::id)
);`;

export const IDENTITY_CODE = `IdentityHashMap<Employee,String> id = new IdentityHashMap<>();
Employee a1 = new Employee("a"); // equals+hashCode by name
Employee a2 = new Employee("a"); // a1.equals(a2) == true
id.put(a1, "one");
id.put(a2, "two");
// size == 2 — uses reference ==, NOT equals()
// Rare: topology graphs, serialization frameworks. Not a general cache.`;

export const ENUM_CODE = `enum Status { NEW, PAID, FAILED }
EnumMap<Status,Integer> counts = new EnumMap<>(Status.class);
counts.put(Status.NEW, 1);
// Array-backed by ordinal — no hashCode of enum constant needed for speed
// Keys must be that enum type. Null keys forbidden.
// Prefer EnumMap over HashMap<Enum,V> when key domain is a single enum.`;

export const HASHTABLE_NOTE = `Hashtable (legacy):
- Synchronized methods (coarse lock) — prefer ConcurrentHashMap
- Still uses hashCode + equals for keys
- Null key/value forbidden (like CHM)
- Enumerator vs Iterator quirks; largely historical in new code`;

export const SKIPLIST_NOTE = `ConcurrentSkipListMap:
- Concurrent sorted map (skip list)
- Key location via Comparable/Comparator — NOT hashCode
- Same consistency rule: compare==0 should match equals
- Approximate alternative to Collections.synchronizedSortedMap(TreeMap)
- Ops average O(log n); good for concurrent range views`;

export type FailureCase = {
  id: string;
  title: string;
  expect: string;
  actual: string;
  why: string;
  fix: string;
  code: string;
};

export const FAILURES: FailureCase[] = [
  {
    id: 'f1',
    title: 'Case 1 — equals only',
    expect: 'Second put(a) replaces; get(a) returns value',
    actual: 'size=3; get=null on HashMap/LHM/CHM',
    why: 'Different identity hashCodes → different buckets; equals never consulted',
    fix: 'Override hashCode consistently with equals',
    code: `@Override public boolean equals(Object o) { /* by name */ }
// missing hashCode()`,
  },
  {
    id: 'f2',
    title: 'Case 2 — hashCode only',
    expect: 'Logical duplicates replace',
    actual: 'Same/nearby buckets but size=3; get=null',
    why: 'Default equals is ==; two Employee("a") instances never equal',
    fix: 'Override equals on the same fields as hashCode',
    code: `@Override public int hashCode() { return name.hashCode(); }
// missing equals()`,
  },
  {
    id: 'f3',
    title: 'Case 3 — mutate key after put',
    expect: 'get still finds the entry',
    actual: 'get returns null; entry orphaned in old bucket',
    why: 'hashCode changed; lookup probes a different bin',
    fix: 'Immutable key fields (final / record)',
    code: `Employee k = new Employee("a");
map.put(k, "v");
k.setName("b");      // mutates hash field
map.get(k);          // null
map.get(new Employee("a")); // also null`,
  },
  {
    id: 'f4',
    title: 'Case 4 — compareTo inconsistent with equals',
    expect: 'HashMap and TreeMap agree on key identity',
    actual: 'HashMap stores both; TreeMap collapses them',
    why: 'TreeMap uses compareTo==0 as sameness',
    fix: 'Align compareTo/Comparator with equals fields',
    code: `// equals uses id+tag; compareTo uses id only
// TreeMap.put(a); TreeMap.put(b) → size 1`,
  },
  {
    id: 'f5',
    title: 'Case 5 — Comparator returns 0 for different objects',
    expect: 'Both employees kept',
    actual: 'Second put replaces first',
    why: 'Zero means equal keys to SortedMap',
    fix: 'thenComparing with a unique tie-breaker (id)',
    code: `Comparator.comparing(Employee::dept) // alone → collisions
Comparator.comparing(Employee::dept).thenComparingInt(Employee::id)`,
  },
  {
    id: 'f6',
    title: 'Case 6 — Comparator on mutable fields',
    expect: 'Sorted order remains valid',
    actual: 'Tree corrupted / lookups fail after mutation',
    why: 'Node position computed from old field values',
    fix: 'Immutable sort keys; remove+reinsert if must change',
    code: `tm.put(e, "v");
e.setDept("X"); // DO NOT — tree structure stale`,
  },
  {
    id: 'f7',
    title: 'Case 7 — Integer subtraction in compareTo',
    expect: 'Correct order for all int ids',
    actual: 'Overflow → wrong sign near Integer.MIN/MAX',
    why: '`this.id - other.id` can overflow',
    fix: 'Integer.compare(this.id, other.id)',
    code: `// bad: return this.id - other.id;
return Integer.compare(this.id, other.id);`,
  },
  {
    id: 'f8',
    title: 'Case 8 — Mutable collection inside hashCode',
    expect: 'Stable hashing',
    actual: 'hashCode changes when list mutates; key lost',
    why: 'hashCode incorporated live mutable state',
    fix: 'Hash defensive copy / unmodifiable snapshot / omit mutable parts',
    code: `List<String> tags = new ArrayList<>();
// hashCode uses tags.hashCode(); then tags.add("x"); → broken`,
  },
];

export const USE_CASES: string[][] = [
  ['HashMap', 'User id → profile; frequency counters; general caches'],
  ['LinkedHashMap', 'Insertion-order reports; access-order LRU caches'],
  ['ConcurrentHashMap', 'In-process concurrent caches; request coalescing'],
  ['TreeMap', 'Sorted reports; range queries; floor/ceiling navigation'],
  ['ConcurrentSkipListMap', 'Concurrent sorted indexes; time-ordered events'],
  ['IdentityHashMap', 'Graph serialization; reference-identity topologies'],
  ['EnumMap', 'Enum → config/handler/count tables'],
  ['Hashtable', 'Legacy only — prefer ConcurrentHashMap'],
];

export const PERF_ROWS: string[][] = [
  ['HashMap', 'hashCode + equals', 'No', 'O(1) avg', 'No'],
  ['LinkedHashMap', 'hashCode + equals', 'Insertion/access', 'O(1) avg', 'No'],
  ['ConcurrentHashMap', 'hashCode + equals', 'No', 'O(1) avg', 'Yes'],
  ['Hashtable', 'hashCode + equals', 'No', 'O(1) avg', 'Yes (coarse)'],
  ['TreeMap', 'compareTo / Comparator', 'Sorted', 'O(log n)', 'No'],
  ['ConcurrentSkipListMap', 'compareTo / Comparator', 'Sorted', 'O(log n)', 'Yes'],
  ['IdentityHashMap', '== (reference)', 'No', 'O(1) avg', 'No'],
  ['EnumMap', 'ordinal array', 'Enum order', 'O(1)', 'No'],
];

export type Exercise = {
  level: number;
  title: string;
  problem: string;
  expected: string;
  constraints: string;
  starter: string;
  solution: string;
  complexity: string;
  edges: string;
};

export const EXERCISES: Exercise[] = [
  {
    level: 1,
    title: 'Employee as HashMap key',
    problem: 'Make Employee usable as HashMap key by name.',
    expected: 'put a,b,a → size 2; get(a) returns overridden value',
    constraints: 'Immutable name; getClass-based equals',
    starter: `class Employee { String name; /* TODO equals/hashCode */ }`,
    solution: `record Employee(String name) {}
Map<Employee,String> m = new HashMap<>();
m.put(new Employee("a"), "1");
m.put(new Employee("b"), "2");
m.put(new Employee("a"), "1x");
assert m.size()==2 && "1x".equals(m.get(new Employee("a")));`,
    complexity: 'O(1) avg put/get',
    edges: 'null name; empty string',
  },
  {
    level: 2,
    title: 'Employee as ConcurrentHashMap key',
    problem: 'Same key in CHM with putIfAbsent.',
    expected: 'Second putIfAbsent leaves first value',
    constraints: 'No null keys',
    starter: `ConcurrentHashMap<Employee,String> m = new ConcurrentHashMap<>();`,
    solution: `m.putIfAbsent(new Employee("a"), "v1");
m.putIfAbsent(new Employee("a"), "v2");
assert "v1".equals(m.get(new Employee("a")));`,
    complexity: 'O(1) avg',
    edges: 'null key NPE; concurrent puts',
  },
  {
    level: 3,
    title: 'LinkedHashMap insertion order',
    problem: 'Prove iteration order matches insertion when equals works.',
    expected: 'Iterator yields a then b',
    constraints: 'accessOrder=false',
    starter: `new LinkedHashMap<Employee,String>()`,
    solution: `m.put(new Employee("a"),"1"); m.put(new Employee("b"),"2");
assert List.copyOf(m.keySet()).equals(List.of(new Employee("a"), new Employee("b")));`,
    complexity: 'O(1) avg + O(n) iterate',
    edges: 'replace keeps position of first key',
  },
  {
    level: 4,
    title: 'Comparable TreeMap',
    problem: 'Employee implements Comparable by id.',
    expected: 'Sorted by id; duplicate id replaces',
    constraints: 'Integer.compare; equals on id',
    starter: `class Employee implements Comparable<Employee>`,
    solution: `public int compareTo(Employee o){ return Integer.compare(id,o.id); }
TreeMap<Employee,String> tm = new TreeMap<>();`,
    complexity: 'O(log n)',
    edges: 'compareTo consistent with equals',
  },
  {
    level: 5,
    title: 'Multiple Comparators',
    problem: 'Sort by dept then id; and reverse id.',
    expected: 'Two TreeMaps, different orders',
    constraints: 'No mutating keys',
    starter: `Comparator<Employee> byDept = ...`,
    solution: `Comparator.comparing(Employee::dept).thenComparingInt(Employee::id)
Comparator.comparingInt(Employee::id).reversed()`,
    complexity: 'O(log n)',
    edges: 'dept-only comparator collapses different ids',
  },
  {
    level: 6,
    title: 'LRU cache',
    problem: 'Capacity-3 LRU via LinkedHashMap accessOrder.',
    expected: 'After get(a) and put(d), b evicted',
    constraints: 'removeEldestEntry',
    starter: `new LinkedHashMap<>(16,0.75f,true){...}`,
    solution: `protected boolean removeEldestEntry(Entry e){ return size()>3; }`,
    complexity: 'O(1) avg',
    edges: 'equals/hashCode on cache keys still required',
  },
  {
    level: 7,
    title: 'Debug mutable-key bug',
    problem: 'Fix lost entry after setName.',
    expected: 'get succeeds after making key immutable',
    constraints: 'No mutate-after-put',
    starter: `k.setName("b"); map.get(...)`,
    solution: `final fields / record; copy-on-write if needed`,
    complexity: 'N/A',
    edges: 'CHM same bug',
  },
  {
    level: 8,
    title: 'Debug equals/hashCode violation',
    problem: 'equals by name but default hashCode.',
    expected: 'After fix, size 2',
    constraints: 'Contract: equal ⇒ same hash',
    starter: `equals only`,
    solution: `hashCode = Objects.hashCode(name)`,
    complexity: 'N/A',
    edges: 'collision still allowed for unequal keys',
  },
  {
    level: 9,
    title: 'Debug Comparator zero',
    problem: 'Dept-only Comparator drops employees.',
    expected: 'Both kept after thenComparing id',
    constraints: 'Stable total order',
    starter: `comparing(Employee::dept)`,
    solution: `.thenComparingInt(Employee::id)`,
    complexity: 'O(log n)',
    edges: 'null dept with nullsFirst',
  },
  {
    level: 10,
    title: 'Production distributed key',
    problem: 'Design cache key for multi-pod payment lookup.',
    expected: 'Immutable record; documented encoding; CHM local only',
    constraints: 'No mutable fields; stable serialization',
    starter: `record PaymentKey(...)`,
    solution: `record PaymentKey(String tenantId, String paymentId) {}
// Local: ConcurrentHashMap<PaymentKey, PaymentView>
// Multi-JVM: Redis/DB with same canonical string key`,
    complexity: 'O(1) local; network for distributed',
    edges: 'tenant isolation; case-normalization; nulls',
  },
];

export const CHEAT_SHEET = `HashMap / LinkedHashMap / ConcurrentHashMap / Hashtable
  → hash(h ^ (h >>> 16)) → bucket → equals()
  → resize at loadFactor; treeify long collision bins (~O(log n) worst per bin)

TreeMap / ConcurrentSkipListMap
  → compareTo() OR Comparator (+ NavigableMap floor/ceiling/subMap)
  → hashCode NOT used for placement

IdentityHashMap → reference == / identityHashCode
EnumMap        → ordinal array
WeakHashMap    → weak keys (GC may drop entries)

Mental model:
  equals()     → logical equality
  hashCode()   → bucket / location
  compareTo()  → ordering / sorted-map sameness
  Comparator   → external ordering strategy

Golden rules:
  equal ⇒ same hashCode
  compare==0 ⇔ equals (SortedMap keys)
  Prefer immutable keys / records
  Never mutate key fields after put
  getClass (or final) over instanceof for map keys
  BigDecimal: equals ≠ compareTo (scale!)
  Double: NaN equals NaN; +0.0 equals -0.0 is false
  get()+put() ≠ computeIfAbsent
  Avoid JPA entities / @Data-everything as keys`;
