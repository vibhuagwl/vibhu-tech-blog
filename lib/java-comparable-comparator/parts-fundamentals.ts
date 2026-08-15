import type {ConceptBlock} from './types';

/** Section body follows ConceptBlock dimensions (what/why/how/mistake/trap) in prose. */
export type FundSection = Pick<ConceptBlock, 'id' | 'title' | 'trap'> & {
  lead: string;
  body: string;
  code?: string;
  remember: string[];
  oneLiner: string;
  tables?: {headers: string[]; rows: string[][]}[];
};

export const COMPARABLE_VS_COMPARATOR_ROWS: string[][] = [
  [
    'Definition',
    'Interface on the class: int compareTo(T other)',
    'Separate strategy: int compare(T o1, T o2) — @FunctionalInterface since Java 8',
  ],
  [
    'Package / location',
    'java.lang.Comparable<T> — implemented by the element type',
    'java.util.Comparator<T> — standalone object, lambda, or method ref',
  ],
  [
    'How many orders',
    'Exactly one natural order per type',
    'Unlimited comparators per type (by name, date, priority, …)',
  ],
  [
    'Modify source?',
    'Yes — must edit the class (or wrapper)',
    'No — works on third-party types (String, UUID, JSON node)',
  ],
  [
    'Typical declaration',
    'class Employee implements Comparable<Employee>',
    'Comparator<Employee> bySalary = Comparator.comparingInt(Employee::salary)',
  ],
  [
    'Default TreeSet / TreeMap',
    'Uses compareTo if T implements Comparable',
    'Uses supplied Comparator; ignores Comparable if provided',
  ],
  [
    'Collections.sort(list)',
    'sort(list) when T extends Comparable',
    'sort(list, comparator) — explicit strategy',
  ],
  [
    'PriorityQueue',
    'new PriorityQueue<>() uses natural order',
    'new PriorityQueue<>(comparator) uses external order',
  ],
  [
    'Stream.sorted()',
    'sorted() requires Comparable',
    'sorted(comparator) always available',
  ],
  [
    'Arrays.sort',
    'Arrays.sort(a) for Comparable objects',
    'Arrays.sort(a, comparator)',
  ],
  [
    'Key identity in TreeMap/TreeSet',
    'compareTo / compare returns 0 → same key (equals irrelevant)',
    'Same — compare==0 defines key equality',
  ],
  [
    'Return value contract',
    'Negative / zero / positive (signum) — not required to be -1/0/1',
    'Identical signum contract',
  ],
  [
    'Null elements',
    'compareTo(null) → NPE',
    'nullsFirst/Last can define null ordering',
  ],
  [
    'Primitive keys',
    'Manual Integer.compare in compareTo',
    'comparingInt / thenComparingLong avoid boxing',
  ],
  [
    'Composition',
    'Multi-field chains inside one compareTo method',
    'Fluent thenComparing* / reversed() / nulls* composition',
  ],
  [
    'Serialization / API stability',
    'Changing natural order breaks serialized Tree* expectations',
    'New Comparator is additive — old natural order untouched',
  ],
  [
    'When interviewer wants',
    '“What is default order of this domain object?”',
    '“Sort same data three different ways in one JVM”',
  ],
  [
    'Classic mistake',
    'this.id - other.id overflow in compareTo',
    'Subtraction in lambda; non-unique single-field compare==0',
  ],
  [
    'equals / hashCode',
    'compareTo==0 should imply equals (recommended)',
    'compare==0 should imply equals when used as map key',
  ],
  [
    'Records (Java 16+)',
    'Only if you add compareTo',
    'Preferred: Comparator.comparing(Record::field)',
  ],
  [
    'Enum',
    'enum implements Comparable by declaration order (ordinal)',
    'Comparator.comparing(MyEnum::name) for name order',
  ],
  [
    'Thread safety',
    'Instance method on immutable key — safe if fields immutable',
    'Stateless comparator — thread-safe; mutable keys are not',
  ],
];

export const SECTIONS_FUND: FundSection[] = [
  {
    id: 'comparable',
    title: 'Comparable fundamentals',
    lead:
      'Comparable<T> is the type’s built-in natural ordering — one compareTo(T other) method that Collections.sort, TreeSet, TreeMap (default), and Stream.sorted() use when you pass no Comparator.',
    body: `WHAT: java.lang.Comparable<T> declares int compareTo(T other). The return value’s sign tells callers whether this object is less than, equal to, or greater than other in the natural order. The Javadoc does not require exactly -1, 0, or +1 — any negative, zero, or positive int is valid (signum semantics).

WHY: A single canonical order baked into the type keeps APIs simple: new TreeSet<>(), Collections.sort(list), and pq without a comparator all “just work” when T implements Comparable. Domain types (Money by amount, Event by timestamp) get one obvious default sort.

HOW: Implement compareTo on the type itself. Delegate to Integer.compare, Long.compare, or a field chain. Keep fields used in compareTo immutable after insertion into sorted structures. Document whether order is total (every pair comparable) or partial.

MISTAKE: Assuming compareTo must return only -1/0/1. Code that does switch (a.compareTo(b)) is wrong — use sign checks or Integer.signum if you need discrete buckets.

TRAP: Natural order is not always the only order you need. Employee by id vs by name vs by hire date — Comparable picks one; the rest need Comparator.`,
    code: `import java.util.*;

/** Natural order: id ascending (business key). */
final class Employee implements Comparable<Employee> {
  private final int id;
  private final String name;
  private final int salary;

  Employee(int id, String name, int salary) {
    this.id = id;
    this.name = name;
    this.salary = salary;
  }

  int id() { return id; }
  String name() { return name; }
  int salary() { return salary; }

  @Override
  public int compareTo(Employee other) {
    return Integer.compare(this.id, other.id);
  }

  @Override
  public boolean equals(Object o) {
    return o instanceof Employee e && id == e.id;
  }

  @Override
  public int hashCode() {
    return Integer.hashCode(id);
  }

  @Override
  public String toString() {
    return "Employee{id=" + id + ", name='" + name + "', salary=" + salary + "}";
  }
}

public class ComparableFundamentalsDemo {
  public static void main(String[] args) {
    List<Employee> team = new ArrayList<>(List.of(
        new Employee(3, "Zoe", 120_000),
        new Employee(1, "Amy", 95_000),
        new Employee(2, "Bob", 110_000)));

    Collections.sort(team); // uses Employee::compareTo
    System.out.println("sorted by id: " + team);

    TreeSet<Employee> byId = new TreeSet<>(team);
    System.out.println("TreeSet size=" + byId.size()); // 3 distinct ids

    // Signum: any negative / zero / positive is legal
    Employee a = team.get(0);
    Employee b = team.get(1);
    int cmp = a.compareTo(b);
    System.out.println("compareTo sign=" + Integer.signum(cmp) + " raw=" + cmp);
  }
}`,
    remember: [
      'Comparable = natural order inside the type (compareTo).',
      'Return sign, not necessarily -1/0/+1.',
      'Used by default TreeSet/TreeMap, Collections.sort, Stream.sorted().',
      'Pick one stable business key for natural order (usually id or timestamp).',
      'Immutable fields used in compareTo after put into Tree* / PriorityQueue.',
    ],
    oneLiner:
      'Comparable embeds one natural compareTo(T) on the type — default sort for TreeSet, TreeMap, Collections.sort.',
    trap: 'Believing compareTo must return exactly -1, 0, or 1 — only the sign matters.',
  },
  {
    id: 'contract',
    title: 'compareTo contract',
    lead:
      'compareTo must be a total order (for comparable pairs): signum rule, transitivity, consistency with equals (strongly recommended), and reflexive zero — or sorted structures and binary search break silently.',
    body: `WHAT: The Comparable contract (mirrored by Comparator.compare) has five rules interviewers drill:

1. Signum: sgn(x.compareTo(y)) == -sgn(y.compareTo(x)) for all x,y (antisymmetry).
2. Transitivity: if x.compareTo(y) > 0 and y.compareTo(z) > 0, then x.compareTo(z) > 0 (and the <0 variants).
3. Consistency: x.compareTo(y) returns the same sign on repeated calls if neither object’s comparison fields change.
4. Reflexive zero: x.compareTo(x) == 0 always.
5. Equals consistency (recommended, not absolute in the interface spec): if compareTo returns 0, equals should return true for the same pair — and vice versa for sorted-map key semantics.

WHY: TreeMap/TreeSet use compare (not equals) for key identity. Violating transitivity yields ClassCastException or impossible tree shape. Violating equals consistency lets HashMap hold two entries TreeMap collapses to one.

HOW: Compare all fields that define identity, or document intentional partial order. Use Integer.compare chains. For BigDecimal, compareTo is numerical — see bigdecimal section: equals and compareTo disagree on scale (1.0 vs 1.00).

MISTAKE: compareTo on one field while equals uses two — classic TreeMap overwrite bug.

TRAP: "compareTo==0 means equals" is required for correct Tree* + HashMap mental model even though Comparable Javadoc treats equals consistency as recommended.`,
    code: `import java.util.*;

final class Version implements Comparable<Version> {
  private final int major;
  private final int minor;

  Version(int major, int minor) {
    this.major = major;
    this.minor = minor;
  }

  @Override
  public int compareTo(Version other) {
    int c = Integer.compare(major, other.major);
    if (c != 0) return c;
    return Integer.compare(minor, other.minor);
  }

  @Override
  public boolean equals(Object o) {
    return o instanceof Version v && major == v.major && minor == v.minor;
  }

  @Override
  public int hashCode() {
    return Objects.hash(major, minor);
  }
}

/** Broken transitivity — never do this. */
final class BrokenTransitive implements Comparable<BrokenTransitive> {
  private final int score;
  BrokenTransitive(int score) { this.score = score; }
  @Override public int compareTo(BrokenTransitive o) {
    // Illegal: not transitive when scores wrap logic
    return (score % 3) - (o.score % 3);
  }
}

public class CompareToContractDemo {
  public static void main(String[] args) {
    Version v1 = new Version(2, 1);
    Version v2 = new Version(2, 3);
    Version v3 = new Version(2, 1);

    // Reflexive zero
    System.out.println("v1.compareTo(v1)=" + v1.compareTo(v1));

    // Antisymmetry: sgn(a,b) == -sgn(b,a)
    int ab = v1.compareTo(v2);
    int ba = v2.compareTo(v1);
    System.out.println("antisymmetry: ab=" + ab + " ba=" + ba);

    // Transitivity: v1 < v2, v2 > v1, v1 == v3
    System.out.println("transitive tie: v1 vs v3 -> " + v1.compareTo(v3));

    TreeMap<Version, String> map = new TreeMap<>();
    map.put(v1, "release-a");
    map.put(v3, "release-b"); // compareTo==0 → replaces value, size stays 1
    System.out.println("TreeMap size=" + map.size() + " value=" + map.get(v1));

    // BigDecimal teaser — full treatment in #bigdecimal
    var a = new java.math.BigDecimal("1.0");
    var b = new java.math.BigDecimal("1.00");
    System.out.println("BigDecimal equals=" + a.equals(b) + " compareTo=" + a.compareTo(b));
  }
}`,
    remember: [
      'Signum: negative / zero / positive — not fixed -1/0/1.',
      'Transitivity violations crash TreeSet or corrupt ordering.',
      'compareTo(x,x) must be 0.',
      'compareTo==0 should imply equals==true (strongly recommended).',
      'BigDecimal: equals≠compareTo — see bigdecimal section.',
    ],
    oneLiner:
      'Total order: antisymmetric signum, transitive, consistent, reflexive zero — align compareTo==0 with equals.',
    trap: 'Treating equals consistency as optional while using the same class in HashMap and TreeMap.',
    tables: [
      {
        headers: ['Rule', 'Formal', 'If broken'],
        rows: [
          ['Signum / antisymmetry', 'sgn(x,y) = -sgn(y,x)', 'Asymmetric sort, undefined binary search'],
          ['Transitivity', 'x>y and y>z ⇒ x>z', 'TreeSet add() throws or inconsistent order'],
          ['Consistency', 'Same sign if fields unchanged', 'Unstable sort, flaky tests'],
          ['Reflexive zero', 'x.compareTo(x)==0', 'Self-insert bugs in Tree structures'],
          ['Equals consistency', 'compareTo==0 ⇔ equals (recommended)', 'HashMap size≠TreeMap size for “same” keys'],
        ],
      },
    ],
  },
  {
    id: 'implement',
    title: 'Implementing Comparable',
    lead:
      'Production compareTo: final fields, multi-field Integer.compare chain, equals/hashCode on the same key, and never subtract wide integers.',
    body: `WHAT: Implement Comparable<T> on the class (or record with explicit ordering via Comparator instead). compareTo is instance method; no static import magic.

WHY: Encapsulates the domain’s default ordering — e.g. Transaction by postedInstant then id for deterministic replay.

HOW:
• Single key: return Integer.compare(this.id, o.id).
• Multi-field: compare field1, if non-zero return; else field2, etc.
• Strings: use String.compareTo (lexicographic) or Comparator.comparing in a separate strategy.
• Enums: ordinal() works but name() order is clearer for APIs; prefer explicit Comparator for non-natural enum order.
• Records: do not implement Comparable unless you add compareTo — use Comparator.comparing(Record::field).

MISTAKE: Implementing compareTo without equals/hashCode when objects are map keys.

TRAP: Subclass overriding compareTo with wider type but breaking symmetry with superclass instances.`,
    code: `import java.time.Instant;
import java.util.*;

final class LedgerEntry implements Comparable<LedgerEntry> {
  private final Instant postedAt;
  private final long sequence;
  private final String accountId;

  LedgerEntry(Instant postedAt, long sequence, String accountId) {
    this.postedAt = postedAt;
    this.sequence = sequence;
    this.accountId = accountId;
  }

  @Override
  public int compareTo(LedgerEntry other) {
    int byTime = this.postedAt.compareTo(other.postedAt);
    if (byTime != 0) return byTime;
    int bySeq = Long.compare(this.sequence, other.sequence);
    if (bySeq != 0) return bySeq;
    return this.accountId.compareTo(other.accountId);
  }

  @Override
  public boolean equals(Object o) {
    return o instanceof LedgerEntry e
        && sequence == e.sequence
        && postedAt.equals(e.postedAt)
        && accountId.equals(e.accountId);
  }

  @Override
  public int hashCode() {
    return Objects.hash(postedAt, sequence, accountId);
  }

  @Override
  public String toString() {
    return sequence + "@" + postedAt + ":" + accountId;
  }
}

public class ImplementComparableDemo {
  public static void main(String[] args) {
    List<LedgerEntry> entries = new ArrayList<>(List.of(
        new LedgerEntry(Instant.parse("2026-01-15T10:00:00Z"), 2L, "CHK"),
        new LedgerEntry(Instant.parse("2026-01-15T09:00:00Z"), 1L, "SAV"),
        new LedgerEntry(Instant.parse("2026-01-15T10:00:00Z"), 1L, "CHK")));

    Collections.sort(entries);
    System.out.println(entries);

    PriorityQueue<LedgerEntry> pq = new PriorityQueue<>(); // natural order = earliest first
    pq.addAll(entries);
    System.out.println("poll order: " + pq.poll() + " | " + pq.poll() + " | " + pq.poll());
  }
}`,
    remember: [
      'Chain fields: compare A, then B, then C.',
      'equals/hashCode must use the same identity as compareTo zero.',
      'Records: add compareTo or supply Comparator to TreeMap.',
      'Use Long.compare / Instant.compareTo — not subtraction.',
      'Document natural order in Javadoc (ascending id, oldest-first, etc.).',
    ],
    oneLiner: 'compareTo = chained field comparison with Integer/Long/String.compare — match equals on the same key.',
    trap: 'compareTo by name only while equals uses id — TreeMap replaces distinct employees.',
  },
  {
    id: 'overflow',
    title: 'Subtraction bug · overflow',
    lead:
      'return this.id - other.id is a production incident: int overflow flips the sign and corrupts TreeSet, TimSort, and PriorityQueue.',
    body: `WHAT: Subtracting two int (or long) values in compareTo can overflow when values are far apart (e.g. Integer.MAX_VALUE and -1). The difference wraps to a negative number, inverting order.

WHY: compareTo must reflect mathematical ordering. Overflow breaks transitivity — TimSort may throw IllegalArgumentException: Comparison method violates its general contract!

HOW: Always use Integer.compare(x, y), Long.compare, Double.compare, or Comparator.comparingInt. For unsigned semantics use Integer.compareUnsigned.

MISTAKE: Copy-paste from ancient tutorials: return score1 - score2.

TRAP: Interviewer gives ids near MAX_VALUE — subtraction returns positive when it should be negative.`,
    code: `import java.util.*;

final class RiskyId implements Comparable<RiskyId> {
  private final int id;
  RiskyId(int id) { this.id = id; }
  int id() { return id; }

  /** WRONG — overflows for extreme pairs. */
  int compareToSubtract(RiskyId other) {
    return this.id - other.id;
  }

  @Override
  public int compareTo(RiskyId other) {
    return Integer.compare(this.id, other.id);
  }

  @Override public boolean equals(Object o) { return o instanceof RiskyId r && id == r.id; }
  @Override public int hashCode() { return Integer.hashCode(id); }
  @Override public String toString() { return "RiskyId(" + id + ")"; }
}

public class OverflowCompareDemo {
  public static void main(String[] args) {
    RiskyId max = new RiskyId(Integer.MAX_VALUE);
    RiskyId negOne = new RiskyId(-1);

    int bad = max.compareToSubtract(negOne);
    int good = max.compareTo(negOne);
    System.out.println("subtract (WRONG sign): " + bad);
    System.out.println("Integer.compare (correct): " + good);

    // TimSort detects broken comparator / compareTo
    List<RiskyId> list = new ArrayList<>(List.of(negOne, max));
    Collections.sort(list); // uses safe compareTo
    System.out.println("sorted: " + list);

    try {
      List<RiskyId> trap = new ArrayList<>(List.of(negOne, max));
      trap.sort((a, b) -> a.id() - b.id()); // same overflow in lambda
      System.out.println("lambda sort: " + trap);
    } catch (IllegalArgumentException ex) {
      System.out.println("TimSort caught bad comparator: " + ex.getMessage());
    }
  }
}`,
    remember: [
      'Never return this.id - other.id in compareTo.',
      'Integer.compare / Long.compare are overflow-safe.',
      'Same rule for Comparator lambdas and comparingInt.',
      'Float/double: use Float.compare — not subtraction (NaN traps).',
      'Unsigned bytes: Integer.compareUnsigned(b1, b2).',
    ],
    oneLiner: 'Subtraction overflows int — Integer.compare is the fix; TimSort throws on broken order.',
    trap: 'Thinking overflow only matters for MAX_VALUE — any large gap can wrap.',
  },
  {
    id: 'comparator',
    title: 'Comparator fundamentals',
    lead:
      'Comparator<T> is an external ordering strategy — multiple comparators per type, lambdas, method references, and composition without touching the class.',
    body: `WHAT: java.util.Comparator<T> defines int compare(T o1, T o2) with the same signum contract as compareTo. Since Java 8 it is a @FunctionalInterface with rich static factories.

WHY: Same Employee sorted by salary for payroll, by name for UI, by hire date for tenure — without implementing Comparable three times or subclassing.

HOW: Pass Comparator to constructors and APIs: new TreeSet<>(cmp), Collections.sort(list, cmp), stream.sorted(cmp), PriorityQueue<>(cmp). Comparators are often stateless singletons — safe to share.

MISTAKE: Mutating fields read by a Comparator while objects sit in a TreeSet.

TRAP: compare returning 0 for unequal objects (inconsistent with equals) — second put disappears in TreeMap.`,
    code: `import java.util.*;

record Employee(int id, String name, int salary, int age) {}

public class ComparatorFundamentalsDemo {
  public static void main(String[] args) {
    List<Employee> team = new ArrayList<>(List.of(
        new Employee(1, "Amy", 90_000, 30),
        new Employee(2, "Bob", 120_000, 28),
        new Employee(3, "Cal", 120_000, 35)));

    Comparator<Employee> bySalaryDesc = Comparator.comparingInt(Employee::salary).reversed();
    team.sort(bySalaryDesc);
    System.out.println("by salary desc: " + team);

    // Anonymous / lambda style (pre-Java 8 pattern, still valid)
    Comparator<Employee> byName = (a, b) -> a.name().compareTo(b.name());
    TreeSet<Employee> nameSet = new TreeSet<>(byName);
    nameSet.addAll(team);
    System.out.println("TreeSet by name: " + nameSet);

    // compare contract: sign only
    Employee x = team.get(0);
    Employee y = team.get(1);
    int sign = Integer.signum(bySalaryDesc.compare(x, y));
    System.out.println("compare sign=" + sign);
  }
}`,
    remember: [
      'Comparator = external, multiple orders per type.',
      'Same signum contract as compareTo.',
      'Pass to TreeSet, sort, PriorityQueue, Stream.sorted.',
      'Stateless comparators are thread-safe; mutable keys are not.',
      'compare==0 defines key equality in TreeMap/TreeSet.',
    ],
    oneLiner: 'Comparator<T> supplies compare(o1,o2) — many sort strategies without changing the class.',
    trap: 'Using Comparator when you need HashMap keys — Tree* uses compare, HashMap uses equals.',
  },
  {
    id: 'vs',
    title: 'Comparable vs Comparator',
    lead:
      'Comparable is one natural order inside the type; Comparator is pluggable, reusable, and mandatory when the type is not yours (String, record, third-party POJO).',
    body: `WHAT: Comparable modifies the type (implements interface). Comparator is a separate object (class, lambda, method ref).

WHY: Library types you cannot edit need Comparator. Domain types benefit from one obvious Comparable (id) plus Comparators for reports.

HOW: If both exist, explicit Comparator wins: new TreeSet<>(comparator) ignores Comparable. PriorityQueue(Comparator) ditto.

MISTAKE: Implementing Comparable on a DTO used in APIs where order is context-dependent — forces one order globally.

TRAP: Assuming TreeMap uses equals — it uses compare/compareTo only; see eqhc section for the full triangle with hashCode.`,
    remember: [
      'Comparable: one natural order, inside the class.',
      'Comparator: many orders, outside the class.',
      'Explicit Comparator overrides Comparable in APIs.',
      'Cannot add Comparable to String — use Comparator.',
      'Tree*: compare==0, not equals.',
    ],
    oneLiner: 'Comparable = built-in natural order · Comparator = external strategy — explicit Comparator wins.',
    trap: 'Implementing Comparable on a type that has no single natural order (e.g. sortable grid row).',
    tables: [
      {
        headers: ['Aspect', 'Comparable', 'Comparator'],
        rows: COMPARABLE_VS_COMPARATOR_ROWS,
      },
    ],
  },
  {
    id: 'create',
    title: 'Creating Comparators',
    lead:
      'Prefer Comparator.comparing* factories and thenComparing chains over hand-written compare — fewer bugs, clearer intent, better optimization for primitives.',
    body: `WHAT: Ways to obtain Comparator<T>: anonymous class, lambda (o1,o2) -> ..., method reference, static factories (comparing, comparingInt), composing with thenComparing, reversing, null guards.

WHY: Hand-rolled compare methods reintroduce overflow, null NPE, and inconsistent tie-breaking.

HOW:
• Key extractor: Comparator.comparing(Employee::name)
• Primitive: Comparator.comparingInt(Employee::salary)
• Multi-level: .thenComparing(...).thenComparingInt(...)
• Reverse: .reversed() on instance or Comparator.reverseOrder() for Comparable types
• Nulls: Comparator.nullsFirst(base) / nullsLast(base)

MISTAKE: Null field in key extractor without nullsFirst on the nested comparator.

TRAP: comparing(Employee::dept) alone ties all same-dept employees as equal (compare==0) — add thenComparing(id).`,
    code: `import java.util.*;

record Employee(int id, String name, String dept, int salary) {}

public class CreateComparatorsDemo {
  public static void main(String[] args) {
    List<Employee> team = new ArrayList<>(List.of(
        new Employee(1, "Amy", "ENG", 100_000),
        new Employee(2, "Bob", "ENG", 120_000),
        new Employee(3, "Cal", "HR", 90_000)));

    // 1) Lambda
    Comparator<Employee> byId = (a, b) -> Integer.compare(a.id(), b.id());

    // 2) Method reference + factory
    Comparator<Employee> byName = Comparator.comparing(Employee::name);

    // 3) Multi-level
    Comparator<Employee> byDeptThenSalary = Comparator
        .comparing(Employee::dept)
        .thenComparingInt(Employee::salary);

    // 4) Anonymous class (legacy style)
    Comparator<Employee> bySalaryDesc = new Comparator<>() {
      @Override
      public int compare(Employee a, Employee b) {
        return Integer.compare(b.salary(), a.salary());
      }
    };

    team.sort(byDeptThenSalary);
    System.out.println("dept then salary: " + team);

    team.sort(bySalaryDesc);
    System.out.println("salary desc: " + team);

    // 5) Reverse natural order for Comparable types
    List<String> tags = new ArrayList<>(List.of("beta", "alpha", "gamma"));
    tags.sort(Comparator.reverseOrder());
    System.out.println("strings desc: " + tags);
  }
}`,
    remember: [
      'Start with comparing / comparingInt, not raw subtraction.',
      'thenComparing breaks ties — never rely on one non-unique field.',
      'reversed() flips one comparator; reverseOrder() flips Comparable natural order.',
      'nullsFirst/Last wrap the whole comparator or field comparators.',
      'Extract static final Comparator constants for reuse in services.',
    ],
    oneLiner: 'Build with comparing* + thenComparing* + reversed/nulls — avoid hand-rolled subtract compare.',
    trap: 'Single-field Comparator on non-unique field → TreeMap key collisions.',
  },
  {
    id: 'api',
    title: 'Java 8+ Comparator API',
    lead:
      'Every static and instance Comparator API from Java 8 through 21 — naturalOrder, reverseOrder, comparing*, thenComparing*, reversed, nullsFirst/Last — with runnable examples.',
    body: `WHAT: Full Comparator surface area used in modern codebases.

STATIC (Java 8+):
• naturalOrder() — Comparable’s order for T extends Comparable<? super T>
• reverseOrder() — flips natural order
• comparing(Function<? super T,? extends U>) — key on Comparable U
• comparing(Function, Comparator<? super U>) — key with custom U order
• comparingInt / comparingLong / comparingDouble — primitive keys, no boxing
• nullsFirst(Comparator) / nullsLast(Comparator) — null-safe wrapper

INSTANCE:
• reversed()
• thenComparing(Comparator<? super T>)
• thenComparing(Function<? super T,? extends U>)
• thenComparing(Function, Comparator<? super U>)
• thenComparingInt / thenComparingLong / thenComparingDouble

WHY: Standard names beat copy-paste lambdas; primitive variants avoid allocation hot paths.

HOW: Chain fluently left-to-right: primary key first, tie-breakers after.

MISTAKE: naturalOrder() on a type that does not implement Comparable — compile error or raw chaos with generics.

TRAP: nullsFirst without wrapping inner comparator that still NPEs on null keys inside compare.`,
    code: `import java.util.*;
import java.util.function.*;

record Person(String name, int age, long score, double rating, String nick) {}

public class ComparatorApiCatalogDemo {
  public static void main(String[] args) {
    List<Person> people = new ArrayList<>(List.of(
        new Person("Zoe", 30, 100L, 4.5, null),
        new Person("Amy", 25, 200L, 3.9, "A"),
        new Person(null, 40, 50L, 4.5, "Z"),
        new Person("Bob", 25, 150L, 4.1, "B")));

    // --- static factories ---
    Comparator<Person> naturalName = Comparator.comparing(Person::name, Comparator.naturalOrder());
    Comparator<Person> reverseName = Comparator.comparing(Person::name, Comparator.reverseOrder());

    Comparator<Person> byAge = Comparator.comparingInt(Person::age);
    Comparator<Person> byScore = Comparator.comparingLong(Person::score);
    Comparator<Person> byRating = Comparator.comparingDouble(Person::rating);

    Comparator<Person> byNickCustom = Comparator.comparing(
        Person::nick,
        Comparator.nullsLast(String::compareToIgnoreCase));

    // --- instance chaining ---
    Comparator<Person> chain = Comparator
        .comparingInt(Person::age)
        .thenComparingLong(Person::score)
        .thenComparing(Person::name)
        .thenComparingDouble(Person::rating)
        .thenComparing(byNickCustom);

    // --- reversed ---
    Comparator<Person> youngestFirst = Comparator.comparingInt(Person::age).reversed();

    // --- null-safe outer wrapper ---
    Comparator<Person> nullSafe = Comparator.nullsFirst(
        Comparator.comparing(Person::name, Comparator.nullsLast(String::compareTo)));

    List<Person> copy = new ArrayList<>(people);
    copy.sort(nullSafe);
    System.out.println("nullsFirst whole Person: " + copy);

    copy = new ArrayList<>(people);
    copy.sort(youngestFirst);
    System.out.println("age reversed: " + copy);

    copy = new ArrayList<>(people);
    copy.sort(chain);
    System.out.println("full chain: " + copy);

    // reverseOrder on Comparable element list
    List<String> words = new ArrayList<>(List.of("delta", "alpha", "charlie"));
    words.sort(Comparator.reverseOrder());
    System.out.println("reverseOrder strings: " + words);

    words.sort(Comparator.naturalOrder());
    System.out.println("naturalOrder strings: " + words);
  }
}`,
    remember: [
      'comparing* = first key; thenComparing* = tie-breakers.',
      'comparingInt/Long/Double avoid boxing in hot sorts.',
      'reversed() on instance; reverseOrder()/naturalOrder() static.',
      'nullsFirst/Last wrap entire Comparator or nested field order.',
      'All compare methods: signum only, not exact -1/0/1.',
    ],
    oneLiner: 'Java 8+ Comparator: comparing*, thenComparing*, reversed, nullsFirst/Last, naturalOrder/reverseOrder.',
    trap: 'Using comparing() on int field — boxes every comparison; use comparingInt.',
    tables: [
      {
        headers: ['API', 'Kind', 'Typical use'],
        rows: [
          ['Comparator.naturalOrder()', 'static', 'Sort Comparable<T> ascending'],
          ['Comparator.reverseOrder()', 'static', 'Sort Comparable<T> descending'],
          ['Comparator.comparing(fn)', 'static', 'Sort by extracted Comparable key'],
          ['Comparator.comparing(fn, cmp)', 'static', 'Sort by key with custom key order'],
          ['Comparator.comparingInt(fn)', 'static', 'int key without boxing'],
          ['Comparator.comparingLong(fn)', 'static', 'long key without boxing'],
          ['Comparator.comparingDouble(fn)', 'static', 'double key without boxing'],
          ['Comparator.nullsFirst(cmp)', 'static', 'null elements sort before non-null'],
          ['Comparator.nullsLast(cmp)', 'static', 'null elements sort after non-null'],
          ['cmp.reversed()', 'instance', 'Flip this comparator'],
          ['cmp.thenComparing(cmp2)', 'instance', 'Tie-break with another comparator'],
          ['cmp.thenComparing(fn)', 'instance', 'Tie-break by Comparable field'],
          ['cmp.thenComparing(fn, c)', 'instance', 'Tie-break by field with order c'],
          ['cmp.thenComparingInt(fn)', 'instance', 'Tie-break by int field'],
          ['cmp.thenComparingLong(fn)', 'instance', 'Tie-break by long field'],
          ['cmp.thenComparingDouble(fn)', 'instance', 'Tie-break by double field'],
        ],
      },
    ],
  },
  {
    id: 'primitive',
    title: 'comparing vs comparingInt',
    lead:
      'Comparator.comparing(Employee::age) boxes every comparison; comparingInt avoids Integer allocation and is the default choice for int fields in hot paths.',
    body: `WHAT: comparing(Function) requires a Comparable return type — int becomes Integer via autoboxing. comparingInt(ToIntFunction) reads primitive int directly.

WHY: Sorting millions of rows in a report or maintaining a large TreeSet — boxing dominates allocation and GC. Microbenchmarks are not interview theater; production ledgers care.

HOW: Use comparingInt, comparingLong, comparingDouble for primitive fields. Use comparing for String, Instant, BigDecimal (Comparable types). For optional int, extract with default or sort nulls separately.

MISTAKE: comparing(Employee::age) in a tight loop “because it reads cleaner.”

TRAP: comparingInt on expression that accidentally widens to long — use comparingLong instead.`,
    code: `import java.util.*;
import java.util.function.ToIntFunction;

record Trade(int id, int quantity, long notionalCents) {}

public class ComparingVsComparingIntDemo {
  public static void main(String[] args) {
    List<Trade> trades = new ArrayList<>();
    for (int i = 0; i < 5; i++) {
      trades.add(new Trade(i, 1000 - i * 100, 1_000_000L - i));
    }

    // Boxing path — valid but allocates Integer per compare
    Comparator<Trade> byQtyBoxed = Comparator.comparing(t -> t.quantity()); // inferred: Integer via autobox

    // Primitive path — preferred for int field
    Comparator<Trade> byQtyPrimitive = Comparator.comparingInt(Trade::quantity);

    trades.sort(byQtyPrimitive);
    System.out.println("by quantity asc: " + trades);

    // long field
    trades.sort(Comparator.comparingLong(Trade::notionalCents).reversed());
    System.out.println("by notional desc: " + trades);

  }
}`,
    remember: [
      'comparingInt/Long/Double = no boxing on key extraction.',
      'comparing(fn) when key is already Comparable object (String, Instant).',
      'thenComparingInt chains primitive tie-breakers.',
      'Performance matters at scale — correctness always first.',
      'Records accessors work cleanly as method refs.',
    ],
    oneLiner: 'Primitive field → comparingInt/Long/Double; comparing() boxes ints — use primitive factories in hot sorts.',
    trap: 'Assuming JIT eliminates all boxing in comparing(Employee::age) — it often does not at scale.',
    tables: [
      {
        headers: ['Factory', 'Key type', 'Boxes?'],
        rows: [
          ['comparing(Employee::name)', 'String (Comparable)', 'No (already object)'],
          ['comparing(Employee::hireDate)', 'Instant', 'No'],
          ['comparing(Employee::age) via autobox', 'int → Integer', 'Yes — per compare'],
          ['comparingInt(Employee::age)', 'int', 'No'],
          ['comparingLong(Employee::id)', 'long', 'No'],
          ['comparingDouble(Employee::score)', 'double', 'No'],
        ],
      },
    ],
  },
  {
    id: 'multilevel',
    title: 'Multi-level sorting',
    lead:
      'Interview classic: sort employees by salary DESC, then age ASC, then name ASC — one Comparator chain, stable tie-breaking at each level.',
    body: `WHAT: Lexicographic tuple order: compare most significant field first; on tie, next field; repeat until difference or all equal.

WHY: Payroll exports, leaderboards, and UI tables need deterministic ordering when top keys collide.

HOW: Comparator.comparingInt(Employee::salary).reversed().thenComparingInt(Employee::age).thenComparing(Employee::name). Stable sorts (TimSort) preserve relative order among fully equal keys.

MISTAKE: Sorting three times with unstable assumptions instead of one chained comparator.

TRAP: Forgetting reversed() on only the first key — salary ASC instead of DESC.`,
    code: `import java.util.*;

record Employee(String name, int age, int salary) {
  @Override public String toString() {
    return name + "(age=" + age + ",$" + salary + ")";
  }
}

public class MultiLevelSortDemo {
  public static final Comparator<Employee> PAYROLL_ORDER = Comparator
      .comparingInt(Employee::salary).reversed()   // salary DESC
      .thenComparingInt(Employee::age)             // age ASC
      .thenComparing(Employee::name);              // name ASC

  public static void main(String[] args) {
    List<Employee> team = new ArrayList<>(List.of(
        new Employee("Zoe", 32, 120_000),
        new Employee("Amy", 28, 120_000),
        new Employee("Bob", 35, 120_000),
        new Employee("Cal", 28, 95_000),
        new Employee("Dan", 40, 120_000)));

    team.sort(PAYROLL_ORDER);
    System.out.println("salary↓ age↑ name↑:");
    team.forEach(e -> System.out.println("  " + e));

    // Stream equivalent
    List<Employee> viaStream = team.stream().sorted(PAYROLL_ORDER).toList();
    System.out.println("stream sorted size=" + viaStream.size());
  }
}`,
    remember: [
      'Primary key first; reversed() for DESC.',
      'thenComparing* for each tie-breaker.',
      'Salary DESC · age ASC · name ASC is a standard interview pattern.',
      'Stable sort keeps equal-key relative order.',
      'Extract public static final Comparator for reuse.',
    ],
    oneLiner: 'Chain comparing* with reversed() on DESC keys — thenComparing* breaks ties left to right.',
    trap: 'Sorting by salary only — ties appear “random” without secondary keys.',
  },
  {
    id: 'ascdesc',
    title: 'Asc / desc · reverse',
    lead:
      'reversed() flips one comparator instance; reverseOrder() and naturalOrder() are static shortcuts for Comparable types — know which applies to your API call.',
    body: `WHAT:
• cmp.reversed() — instance method, negates this Comparator
• Comparator.reverseOrder() — static, descending for Comparable<T>
• Comparator.naturalOrder() — static, ascending Comparable<T>
• Collections.reverseOrder() / reverse(list) — different: list mutator vs comparator factory

WHY: Descending leaderboards, newest-first logs, and inverted priority queues need explicit reverse — natural order alone is always “ascending” per compareTo.

HOW: new PriorityQueue<>(Comparator.comparingInt(Task::priority).reversed()) serves highest priority first. Arrays.sort with reverseOrder for Comparable arrays.

MISTAKE: Calling reversed() twice thinking it “cancels” across different comparator instances — each chain is independent.

TRAP: reverseOrder() on types without Comparable — compile-time failure; use comparing(fn).reversed() instead.`,
    code: `import java.util.*;

record Task(String name, int priority, long createdEpoch) {}

public class AscDescReverseDemo {
  public static void main(String[] args) {
    List<Task> backlog = new ArrayList<>(List.of(
        new Task("patch", 2, 100L),
        new Task("feature", 1, 300L),
        new Task("hotfix", 1, 200L)));

    // Instance reversed on custom comparator
    Comparator<Task> priorityDesc = Comparator.comparingInt(Task::priority).reversed();
    backlog.sort(priorityDesc);
    System.out.println("priority desc: " + backlog);

    // Then tie-break createdEpoch ASC within same priority
    Comparator<Task> priorityDescThenOldest = Comparator
        .comparingInt(Task::priority).reversed()
        .thenComparingLong(Task::createdEpoch);
    backlog.sort(priorityDescThenOldest);
    System.out.println("priority desc, oldest first: " + backlog);

    // Static reverseOrder / naturalOrder on Comparable
    List<String> codes = new ArrayList<>(List.of("M", "A", "Z"));
    codes.sort(Comparator.reverseOrder());
    System.out.println("strings reverseOrder: " + codes);
    codes.sort(Comparator.naturalOrder());
    System.out.println("strings naturalOrder: " + codes);

    // PriorityQueue: higher priority int first
    PriorityQueue<Task> pq = new PriorityQueue<>(priorityDesc);
    pq.addAll(backlog);
    System.out.print("poll: ");
    while (!pq.isEmpty()) System.out.print(pq.poll().name() + " ");
    System.out.println();
  }
}`,
    remember: [
      'reversed() = flip this comparator chain.',
      'reverseOrder() = static descending Comparable.',
      'naturalOrder() = static ascending Comparable.',
      'Collections.reverse(list) mutates list — not a Comparator.',
      'Apply reversed() right after the key you want DESC.',
    ],
    oneLiner: 'reversed() negates one comparator · reverseOrder()/naturalOrder() wrap Comparable types.',
    trap: 'Confusing Collections.reverse(list) with Comparator.reversed().',
  },
  {
    id: 'nulls',
    title: 'Null handling',
    lead:
      'TreeSet/TreeMap forbid null keys with natural order; Comparator.nullsFirst/Last fixes null elements and nullsFirst(fieldComparator) fixes null fields in multi-level sorts.',
    body: `WHAT:
• nullsFirst(Comparator) — null references sort before non-null when comparing T
• nullsLast(Comparator) — nulls after non-null
• For nullable fields: Comparator.comparing(Employee::nick, Comparator.nullsLast(naturalOrder()))
• Natural TreeMap/TreeSet: null key → NPE on add

WHY: Real data has missing nicknames, optional ranks, and nullable sort keys in CSV imports.

HOW: Wrap outer comparator when list contains null elements. Wrap inner field comparator when field may be null. Do not call compareTo on null — Comparator handles null element ordering explicitly.

MISTAKE: assuming Comparator.comparing(Employee::nick) tolerates null nick — NPE inside comparing.

TRAP: nullsFirst on outer comparator but inner String::compareTo still throws on null field.`,
    code: `import java.util.*;

record Employee(String name, String nick, Integer bonus) {
  @Override public String toString() { return name + "/" + nick + "/bonus=" + bonus; }
}

public class NullHandlingDemo {
  public static void main(String[] args) {
    List<Employee> team = new ArrayList<>(List.of(
        new Employee("Amy", "Ace", 500),
        new Employee("Bob", null, 300),
        new Employee("Cal", "Cap", null),
        null,
        new Employee("Dan", "Dee", 400)));

    // Null elements first, then name, null nicks last within compare
    Comparator<Employee> cmp = Comparator.nullsFirst(
        Comparator.comparing(Employee::name)
            .thenComparing(Employee::nick, Comparator.nullsLast(String::compareTo))
            .thenComparing(Employee::bonus, Comparator.nullsFirst(Integer::compareTo)));

    List<Employee> copy = new ArrayList<>(team);
    copy.sort(cmp);
    System.out.println("sorted with null element + null fields:");
    copy.forEach(e -> System.out.println("  " + e));

    // TreeSet: cannot use null keys with natural order
    TreeSet<String> natural = new TreeSet<>();
    natural.add("beta");
    natural.add("alpha");
    System.out.println("TreeSet natural: " + natural);

    // TreeSet with explicit nullsLast comparator allows one null if comparator permits
    TreeSet<String> withNull = new TreeSet<>(Comparator.nullsLast(String::compareTo));
    withNull.add("beta");
    withNull.add(null);
    withNull.add("alpha");
    System.out.println("TreeSet nullsLast: " + withNull);
  }
}`,
    remember: [
      'Natural TreeMap/TreeSet: no null keys.',
      'nullsFirst/Last wrap comparators for null elements.',
      'Nullable fields need nulls on inner comparing(..., cmp).',
      'Integer bonus null → comparing with nullsFirst(Integer::compareTo).',
      'Never pass null to compareTo — only Comparator null wrappers handle nulls.',
    ],
    oneLiner: 'nullsFirst/Last on element or field comparators — natural Tree* rejects null keys.',
    trap: 'Outer nullsFirst does not fix null fields — wrap each nullable field comparator.',
  },
];

export const MEMORY_RULES = `┌──────────────────────────────────────────────────────────────────────────────┐
│  COMPARABLE vs COMPARATOR — interview whiteboard                               │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────┐              ┌─────────────────┐                     │
│   │   Comparable    │              │   Comparator    │                     │
│   │  INSIDE type    │              │ OUTSIDE type    │                     │
│   │  compareTo(T)   │              │ compare(o1,o2)  │                     │
│   │  ONE natural    │              │ MANY strategies │                     │
│   └────────┬────────┘              └────────┬────────┘                     │
│            │                                  │                              │
│            └──────────────┬───────────────────┘                              │
│                           ▼                                                  │
│              sign < 0  |  sign == 0  |  sign > 0                           │
│              (NOT always -1 / 0 / +1)                                        │
│                           │                                                  │
│         ┌─────────────────┼─────────────────┐                                │
│         ▼                 ▼                 ▼                                │
│    TreeSet/TreeMap   PriorityQueue    Collections.sort                       │
│    compare==0 =      explicit cmp     Stream.sorted(cmp)                     │
│    SAME KEY          beats natural                                           │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│  OVERFLOW TRAP          │  NULL TRAP              │  BIGDECIMAL TRAP          │
│  id - other.id  ✗       │  Tree* null key NPE     │  equals ≠ compareTo     │
│  Integer.compare  ✓     │  nullsFirst/Last  ✓     │  → see #bigdecimal      │
├──────────────────────────────────────────────────────────────────────────────┤
│  MULTI-LEVEL:  .comparingInt(salary).reversed()                              │
│                .thenComparingInt(age)                                        │
│                .thenComparing(name)     // salary↓ age↑ name↑              │
├──────────────────────────────────────────────────────────────────────────────┤
│  PRIMITIVE: comparingInt > comparing (no Integer box per compare)            │
├──────────────────────────────────────────────────────────────────────────────┤
│  REVERSE:  cmp.reversed()  |  Comparator.reverseOrder() for Comparable       │
└──────────────────────────────────────────────────────────────────────────────┘`;
