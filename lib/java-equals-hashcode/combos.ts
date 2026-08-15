import type {Combo} from './types';

/** Verified on OpenJDK 21 — put(a), put(b), put(a), get(new a). */
export const COMBOS: Combo[] = [
  {
    id: 'none',
    title: '1. Neither equals nor hashCode',
    hashCode: 'Object identity hash (default)',
    equals: 'Reference equality (==)',
    contractOk: true,
    results: [
      {map: 'HashMap', size: 3, get: 'null', buckets: '~3', note: 'Three distinct keys by identity'},
      {map: 'LinkedHashMap', size: 3, get: 'null', buckets: '~3', note: 'Same as HashMap; insertion order kept'},
      {map: 'ConcurrentHashMap', size: 3, get: 'null', buckets: '~3', note: 'Same equality rules as HashMap'},
      {map: 'TreeMap', size: 2, get: 'emp1 OVERRIDDEN', buckets: 'N/A (tree)', note: 'Uses compareTo(name) — a equals a by order'},
    ],
    java: `class Employee {
  private final String name;
  public Employee(String name) { this.name = name; }
  // no equals / hashCode
  public String toString() { return "Employee[" + name + "]"; }
}
Map<Employee,String> m = new HashMap<>();
m.put(new Employee("a"), "emp1");
m.put(new Employee("b"), "emp2");
m.put(new Employee("a"), "emp1 OVERRIDDEN");
// size=3, get(new Employee("a")) → null`,
  },
  {
    id: 'both',
    title: '2. Both equals + hashCode (correct)',
    hashCode: 'name.hashCode()',
    equals: 'Objects.equals(name, other.name)',
    contractOk: true,
    results: [
      {map: 'HashMap', size: 2, get: 'emp1 OVERRIDDEN', buckets: '2', note: 'Second "a" replaces first'},
      {map: 'LinkedHashMap', size: 2, get: 'emp1 OVERRIDDEN', buckets: '2', note: 'Same; order of first insert of a kept'},
      {map: 'ConcurrentHashMap', size: 2, get: 'emp1 OVERRIDDEN', buckets: '2', note: 'Same replace semantics'},
      {map: 'TreeMap', size: 2, get: 'emp1 OVERRIDDEN', buckets: 'N/A', note: 'compareTo + equals should agree'},
    ],
    java: `@Override public int hashCode() {
  return name == null ? 0 : name.hashCode();
}
@Override public boolean equals(Object o) {
  if (this == o) return true;
  if (o == null || getClass() != o.getClass()) return false;
  Employee e = (Employee) o;
  return Objects.equals(name, e.name);
}`,
  },
  {
    id: 'hc1-eq-true',
    title: '3. hashCode()→1 and equals()→true (always)',
    hashCode: 'always 1',
    equals: 'always true',
    contractOk: false,
    results: [
      {map: 'HashMap', size: 1, get: 'emp1 OVERRIDDEN', buckets: '1', note: 'Every key collapses to one entry'},
      {map: 'LinkedHashMap', size: 1, get: 'emp1 OVERRIDDEN', buckets: '1', note: 'Same collapse'},
      {map: 'ConcurrentHashMap', size: 1, get: 'emp1 OVERRIDDEN', buckets: '1', note: 'Same collapse'},
      {map: 'TreeMap', size: 2, get: 'emp1 OVERRIDDEN', buckets: 'N/A', note: 'Tree still separates a vs b via compareTo'},
    ],
    java: `@Override public int hashCode() { return 1; }
@Override public boolean equals(Object o) { return true; }
// Hash-based maps: size=1. TreeMap(Comparable by name): size=2.`,
  },
  {
    id: 'hc1-no-eq',
    title: '4. hashCode()→1, no equals override',
    hashCode: 'always 1',
    equals: 'reference ==',
    contractOk: true,
    results: [
      {map: 'HashMap', size: 3, get: 'null', buckets: '1', note: 'Same bucket, three chain entries'},
      {map: 'LinkedHashMap', size: 3, get: 'null', buckets: '1', note: 'Same'},
      {map: 'ConcurrentHashMap', size: 3, get: 'null', buckets: '1', note: 'Same'},
      {map: 'TreeMap', size: 2, get: 'emp1 OVERRIDDEN', buckets: 'N/A', note: 'hashCode unused for lookup'},
    ],
    java: `@Override public int hashCode() { return 1; }
// no equals → identity. Hash maps: size=3, get=null, one bucket.`,
  },
  {
    id: 'no-hc-eq-true',
    title: '5. No hashCode, equals()→true',
    hashCode: 'identity (default)',
    equals: 'always true',
    contractOk: false,
    results: [
      {map: 'HashMap', size: 3, get: 'null', buckets: '~3', note: 'Never land in same bucket → equals never compared'},
      {map: 'LinkedHashMap', size: 3, get: 'null', buckets: '~3', note: 'Same'},
      {map: 'ConcurrentHashMap', size: 3, get: 'null', buckets: '~3', note: 'Same'},
      {map: 'TreeMap', size: 2, get: 'emp1 OVERRIDDEN', buckets: 'N/A', note: 'Still ordered by name'},
    ],
    java: `// no hashCode
@Override public boolean equals(Object o) { return true; }
// Contract broken: equal objects can have different hashCodes.
// Hash maps never call equals across buckets → size=3, get=null.`,
  },
  {
    id: 'hc-ok-no-eq',
    title: '6. Correct hashCode, no equals',
    hashCode: 'name.hashCode()',
    equals: 'reference ==',
    contractOk: true,
    results: [
      {map: 'HashMap', size: 3, get: 'null', buckets: '2', note: 'Two "a" share bucket but fail equals'},
      {map: 'LinkedHashMap', size: 3, get: 'null', buckets: '2', note: 'Same'},
      {map: 'ConcurrentHashMap', size: 3, get: 'null', buckets: '2', note: 'Same'},
      {map: 'TreeMap', size: 2, get: 'emp1 OVERRIDDEN', buckets: 'N/A', note: 'compareTo decides'},
    ],
    java: `@Override public int hashCode() {
  return name == null ? 0 : name.hashCode();
}
// no equals → size=3 on hash maps, get=null`,
  },
  {
    id: 'no-hc-eq-ok',
    title: '7. No hashCode, correct equals',
    hashCode: 'identity (default)',
    equals: 'name equality',
    contractOk: false,
    results: [
      {map: 'HashMap', size: 3, get: 'null', buckets: '~3', note: 'Wrong buckets; equals never saves you'},
      {map: 'LinkedHashMap', size: 3, get: 'null', buckets: '~3', note: 'Same'},
      {map: 'ConcurrentHashMap', size: 3, get: 'null', buckets: '~3', note: 'Same'},
      {map: 'TreeMap', size: 2, get: 'emp1 OVERRIDDEN', buckets: 'N/A', note: 'Tree ignores hashCode'},
    ],
    java: `// no hashCode — unequal hash for equal names
@Override public boolean equals(Object o) { /* name equals */ }
// Hash maps: size=3, get=null. Must override BOTH.`,
  },
];

export const CONTRACT_RULES = [
  ['Reflexive', 'x.equals(x) is true'],
  ['Symmetric', 'x.equals(y) ⇔ y.equals(x)'],
  ['Transitive', 'x.equals(y) && y.equals(z) ⇒ x.equals(z)'],
  ['Consistent', 'Repeated equals agree if fields unchanged'],
  ['Non-null', 'x.equals(null) is false'],
  ['hashCode consistency', 'If x.equals(y) then x.hashCode()==y.hashCode()'],
  ['Unequal hashes OK', 'Unequal objects MAY share a hashCode (collision)'],
];

export const MAP_COMPARE: string[][] = [
  ['HashMap', 'hashCode → bucket, equals in chain/tree', 'Yes (1 null key)', 'Unordered', 'Not thread-safe'],
  ['LinkedHashMap', 'Same as HashMap + linked list of entries', 'Yes', 'Insertion (or access) order', 'Not thread-safe'],
  ['ConcurrentHashMap', 'Same key equality; segmented/CAS internals', 'No null key/value', 'Unordered', 'Concurrent reads/updates'],
  ['TreeMap', 'Comparable/Comparator; hashCode unused for structure', 'No null key (natural order)', 'Sorted by compare', 'Not thread-safe (use ConcurrentSkipListMap)'],
];

export const QUICK_FACTS = [
  'Same hashCode ≠ equal. Collision → same bucket, equals decides.',
  'equals true ⇒ must same hashCode (contract).',
  'Only equals without hashCode breaks HashMap/LinkedHashMap/CHM lookup.',
  'Only hashCode without equals → duplicates in same/other buckets.',
  'TreeMap keys need compareTo/Comparator; hashCode does not place nodes.',
  'If compareTo returns 0, TreeMap treats keys as equal for put/get — even if equals is false (inconsistency bug).',
  'Prefer String/Integer/record keys — they already implement the contract.',
  'Mutable keys are poison: mutate after put → lost entry.',
];
