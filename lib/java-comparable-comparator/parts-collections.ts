import type {ConceptBlock} from './types';

export type CollSection = ConceptBlock & {
  remember: string[];
  oneLiner: string;
};

export const SECTIONS_COLL: CollSection[] = [
  {
    id: 'collections',
    title: 'Sorting collections — Arrays · Collections · List · Stream',
    what: 'Four entry points sort in-place or produce a new ordered stream: Arrays.sort, Collections.sort, List.sort (Java 8+), and Stream.sorted.',
    why: 'Interviews mix legacy APIs with modern ones. You must know which mutates, which returns a new collection, and that all ultimately delegate to TimSort (or comparable paths) for reference types.',
    how: 'Arrays.sort mutates the array. Collections.sort mutates a List (delegates to list.sort since Java 8). List.sort is the List default method. stream().sorted() is lazy/intermediate — collect to materialize. Primitives: Arrays.sort(int[]) has no Comparator overload.',
    code: `import java.util.*;
import java.util.stream.*;

public class SortApisDemo {
  static final class Trade implements Comparable<Trade> {
    final String symbol; final long ts;
    Trade(String s, long t) { symbol = s; ts = t; }
  @Override public int compareTo(Trade o) {
      int c = symbol.compareTo(o.symbol);
      return c != 0 ? c : Long.compare(ts, o.ts);
    }
    @Override public String toString() { return symbol + "@" + ts; }
  }

  public static void main(String[] args) {
    // 1) Arrays.sort — mutates array
    String[] tags = {"gamma", "alpha", "beta"};
    Arrays.sort(tags);
    System.out.println("arrays: " + Arrays.toString(tags));

    // 2) Collections.sort — mutates backing list (legacy name, still valid)
    List<Integer> ids = new ArrayList<>(List.of(30, 10, 20));
    Collections.sort(ids);
    System.out.println("collections.sort: " + ids);

    // 3) List.sort — preferred on List since Java 8
    List<Integer> ids2 = new ArrayList<>(List.of(30, 10, 20));
    ids2.sort(Comparator.naturalOrder());
    System.out.println("list.sort: " + ids2);

    // 4) Stream.sorted — does NOT mutate source; terminal collect required
    List<String> src = new ArrayList<>(List.of("z", "a", "m"));
    List<String> sorted = src.stream()
        .sorted(String.CASE_INSENSITIVE_ORDER)
        .collect(Collectors.toList());
    System.out.println("stream sorted: " + sorted + " src unchanged: " + src);

    // Comparator on Arrays / Collections
    Trade[] book = {new Trade("AAPL", 2), new Trade("AAPL", 1), new Trade("MSFT", 1)};
    Arrays.sort(book, Comparator.comparing((Trade t) -> t.symbol)
        .thenComparingLong(t -> t.ts));
    System.out.println("trades: " + Arrays.toString(book));
  }
}`,
    realWorld: 'Batch settlement files: sort trade rows by symbol then timestamp before netting. APIs return stream().sorted(comparator).limit(50) for leaderboards without mutating the backing cache list.',
    mistake: 'Calling stream().sorted() without collect/forEach and expecting the original List to reorder. Forgetting Arrays.sort has no Comparator for primitive arrays (use boxed or manual).',
    trap: '"Collections.sort copies the list" — it sorts in place; only Stream.sorted builds a new pipeline result.',
    interviewAnswer:
      'Arrays.sort and List.sort mutate; Collections.sort is the legacy List alias. Stream.sorted is lazy until terminal. All reference-type sorts use TimSort under the hood (stable). Primitives sort via dual-pivot quicksort (Arrays) — no Comparator.',
    remember: [
      'Mutate: Arrays.sort, Collections.sort, List.sort.',
      'New order: Stream.sorted → collect.',
      'Collections.sort(list) → list.sort since Java 8.',
      'Primitive arrays: no Comparator overload on Arrays.sort.',
    ],
    oneLiner: 'Arrays/Collections/List.sort mutate the backing store; Stream.sorted is lazy until you collect.',
  },
  {
    id: 'treeset',
    title: 'TreeSet — uniqueness by compare, not equals',
    what: 'TreeSet stores elements in red-black tree order. Two elements with compareTo/comparator result 0 are treated as duplicates — only one survives, even if equals() is false.',
    why: 'This is the #1 TreeSet interview trap. HashSet uses equals+hashCode; TreeSet uses ordering contract. Inconsistent compare vs equals causes silent data loss.',
    how: 'Natural order: element implements Comparable. Custom: TreeSet<>(Comparator). add() returns false when compare==0. Iteration is ascending sort order. contains() uses compare, not equals alone.',
    code: `import java.util.*;

public class TreeSetUniquenessDemo {
  // equals considers BOTH fields; compareTo only id
  static final class Employee implements Comparable<Employee> {
    final int id; final String dept;
    Employee(int id, String dept) { this.id = id; this.dept = dept; }
    @Override public int compareTo(Employee o) { return Integer.compare(id, o.id); }
    @Override public boolean equals(Object o) {
      return o instanceof Employee e && id == e.id && Objects.equals(dept, e.dept);
    }
    @Override public int hashCode() { return Objects.hash(id, dept); }
    @Override public String toString() { return id + ":" + dept; }
  }

  public static void main(String[] args) {
    Employee a = new Employee(1, "PAYMENTS");
    Employee b = new Employee(1, "FRAUD"); // same id, different dept

    // HashSet: equals false → both fit
    Set<Employee> hash = new HashSet<>();
    hash.add(a); hash.add(b);
    System.out.println("HashSet size=" + hash.size()); // 2

    // TreeSet: compareTo==0 on id → duplicate
    Set<Employee> tree = new TreeSet<>();
    tree.add(a); boolean added = tree.add(b);
    System.out.println("TreeSet size=" + tree.size() + " second add=" + added); // 1, false
    System.out.println("contains(b)=" + tree.contains(b)); // true — compare==0

    // Explicit comparator returning 0 for "same bucket"
    TreeSet<String> byLen = new TreeSet<>(Comparator.comparingInt(String::length));
    byLen.add("fee"); byLen.add("tax"); // both length 3
    System.out.println("by length: " + byLen); // one element
  }
}`,
    realWorld: 'Ranking desk: TreeSet of orders by (accountId, sequence). Two orders same account+seq compare equal — second silently dropped. Use composite key in compare or HashSet if equality semantics differ.',
    mistake: 'Implementing compareTo on one field while equals uses more fields. Using TreeSet when you need equals-based uniqueness.',
    trap: 'equals false but compareTo 0 → HashSet holds 2, TreeSet holds 1. Interviewers ask which and why.',
    interviewAnswer:
      'TreeSet uniqueness is compare==0 (Comparable or Comparator), not equals. If compareTo==0 but equals is false, TreeSet keeps one element; HashSet keeps both. Rule: align compareTo==0 with equals for sorted sets/maps.',
    remember: [
      'TreeSet duplicate ⇔ compare result 0.',
      'equals is NOT the primary uniqueness check.',
      'add() false means compare==0, not necessarily equals.',
      'Align compareTo==0 with equals to avoid surprises.',
    ],
    oneLiner: 'TreeSet drops duplicates when compare==0 — equals can be false and you still lose an element.',
  },
  {
    id: 'treemap',
    title: 'TreeMap — sorted keys, same compare==0 rule',
    what: 'TreeMap keeps keys sorted. put(k2, v2) when k2 compares equal to existing key k1 replaces the value — keys are not equals-tested for slot identity.',
    why: 'Same contract as TreeSet but for map keys. Wrong comparator on mutable or partial keys corrupts lookups.',
    how: 'NavigableMap API: firstKey, lastKey, floorKey, ceilingKey, subMap. null keys forbidden (natural order). Custom Comparator defines key equivalence.',
    code: `import java.util.*;

public class TreeMapKeyDemo {
  static final class OrderKey implements Comparable<OrderKey> {
    final String accountId; final long orderId;
    OrderKey(String a, long o) { accountId = a; orderId = o; }
    @Override public int compareTo(OrderKey o) {
      int c = accountId.compareTo(o.accountId);
      return c != 0 ? c : Long.compare(orderId, o.orderId);
    }
    @Override public boolean equals(Object o) {
      return o instanceof OrderKey k && accountId.equals(k.accountId) && orderId == k.orderId;
    }
    @Override public int hashCode() { return Objects.hash(accountId, orderId); }
  }

  public static void main(String[] args) {
    TreeMap<OrderKey, String> book = new TreeMap<>();
    OrderKey k1 = new OrderKey("ACC-1", 100L);
    OrderKey k2 = new OrderKey("ACC-1", 100L);
    book.put(k1, "BUY");
    book.put(k2, "SELL"); // compare==0 → replaces
    System.out.println("size=" + book.size() + " val=" + book.firstEntry().getValue()); // 1, SELL

    // Bad: compare only accountId
    TreeMap<OrderKey, String> bad = new TreeMap<>(
        Comparator.comparing(k -> k.accountId));
    bad.put(new OrderKey("ACC-1", 100L), "A");
    bad.put(new OrderKey("ACC-1", 200L), "B"); // same account → overwrites
    System.out.println("bad map size=" + bad.size()); // 1

    // Navigable views
    TreeMap<Integer, String> seq = new TreeMap<>(Map.of(10, "a", 20, "b", 30, "c"));
    System.out.println("floor 25=" + seq.floorKey(25)); // 20
    System.out.println("subMap=" + seq.subMap(15, true, 25, true));
  }
}`,
    realWorld: 'Order book by price level: TreeMap<BigDecimal, Queue<Order>>. Price keys must be consistent with equals. Limit order lookup by floorKey(price) for best bid.',
    mistake: 'Comparator that ignores part of the key fields while equals is stricter. Putting null key in natural-order TreeMap → NPE.',
    trap: 'Two distinct key objects, equals true, compare 0 — fine. equals false, compare 0 — second put wins, first key object may remain internally.',
    interviewAnswer:
      'TreeMap treats keys as equal when Comparator/Comparable returns 0. put replaces value. Unlike HashMap, bucket is ordering position. subMap/floorKey give range queries O(log n).',
    remember: [
      'Key equality in TreeMap = compare==0.',
      'put on compare-equal key replaces value.',
      'No null keys in natural-order TreeMap.',
      'NavigableMap for range/floor/ceiling.',
    ],
    oneLiner: 'TreeMap key slots are compare==0 slots — put replaces; equals is secondary.',
  },
  {
    id: 'priorityqueue',
    title: 'PriorityQueue — heap order, not iteration order',
    what: 'PriorityQueue is a binary heap: poll()/peek() return least element per ordering. Iterator/foreach traverse internal array — NOT sorted.',
    why: 'Candidates assume printing the queue shows priority order. Production bugs: logging queue contents during incident shows "random" order.',
    how: 'O(log n) insert/remove. Not thread-safe. Iterator is fail-fast. No null elements. Natural or Comparator order — same consistency rules as TreeSet for "duplicate" identity when comparator returns 0.',
    code: `import java.util.*;

public class PriorityQueueOrderDemo {
  public static void main(String[] args) {
    PriorityQueue<Integer> minHeap = new PriorityQueue<>();
    minHeap.addAll(List.of(30, 10, 20, 5));

    // WRONG mental model: iteration is NOT sorted
    System.out.print("iterator: ");
    for (int x : minHeap) System.out.print(x + " "); // e.g. 5 20 30 10 — heap layout
    System.out.println();

    // CORRECT: poll in priority order
    System.out.print("poll order: ");
  PriorityQueue<Integer> copy = new PriorityQueue<>(minHeap);
    while (!copy.isEmpty()) System.out.print(copy.poll() + " "); // 5 10 20 30
    System.out.println();

    // Max-heap via reversed comparator
    PriorityQueue<String> maxByLen = new PriorityQueue<>(
        Comparator.comparingInt(String::length).reversed());
    maxByLen.addAll(List.of("fee", "processing", "tax"));
    System.out.println("peek longest=" + maxByLen.peek()); // processing

    // Task scheduling
    record Task(int priority, String name) {}
    PriorityQueue<Task> tasks = new PriorityQueue<>(Comparator.comparingInt(Task::priority));
    tasks.add(new Task(3, "audit"));
    tasks.add(new Task(1, "settle"));
    System.out.println("next=" + tasks.poll().name()); // settle
  }
}`,
    realWorld: 'Payment retry queue: highest priority failures polled first. Metrics that scan the queue via iterator misreport "oldest" — use poll loop or separate audit list.',
    mistake: 'Iterating PriorityQueue expecting sorted output. Using PriorityQueue as a sorted collection. Sharing one instance across threads without synchronization.',
    trap: 'for (x : pq) does NOT drain in priority order — only poll() does.',
    interviewAnswer:
      'PriorityQueue is a heap: O(1) peek, O(log n) offer/poll. Iteration is undefined order (array heap layout). For sorted traversal, poll until empty or use TreeSet if you need in-order iteration.',
    remember: [
      'poll/peek = heap order.',
      'Iterator ≠ sorted order.',
      'Not thread-safe.',
      'Comparator 0 = duplicate identity (one stays).',
    ],
    oneLiner: 'PriorityQueue polls in order; iterating it is heap layout — not sorted.',
  },
  {
    id: 'streams',
    title: 'Stream.sorted — lazy, stable, collector required',
    what: 'Stream.sorted() and sorted(Comparator) are intermediate ops producing encounter-order-stable sorted stream (for ordered sources).',
    why: 'Functional pipelines replace mutating sort for read-only reporting. Must understand lazy evaluation and that parallel streams still use merge sort with stability guarantees where applicable.',
    how: 'sorted() uses natural order (elements Comparable). sorted(comparator) for custom. Distinct/sorted order: distinct() before or after sorted depends on dedup key. Use Comparator explicitly for null-hostile natural order types.',
    code: `import java.util.*;
import java.util.stream.*;

public class StreamSortedDemo {
  record Payment(String id, long amount, int attempt) implements Comparable<Payment> {
    @Override public int compareTo(Payment o) {
      return Long.compare(amount, o.amount);
    }
  }

  public static void main(String[] args) {
    List<Payment> ledger = List.of(
        new Payment("p3", 500, 1),
        new Payment("p1", 100, 2),
        new Payment("p2", 100, 1));

    // Natural order by amount (then undefined tie — use thenComparing in real code)
    List<Payment> byAmount = ledger.stream()
        .sorted()
        .collect(Collectors.toList());

    // Explicit multi-key
    List<Payment> stable = ledger.stream()
        .sorted(Comparator.comparingLong(Payment::amount)
            .thenComparingInt(Payment::attempt))
        .collect(Collectors.toList());
    System.out.println(stable); // p2 then p1 (amount 100, attempt 1 before 2)

    // Descending top-N without full sort of huge list — still O(n log n) unless limit optimization
    List<String> symbols = List.of("MSFT", "AAPL", "GOOG", "AMZN");
    List<String> top = symbols.stream()
        .sorted(Comparator.reverseOrder())
        .limit(2)
        .collect(Collectors.toList());
    System.out.println("top desc: " + top);

    // sorted distinct strings case-insensitive
    List<String> tags = Stream.of("Beta", "alpha", "Alpha", "gamma")
        .sorted(String.CASE_INSENSITIVE_ORDER)
        .distinct() // distinct AFTER sort groups case variants adjacently only if compare says equal
        .collect(Collectors.toList());
    System.out.println(tags);
  }
}`,
    realWorld: 'REST export: transactions.stream().sorted(byDate).map(toDto). Collectors.toList() without touching JPA entity list order in persistence context.',
    mistake: 'sorted() on stream of non-Comparable types. Expecting parallel stream sorted to match sequential tie order without caring about stability.',
    trap: 'sorted() without terminal op does nothing — lazy until collect.',
    interviewAnswer:
      'Stream.sorted is intermediate and lazy; materialize with collect. Uses TimSort for object arrays internally when collected to list. Provide Comparator for non-Comparable or multi-field. Original list unchanged.',
    remember: [
      'Lazy until terminal operation.',
      'Does not mutate source list.',
      'sorted(Comparator) for multi-field.',
      'Stable for ordered streams.',
    ],
    oneLiner: 'Stream.sorted is lazy — collect to list; source collection stays untouched.',
  },
  {
    id: 'stable',
    title: 'Stable sorting · TimSort interview depth',
    what: 'A sort is stable if equal elements (compare==0) keep their relative input order. Java uses TimSort for object arrays and List.sort since Java 7.',
    why: 'Multi-pass sorts (sort by salary, then by dept) rely on stability. Staff interviews ask algorithm, complexity, and when instability breaks secondary keys.',
    how: 'TimSort: merge sort + galloping + natural run detection. Best O(n) on already sorted data, worst/average O(n log n), extra O(n) space. Arrays.sort(primitives) uses dual-pivot quicksort — NOT stable.',
    code: `import java.util.*;

public class StableSortDemo {
  static class Row {
    final String dept; final String name; final int salary;
    Row(String d, String n, int s) { dept = d; name = n; salary = s; }
    @Override public String toString() { return dept + "/" + name + "=" + salary; }
  }

  public static void main(String[] args) {
    List<Row> staff = new ArrayList<>(List.of(
        new Row("ENG", "Ada", 120),
        new Row("ENG", "Bob", 120),
        new Row("PAY", "Cara", 120)));

    // Stable TimSort: sort by salary, then by name — preserves Ada before Bob for equal salary
    staff.sort(Comparator.comparingInt((Row r) -> r.salary).thenComparing(r -> r.name));
    System.out.println("salary then name: " + staff);

    // Two-pass stable trick (works because List.sort is stable)
    List<Row> staff2 = new ArrayList<>(List.of(
        new Row("ENG", "Ada", 120),
        new Row("ENG", "Bob", 120),
        new Row("PAY", "Cara", 120)));
    staff2.sort(Comparator.comparing(r -> r.name));   // pass 1
    staff2.sort(Comparator.comparing(r -> r.dept));   // pass 2 — stable → dept groups, name order within
    System.out.println("dept then name (two-pass): " + staff2);

    // Primitive sort NOT stable
    int[] ids = {1, 2, 1, 3};
    Integer[] boxed = {1, 2, 1, 3};
    Arrays.sort(ids); // quicksort — stability N/A for primitives without ties semantics
    Arrays.sort(boxed);
    System.out.println("boxed: " + Arrays.toString(boxed));
  }
}`,
    realWorld: 'Paginated admin UI: sort by status then createdAt. Stability keeps createdAt order within same status without compound comparator (though compound is clearer).',
    mistake: 'Assuming Arrays.sort(int[]) is stable. Relying on stability from parallel stream without verification. Using unstable sort then wondering why tie order shuffled.',
    trap: 'Object List.sort = stable TimSort; primitive Arrays.sort = unstable quicksort.',
    interviewAnswer:
      'Java TimSort is stable O(n log n) with O(n) aux space; exploits existing runs. List.sort/Arrays.sort(object[]) use it. Primitive Arrays.sort is dual-pivot quicksort, not stable — irrelevant for primitives without identity. Multi-key: thenComparing or stable successive sorts.',
    remember: [
      'TimSort: stable, O(n log n), O(n) space.',
      'List.sort / Arrays.sort(object[]) = TimSort.',
      'Primitive Arrays.sort: quicksort, not stable.',
      'Equal keys keep input order (stable sorts).',
    ],
    oneLiner: 'TimSort is stable — equal elements keep their original relative order; primitive quicksort is not.',
  },
  {
    id: 'strings',
    title: 'Sorting strings · CASE_INSENSITIVE_ORDER · locale caveats',
    what: 'String sorts lexicographically by UTF-16 code units unless you use Comparator like CASE_INSENSITIVE_ORDER or a Collator for locale-aware ordering.',
    why: 'Username search and file lists break when case or locale rules ignored. Turkish I/i, German ß, and numeric "file10" vs "file2" trip production and interviews.',
    how: 'String.CASE_INSENSITIVE_ORDER compares case-insensitively but is English-centric (Unicode case mapping). For locale: Collator.getInstance(locale). For numeric chunks: Comparator.naturalOrder() on strings fails — use custom or libraries.',
    code: `import java.text.Collator;
import java.util.*;

public class StringSortDemo {
  public static void main(String[] args) {
    List<String> codes = new ArrayList<>(List.of("beta", "Alpha", "alpha", "Gamma"));
    codes.sort(String.CASE_INSENSITIVE_ORDER);
    System.out.println("case insensitive: " + codes);

    // Lexicographic default — uppercase before lowercase (Unicode)
    List<String> lex = new ArrayList<>(List.of("a", "A", "b", "B"));
    lex.sort(Comparator.naturalOrder());
    System.out.println("natural: " + lex); // A, B, a, b

    // Locale-sensitive (Turkish I problem in interview stories)
    Collator tr = Collator.getInstance(new Locale("tr", "TR"));
    List<String> turkish = new ArrayList<>(List.of("ı", "I", "i", "İ"));
    turkish.sort(tr);
    System.out.println("Turkish collator: " + turkish);

    // Numeric-aware (simple pad trick — production may use AlphanumericComparator)
    List<String> files = new ArrayList<>(List.of("file10", "file2", "file1"));
    files.sort(Comparator.comparingInt(s -> Integer.parseInt(s.replace("file", ""))));
    System.out.println("numeric: " + files);

    // TreeSet case-insensitive uniqueness
    TreeSet<String> set = new TreeSet<>(String.CASE_INSENSITIVE_ORDER);
    set.add("API"); set.add("api");
    System.out.println("tree set size=" + set.size()); // 1
  }
}`,
    realWorld: 'Instrument symbol lists: CASE_INSENSITIVE_ORDER for US tickers. Client-facing sorted dropdowns in EU: Collator with user locale. Never rely on default lex order for human names.',
    mistake: 'toLowerCase() without Locale.ROOT before compare. Using CASE_INSENSITIVE_ORDER for Turkish customer names. Expecting "file2" < "file10" lexicographically.',
    trap: 'CASE_INSENSITIVE_ORDER is not locale-aware — Turkish locale needs Collator.',
    interviewAnswer:
      'Default String order is lexicographic Unicode. CASE_INSENSITIVE_ORDER for ASCII-ish case fold. Real i18n: Collator + strength. TreeSet with case-insensitive comparator treats "A" and "a" as one key.',
    remember: [
      'Natural order: Unicode code point order.',
      'CASE_INSENSITIVE_ORDER ≠ locale rules.',
      'Use Collator for human names.',
      'Numeric strings need special comparator.',
    ],
    oneLiner: 'CASE_INSENSITIVE_ORDER is English-biased — use Collator for real locale sorting.',
  },
  {
    id: 'dates',
    title: 'Sorting dates · LocalDate · Instant · ZonedDateTime',
    what: 'java.time types are Comparable in chronological order: LocalDate, LocalDateTime, Instant, OffsetDateTime, ZonedDateTime.',
    why: 'Ledger timelines, SLA windows, and session expiry lists depend on correct temporal ordering. Mixing legacy Date or comparing LocalDateTime across zones breaks ordering.',
    how: 'Prefer Instant for machine timelines (UTC). LocalDate for calendar dates without time. ZonedDateTime when zone matters. Never sort LocalDateTime from different zones without normalizing to Instant.',
    code: `import java.time.*;
import java.util.*;

public class DateSortDemo {
  public static void main(String[] args) {
    List<LocalDate> settlements = new ArrayList<>(List.of(
        LocalDate.of(2026, 3, 15),
        LocalDate.of(2026, 1, 2),
        LocalDate.of(2026, 12, 31)));
    settlements.sort(Comparator.naturalOrder());
    System.out.println("LocalDate: " + settlements);

    List<Instant> events = new ArrayList<>(List.of(
        Instant.parse("2026-01-01T10:00:00Z"),
        Instant.parse("2026-01-01T09:59:59Z")));
    events.sort(Comparator.reverseOrder());
    System.out.println("Instant desc: " + events);

    // ZonedDateTime — comparable within same instant timeline
    ZonedDateTime ny = ZonedDateTime.of(2026, 6, 1, 9, 0, 0, 0, ZoneId.of("America/New_York"));
    ZonedDateTime lon = ZonedDateTime.of(2026, 6, 1, 14, 0, 0, 0, ZoneId.of("Europe/London"));
    List<ZonedDateTime> z = new ArrayList<>(List.of(ny, lon));
    z.sort(Comparator.naturalOrder()); // compares instant timeline
    System.out.println("Zoned: " + z);

    // Legacy interop — convert then sort
    List<Date> legacy = new ArrayList<>();
    legacy.add(Date.from(Instant.parse("2026-01-02T00:00:00Z")));
    legacy.add(Date.from(Instant.parse("2026-01-01T00:00:00Z")));
    legacy.sort(Comparator.comparing(Date::toInstant));
    System.out.println("legacy Date via Instant: " + legacy);

    // TreeMap keyed by LocalDate — natural chronological nav
    NavigableMap<LocalDate, String> batch = new TreeMap<>();
    batch.put(LocalDate.of(2026, 1, 10), "batch-A");
    batch.put(LocalDate.of(2026, 1, 5), "batch-B");
    System.out.println("first batch day: " + batch.firstKey());
  }
}`,
    realWorld: 'End-of-day settlement batches keyed by LocalDate in TreeMap. Trade capture uses Instant ordering for matching engine replay. Display sorts ZonedDateTime in user zone after converting.',
    mistake: 'Sorting LocalDateTime from multiple zones without normalizing. Using Date.compareTo without migrating to java.time. Null dates in sort — use nullsLast comparator.',
    trap: 'LocalDateTime is NOT comparable across DST gaps the way Instant is — normalize first.',
    interviewAnswer:
      'java.time classes implement Comparable chronologically. Sort Instants for global events. LocalDate for business dates. Use Comparator.nullsLast for nullable effective dates. TreeMap<LocalDate,?> gives date-range reports via subMap.',
    remember: [
      'Instant for UTC timelines.',
      'LocalDate for calendar-only.',
      'Normalize zones before compare.',
      'nullsFirst/Last on optional dates.',
    ],
    oneLiner: 'Sort Instants for global time; LocalDate for business dates — never mix zones in LocalDateTime compare.',
  },
  {
    id: 'domain',
    title: 'Domain sorting — Employee · Product · Order · Student · Customer',
    what: 'Real entities need multi-field Comparators: tie-breakers, null-safe fields, and business rules (VIP first, status ordinal).',
    why: 'Interviewers want concrete finance/retail examples, not abstract "Item". Shows you can compose Comparator chains and keep equals alignment.',
    how: 'Comparator.comparing / thenComparing / thenComparingInt. Extract method references. For enums: Comparator.comparing(Enum::ordinal) or custom priority map. Records: explicit Comparator, not Comparable unless single natural key.',
    code: `import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Instant;
import java.util.*;
import java.util.stream.*;

public class DomainSortDemo {
  enum OrderStatus { PENDING, AUTHORIZED, SETTLED, FAILED }

  record Employee(String dept, String name, int level, LocalDate hireDate) {}
  record Product(String sku, String category, BigDecimal price) {}
  record Order(String customerId, long orderId, OrderStatus status, Instant created) {}
  record Student(String section, String name, double gpa) {}
  record Customer(boolean vip, String tier, String name, long lifetimeValue) {}

  static final Comparator<Employee> BY_DEPT_NAME = Comparator
      .comparing(Employee::dept)
      .thenComparing(Employee::name);
  static final Comparator<Order> BY_STATUS_THEN_TIME = Comparator
      .comparing((Order o) -> o.status().ordinal())
      .thenComparing(Order::created);
  static final Comparator<Customer> BY_VIP_VALUE = Comparator
      .comparing(Customer::vip).reversed()
      .thenComparingLong(Customer::lifetimeValue).reversed()
      .thenComparing(Customer::name);

  public static void main(String[] args) {
    var employees = List.of(
        new Employee("PAY", "Zoe", 3, LocalDate.of(2020, 1, 1)),
        new Employee("ENG", "Amy", 2, LocalDate.of(2019, 6, 1)),
        new Employee("PAY", "Ben", 2, LocalDate.of(2021, 3, 1)));
    System.out.println(employees.stream().sorted(BY_DEPT_NAME).collect(Collectors.toList()));

    var products = List.of(
        new Product("SKU-2", "FEE", new BigDecimal("9.99")),
        new Product("SKU-1", "FEE", new BigDecimal("1.00")));
    products.stream()
        .sorted(Comparator.comparing(Product::category).thenComparing(Product::price))
        .forEach(System.out::println);

    var orders = List.of(
        new Order("C1", 2, OrderStatus.PENDING, Instant.parse("2026-01-02T00:00:00Z")),
        new Order("C1", 1, OrderStatus.PENDING, Instant.parse("2026-01-01T00:00:00Z")));
    System.out.println(orders.stream().sorted(BY_STATUS_THEN_TIME).toList());

    var students = List.of(
        new Student("A", "Pat", 3.5),
        new Student("A", "Quinn", 3.9));
    students.sort(Comparator.comparing(Student::section).thenComparing(Student::gpa).reversed());
    System.out.println(students);

    var customers = List.of(
        new Customer(false, "GOLD", "X", 1000),
        new Customer(true, "SILVER", "Y", 100));
    System.out.println(customers.stream().sorted(BY_VIP_VALUE).toList());
  }
}`,
    realWorld: 'Operations dashboard: orders by status then createdAt. CRM: VIP customers first by lifetime value. Catalog: category then price ascending for price comparison compliance.',
    mistake: 'Single-field compare when business needs tie-breaker. Subtracting ints for id difference. Forgetting null department on Employee.',
    trap: 'Sorting by status enum ordinal assumes enum declaration order matches business priority.',
    interviewAnswer:
      'Compose Comparator chains: comparing dept then name, status then createdAt, VIP desc then LTV. Use method references. Align compare==0 with business identity (orderId). Records need explicit Comparator unless one natural key.',
    remember: [
      'Multi-field: thenComparing chain.',
      'Enum ordinal only if order matches business.',
      'VIP/business flags before alphabetical.',
      'BigDecimal price: natural Comparable scale-safe.',
    ],
    oneLiner: 'Chain thenComparing for dept→name, status→time, VIP→value — one field is rarely enough.',
  },
  {
    id: 'inheritance',
    title: 'Inheritance · Liskov · compareTo pitfalls',
    what: 'Comparable across inheritance hierarchies is fragile: symmetry, transitivity, and equals consistency break when subclasses change comparison fields.',
    why: 'Joshua Bloch: inheritance + Comparable = broken contracts. Staff interviews probe whether you enforce compareTo only on leaf types or use composition.',
    how: 'Prefer final classes or Comparator external to hierarchy. If subclass extends compareTo, must not violate transitivity with superclass instances. Symmetric: sg.compareTo(g) vs g.compareTo(sg) must agree sign.',
    code: `import java.util.*;

public class InheritanceCompareDemo {
  static class Instrument implements Comparable<Instrument> {
    final String symbol;
    Instrument(String s) { symbol = s; }
    @Override public int compareTo(Instrument o) { return symbol.compareTo(o.symbol); }
  }

  // Anti-pattern: subclass changes equality semantics
  static class Equity extends Instrument {
    final String exchange;
    Equity(String s, String ex) { super(s); exchange = ex; }
    @Override public int compareTo(Instrument o) {
      if (o instanceof Equity e) {
        int c = symbol.compareTo(e.symbol);
        return c != 0 ? c : exchange.compareTo(e.exchange);
      }
      return symbol.compareTo(o.symbol); // ignores exchange vs plain Instrument
    }
  }

  public static void main(String[] args) {
    Instrument g = new Instrument("AAPL");
    Equity sg = new Equity("AAPL", "NASDAQ");
    Equity sg2 = new Equity("AAPL", "LSE");

    System.out.println("g vs sg: " + g.compareTo(sg));   // 0 — symbol only on g side
    System.out.println("sg vs sg2: " + sg.compareTo(sg2)); // non-zero — exchanges differ
  // Transitivity traps appear with richer hierarchies — reason to avoid Comparable on base

    // Liskov-safe approach: external Comparator per view
    List<Equity> list = new ArrayList<>(List.of(
        new Equity("MSFT", "NASDAQ"),
        new Equity("AAPL", "NASDAQ")));
    list.sort(Comparator.comparing((Equity e) -> e.symbol)
        .thenComparing(e -> e.exchange));
    System.out.println(list);

    // Final leaf type implements Comparable — OK
    final class Bond implements Comparable<Bond> {
      final String isin;
      Bond(String i) { isin = i; }
      @Override public int compareTo(Bond o) { return isin.compareTo(o.isin); }
    }
    TreeSet<Bond> bonds = new TreeSet<>(List.of(new Bond("US0001"), new Bond("US0002")));
    System.out.println(bonds.first());
  }
}`,
    realWorld: 'PaymentInstrument base with Card/ACH subclasses — do NOT put compareTo on base; use Comparator.comparing(TransactionView::sortKey) in each reporting module.',
    mistake: 'Subclass compareTo that treats superclass instances as equal on partial fields. Non-final Comparable base class open for breakage.',
    trap: 'sg.compareTo(g)==0 but g.compareTo(sg) may differ if not symmetric — contract violation.',
    interviewAnswer:
      'Avoid Comparable on extensible classes. Subclass compareTo breaks transitivity/symmetry with mixed types. Liskov: use composition, final leaf Comparable, or external Comparator strategies per use case.',
    remember: [
      'No Comparable on non-final base.',
      'Subclass + superclass mix breaks transitivity.',
      'External Comparator per sort view.',
      'Final leaf types OK for natural order.',
    ],
    oneLiner: 'Do not put compareTo on an extensible base — use external Comparators per sort view.',
  },
  {
    id: 'generics',
    title: 'Generics · Comparator<? super T> · PECS',
    what: 'Comparator is contravariant on its type parameter: Comparator<? super T> accepts comparators for supertypes of T (PECS: Producer extends, Consumer super).',
    why: 'APIs like Collections.sort(List<T>, Comparator<? super T>) let you sort List<Employee> with Comparator<Person> or Comparator<Object>. Interview tests variance literacy.',
    how: '? super T means comparator can compare T and any superclass fields. ? extends T is for producers. TreeSet<E>(Comparator<? super E>). Method: <T> void sort(List<T> list, Comparator<? super T> c).',
    code: `import java.util.*;

public class GenericsPecsDemo {
  static class Person { final String name; Person(String n) { name = n; } }
  static class Employee extends Person {
    final int id;
    Employee(String n, int id) { super(n); this.id = id; }
  }

  static final Comparator<Person> BY_NAME = Comparator.comparing(p -> p.name);
  static final Comparator<Employee> BY_ID = Comparator.comparingInt(e -> e.id);

  static <T> void sortPeople(List<T> list, Comparator<? super T> cmp) {
    list.sort(cmp);
  }

  public static void main(String[] args) {
    List<Employee> team = new ArrayList<>(List.of(
        new Employee("Cara", 2),
        new Employee("Ada", 1)));

    // Comparator<Person> is Comparator<? super Employee> — legal
    sortPeople(team, BY_NAME);
    System.out.println("by name: " + team.stream().map(e -> e.name).toList());

    sortPeople(team, BY_ID);
    System.out.println("by id: " + team.stream().map(e -> e.id).toList());

    // TreeSet<? super Employee> accepts Comparator<Person>
    NavigableSet<Employee> set = new TreeSet<>(BY_NAME);
    set.add(new Employee("Bob", 3));
    set.add(new Employee("Ada", 1));
    System.out.println("tree: " + set);

    // PECS mnemonic in method bounds
    dumpSorted(team, BY_NAME); // consumer of Employee, comparator super Employee
  }

  static <T> void dumpSorted(List<T> items, Comparator<? super T> order) {
    items.stream().sorted(order).forEach(System.out::println);
  }
}`,
    realWorld: 'Generic repository method sort(List<? extends AuditableEntity>, Comparator<? super AuditableEntity> byCreated) shared across Invoice, Payment entities.',
    mistake: 'Using Comparator<Employee> parameter type on generic sort method — cannot pass Comparator<Person>. Confusing ? extends vs ? super on Comparator.',
    trap: 'Comparator<? extends Employee> is NOT useful for sorting List<Employee> — need ? super Employee.',
    interviewAnswer:
      'Comparator is contravariant: Comparator<? super T> for sorting List<T>. Lets wider comparator (on parent type) apply to narrower list elements. PECS: sort is a consumer of T, so Comparator<? super T>.',
    remember: [
      'Sort consumer → Comparator<? super T>.',
      'Comparator<Person> sorts List<Employee>.',
      '? extends on Comparator is wrong for sort input.',
      'TreeSet ctor takes Comparator<? super E>.',
    ],
    oneLiner: 'Sorting is consumption — Comparator<? super T> lets a Person comparator sort Employees.',
  },
  {
    id: 'eqhc',
    title: 'equals · hashCode · compareTo — master comparison',
    what: 'Three contracts: equals/hashCode for hash-based collections; compareTo/Comparator for ordered collections. Ideal: compare==0 iff equals true.',
    why: 'The unified interview matrix: HashMap vs TreeMap behavior on same keys. Broken alignment causes duplicates in one structure, loss in another.',
    how: 'equals: reflexive, symmetric, transitive, consistent, non-null. hashCode: equal objects → equal hash. compareTo: antisymmetric, transitive, consistent with equals. Records generate equals/hashCode; still need Comparator for TreeMap.',
    code: `import java.util.*;

public class EqHcCompareDemo {
  static final class AccountKey implements Comparable<AccountKey> {
    final String iban; final String ccy;
    AccountKey(String iban, String ccy) { this.iban = iban; this.ccy = ccy; }
    @Override public int compareTo(AccountKey o) {
      int c = iban.compareTo(o.iban);
      return c != 0 ? c : ccy.compareTo(o.ccy);
    }
    @Override public boolean equals(Object o) {
      return o instanceof AccountKey k && iban.equals(k.iban) && ccy.equals(k.ccy);
    }
    @Override public int hashCode() { return Objects.hash(iban, ccy); }
  }

  // Broken: compare only IBAN
  static final class BadAccountKey implements Comparable<BadAccountKey> {
    final String iban; final String ccy;
    BadAccountKey(String i, String c) { iban = i; ccy = c; }
    @Override public int compareTo(BadAccountKey o) { return iban.compareTo(o.iban); }
    @Override public boolean equals(Object o) {
      return o instanceof BadAccountKey k && iban.equals(k.iban) && ccy.equals(k.ccy);
    }
    @Override public int hashCode() { return Objects.hash(iban, ccy); }
  }

  public static void main(String[] args) {
    AccountKey good = new AccountKey("DE89", "EUR");
    AccountKey good2 = new AccountKey("DE89", "EUR");
    System.out.println("aligned: compare=" + good.compareTo(good2) + " equals=" + good.equals(good2));

    BadAccountKey a = new BadAccountKey("DE89", "EUR");
    BadAccountKey b = new BadAccountKey("DE89", "USD");
    System.out.println("misaligned equals=" + a.equals(b) + " compare=" + a.compareTo(b));

    Map<BadAccountKey, String> hash = new HashMap<>();
    hash.put(a, "1"); hash.put(b, "2");
    System.out.println("HashMap size=" + hash.size()); // 2

    Map<BadAccountKey, String> tree = new TreeMap<>();
    tree.put(a, "1"); tree.put(b, "2");
    System.out.println("TreeMap size=" + tree.size()); // 1

    // Identity vs equality
    String s1 = new String("X");
    String s2 = new String("X");
    System.out.println("String equals=" + s1.equals(s2) + " compare=" + s1.compareTo(s2) + " ==" + (s1 == s2));
  }
}`,
    realWorld: 'Account composite key (iban, currency) must align all three for cache HashMap and sorted statement TreeMap. Migration audits grep for compareTo ignoring fields used in equals.',
    mistake: 'Implementing equals/hashCode but compareTo on subset of fields. Using == on Strings. Relying on default Object.equals in TreeSet with custom Comparator returning 0 for unequal objects.',
    trap: 'equals false + compareTo 0 → HashMap size 2, TreeMap size 1.',
    interviewAnswer:
      'Hash structures: equals + hashCode. Sorted: Comparable/Comparator. Strong recommendation: a.compareTo(b)==0 iff a.equals(b). If diverge, HashSet and TreeSet disagree on cardinality. Records: equals/hashCode yes; Comparable no unless you add it.',
    remember: [
      'compare==0 should match equals.',
      'HashMap/HashSet → equals/hashCode.',
      'TreeMap/TreeSet → compare.',
      'Misalignment = silent data loss in trees.',
    ],
    oneLiner: 'compare==0 should mean equals — or HashMap and TreeMap disagree on how many keys you have.',
  },
  {
    id: 'bigdecimal',
    title: 'BigDecimal — equals vs compareTo · HashSet vs TreeSet',
    what: 'BigDecimal.compareTo ignores scale; equals considers scale. new BigDecimal("1.0") and "1.00" are unequal but compareTo 0.',
    why: 'Money amounts in TreeSet vs HashSet behave differently. Financial code using BigDecimal as HashMap key with string constructor variants creates duplicate buckets.',
    how: 'Sorting/monetary comparison: compareTo. Object identity in hash sets: normalize scale (stripTrailingZeros) or use equals-aware key type. TreeSet uses compareTo — treats 1.0 and 1.00 as duplicate.',
    code: `import java.math.BigDecimal;
import java.util.*;

public class BigDecimalTrapDemo {
  public static void main(String[] args) {
    BigDecimal a = new BigDecimal("1.0");
    BigDecimal b = new BigDecimal("1.00");

    System.out.println("equals=" + a.equals(b));       // false — scale differs
    System.out.println("compareTo=" + a.compareTo(b)); // 0 — same numeric value

    Set<BigDecimal> hash = new HashSet<>();
    hash.add(a); hash.add(b);
    System.out.println("HashSet size=" + hash.size()); // 2

    Set<BigDecimal> tree = new TreeSet<>();
    tree.add(a); tree.add(b);
    System.out.println("TreeSet size=" + tree.size()); // 1

    // Normalized key for hash collections
    record MoneyKey(BigDecimal normalized) {
      MoneyKey(BigDecimal raw) {
        normalized = raw.stripTrailingZeros();
      }
    }
    Set<MoneyKey> normalized = new HashSet<>();
    normalized.add(new MoneyKey(a));
    normalized.add(new MoneyKey(b));
    System.out.println("normalized keys=" + normalized.size()); // 1 if same numeric

    // Sort ledger lines by amount
    List<BigDecimal> amounts = new ArrayList<>(List.of(
        new BigDecimal("10.01"), new BigDecimal("9.99"), new BigDecimal("10.0")));
    amounts.sort(Comparator.naturalOrder());
    System.out.println(amounts);
  }
}`,
    realWorld: 'FX rate table TreeSet keyed by rate — compareTo dedupes numerically equal rates. Hash cache keyed by amount must stripTrailingZeros or use long cents.',
    mistake: 'Using BigDecimal.equals in business dedup. Expecting HashSet to collapse 1.0 and 1.00. Using double constructor for money.',
    trap: 'equals false, compareTo 0 — classic BigDecimal HashSet vs TreeSet interview question.',
    interviewAnswer:
      'BigDecimal: compareTo for numeric order (scale-blind); equals includes scale. TreeSet dedupes on compareTo; HashSet on equals — 1.0 and 1.00 coexist in HashSet, one slot in TreeSet. Normalize for hash keys.',
    remember: [
      'compareTo ignores scale.',
      'equals includes scale.',
      'TreeSet: one numeric value.',
      'HashSet: scale-distinct instances.',
    ],
    oneLiner: 'BigDecimal: compareTo says equal, equals says different — TreeSet merges, HashSet keeps both.',
  },
  {
    id: 'cmp-contract',
    title: 'Comparator contract violation · general contract',
    what: 'Comparator must be antisymmetric, transitive, and consistent with equals when used with sorted collections. Violations yield IllegalArgumentException: "Comparison method violates its general contract".',
    why: 'TimSort detects inconsistent compare during merge — not all bad comparators fail at compile time. Classic bug: subtract ints, or compare mod 2.',
    how: 'Rules: if cmp(a,b)>0 then cmp(b,a)<0; if cmp(a,b)==0 then cmp(b,a)==0; if a>b and b>c then a>c. Use Integer.compare, not subtraction. Don\'t use partial logic like (a.value % 2) - (b.value % 2) unless truly equivalence classes.',
    code: `import java.util.*;

public class ComparatorContractDemo {
  // BROKEN: subtraction overflow
  static final Comparator<Integer> SUBTRACT = (a, b) -> a - b;

  // BROKEN: non-transitive "fun" comparator
  static final Comparator<Integer> MOD2 = (a, b) -> (a % 2) - (b % 2);

  static final Comparator<Integer> SAFE = Integer::compare;

  public static void main(String[] args) {
    List<Integer> data = new ArrayList<>();
    for (int i = 0; i < 20; i++) data.add(i);

    try {
      data.sort(SUBTRACT); // may work on small ints
      System.out.println("subtract sort ok on small");
    } catch (IllegalArgumentException e) {
      System.out.println("subtract failed: " + e.getMessage());
    }

    List<Integer> overflow = new ArrayList<>(List.of(
        Integer.MAX_VALUE, -1, 0, 1));
    try {
      overflow.sort(SUBTRACT);
    } catch (IllegalArgumentException e) {
      System.out.println("overflow trap: " + e.getMessage());
    }

    try {
      List<Integer> bad = new ArrayList<>(List.of(1, 2, 3, 4, 5, 6));
      bad.sort(MOD2); // TimSort may throw
    } catch (IllegalArgumentException e) {
      System.out.println("mod2 contract violation: " + e.getMessage());
    }

    List<Integer> ok = new ArrayList<>(List.of(3, 1, 4, 1, 5));
    ok.sort(SAFE);
    System.out.println("safe: " + ok);
  }
}`,
    realWorld: 'Custom tie-break comparator that returns random ±1 for "equal" teams — rare TimSort crash in CI on large datasets. Payment priority comparator must be transitive across partial statuses.',
    mistake: 'return a.id - b.id with near MAX_VALUE ids. Comparator that returns non-zero for reflexive compare(a,a). Inconsistent with equals when contract demands consistency.',
    trap: '"Comparison method violates its general contract" = TimSort caught non-transitive/antisymmetric compare.',
    interviewAnswer:
      'Comparator must be transitive and antisymmetric. Subtraction overflows → contract violation at sort time. Never (a-b) for int/long. Use Integer.compare. Broken comparators throw IllegalArgumentException during TimSort merges.',
    remember: [
      'Never return a - b for int/long.',
      'compare(a,a) must be 0.',
      'Transitivity: a>b, b>c ⇒ a>c.',
      'TimSort throws on violation.',
    ],
    oneLiner: 'IllegalArgumentException during sort means your Comparator broke transitivity — usually subtraction overflow.',
  },
  {
    id: 'float',
    title: 'Float · Double · NaN · overflow traps in compare',
    what: 'Floating-point compare has NaN rules; floatToIntBits ordering in Float.compare. Never subtract doubles for Comparator. Mixed with integers causes subtle ordering bugs.',
    why: 'Risk metrics, rates, and scientific data use doubles. NaN breaks total order if you roll your own compare. BigDecimal preferred for money but float traps still appear in interviews.',
    how: 'Double.compare(a,b), Float.compare. Float.compare handles NaN (NaN greater). For money use BigDecimal. Beware -0.0 vs +0.0 (compare treats as equal).',
    code: `import java.util.*;

public class FloatCompareDemo {
  public static void main(String[] args) {
    List<Double> rates = new ArrayList<>(List.of(0.1 + 0.2, 0.3, Double.NaN, 1.0));
    rates.sort(Double::compare); // NaN last in Double.compare ordering
    System.out.println(rates);

    // WRONG
    Comparator<Double> bad = (a, b) -> (int) (a - b); // truncates, NaN broken
    List<Double> small = new ArrayList<>(List.of(1.9, 1.1, 1.5));
    small.sort(bad);
    System.out.println("bad double subtract: " + small); // wrong order

    // CORRECT
    small.sort(Double::compare);
    System.out.println("Double.compare: " + small);

    System.out.println("NaN compare: " + Double.compare(Double.NaN, 1.0));
    System.out.println("-0 vs +0: " + Double.compare(-0.0, 0.0)); // 0

    // Float key in TreeMap
    TreeMap<Float, String> map = new TreeMap<>();
    map.put(1.0f, "a");
    map.put(Float.NaN, "nan"); // NaN allowed in Float.compare total order
    System.out.println(map.lastKey());
  }
}`,
    realWorld: 'Market data feed gaps: missing rate as NaN — Double.compare sorts NaN consistently. Do not cast double difference to int for price ladders.',
    mistake: 'a.compareTo(b) on nullable Double without nullsFirst. (int)(a-b) comparator. Using == for double equality.',
    trap: 'Double.NaN: natural ordering puts NaN high; custom bad comparator can throw or loop.',
    interviewAnswer:
      'Always Double.compare/Float.compare — handles NaN and -0. Never subtract floats/doubles. Money: BigDecimal. TimSort + bad double cast comparator → wrong order without throwing.',
    remember: [
      'Double.compare / Float.compare only.',
      'Never cast (a-b) to int.',
      'NaN has defined compare order.',
      'Money → BigDecimal not double.',
    ],
    oneLiner: 'Never subtract doubles for compare — Double.compare handles NaN and -0.0 correctly.',
  },
  {
    id: 'optional',
    title: 'Optional · null fields in Comparator chains',
    what: 'Nullable sort keys (middle name, optional discount, nullable effective date) require nullsFirst/nullsLast or explicit null checks in Comparator composition.',
    why: 'NPE during sort takes down batch jobs. nullsFirst is not default — natural order on Comparable with null throws NPE.',
    how: 'Comparator.nullsFirst(Comparator.naturalOrder()), nullsLast. Comparing with mapping: Comparator.comparing(Entity::getMiddle, Comparator.nullsLast(String::compareTo)). Optional fields: sort empty last via mapping o -> o.orElse(null) then nullsLast.',
    code: `import java.util.*;
import java.util.Optional.*;

public class OptionalNullSortDemo {
  record Customer(String name, Optional<String> middle, Optional<Integer> discountPct) {}

  static final Comparator<Customer> BY_NAME = Comparator.comparing(Customer::name);

  static final Comparator<Customer> BY_MIDDLE_NULLS_LAST = Comparator.comparing(
      c -> c.middle().orElse(null),
      Comparator.nullsLast(String::compareToIgnoreCase));

  static final Comparator<Customer> BY_DISCOUNT = Comparator.comparing(
      c -> c.discountPct().orElse(Integer.MAX_VALUE)); // no discount → sort last when ascending

  public static void main(String[] args) {
    List<Customer> list = new ArrayList<>(List.of(
        new Customer("Ada", Optional.empty(), Optional.of(10)),
        new Customer("Ben", Optional.of("Q"), Optional.empty()),
        new Customer("Cara", Optional.of("A"), Optional.of(5))));

    list.sort(BY_NAME.thenComparing(BY_MIDDLE_NULLS_LAST));
    System.out.println(list);

    list.sort(BY_DISCOUNT);
    System.out.println("by discount: " + list);

    // Explicit nulls on dates
    record Row(java.time.LocalDate endDate) {}
    List<Row> rows = new ArrayList<>(List.of(
        new Row(null),
        new Row(java.time.LocalDate.of(2026, 1, 1))));
    rows.sort(Comparator.comparing(Row::endDate, Comparator.nullsLast(Comparator.naturalOrder())));
    System.out.println(rows);
  }
}`,
    realWorld: 'CRM sort: optional VIP flag, nullsLast for standard customers. Contract end date null means active — nullsFirst for renewal dashboards.',
    mistake: 'Comparator.comparing(Entity::getNullableField) without nullsFirst/Last. Sorting Optional directly (not Comparable). Mixing null-hostile TreeMap with nullable business keys.',
    trap: 'Natural order sort on List with null element → NPE before TimSort finishes.',
    interviewAnswer:
      'Wrap nullable keys: Comparator.nullsFirst/Last around the inner comparator. Optional: map to null or sentinel then compare. Never let naturalOrder see null. TreeMap natural order forbids null keys entirely.',
    remember: [
      'nullsFirst / nullsLast explicitly.',
      'Optional → orElse(null) + null comparator.',
      'TreeMap: no null keys.',
      'Sentinel values document intent.',
    ],
    oneLiner: 'Nullable sort keys need nullsFirst/nullsLast — naturalOrder throws on null.',
  },
  {
    id: 'reuse',
    title: 'Reuse · Strategy pattern · BY_NAME constants',
    what: 'Extract Comparators as static final constants (strategy objects) shared across services, tests, and UI sort toggles. Reverse with reversed(), compose with thenComparing.',
    why: 'Duplicated lambda comparators diverge. Named constants document business rules and enable consistent ASC/DESC toggles.',
    how: 'public static final Comparator<Employee> BY_NAME = Comparator.comparing(Employee::name); enum SortOption { BY_NAME, BY_ID } maps to comparator. Spring @Bean Comparator beans for injection in batch jobs.',
    code: `import java.util.*;

public class ComparatorReuseDemo {
  record Employee(long id, String name, String dept) {}

  public static final class EmployeeComparators {
    private EmployeeComparators() {}
    public static final Comparator<Employee> BY_NAME =
        Comparator.comparing(Employee::name, String.CASE_INSENSITIVE_ORDER);
    public static final Comparator<Employee> BY_ID =
        Comparator.comparingLong(Employee::id);
    public static final Comparator<Employee> BY_DEPT_THEN_NAME =
        Comparator.comparing(Employee::dept).thenComparing(BY_NAME);
    public static final Comparator<Employee> BY_NAME_DESC = BY_NAME.reversed();
  }

  enum PayrollSort implements Comparator<Employee> {
    BY_ID(EmployeeComparators.BY_ID),
    BY_DEPT(EmployeeComparators.BY_DEPT_THEN_NAME);
    private final Comparator<Employee> delegate;
    PayrollSort(Comparator<Employee> c) { delegate = c; }
    @Override public int compare(Employee a, Employee b) { return delegate.compare(a, b); }
  }

  public static void main(String[] args) {
    List<Employee> team = new ArrayList<>(List.of(
        new Employee(2, "bob", "PAY"),
        new Employee(1, "Ada", "ENG")));

    team.sort(EmployeeComparators.BY_DEPT_THEN_NAME);
    System.out.println("dept sort: " + team);

    team.sort(PayrollSort.BY_ID);
    System.out.println("id sort: " + team);

    // UI toggle
    boolean ascending = false;
    Comparator<Employee> view = ascending ? EmployeeComparators.BY_NAME : EmployeeComparators.BY_NAME_DESC;
    team.sort(view);
    System.out.println("toggle: " + team);
  }
}`,
    realWorld: 'Shared library EmployeeComparators.BY_COST_CENTER used by report service and admin UI. Enum maps REST ?sort=dept,name to constant comparator — no inline lambdas.',
    mistake: 'Copy-paste comparator lambdas in three modules. Mutating shared Comparator instance (there is none — but wrapping mutable state in closure breaks contract).',
    trap: 'reversed() returns new comparator — safe to store both ASC and DESC constants.',
    interviewAnswer:
      'Strategy pattern: named static final Comparator constants, enum delegates, optional Spring beans. Compose once (BY_DEPT_THEN_NAME), reuse everywhere. reversed() for descending without duplicating logic.',
    remember: [
      'static final Comparator constants.',
      'Enum strategy for sort options.',
      'thenComposing builds pipelines once.',
      'reversed() is immutable new instance.',
    ],
    oneLiner: 'Name and reuse Comparators like BY_DEPT_THEN_NAME — Strategy pattern beats copy-paste lambdas.',
  },
  {
    id: 'perf',
    title: 'Performance — O(n log n) · boxing · comparingInt',
    what: 'Comparison sorts are O(n log n). Object sorts box primitives, allocate, and invoke methods — comparingInt/Long/Double avoid boxing in Comparator chains.',
    why: 'Million-row payment extracts: boxing overhead dominates. Staff asks how to sort int[] vs List<Integer> and when parallel sort helps.',
    how: 'Arrays.sort(int[]) primitive — no boxing. List<Integer>.sort boxes. Comparator.comparingInt(Entity::getId) uses primitive ops. parallelSort for large primitive arrays. Avoid creating Comparator in hot loop.',
    code: `import java.util.*;

public class SortPerfDemo {
  record Txn(long id, int amountCents, String status) {}

  static final Comparator<Txn> BOXING = Comparator.comparing((Txn t) -> t.amountCents);
  static final Comparator<Txn> PRIMITIVE = Comparator.comparingInt(Txn::amountCents);

  public static void main(String[] args) {
    int n = 100_000;
    int[] primitive = new Random(42).ints(n, 0, n).toArray();
    Integer[] boxed = Arrays.stream(primitive).boxed().toArray(Integer[]::new);

    long t0 = System.nanoTime();
    Arrays.sort(primitive);
    long primitiveMs = (System.nanoTime() - t0) / 1_000_000;
    System.out.println("primitive Arrays.sort ms=" + primitiveMs);

    t0 = System.nanoTime();
    Arrays.sort(boxed);
    long boxedMs = (System.nanoTime() - t0) / 1_000_000;
    System.out.println("boxed Arrays.sort ms=" + boxedMs);

    List<Txn> txns = new ArrayList<>(n);
    Random r = new Random(42);
    for (int i = 0; i < n; i++) txns.add(new Txn(i, r.nextInt(1_000_000), "OK"));
    t0 = System.nanoTime();
    txns.sort(PRIMITIVE);
    System.out.println("comparingInt ms=" + (System.nanoTime() - t0) / 1_000_000);

    // parallel — large arrays only
    int[] big = new Random(0).ints(5_000_000, 0, 1000).toArray();
    Arrays.parallelSort(big);
    System.out.println("parallelSort done len=" + big.length);
  }
}`,
    realWorld: 'Ledger sort by amountCents: comparingInt. Batch sort 10M IDs: int[] + Arrays.parallelSort. Profile before parallel — overhead hurts small n.',
    mistake: 'comparing(x -> x.getId()) autoboxing long keys. Sorting when partial heap (top-k) would be O(n log k). Re-sorting entire list on every UI click.',
    trap: 'List.sort on Integer is O(n log n) with boxing each compare — comparingInt on custom type is leaner for int fields.',
    interviewAnswer:
      'Comparison sort lower bound O(n log n). Primitive Arrays.sort avoids boxing. comparingInt/Long/Double reduce allocation in Comparator. parallelSort for large primitive arrays. TreeSet add is O(log n) per element.',
    remember: [
      'O(n log n) comparison sorts.',
      'comparingInt avoids Integer boxes.',
      'Primitive array sort fastest.',
      'parallelSort for huge primitive arrays.',
    ],
    oneLiner: 'Use comparingInt/Long on hot paths — boxing in Comparator.compare kills throughput at scale.',
  },
  {
    id: 'sort-apis',
    title: 'API evolution — Arrays vs Collections vs List.sort',
    what: 'Historical layers: Arrays.sort (Java 1.2), Collections.sort static on List (1.2), List.sort default method (Java 8), Stream.sorted (Java 8).',
    why: 'Legacy codebases still call Collections.sort; interviews ask which to prefer and what changed in Java 8.',
    how: 'Collections.sort(list, c) delegates to list.sort(c). Arrays.sort for arrays only. List.sort requires List implementation mutable (throws on immutable list). Stream for functional pipelines.',
    code: `import java.util.*;

public class ApiEvolutionDemo {
  public static void main(String[] args) {
  List<String> mutable = new ArrayList<>(List.of("c", "a", "b"));

    // Java 1.2 style — still compiles
    Collections.sort(mutable);
    System.out.println("Collections.sort: " + mutable);

    // Java 8+ idiomatic on List
    mutable.sort(Comparator.reverseOrder());
    System.out.println("List.sort reversed: " + mutable);

    // Arrays — own type
    String[] arr = {"x", "y", "z"};
    Arrays.sort(arr, Collections.reverseOrder());
    System.out.println("Arrays.sort+Comparator: " + Arrays.toString(arr));

    // Immutable list — sort throws
    List<String> frozen = List.of("a", "b");
    try {
      frozen.sort(Comparator.naturalOrder());
    } catch (UnsupportedOperationException e) {
      System.out.println("immutable sort blocked");
    }

    // Stream does not require mutable source
    List<String> streamed = frozen.stream().sorted().toList();
    System.out.println("stream on immutable: " + streamed);
  }
}`,
    realWorld: 'JDK migration guides: replace Collections.sort with list.sort for readability. Library code targeting List interface uses default sort method.',
    mistake: 'Calling Collections.sort on Arrays.asList fixed-size list — sort works but set on index may fail later. Assuming Collections.sort copies.',
    trap: 'Collections.sort on immutable List.of → UnsupportedOperationException.',
    interviewAnswer:
      'Java 8: List.sort default method; Collections.sort delegates to it. Prefer list.sort for clarity. Arrays.sort for arrays. Stream.sorted when non-mutating pipeline. TimSort adopted for object sorts in Java 7.',
    remember: [
      'Collections.sort → list.sort delegate.',
      'Prefer list.sort since Java 8.',
      'Immutable lists cannot sort in place.',
      'TimSort from Java 7 object sorts.',
    ],
    oneLiner: 'Java 8+: prefer list.sort — Collections.sort is just a forwarding call.',
  },
  {
    id: 'production',
    title: 'Production — payments · banking · trading',
    what: 'Real systems combine sort requirements: regulatory reporting order, settlement priority, trade book ranking, idempotent replay ordering.',
    why: 'Interviewers want hear: stable sort for multi-pass reports, Comparator constants, BigDecimal compareTo, Instant timelines, and never mutating shared cached lists.',
    how: 'Payment batch: sort by valueDate then accountId. Trading blotter: sort by priority DESC, then sequence ASC. Use immutable sorted copies for API responses. Audit comparator version in schema migrations.',
    code: `import java.math.BigDecimal;
import java.time.*;
import java.util.*;
import java.util.stream.*;

public class ProductionSortDemo {
  record Payment(String paymentId, String accountId, LocalDate valueDate,
                 BigDecimal amount, int retryAttempt) {}

  record Trade(long sequence, String symbol, BigDecimal price, Instant capturedAt, boolean urgent) {}

  static final Comparator<Payment> SETTLEMENT_ORDER = Comparator
      .comparing(Payment::valueDate)
      .thenComparing(Payment::accountId)
      .thenComparing(Payment::paymentId);

  static final Comparator<Trade> BLOTTER = Comparator
      .comparing(Trade::urgent).reversed()
      .thenComparing(Trade::capturedAt)
      .thenComparingLong(Trade::sequence);

  public static void main(String[] args) {
    List<Payment> batch = List.of(
        new Payment("P2", "ACC-9", LocalDate.of(2026, 1, 2), new BigDecimal("10.00"), 0),
        new Payment("P1", "ACC-1", LocalDate.of(2026, 1, 2), new BigDecimal("5.0"), 1),
        new Payment("P3", "ACC-1", LocalDate.of(2026, 1, 1), new BigDecimal("1.0"), 0));

    List<Payment> settlement = batch.stream().sorted(SETTLEMENT_ORDER).toList();
    System.out.println("settlement: " + settlement);

    List<Trade> blotter = new ArrayList<>(List.of(
        new Trade(2, "AAPL", new BigDecimal("190.5"), Instant.parse("2026-01-02T15:00:01Z"), false),
        new Trade(1, "AAPL", new BigDecimal("190.4"), Instant.parse("2026-01-02T15:00:00Z"), true)));
    blotter.sort(BLOTTER);
    System.out.println("blotter: " + blotter);

    // Banking statement lines — amount descending, stable on id
    record StmtLine(String id, BigDecimal balance) {}
    List<StmtLine> lines = List.of(
        new StmtLine("L1", new BigDecimal("100")),
        new StmtLine("L2", new BigDecimal("250")),
        new StmtLine("L3", new BigDecimal("250")));
    var byBalance = lines.stream()
        .sorted(Comparator.comparing(StmtLine::balance).reversed()
            .thenComparing(StmtLine::id))
        .toList();
    System.out.println(byBalance);
  }
}`,
    realWorld: 'ACH file generation: valueDate → routing → account. Matching engine replay: sequence on symbol-time composite. Fraud queue: priority comparator with stable tie on event id.',
    mistake: 'Sorting mutable entity list from JPA session. Using double for money sort. Non-stable sort then assuming original tie order in reconciliation.',
    trap: 'BigDecimal "10.0" vs "10.00" in HashMap dedup vs TreeSet — production duplicate payments if wrong structure.',
    interviewAnswer:
      'Name comparators (SETTLEMENT_ORDER). Sort Instants for event time, LocalDate for business date, BigDecimal.compareTo for money. Return new sorted lists from APIs. Stable sort for multi-pass regulatory grouping. Document comparator in payment schema versioning.',
    remember: [
      'Named comparators in domain module.',
      'BigDecimal + LocalDate + Instant correctly.',
      'Immutable sorted API responses.',
      'Stable sort for multi-pass reports.',
    ],
    oneLiner: 'Production: named SETTLEMENT_ORDER comparators, BigDecimal compareTo, stable sorts for regulatory passes.',
  },
  {
    id: 'mutable',
    title: 'Mutable keys in TreeSet / TreeMap after insert',
    what: 'If a key field used in compareTo/Comparator changes after insertion, the element stays in the wrong tree position — contains/get break.',
    why: 'Classic production bug: mutable Date or StringBuilder key, or setter on entity in TreeMap. HashMap bucket wrong too if hashCode changes.',
    how: 'Immutable keys (final fields, records, Strings). If mutation required, remove then re-insert, or use HashMap with stable hash key (id only). Never mutate fields participating in ordering.',
    code: `import java.util.*;

public class MutableKeyDemo {
  // BAD mutable key
  static class MutableId implements Comparable<MutableId> {
    int id;
    MutableId(int id) { this.id = id; }
    void setId(int id) { this.id = id; }
    @Override public int compareTo(MutableId o) { return Integer.compare(id, o.id); }
    @Override public String toString() { return "id=" + id; }
  }

  public static void main(String[] args) {
    TreeMap<MutableId, String> map = new TreeMap<>();
    MutableId k = new MutableId(10);
    map.put(k, "payment");
    System.out.println("before mutate get=" + map.get(k));

    k.setId(99); // key mutated after insert
    System.out.println("after mutate get=" + map.get(k)); // likely null
    System.out.println("containsKey(k)=" + map.containsKey(k));
    System.out.println("map=" + map); // stale entry under old ordering

    // FIX: immutable record key
    record StableKey(long id) implements Comparable<StableKey> {
      @Override public int compareTo(StableKey o) { return Long.compare(id, o.id); }
    }
    TreeMap<StableKey, String> good = new TreeMap<>();
    StableKey sk = new StableKey(10);
    good.put(sk, "ok");
    System.out.println("stable get=" + good.get(new StableKey(10)));

    // Recovery: remove + re-add after intentional mutation
    MutableId m = new MutableId(1);
    map.clear();
    map.put(m, "v1");
    m.setId(2);
    map.remove(m); // may fail — must retain original key object reference or rebuild
    m.setId(2);
    map.put(m, "v2");
    System.out.println("rebuilt size=" + map.size());
  }
}`,
    realWorld: 'Never use @Entity JPA object with updatable id in TreeSet cache. Cache key = immutable Long id; sort display copies separately.',
    mistake: 'TreeMap with mutable POJO keys. Changing compare field via setter. Assuming get still finds entry after mutation.',
    trap: 'After mutating key, get returns null but entry still in map — memory leak + ghost data.',
    interviewAnswer:
      'Tree structures position by compare at insert time only. Mutating compare fields breaks ordering invariant — get/contains fail. Use immutable keys (record, String, Long). HashMap also breaks if hashCode changes. Fix: remove+reinsert or rebuild map.',
    remember: [
      'Keys must be immutable.',
      'Mutation breaks TreeMap/TreeSet position.',
      'HashMap breaks if hashCode changes.',
      'remove+reinsert if key must change.',
    ],
    oneLiner: 'Mutating a TreeMap key after put orphans the entry — get returns null, ghost data remains.',
  },
  {
    id: 'threads',
    title: 'Thread safety · serialization brief',
    what: 'Comparator implementations should be stateless. TreeSet/TreeMap/ArrayList not thread-safe. Collections.synchronizedSortedSet or ConcurrentSkipListMap for concurrent sorted maps. Serializable comparators need stable serial form.',
    why: 'Shared static Comparator is safe; comparator closing over mutable counter is not. Distributed cache deserializing TreeSet needs Comparator class on classpath.',
    how: 'ConcurrentSkipListMap for concurrent sorted map. synchronized (map) { ... } for legacy. Lambda comparators Serializable only if capturing values are serializable. Prefer explicit named classes for serializable comparators.',
    code: `import java.util.*;
import java.util.concurrent.*;

public class ThreadSortDemo {
  static final Comparator<String> STATELESS = Comparator.naturalOrder();

  // BAD: mutable capture breaks contract under concurrency
  static Comparator<String> mutableCapture(List<String> order) {
    return (a, b) -> Integer.compare(order.indexOf(a), order.indexOf(b));
  }

  public static void main(String[] args) throws Exception {
    NavigableMap<String, Integer> concurrent = new ConcurrentSkipListMap<>();
    concurrent.put("beta", 2);
    concurrent.put("alpha", 1);
    System.out.println(concurrent);

    TreeSet<String> tree = new TreeSet<>();
    Set<String> synced = Collections.synchronizedSortedSet(tree);
    Runnable r = () -> { synchronized (synced) { synced.add("job-" + Thread.currentThread().getId()); } };
    List<Thread> threads = new ArrayList<>();
    for (int i = 0; i < 3; i++) {
      Thread t = new Thread(r); threads.add(t); t.start();
    }
    for (Thread t : threads) t.join();
    synchronized (synced) { System.out.println("synced set size=" + synced.size()); }

    // Stateless comparator safe to share
    List<String> shared = Collections.synchronizedList(new ArrayList<>(List.of("b", "a", "c")));
    synchronized (shared) { shared.sort(STATELESS); }
    System.out.println(shared);
  }
}`,
    realWorld: 'In-memory order book per symbol: ConcurrentSkipListMap<BigDecimal, Queue<Order>>. Batch sort in single-threaded job — no sync needed. Kafka consumer partition processing is single-threaded per partition.',
    mistake: 'Sharing TreeMap across threads without sync. Comparator with mutable external list. Deserializing TreeSet without comparator on remote node.',
    trap: 'Collections.synchronizedSortedSet — iterate/sync manually or ConcurrentModificationException.',
    interviewAnswer:
      'Comparators should be stateless — safe as static finals. TreeSet/TreeMap not concurrent — use ConcurrentSkipListMap or external lock. synchronizedSortedSet wraps every method but compound ops need manual sync. Serialization: explicit Comparator classes if TreeSet crosses JVM boundary.',
    remember: [
      'Stateless Comparator = thread-safe.',
      'ConcurrentSkipListMap for concurrent sort.',
      'synchronizedSortedSet needs compound sync.',
      'Serializable comparators: named classes.',
    ],
    oneLiner: 'Comparators should be stateless; TreeMap/TreeSet need external sync or ConcurrentSkipListMap.',
  },
  {
    id: 'debug',
    title: 'Debugging checklist — 10 steps',
    what: 'Systematic triage when sort order wrong, elements missing from TreeSet, or IllegalArgumentException during sort.',
    why: 'Production incidents: "duplicate payments in HashSet but one in report TreeMap" — checklist speeds RCA.',
    how: 'Ten steps from reproduce to fix: contract, fields, nulls, structure choice, mutation, comparator instance, stability, locale, BigDecimal, thread safety.',
    code: `import java.util.*;

public class DebugChecklistDemo {
  // Minimal repro template interviewers like
  static void assertOrder(List<String> sorted, String... expected) {
    if (!sorted.equals(List.of(expected))) {
      throw new AssertionError("expected " + List.of(expected) + " got " + sorted);
    }
  }

  public static void main(String[] args) {
    // Step-driven fix example: wrong comparator fixed
    List<String> broken = new ArrayList<>(List.of("file10", "file2"));
    broken.sort(Comparator.naturalOrder()); // lex — wrong
    System.out.println("step3 broken: " + broken);

    broken.sort(Comparator.comparingInt(s -> Integer.parseInt(s.replace("file", ""))));
    assertOrder(broken, "file2", "file10");
    System.out.println("step10 fixed: " + broken);

    /* DEBUG CHECKLIST (10 steps):
     * 1. Reproduce minimal input — 2-3 elements showing bug.
     * 2. Hash structure (HashSet/HashMap) or tree (TreeSet/TreeMap) or sort only?
     * 3. List compare fields vs equals fields — aligned?
     * 4. Null keys/elements? Add nullsFirst/Last or ban nulls.
     * 5. Mutable key mutated after insert? → remove/rebuild.
     * 6. Comparator contract — subtraction overflow? Use Integer.compare.
     * 7. BigDecimal scale — equals vs compareTo mismatch?
     * 8. String locale / case — CASE_INSENSITIVE vs Collator?
     * 9. Stability — need thenComparing tie-break?
     * 10. Shared comparator state / concurrent TreeMap — sync or ConcurrentSkipListMap.
     */
  }
}`,
    realWorld: 'On-call runbook: export first 5 "missing" keys, log compareTo sign between pairs, verify TreeSet size vs HashSet on same data sample.',
    mistake: 'Debugging without minimal repro. Fixing symptom by switching to HashSet without fixing comparator alignment.',
    trap: 'Skipping step 2 — wrong collection semantics means comparator fix cannot help TreeSet duplicate issue driven by compare==0.',
    interviewAnswer:
      'Walk 10 steps: repro, collection type, equals/compare alignment, nulls, mutation, contract/subtraction, BigDecimal, locale, stability tie-break, concurrency. Most bugs: compareTo partial field, mutable key, or BigDecimal equals in HashSet.',
    remember: [
      '1 Repro small.',
      '2 Hash vs tree semantics.',
      '3 equals vs compare fields.',
      '4 Nulls 5 Mutation 6 Contract.',
      '7 BigDecimal 8 Locale 9 Stability 10 Threads.',
    ],
    oneLiner: 'Debug: repro → hash vs tree → equals/compare alignment → nulls → mutation → contract → BigDecimal → locale → stability → threads.',
  },
];
