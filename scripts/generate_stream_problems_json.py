#!/usr/bin/env python3
"""Generate lib/java-streams/_generated_problems.json — ~190–200 unique Stream interview problems."""
from __future__ import annotations

import json
from collections import Counter
from pathlib import Path

OUT = Path("/workspace/lib/java-streams/_generated_problems.json")
problems: list[dict] = []


def add(**kw):
    req = (
        "id", "category", "difficulty", "title", "problem", "input", "output",
        "solution", "pipeline", "why", "timeComplexity", "spaceComplexity", "trap", "senior",
    )
    for r in req:
        if r not in kw:
            raise SystemExit(f"missing {r} in {kw.get('id')}")
    problems.append(kw)


def P(id, category, difficulty, title, problem, input, output, solution, pipeline, why,
      timeComplexity, spaceComplexity, trap, senior, alternative=None, javaSince=None, tags=None):
    d = dict(
        id=id, category=category, difficulty=difficulty, title=title, problem=problem,
        input=input, output=output, solution=solution, pipeline=pipeline, why=why,
        timeComplexity=timeComplexity, spaceComplexity=spaceComplexity, trap=trap, senior=senior,
    )
    if alternative:
        d["alternative"] = alternative
    if javaSince:
        d["javaSince"] = javaSince
    if tags:
        d["tags"] = tags
    else:
        d["tags"] = [category]
    add(**d)


# ---------------------------------------------------------------------------
# FUNDAMENTALS (7)
# ---------------------------------------------------------------------------
P("f01", "fundamentals", "Beginner", "Stream from List",
  "Create a Stream from a List and print each element.",
  'List.of("java","spring","kafka")', "java / spring / kafka",
  'List.of("java","spring","kafka").stream().forEach(System.out::println);',
  "List → stream → forEach", "Canonical collection source for Stream pipelines.",
  "O(n)", "O(1)", "Reusing a Stream after a terminal operation throws IllegalStateException.",
  "Prefer forEach for pure side effects; use collect when you need a result.",
  javaSince="Java 8")

P("f02", "fundamentals", "Beginner", "Stream from Set then sort",
  "Stream unique departments and sort for stable output.",
  'Set.copyOf(List.of("ENG","HR","ENG"))', "[ENG, HR]",
  'Set.copyOf(List.of("ENG","HR","ENG")).stream().sorted().toList();',
  "Set → stream → sorted → toList", "Set already unique; sorted makes output deterministic.",
  "O(n log n)", "O(n)", "Assuming HashSet encounter order is stable.",
  "Document ordering contracts when APIs return Sets.",
  javaSince="Java 16")

P("f03", "fundamentals", "Beginner", "Stream Map entries",
  "Print map entries as key=value lines.",
  'Map.of("a",1,"b",2)', "a=1 and b=2 (unordered)",
  'Map.of("a",1,"b",2).entrySet().stream()\n  .forEach(e -> System.out.println(e.getKey() + "=" + e.getValue()));',
  "entrySet → stream → forEach", "Map itself is not a Stream source; stream the entrySet.",
  "O(n)", "O(1)", "Calling map.stream() does not compile.",
  "Use LinkedHashMap when insertion order must be preserved.",
  javaSince="Java 8")

P("f04", "fundamentals", "Intermediate", "Primitive IntStream sum",
  "Sum an int[] without boxing.",
  "[1,2,3,4]", "10",
  "int sum = Arrays.stream(new int[]{1, 2, 3, 4}).sum();",
  "int[] → IntStream → sum", "Primitive streams avoid Integer boxing overhead.",
  "O(n)", "O(1)", "Using Stream<Integer> on large arrays wastes CPU and GC.",
  "Prefer IntStream/LongStream/DoubleStream for numeric hot paths.",
  javaSince="Java 8")

P("f05", "fundamentals", "Intermediate", "Stream.generate with limit",
  "Generate 5 random doubles safely from an infinite source.",
  "n=5", "5 doubles in [0,1)",
  "List<Double> xs = Stream.generate(Math::random).limit(5).toList();",
  "generate → limit → toList", "Infinite sources must be bounded before a terminal op.",
  "O(k)", "O(k)", "Collecting without limit hangs forever.",
  "Prefer RandomGenerator (Java 17+) when you need reproducible tests.",
  javaSince="Java 8")

P("f06", "fundamentals", "Advanced", "Files.lines try-with-resources",
  "Count non-blank lines in a CSV using Files.lines and ensure the file is closed.",
  "payments.csv", "N non-blank lines",
  '''try (Stream<String> lines = Files.lines(Path.of("payments.csv"))) {
  long n = lines.filter(l -> !l.isBlank()).count();
}''',
  "Files.lines → filter → count", "Files.lines returns a Stream that holds an open file channel.",
  "O(lines)", "O(1)", "Forgetting try-with-resources leaks file descriptors.",
  "Always close Files.lines / BufferedReader.lines in production code.",
  javaSince="Java 8", tags=["fundamentals", "production", "io"])

P("f07", "fundamentals", "Intermediate", "Optional.stream flatten",
  "Flatten a List of Optional<String> into present values only.",
  '[Optional.of("A"), Optional.empty(), Optional.of("B")]', "[A, B]",
  '''List<String> names = List.of(Optional.of("A"), Optional.<String>empty(), Optional.of("B"))
  .stream()
  .flatMap(Optional::stream)
  .toList();''',
  "stream → flatMap(Optional::stream) → toList",
  "Optional.stream() yields 0 or 1 element — ideal for flatMap.",
  "O(n)", "O(k)", "filter(Optional::isPresent).map(Optional::get) is noisier and easier to misuse.",
  "Prefer Optional.stream in Stream pipelines (Java 9+).",
  javaSince="Java 9", tags=["fundamentals", "datetime-optional"])

# ---------------------------------------------------------------------------
# FILTER (5)
# ---------------------------------------------------------------------------
P("fi01", "filter", "Beginner", "Filter even numbers",
  "Keep even integers from a list.",
  "[1,2,3,4,5,6]", "[2, 4, 6]",
  "List<Integer> evens = List.of(1,2,3,4,5,6).stream().filter(n -> n % 2 == 0).toList();",
  "stream → filter → toList", "filter keeps elements matching a Predicate.",
  "O(n)", "O(k)", "Mutating the source list while streaming.",
  "Keep predicates pure and side-effect free.",
  javaSince="Java 16")

P("fi02", "filter", "Intermediate", "Predicate and / or / negate",
  "Keep salaries that are either junior band (<50k) or executive band (>=200k) using composed Predicates.",
  "salaries [40k,80k,220k,45k]", "[40000, 220000, 45000]",
  '''Predicate<Integer> junior = s -> s < 50_000;
Predicate<Integer> exec = s -> s >= 200_000;
List<Integer> band = salaries.stream().filter(junior.or(exec)).toList();
List<Integer> mid = salaries.stream().filter(junior.or(exec).negate()).toList();''',
  "stream → filter(predicate.or/and/negate) → toList",
  "Predicate composition avoids nested boolean soup and is reusable.",
  "O(n)", "O(k)", "Negating a complex predicate without parentheses clarity.",
  "Name predicates; compose with and/or/negate for interview clarity.",
  javaSince="Java 8", tags=["filter", "predicate"])

P("fi03", "filter", "Beginner", "Filter non-blank strings",
  "Remove null and blank strings after trim.",
  '["  ","java",null,"  spring "]', "[java, spring]",
  '''List<String> clean = Stream.of("  ", "java", null, "  spring ")
  .filter(Objects::nonNull)
  .map(String::trim)
  .filter(s -> !s.isBlank())
  .toList();''',
  "stream → filter(nonNull) → map(trim) → filter(!blank) → toList",
  "Null-safe filtering before mapping prevents NPEs.",
  "O(n)", "O(k)", "Calling trim before null check.",
  "filter(Objects::nonNull) early; prefer isBlank over isEmpty for whitespace.",
  javaSince="Java 11")

P("fi04", "filter", "Intermediate", "Filter employees by department",
  "Return Engineering employees only.",
  "emps with ENG/HR/SALES", "only ENG records",
  '''List<Employee> eng = employees.stream()
  .filter(e -> "ENG".equals(e.department()))
  .toList();''',
  "stream → filter(dept) → toList", "Domain filtering is the most common Stream use case.",
  "O(n)", "O(k)", 'Using == for String department comparison.',
  "Prefer constants or enums for department codes.",
  javaSince="Java 16")

P("fi05", "filter", "Advanced", "takeWhile / dropWhile sorted prefix",
  "From a sorted transaction amount list, take while amounts stay under 1000, then dropWhile under 100.",
  "sorted [50,80,120,900,1500]", "takeWhile:<1000 → [50,80,120,900]",
  '''List<Integer> under1k = amounts.stream().takeWhile(a -> a < 1000).toList();
List<Integer> from100 = amounts.stream().dropWhile(a -> a < 100).toList();''',
  "sorted stream → takeWhile/dropWhile → toList",
  "takeWhile/dropWhile require sorted (or prefix-meaningful) encounter order.",
  "O(n)", "O(k)", "Using takeWhile on unsorted data and expecting a global filter.",
  "Interview: contrast takeWhile (prefix) vs filter (all matches).",
  javaSince="Java 9")

# ---------------------------------------------------------------------------
# MAP (5)
# ---------------------------------------------------------------------------
P("m01", "map", "Beginner", "Map to uppercase",
  "Transform strings to uppercase.",
  '["upi","neft"]', "[UPI, NEFT]",
  'List<String> up = List.of("upi","neft").stream().map(String::toUpperCase).toList();',
  "stream → map → toList", "map is 1:1 element transformation.",
  "O(n)", "O(n)", "Confusing map with flatMap for nested lists.",
  "Prefer method references when the mapping is a single method call.",
  javaSince="Java 16")

P("m02", "map", "Intermediate", "mapToInt for salaries",
  "Compute average salary as double without boxing in the average step.",
  "Employee salaries", "avg as double",
  "double avg = employees.stream().mapToInt(Employee::salary).average().orElse(0);",
  "stream → mapToInt → average", "mapToInt yields IntStream with numeric terminals.",
  "O(n)", "O(1)", "map(Employee::salary).collect(averaging) boxes unnecessarily.",
  "Use mapToInt/Long/Double for aggregates on primitives.",
  javaSince="Java 8")

P("m03", "map", "Beginner", "Extract employee names",
  "Map Employee records to name strings.",
  "List<Employee>", "[Ada, Linus, Grace]",
  "List<String> names = employees.stream().map(Employee::name).toList();",
  "stream → map(name) → toList", "Projection is the core map pattern in domain models.",
  "O(n)", "O(n)", "Mapping to mutable shared objects.",
  "Records + method refs keep projections readable.",
  javaSince="Java 16")

P("m04", "map", "Intermediate", "map vs peek side effects",
  "Demonstrate that peek should not replace map for transformations.",
  '["a","b"]', "[A, B]",
  '''// correct
List<String> out = list.stream().map(String::toUpperCase).toList();
// wrong interview trap: peek(s -> s.toUpperCase()) does nothing to immutable String''',
  "stream → map → toList", "peek is for debugging; map returns the new value.",
  "O(n)", "O(n)", "Relying on peek for business logic (may be elided).",
  "Staff answer: peek is not guaranteed to run for short-circuit ops.",
  javaSince="Java 8")

P("m05", "map", "Advanced", "mapMulti for conditional emit",
  "Use mapMulti to emit square only for even ints (Java 16).",
  "[1,2,3,4]", "[4, 16]",
  '''List<Integer> squares = List.of(1,2,3,4).stream()
  .<Integer>mapMulti((n, sink) -> { if (n % 2 == 0) sink.accept(n * n); })
  .toList();''',
  "stream → mapMulti → toList", "mapMulti is an imperative flatMap alternative with less allocation.",
  "O(n)", "O(k)", "Overusing mapMulti when filter+map is clearer.",
  "Prefer filter+map unless you need 0..N emits with shared state in the lambda.",
  javaSince="Java 16")

# ---------------------------------------------------------------------------
# FLATMAP (5)
# ---------------------------------------------------------------------------
P("fm01", "flatmap", "Beginner", "Flatten list of lists",
  "Flatten List<List<String>> into one list.",
  "[[a,b],[c]]", "[a, b, c]",
  '''List<String> flat = List.of(List.of("a","b"), List.of("c")).stream()
  .flatMap(Collection::stream)
  .toList();''',
  "stream → flatMap(Collection::stream) → toList", "flatMap maps each element to a stream and concatenates.",
  "O(n)", "O(n)", "Using map instead of flatMap leaves Stream<Stream<T>>.",
  "flatMap = map + flatten; interviewers watch for the nested Stream type.",
  javaSince="Java 16")

P("fm02", "flatmap", "Intermediate", "Orders to line items",
  "From orders, collect all SKUs across line items.",
  "Order{items[{sku},{sku}]}", "[SKU1, SKU2, ...]",
  '''List<String> skus = orders.stream()
  .flatMap(o -> o.items().stream())
  .map(LineItem::sku)
  .toList();''',
  "orders → flatMap(items) → map(sku) → toList",
  "One-to-many domain navigation is the textbook flatMap case.",
  "O(n)", "O(n)", "Null items list without Optional/emptyStream guard.",
  "Model empty collections as empty lists, not null.",
  javaSince="Java 16", tags=["flatmap", "ecommerce"])

P("fm03", "flatmap", "Intermediate", "Split sentences to words",
  "FlatMap sentences into lowercase words.",
  '["Java Streams","are lazy"]', "[java, streams, are, lazy]",
  '''List<String> words = sentences.stream()
  .flatMap(s -> Arrays.stream(s.toLowerCase().split("\\\\s+")))
  .toList();''',
  "stream → flatMap(split→stream) → toList", "String.split returns array; Arrays.stream bridges to Stream.",
  "O(n)", "O(n)", "Pattern.compile per element instead of reusing Pattern.",
  "Reuse Pattern.splitAsStream for hot paths.",
  javaSince="Java 8", tags=["flatmap", "strings"])

P("fm04", "flatmap", "Advanced", "flatMapToInt code points",
  "Sum Unicode code points of all strings.",
  '["A","€"]', "sum of code points",
  '''int sum = List.of("A", "€").stream()
  .flatMapToInt(String::codePoints)
  .sum();''',
  "stream → flatMapToInt(codePoints) → sum",
  "codePoints handles supplementary characters correctly vs chars().",
  "O(n)", "O(1)", "Using chars() for emoji-heavy text.",
  "Prefer codePoints for internationalized text processing.",
  javaSince="Java 8")

P("fm05", "flatmap", "Advanced", "Nested Optional flatMap",
  "Chain Optional lookups with flatMap then bridge into a Stream.",
  "Optional<User> → Optional<Address>", "city or empty",
  '''List<String> cities = users.stream()
  .map(User::address)
  .flatMap(Optional::stream)
  .map(Address::city)
  .toList();''',
  "stream → map(Optional) → flatMap(Optional::stream) → map → toList",
  "Optional.stream turns absent into empty contribution.",
  "O(n)", "O(k)", "Calling get() without isPresent in a map.",
  "Never Optional.get in Streams; use stream()/orElse.",
  javaSince="Java 9")

# ---------------------------------------------------------------------------
# DISTINCT (4)
# ---------------------------------------------------------------------------
P("d01", "distinct", "Beginner", "Distinct strings",
  "Remove duplicate tags preserving encounter order.",
  '["java","spring","java"]', "[java, spring]",
  'List<String> uniq = List.of("java","spring","java").stream().distinct().toList();',
  "stream → distinct → toList", "distinct uses equals/hashCode; encounter order for sequential.",
  "O(n)", "O(n)", "distinct on objects without proper equals/hashCode.",
  "For custom uniqueness, use toMap/collectingAndThen or a LinkedHashSet collector.",
  javaSince="Java 16")

P("d02", "distinct", "Advanced", "Distinct-by-key warning (parallel)",
  "Explain why a stateful distinct-by-key with a shared HashSet breaks under parallel().",
  "employees by email", "unique by email",
  '''// sequential OK-ish (still impure):
Set<String> seen = ConcurrentHashMap.newKeySet();
List<Employee> uniq = employees.stream()
  .filter(e -> seen.add(e.email()))
  .toList();
// Prefer:
Map<String, Employee> byEmail = employees.stream()
  .collect(Collectors.toMap(Employee::email, Function.identity(), (a, b) -> a, LinkedHashMap::new));''',
  "stream → toMap(key, identity, merge, LinkedHashMap)",
  "Shared mutable Set in filter is a race under parallel and a hidden side effect.",
  "O(n)", "O(n)", "filter(seen.add) in parallelStream — lost updates / ConcurrentModification.",
  "Staff: distinct-by-key needs ConcurrentHashMap or toMap merge; never a plain HashSet in parallel.",
  javaSince="Java 8", tags=["distinct", "parallel"])

P("d03", "distinct", "Intermediate", "Distinct after map",
  "Map orders to customerId then distinct.",
  "orders", "unique customer ids",
  "List<String> customers = orders.stream().map(Order::customerId).distinct().toList();",
  "stream → map → distinct → toList", "distinct after projection is cheaper than distinct on heavy objects.",
  "O(n)", "O(k)", "distinct before map when only the projected key matters.",
  "Project early; distinct on the key you care about.",
  javaSince="Java 16")

P("d04", "distinct", "Intermediate", "Distinct primitives",
  "Unique ints via IntStream.",
  "[1,2,2,3]", "[1,2,3]",
  "int[] uniq = IntStream.of(1,2,2,3).distinct().toArray();",
  "IntStream → distinct → toArray", "Primitive distinct uses a specialized set.",
  "O(n)", "O(k)", "Boxing then distinct on Stream<Integer> for large arrays.",
  "Stay on IntStream for numeric uniqueness.",
  javaSince="Java 8")

# ---------------------------------------------------------------------------
# SORT (4)
# ---------------------------------------------------------------------------
P("so01", "sort", "Beginner", "Natural sort strings",
  "Sort names alphabetically.",
  '["Zoe","Ada","Lin"]', "[Ada, Lin, Zoe]",
  'List<String> sorted = List.of("Zoe","Ada","Lin").stream().sorted().toList();',
  "stream → sorted → toList", "sorted() uses natural ordering.",
  "O(n log n)", "O(n)", "sorted() on streams of non-Comparable types.",
  "Provide Comparator when natural order is wrong for the domain.",
  javaSince="Java 16")

P("so02", "sort", "Intermediate", "Sort employees by salary desc",
  "Sort employees by salary descending, then name ascending.",
  "Employee list", "highest salary first",
  '''List<Employee> ranked = employees.stream()
  .sorted(Comparator.comparingInt(Employee::salary).reversed()
      .thenComparing(Employee::name))
  .toList();''',
  "stream → sorted(comparator) → toList", "thenComparing breaks ties stably for reporting.",
  "O(n log n)", "O(n)", "comparing salary as Integer nulls without nullsLast.",
  "Always define a total order for production sorts.",
  javaSince="Java 16", tags=["sort", "employee"])

P("so03", "sort", "Advanced", "Sort BigDecimal amounts",
  "Sort payment amounts ascending with BigDecimal.",
  "[10.00, 2.5, 10.0]", "[2.5, 10.00, 10.0] by compareTo",
  '''List<BigDecimal> sorted = amounts.stream()
  .sorted(Comparator.naturalOrder())
  .toList();''',
  "stream → sorted(naturalOrder) → toList",
  "BigDecimal.compareTo ignores scale; equals does not — know the difference.",
  "O(n log n)", "O(n)", "Using equals for money uniqueness vs compareTo for sort.",
  "FinTech: never sort money as double; use BigDecimal.",
  javaSince="Java 8", tags=["sort", "fintech"])

P("so04", "sort", "Intermediate", "reverseOrder",
  "Sort integers descending.",
  "[1,3,2]", "[3, 2, 1]",
  "List<Integer> desc = List.of(1,3,2).stream().sorted(Comparator.reverseOrder()).toList();",
  "stream → sorted(reverseOrder) → toList", "reverseOrder is the concise descending Comparator.",
  "O(n log n)", "O(n)", "sorted(Comparator.comparing(x->x).reversed()) verbosity without need.",
  "Use reverseOrder for Comparable elements.",
  javaSince="Java 16")

# ---------------------------------------------------------------------------
# LIMIT-SKIP (4)
# ---------------------------------------------------------------------------
P("ls01", "limit-skip", "Beginner", "Top 3 with limit",
  "Take first 3 elements after sorting descending.",
  "[5,1,9,3,7]", "[9, 7, 5]",
  '''List<Integer> top3 = List.of(5,1,9,3,7).stream()
  .sorted(Comparator.reverseOrder())
  .limit(3)
  .toList();''',
  "stream → sorted → limit → toList", "limit short-circuits after N elements when ordered.",
  "O(n log n)", "O(k)", "limit before sorted (wrong top-N).",
  "For top-N, sort then limit — or use a heap for large n.",
  javaSince="Java 16")

P("ls02", "limit-skip", "Intermediate", "Pagination skip/limit",
  "Page size 10, page index 2 (0-based) of transaction ids.",
  "ids stream", "elements 20..29",
  '''List<String> page = ids.stream().skip(2L * 10).limit(10).toList();''',
  "stream → skip → limit → toList", "skip+limit models offset pagination.",
  "O(offset+page)", "O(page)", "Deep offsets on huge streams are expensive.",
  "Prefer keyset pagination in production APIs.",
  javaSince="Java 16", tags=["limit-skip", "production"])

P("ls03", "limit-skip", "Beginner", "skip first header",
  "Skip CSV header line then parse.",
  "lines with header", "data rows only",
  '''List<String> rows = lines.stream().skip(1).toList();''',
  "stream → skip(1) → toList", "skip drops the first N encounter-order elements.",
  "O(n)", "O(n)", "skip on unordered parallel sources is nondeterministic.",
  "Keep header handling sequential when order matters.",
  javaSince="Java 16")

P("ls04", "limit-skip", "Advanced", "limit on infinite iterate",
  "Materialize first 100 primes-like candidates from iterate (illustrative bound).",
  "iterate from 2", "100 ints",
  "List<Integer> first = Stream.iterate(2, n -> n + 1).limit(100).toList();",
  "iterate → limit → toList", "limit is mandatory on infinite sources.",
  "O(k)", "O(k)", "forEach on unbounded iterate.",
  "Library APIs should require a bound for infinite factories.",
  javaSince="Java 8")

# ---------------------------------------------------------------------------
# FIND-MATCH (5)
# ---------------------------------------------------------------------------
P("fmch01", "find-match", "Beginner", "anyMatch / allMatch / noneMatch",
  "Check if any employee is in ENG, all have salary > 0, none are contractors.",
  "employees", "booleans",
  '''boolean anyEng = employees.stream().anyMatch(e -> "ENG".equals(e.department()));
boolean allPaid = employees.stream().allMatch(e -> e.salary() > 0);
boolean noContractors = employees.stream().noneMatch(Employee::contractor);''',
  "stream → anyMatch|allMatch|noneMatch", "Short-circuiting boolean terminals.",
  "O(n)", "O(1)", "allMatch on empty stream is true (vacuous truth).",
  "Know empty-stream semantics for allMatch/noneMatch.",
  javaSince="Java 8")

P("fmch02", "find-match", "Intermediate", "findFirst vs findAny",
  "Contrast findFirst and findAny on parallel streams of payment ids.",
  "parallel payment stream", "Optional id",
  '''Optional<String> first = ids.stream().filter(id -> id.startsWith("P")).findFirst();
Optional<String> any = ids.parallelStream().filter(id -> id.startsWith("P")).findAny();''',
  "stream → filter → findFirst|findAny",
  "findFirst respects encounter order; findAny may return any match (faster parallel).",
  "O(n)", "O(1)", "Assuming findAny is deterministic under parallel.",
  "Use findFirst when order matters; findAny when any witness is enough.",
  javaSince="Java 8", tags=["find-match", "parallel"])

P("fmch03", "find-match", "Beginner", "findFirst present name",
  "Find first name starting with A.",
  '["Bob","Ada","Amy"]', "Optional[Ada]",
  '''Optional<String> name = List.of("Bob","Ada","Amy").stream()
  .filter(s -> s.startsWith("A"))
  .findFirst();''',
  "stream → filter → findFirst", "findFirst returns Optional.",
  "O(n)", "O(1)", "Calling get() without isPresent/orElseThrow.",
  "Prefer orElseThrow in domain code when absence is a bug.",
  javaSince="Java 8")

P("fmch04", "find-match", "Advanced", "Short-circuit vs full scan",
  "Show anyMatch can stop early vs count() always scans.",
  "large list", "true early",
  '''boolean ok = huge.stream().anyMatch(x -> x == 42);
long n = huge.stream().filter(x -> x == 42).count(); // full scan''',
  "stream → anyMatch (short-circuit)", "Choose the terminal that matches the question.",
  "O(k) best", "O(1)", "Using collect just to check existence.",
  "Interview: pick anyMatch for existence, findFirst for the value.",
  javaSince="Java 8")

P("fmch05", "find-match", "Intermediate", "max / min with Comparator",
  "Find employee with max salary.",
  "employees", "Optional<Employee>",
  "Optional<Employee> top = employees.stream().max(Comparator.comparingInt(Employee::salary));",
  "stream → max(comparator)", "max/min are reductions returning Optional.",
  "O(n)", "O(1)", "max on empty stream — handle Optional.",
  "For ties, chain thenComparing to define a winner.",
  javaSince="Java 8", tags=["find-match", "employee"])

# ---------------------------------------------------------------------------
# REDUCE (5)
# ---------------------------------------------------------------------------
P("r01", "reduce", "Beginner", "Sum with reduce",
  "Sum integers with reduce.",
  "[1,2,3,4]", "10",
  "int sum = List.of(1,2,3,4).stream().reduce(0, Integer::sum);",
  "stream → reduce(identity, accumulator)", "Identity must be identity for the operator.",
  "O(n)", "O(1)", "reduce without identity returns Optional.",
  "Prefer mapToInt.sum for primitives.",
  javaSince="Java 8")

P("r02", "reduce", "Advanced", "Reduce with combiner (parallel)",
  "Implement parallel-safe String joining of account ids with reduce identity/accumulator/combiner.",
  '["A1","A2","A3"]', "A1,A2,A3",
  '''String joined = ids.parallelStream().reduce(
  "",
  (acc, id) -> acc.isEmpty() ? id : acc + "," + id,
  (a, b) -> a.isEmpty() ? b : b.isEmpty() ? a : a + "," + b
);''',
  "parallelStream → reduce(id, acc, combiner)",
  "Combiner merges partial results from parallel splits; must be associative.",
  "O(n)", "O(n)", "Omitting combiner on parallel reduce of non-associative ops.",
  "Staff: joining Collector is clearer; know combiner for whiteboard reduce.",
  javaSince="Java 8", tags=["reduce", "parallel"])

P("r03", "reduce", "Intermediate", "Reduce BigDecimal totals",
  "Sum payment amounts with BigDecimal reduce.",
  "[10.50, 2.00]", "12.50",
  '''BigDecimal total = amounts.stream()
  .reduce(BigDecimal.ZERO, BigDecimal::add);''',
  "stream → reduce(ZERO, add)", "Money aggregation must use BigDecimal.",
  "O(n)", "O(1)", "Summing money with double.",
  "ZERO is the correct identity for add.",
  javaSince="Java 8", tags=["reduce", "fintech"])

P("r04", "reduce", "Intermediate", "Optional reduce without identity",
  "Find longest string via reduce without identity.",
  '["java","stream","api"]', "Optional[stream]",
  '''Optional<String> longest = words.stream()
  .reduce((a, b) -> a.length() >= b.length() ? a : b);''',
  "stream → reduce(BinaryOperator)", "Empty stream → Optional.empty().",
  "O(n)", "O(1)", "Assuming reduce always returns a value.",
  "Contrast with max(Comparator.comparingInt(String::length)).",
  javaSince="Java 8")

P("r05", "reduce", "Advanced", "Mutable reduction anti-pattern",
  "Show why reduce into a shared mutable List is wrong vs collect.",
  "strings", "list",
  '''// WRONG under parallel:
List<String> bad = stream.reduce(new ArrayList<>(), (l, s) -> { l.add(s); return l; }, (a,b) -> { a.addAll(b); return a; });
// RIGHT:
List<String> ok = stream.collect(Collectors.toList());''',
  "collect → toList", "collect is designed for mutable reduction; reduce for immutable folds.",
  "O(n)", "O(n)", "Identity ArrayList shared across threads if mis-specified.",
  "Architect: use collect for mutable accumulators; reduce for pure folds.",
  javaSince="Java 8", tags=["reduce", "parallel"])

# ---------------------------------------------------------------------------
# COLLECTORS (5)
# ---------------------------------------------------------------------------
P("c01", "collectors", "Beginner", "toList / toSet / toCollection",
  "Collect names to List, Set, and LinkedList.",
  "names", "List / Set / LinkedList",
  '''List<String> list = names.stream().toList(); // unmodifiable
Set<String> set = names.stream().collect(Collectors.toSet());
LinkedList<String> ll = names.stream().collect(Collectors.toCollection(LinkedList::new));''',
  "stream → collect(toList|toSet|toCollection)", "Choose the collection semantics you need.",
  "O(n)", "O(n)", "Mutating Stream.toList() result (UnsupportedOperationException).",
  "Java 16 toList() is unmodifiable; use toCollection for mutable.",
  javaSince="Java 16")

P("c02", "collectors", "Intermediate", "summarizingInt",
  "Get count, sum, min, max, average of salaries in one pass.",
  "employees", "IntSummaryStatistics",
  "IntSummaryStatistics stats = employees.stream().collect(Collectors.summarizingInt(Employee::salary));",
  "stream → collect(summarizingInt)", "One pass multi-stat aggregation.",
  "O(n)", "O(1)", "Multiple separate sum/min/max passes on huge lists.",
  "summarizing* is ideal for dashboards.",
  javaSince="Java 8", tags=["collectors", "employee"])

P("c03", "collectors", "Intermediate", "averaging / summing",
  "Average and sum of order totals.",
  "orders", "avg and sum",
  '''double avg = orders.stream().collect(Collectors.averagingDouble(o -> o.total().doubleValue()));
BigDecimal sum = orders.stream().map(Order::total).reduce(BigDecimal.ZERO, BigDecimal::add);''',
  "stream → averagingDouble | reduce(BigDecimal)",
  "averagingDouble is convenient but lossy for money — prefer BigDecimal sum.",
  "O(n)", "O(1)", "Using averagingDouble for currency.",
  "FinTech interviews fail people who average money as double.",
  javaSince="Java 8")

P("c04", "collectors", "Beginner", "counting collector",
  "Count elements with Collectors.counting.",
  "stream of events", "Long",
  "long n = events.stream().collect(Collectors.counting());",
  "stream → collect(counting)", "Useful as a downstream collector.",
  "O(n)", "O(1)", "Using counting when stream.count() is enough.",
  "Prefer stream.count() unless nesting in groupingBy.",
  javaSince="Java 8")

P("c05", "collectors", "Advanced", "collectingAndThen wrap unmodifiable",
  "Collect to a mutable list then wrap as unmodifiable via collectingAndThen.",
  "tags", "unmodifiable List",
  '''List<String> frozen = tags.stream()
  .collect(Collectors.collectingAndThen(Collectors.toList(), List::copyOf));''',
  "stream → collectingAndThen(toList, copyOf)",
  "collectingAndThen finishes a downstream result with a finisher function.",
  "O(n)", "O(n)", "Returning the same mutable list from the finisher.",
  "Common pattern: toMap then Collections.unmodifiableMap.",
  javaSince="Java 8", tags=["collectors", "advanced-collectors"])

# ---------------------------------------------------------------------------
# GROUPING (15)
# ---------------------------------------------------------------------------
P("g01", "grouping", "Beginner", "groupingBy department",
  "Group employees by department.",
  "employees", "Map<String, List<Employee>>",
  '''Map<String, List<Employee>> byDept = employees.stream()
  .collect(Collectors.groupingBy(Employee::department));''',
  "stream → collect(groupingBy)", "Classic classifier → List downstream.",
  "O(n)", "O(n)", "Assuming map iteration order is sorted.",
  "Use groupingBy(classifier, TreeMap::new, downstream) for sorted keys.",
  javaSince="Java 8", tags=["grouping", "employee"])

P("g02", "grouping", "Intermediate", "groupingBy with counting",
  "Count employees per department.",
  "employees", "Map<String, Long>",
  '''Map<String, Long> counts = employees.stream()
  .collect(Collectors.groupingBy(Employee::department, Collectors.counting()));''',
  "stream → groupingBy(dept, counting)", "Downstream collectors specialize the value type.",
  "O(n)", "O(d)", "Expecting Integer instead of Long from counting.",
  "counting always returns Long.",
  javaSince="Java 8", tags=["grouping", "employee"])

P("g03", "grouping", "Intermediate", "groupingBy summing salaries",
  "Sum salary per department.",
  "employees", "Map<String, Integer>",
  '''Map<String, Integer> payroll = employees.stream()
  .collect(Collectors.groupingBy(Employee::department, Collectors.summingInt(Employee::salary)));''',
  "stream → groupingBy(dept, summingInt)", "Downstream numeric collectors avoid manual reduce.",
  "O(n)", "O(d)", "summingInt overflow for huge payrolls — use summingLong.",
  "Prefer Long for money-like ints at scale.",
  javaSince="Java 8", tags=["grouping", "employee"])

P("g04", "grouping", "Advanced", "Nested groupingBy",
  "Group by department then by title.",
  "employees", "Map<String, Map<String, List<Employee>>>",
  '''Map<String, Map<String, List<Employee>>> nested = employees.stream()
  .collect(Collectors.groupingBy(Employee::department,
      Collectors.groupingBy(Employee::title)));''',
  "stream → groupingBy(dept, groupingBy(title))",
  "Nested groupingBy builds multi-level reports.",
  "O(n)", "O(n)", "Deep nesting without a view/DTO becomes unreadable.",
  "Staff: two-level grouping is common; three+ levels need named types.",
  javaSince="Java 8", tags=["grouping", "employee"])

P("g05", "grouping", "Advanced", "groupingBy averagingDouble",
  "Average order value per customer.",
  "orders", "Map<String, Double>",
  '''Map<String, Double> avg = orders.stream()
  .collect(Collectors.groupingBy(Order::customerId,
      Collectors.averagingDouble(o -> o.total().doubleValue())));''',
  "stream → groupingBy(customer, averagingDouble)",
  "Downstream average for cohort metrics.",
  "O(n)", "O(c)", "Money as double in financial ledgers.",
  "For money, group then reduce BigDecimal separately.",
  javaSince="Java 8", tags=["grouping", "ecommerce"])

P("g06", "grouping", "Intermediate", "groupingBy mapping names",
  "Map department → list of employee names.",
  "employees", "Map<String, List<String>>",
  '''Map<String, List<String>> names = employees.stream()
  .collect(Collectors.groupingBy(Employee::department,
      Collectors.mapping(Employee::name, Collectors.toList())));''',
  "stream → groupingBy(dept, mapping(name, toList))",
  "mapping adapts element type before downstream collect.",
  "O(n)", "O(n)", "Forgetting mapping and ending with List<Employee> when names needed.",
  "mapping + joining is a frequent interview combo.",
  javaSince="Java 8", tags=["grouping", "employee"])

P("g07", "grouping", "Advanced", "groupingBy collectingAndThen max",
  "Per department, the highest-paid employee (Optional unwrapped).",
  "employees", "Map<String, Employee>",
  '''Map<String, Employee> top = employees.stream()
  .collect(Collectors.groupingBy(Employee::department,
      Collectors.collectingAndThen(
          Collectors.maxBy(Comparator.comparingInt(Employee::salary)),
          Optional::orElseThrow)));''',
  "stream → groupingBy(dept, collectingAndThen(maxBy, orElseThrow))",
  "Finish Optional downstream into a concrete value.",
  "O(n)", "O(d)", "orElseThrow when a group could theoretically be empty (it won't after grouping).",
  "Elegant pattern for 'best per group'.",
  javaSince="Java 8", tags=["grouping", "employee", "advanced-collectors"])

P("g08", "grouping", "Intermediate", "groupingBy to Set",
  "Unique job titles per department.",
  "employees", "Map<String, Set<String>>",
  '''Map<String, Set<String>> titles = employees.stream()
  .collect(Collectors.groupingBy(Employee::department,
      Collectors.mapping(Employee::title, Collectors.toSet())));''',
  "stream → groupingBy(dept, mapping(title, toSet))",
  "toSet downstream deduplicates within each group.",
  "O(n)", "O(n)", "toList when uniqueness is required.",
  "Choose Set vs List based on reporting needs.",
  javaSince="Java 8", tags=["grouping", "employee"])

P("g09", "grouping", "Advanced", "groupingByConcurrent",
  "Parallel group transactions by currency.",
  "transactions parallel", "ConcurrentMap<String, List<Tx>>",
  '''Map<String, List<Tx>> byCcy = txs.parallelStream()
  .collect(Collectors.groupingByConcurrent(Tx::currency));''',
  "parallelStream → groupingByConcurrent",
  "Concurrent grouping for parallel pipelines; key order not defined.",
  "O(n)", "O(n)", "Using groupingBy (non-concurrent) with parallelStream and shared mutable state.",
  "groupingByConcurrent returns ConcurrentMap; don't rely on ordering.",
  javaSince="Java 8", tags=["grouping", "parallel", "fintech"])

P("g10", "grouping", "Intermediate", "groupingBy filtering downstream",
  "Per department, only employees with salary >= 100000.",
  "employees", "Map with filtered lists",
  '''Map<String, List<Employee>> high = employees.stream()
  .collect(Collectors.groupingBy(Employee::department,
      Collectors.filtering(e -> e.salary() >= 100_000, Collectors.toList())));''',
  "stream → groupingBy(dept, filtering(pred, toList))",
  "filtering downstream keeps empty groups for departments with no matches.",
  "O(n)", "O(n)", "Pre-filter before grouping drops empty department keys.",
  "Interview nuance: filter before vs Collectors.filtering.",
  javaSince="Java 9", tags=["grouping", "employee"])

P("g11", "grouping", "Expert", "groupingBy teeing aggregates",
  "Per merchant, compute count and total amount together (teeing inside groups via custom approach).",
  "payments", "Map merchant → stats",
  '''record Stats(long count, BigDecimal total) {}
Map<String, Stats> byMerchant = payments.stream()
  .collect(Collectors.groupingBy(Payment::merchantId,
      Collectors.teeing(
          Collectors.counting(),
          Collectors.mapping(Payment::amount, Collectors.reducing(BigDecimal.ZERO, BigDecimal::add)),
          Stats::new)));''',
  "stream → groupingBy(merchant, teeing(counting, reducing))",
  "teeing runs two downstream collectors and merges results.",
  "O(n)", "O(m)", "Writing two separate grouping passes on large ledgers.",
  "Java 12+ teeing is a staff-level collector answer.",
  javaSince="Java 12", tags=["grouping", "fintech", "advanced-collectors"])

P("g12", "grouping", "Intermediate", "groupingBy order status",
  "Count orders by status (NEW, PAID, SHIPPED).",
  "orders", "Map<Status, Long>",
  '''Map<Status, Long> byStatus = orders.stream()
  .collect(Collectors.groupingBy(Order::status, Collectors.counting()));''',
  "stream → groupingBy(status, counting)", "Enum keys make reports type-safe.",
  "O(n)", "O(1)", "Stringly-typed status keys.",
  "Prefer enums for finite domain statuses.",
  javaSince="Java 8", tags=["grouping", "ecommerce"])

P("g13", "grouping", "Advanced", "groupingBy year-month",
  "Group trades by YearMonth of trade date.",
  "trades", "Map<YearMonth, List<Trade>>",
  '''Map<YearMonth, List<Trade>> byMonth = trades.stream()
  .collect(Collectors.groupingBy(t -> YearMonth.from(t.tradeDate())));''',
  "stream → groupingBy(YearMonth.from)", "Temporal classifiers for financial calendars.",
  "O(n)", "O(n)", "Grouping by Date.toString() formats.",
  "Use java.time classifiers, never legacy Date strings.",
  javaSince="Java 8", tags=["grouping", "fintech", "datetime-optional"])

P("g14", "grouping", "Staff", "groupingBy with TreeMap and summing",
  "Department payroll report with departments sorted alphabetically.",
  "employees", "TreeMap dept → sum",
  '''Map<String, Integer> report = employees.stream()
  .collect(Collectors.groupingBy(Employee::department, TreeMap::new,
      Collectors.summingInt(Employee::salary)));''',
  "stream → groupingBy(dept, TreeMap::new, summingInt)",
  "Supplier map type controls key ordering.",
  "O(n log d)", "O(d)", "HashMap when UI expects sorted keys.",
  "Pass map factory as second groupingBy arg.",
  javaSince="Java 8", tags=["grouping", "employee"])

P("g15", "grouping", "Intermediate", "groupingBy flatMapping skills",
  "Union of skills per department.",
  "employees with List<String> skills", "Map<String, Set<String>>",
  '''Map<String, Set<String>> skills = employees.stream()
  .collect(Collectors.groupingBy(Employee::department,
      Collectors.flatMapping(e -> e.skills().stream(), Collectors.toSet())));''',
  "stream → groupingBy(dept, flatMapping(skills, toSet))",
  "flatMapping flattens nested collections inside a group.",
  "O(n)", "O(n)", "mapping(List) instead of flatMapping(stream).",
  "Java 9 flatMapping is the clean nested-collection answer.",
  javaSince="Java 9", tags=["grouping", "employee"])

# ---------------------------------------------------------------------------
# PARTITIONING (4)
# ---------------------------------------------------------------------------
P("p01", "partitioning", "Beginner", "partitioningBy predicate",
  "Partition integers into even/odd.",
  "[1,2,3,4]", "{false=[1,3], true=[2,4]}",
  '''Map<Boolean, List<Integer>> parts = List.of(1,2,3,4).stream()
  .collect(Collectors.partitioningBy(n -> n % 2 == 0));''',
  "stream → partitioningBy(pred)", "Always returns both true and false keys.",
  "O(n)", "O(n)", "Expecting missing key when one side is empty — key still present with empty list.",
  "partitioningBy is a specialized groupingBy(Boolean).",
  javaSince="Java 8")

P("p02", "partitioning", "Intermediate", "partitioningBy employees high earner",
  "Partition employees by salary >= 150000.",
  "employees", "Map<Boolean, List<Employee>>",
  '''Map<Boolean, List<Employee>> bands = employees.stream()
  .collect(Collectors.partitioningBy(e -> e.salary() >= 150_000));''',
  "stream → partitioningBy(salary>=)", "Boolean partitions for HR bands.",
  "O(n)", "O(n)", "Using groupingBy with Boolean manually.",
  "Prefer partitioningBy for two-way splits.",
  javaSince="Java 8", tags=["partitioning", "employee"])

P("p03", "partitioning", "Advanced", "partitioningBy with downstream counting",
  "Count paid vs unpaid invoices.",
  "invoices", "Map<Boolean, Long>",
  '''Map<Boolean, Long> counts = invoices.stream()
  .collect(Collectors.partitioningBy(Invoice::paid, Collectors.counting()));''',
  "stream → partitioningBy(paid, counting)", "Downstream works like groupingBy.",
  "O(n)", "O(1)", "Ignoring that both keys always exist.",
  "Useful for KPI dashboards (paid ratio).",
  javaSince="Java 8", tags=["partitioning", "fintech"])

P("p04", "partitioning", "Intermediate", "partitioningBy prime check",
  "Partition 1..20 into primes vs non-primes.",
  "1..20", "true=primes",
  '''Map<Boolean, List<Integer>> parts = IntStream.rangeClosed(1, 20).boxed()
  .collect(Collectors.partitioningBy(n -> n > 1 && IntStream.rangeClosed(2, (int)Math.sqrt(n)).noneMatch(d -> n % d == 0)));''',
  "range → boxed → partitioningBy(isPrime)", "Illustrates partitioning with a non-trivial predicate.",
  "O(n√n)", "O(n)", "Calling isPrime with trial division in a hot path without caching.",
  "Show clarity first; optimize later.",
  javaSince="Java 8")

# ---------------------------------------------------------------------------
# TOMAP-JOINING (5)
# ---------------------------------------------------------------------------
P("tj01", "tomap-joining", "Beginner", "joining with delimiter",
  "Join names with comma and space.",
  '["Ada","Lin"]', "Ada, Lin",
  'String s = List.of("Ada","Lin").stream().collect(Collectors.joining(", "));',
  "stream → joining", "joining is the idiomatic Collector for String concatenation.",
  "O(n)", "O(n)", "reduce with + for many strings (quadratic risk).",
  "Prefer Collectors.joining over manual StringBuilder in Streams.",
  javaSince="Java 8")

P("tj02", "tomap-joining", "Intermediate", "toMap with merge function",
  "Build Map sku→qty merging duplicate SKUs by summing quantities.",
  "line items with duplicate sku", "{SKU1=5, ...}",
  '''Map<String, Integer> qty = items.stream()
  .collect(Collectors.toMap(LineItem::sku, LineItem::qty, Integer::sum));''',
  "stream → toMap(key, value, merge)",
  "Merge function resolves duplicate keys; without it duplicates throw.",
  "O(n)", "O(k)", "toMap without merge on duplicate keys → IllegalStateException.",
  "Always provide merge when keys may collide.",
  javaSince="Java 8", tags=["tomap-joining", "ecommerce"])

P("tj03", "tomap-joining", "Advanced", "toMap last-win LinkedHashMap",
  "Index employees by id keeping insertion order; last duplicate wins.",
  "employees possibly duplicate id", "LinkedHashMap",
  '''Map<String, Employee> byId = employees.stream()
  .collect(Collectors.toMap(Employee::id, Function.identity(), (a, b) -> b, LinkedHashMap::new));''',
  "stream → toMap(id, identity, last-win, LinkedHashMap)",
  "Four-arg toMap controls map type and collision policy.",
  "O(n)", "O(n)", "First-win vs last-win ambiguity in ETL.",
  "Document merge policy in data ingestion code.",
  javaSince="Java 8", tags=["tomap-joining", "employee"])

P("tj04", "tomap-joining", "Intermediate", "joining with prefix suffix",
  "Render SQL IN clause list.",
  '["u1","u2"]', "(u1,u2)",
  'String in = ids.stream().collect(Collectors.joining(",", "(", ")"));',
  "stream → joining(delim, prefix, suffix)", "Prefix/suffix form complete literal fragments.",
  "O(n)", "O(n)", "SQL injection if ids aren't sanitized — Streams don't make SQL safe.",
  "Use parameters/bind variables; joining is only for display or trusted ids.",
  javaSince="Java 8")

P("tj05", "tomap-joining", "Expert", "toMap with BigDecimal merge",
  "Aggregate ledger entries accountId → balance delta.",
  "entries", "Map<String, BigDecimal>",
  '''Map<String, BigDecimal> balances = entries.stream()
  .collect(Collectors.toMap(Entry::accountId, Entry::amount, BigDecimal::add));''',
  "stream → toMap(account, amount, BigDecimal::add)",
  "Merge with BigDecimal::add for monetary aggregation.",
  "O(n)", "O(a)", "double sums for balances.",
  "Core FinTech Stream pattern.",
  javaSince="Java 8", tags=["tomap-joining", "fintech"])

# ---------------------------------------------------------------------------
# TOPN-NTH (5)
# ---------------------------------------------------------------------------
P("tn01", "topn-nth", "Intermediate", "Top N salaries",
  "Return top 3 salaries descending.",
  "salary list", "[220000, 180000, 150000]",
  '''List<Integer> top3 = salaries.stream()
  .sorted(Comparator.reverseOrder())
  .limit(3)
  .toList();''',
  "stream → sorted(desc) → limit(3)", "Simple top-N via sort+limit.",
  "O(n log n)", "O(n)", "For huge n, sort-all is wasteful vs heap of size k.",
  "Mention PriorityQueue for O(n log k) follow-up.",
  javaSince="Java 16")

P("tn02", "topn-nth", "Advanced", "Nth highest distinct vs non-distinct",
  "Find 2nd highest distinct salary vs 2nd highest allowing duplicates.",
  "[100,100,90,80]", "distinct 2nd=90; non-distinct 2nd=100",
  '''OptionalInt secondDistinct = salaries.stream().mapToInt(Integer::intValue)
  .distinct().boxed().sorted(Comparator.reverseOrder()).skip(1).mapToInt(Integer::intValue).findFirst();
OptionalInt secondRaw = salaries.stream().mapToInt(Integer::intValue)
  .boxed().sorted(Comparator.reverseOrder()).skip(1).mapToInt(Integer::intValue).findFirst();''',
  "stream → (distinct?) → sorted(desc) → skip(n-1) → findFirst",
  "Interviewers test whether you distinct before ranking.",
  "O(n log n)", "O(n)", "Forgetting distinct when the problem says unique salaries.",
  "Clarify distinct vs multiset ranking before coding.",
  javaSince="Java 8", tags=["topn-nth", "employee"])

P("tn03", "topn-nth", "Intermediate", "Nth order by total",
  "Find the 3rd largest order by BigDecimal total.",
  "orders", "Optional<Order>",
  '''Optional<Order> third = orders.stream()
  .sorted(Comparator.comparing(Order::total).reversed())
  .skip(2)
  .findFirst();''',
  "stream → sorted(desc total) → skip(2) → findFirst",
  "skip(n-1)+findFirst is the nth pattern.",
  "O(n log n)", "O(n)", "skip(3) off-by-one for 3rd.",
  "State n clearly; off-by-one is the common bug.",
  javaSince="Java 16", tags=["topn-nth", "ecommerce"])

P("tn04", "topn-nth", "Expert", "Top N per group",
  "Top 2 earners per department.",
  "employees", "Map<String, List<Employee>>",
  '''Map<String, List<Employee>> top2 = employees.stream()
  .collect(Collectors.groupingBy(Employee::department,
      Collectors.collectingAndThen(Collectors.toList(), list -> list.stream()
          .sorted(Comparator.comparingInt(Employee::salary).reversed())
          .limit(2)
          .toList())));''',
  "groupingBy → collectingAndThen(sort+limit)",
  "Per-group top-N needs finisher sort or a custom accumulator.",
  "O(n log n)", "O(n)", "Global top-N then group (wrong).",
  "Staff follow-up: bounded PriorityQueue per group.",
  javaSince="Java 16", tags=["topn-nth", "grouping", "employee"])

P("tn05", "topn-nth", "Beginner", "First N words",
  "Take first 5 words from a list.",
  "words", "5 words",
  "List<String> first = words.stream().limit(5).toList();",
  "stream → limit → toList", "limit without sort = first encounter order.",
  "O(k)", "O(k)", "Calling this top-N when order isn't ranked.",
  "Name the method carefully: prefix vs top.",
  javaSince="Java 16")

# ---------------------------------------------------------------------------
# DUPLICATES-FREQ (5)
# ---------------------------------------------------------------------------
P("df01", "duplicates-freq", "Beginner", "Frequency map with groupingBy",
  "Build frequency map of words.",
  '["a","b","a"]', "{a=2, b=1}",
  '''Map<String, Long> freq = words.stream()
  .collect(Collectors.groupingBy(Function.identity(), Collectors.counting()));''',
  "stream → groupingBy(identity, counting)", "Standard frequency histogram.",
  "O(n)", "O(k)", "toMap without merge on duplicates.",
  "groupingBy+counting is the default interview answer.",
  javaSince="Java 8")

P("df02", "duplicates-freq", "Intermediate", "Find duplicates only",
  "Return elements that appear more than once.",
  "[1,2,2,3,3,3]", "[2, 3]",
  '''List<Integer> dups = nums.stream()
  .collect(Collectors.groupingBy(Function.identity(), Collectors.counting()))
  .entrySet().stream()
  .filter(e -> e.getValue() > 1)
  .map(Map.Entry::getKey)
  .toList();''',
  "groupingBy → filter(count>1) → keys", "Two-stage: count then filter.",
  "O(n)", "O(k)", "Using distinct thinking it returns duplicates.",
  "distinct removes dups; it does not list them.",
  javaSince="Java 16")

P("df03", "duplicates-freq", "Advanced", "First non-repeated character",
  "Find the first character in a string that appears exactly once.",
  '"swiss"', "w",
  '''Optional<Character> first = "swiss".chars()
  .mapToObj(c -> (char) c)
  .collect(Collectors.groupingBy(Function.identity(), LinkedHashMap::new, Collectors.counting()))
  .entrySet().stream()
  .filter(e -> e.getValue() == 1)
  .map(Map.Entry::getKey)
  .findFirst();''',
  "chars → groupingBy(LinkedHashMap, counting) → filter → findFirst",
  "LinkedHashMap preserves first-seen order for 'first' semantics.",
  "O(n)", "O(1) alphabet", "HashMap loses encounter order for first-non-repeated.",
  "Classic string+Stream interview question.",
  javaSince="Java 8", tags=["duplicates-freq", "strings"])

P("df04", "duplicates-freq", "Intermediate", "Mode of a list",
  "Find the most frequent integer (mode).",
  "[1,1,2,2,2,3]", "2",
  '''Optional<Integer> mode = nums.stream()
  .collect(Collectors.groupingBy(Function.identity(), Collectors.counting()))
  .entrySet().stream()
  .max(Map.Entry.comparingByValue())
  .map(Map.Entry::getKey);''',
  "groupingBy → max(byValue)", "Mode via frequency then max.",
  "O(n)", "O(k)", "Undefined behavior on ties — specify policy.",
  "Clarify tie-break in product requirements.",
  javaSince="Java 8")

P("df05", "duplicates-freq", "Expert", "Duplicate emails in employees",
  "List emails that appear more than once.",
  "employees", "[dup@corp.com]",
  '''List<String> dupEmails = employees.stream()
  .collect(Collectors.groupingBy(Employee::email, Collectors.counting()))
  .entrySet().stream()
  .filter(e -> e.getValue() > 1)
  .map(Map.Entry::getKey)
  .toList();''',
  "groupingBy(email, counting) → filter", "Data-quality check via Streams.",
  "O(n)", "O(n)", "Case-sensitive email compare without normalizing.",
  "Normalize email.toLowerCase(Locale.ROOT) before grouping.",
  javaSince="Java 16", tags=["duplicates-freq", "employee"])

# ---------------------------------------------------------------------------
# STRINGS (15)
# ---------------------------------------------------------------------------
P("s01", "strings", "Beginner", "Count characters",
  "Count occurrences of a character in a string via chars().",
  '"banana", char a', "3",
  'long n = "banana".chars().filter(c -> c == \'a\').count();',
  "chars → filter → count", "chars() is IntStream of UTF-16 code units.",
  "O(n)", "O(1)", "chars() vs codePoints() for supplementary chars.",
  "Mention codePoints in Unicode follow-ups.",
  javaSince="Java 8")

P("s02", "strings", "Intermediate", "Anagram check with Streams",
  "Check if two strings are anagrams (ignore case, ignore spaces).",
  '"Listen","Silent"', "true",
  '''boolean anagram = Stream.of(a, b)
  .map(s -> s.toLowerCase(Locale.ROOT).replaceAll("\\\\s+", ""))
  .map(s -> s.chars().sorted().mapToObj(c -> String.valueOf((char)c)).collect(Collectors.joining()))
  .distinct().count() == 1;''',
  "normalize → sort chars → compare", "Anagrams share the same sorted character multiset.",
  "O(n log n)", "O(n)", "Not normalizing case/spaces.",
  "Alternative: frequency maps with groupingBy.",
  alternative='''Map<Character, Long> freq(String s) {
  return s.toLowerCase(Locale.ROOT).replaceAll("\\\\s+", "").chars()
    .mapToObj(c -> (char)c)
    .collect(Collectors.groupingBy(Function.identity(), Collectors.counting()));
}
boolean ok = freq(a).equals(freq(b));''',
  javaSince="Java 8")

P("s03", "strings", "Intermediate", "Reverse words in sentence",
  "Reverse word order using Streams.",
  '"java stream api"', "api stream java",
  '''String rev = Arrays.stream("java stream api".split("\\\\s+"))
  .collect(Collectors.collectingAndThen(Collectors.toList(), list -> {
    Collections.reverse(list);
    return String.join(" ", list);
  }));''',
  "split → stream → reverse list → join", "collectingAndThen allows an in-place reverse finisher.",
  "O(n)", "O(n)", "Reversing characters instead of words.",
  "Clarify word vs character reverse.",
  javaSince="Java 8")

P("s04", "strings", "Beginner", "Join with joining",
  "CSV-join tokens.",
  '["a","b","c"]', "a,b,c",
  'String csv = Stream.of("a","b","c").collect(Collectors.joining(","));',
  "stream → joining", "Idiomatic join.",
  "O(n)", "O(n)", "Trailing comma from manual loops.",
  "joining handles separators cleanly.",
  javaSince="Java 8")

P("s05", "strings", "Advanced", "Longest word",
  "Find longest word in a sentence.",
  '"the stream pipeline"', "pipeline",
  '''Optional<String> longest = Arrays.stream(sentence.split("\\\\s+"))
  .max(Comparator.comparingInt(String::length));''',
  "split → stream → max(by length)", "max with Comparator on length.",
  "O(n)", "O(1)", "Ties — define first vs last policy.",
  "thenComparing for stable tie-break.",
  javaSince="Java 8")

P("s06", "strings", "Intermediate", "Palindrome words filter",
  "Keep palindromic tokens ignoring case.",
  '"Level stream Kayak"', "[Level, Kayak]",
  '''List<String> pals = Arrays.stream(sentence.split("\\\\s+"))
  .filter(w -> {
    String s = w.toLowerCase(Locale.ROOT);
    return new StringBuilder(s).reverse().toString().equals(s);
  })
  .toList();''',
  "split → filter(palindrome) → toList", "Filter with a local normalization.",
  "O(n*m)", "O(k)", "Mutating StringBuilder across elements.",
  "Keep predicate pure.",
  javaSince="Java 16")

P("s07", "strings", "Expert", "First non-repeated char (string category)",
  "Return first non-repeated character or empty.",
  '"aabbcdde"', "c",
  '''Optional<Character> c = "aabbcdde".chars().mapToObj(ch -> (char) ch)
  .collect(Collectors.groupingBy(Function.identity(), LinkedHashMap::new, Collectors.counting()))
  .entrySet().stream().filter(e -> e.getValue() == 1).map(Map.Entry::getKey).findFirst();''',
  "chars → LinkedHashMap frequencies → findFirst count==1",
  "Order-preserving frequency map.",
  "O(n)", "O(alphabet)", "Using HashMap then min index scan without care.",
  "LinkedHashMap is the Stream-friendly solution.",
  javaSince="Java 8")

P("s08", "strings", "Intermediate", "Remove duplicate chars preserve order",
  "Distinct characters in encounter order.",
  '"banana"', "ban",
  '''String out = "banana".chars().mapToObj(c -> String.valueOf((char)c))
  .distinct().collect(Collectors.joining());''',
  "chars → mapToObj → distinct → joining", "distinct preserves encounter order sequentially.",
  "O(n)", "O(k)", "Parallel distinct order.",
  "Keep sequential for order-sensitive string transforms.",
  javaSince="Java 8")

P("s09", "strings", "Beginner", "Count vowels",
  "Count vowels in a word.",
  '"Meridian"', "4",
  'long v = "Meridian".toLowerCase(Locale.ROOT).chars().filter(c -> "aeiou".indexOf(c) >= 0).count();',
  "chars → filter(vowel) → count", "Simple IntStream filter.",
  "O(n)", "O(1)", "Locale issues with Turkish i.",
  "Use Locale.ROOT for ASCII-oriented interview problems.",
  javaSince="Java 8")

P("s10", "strings", "Advanced", "Group words by length",
  "Map length → list of words.",
  '["java","go","rust","c"]', "{4=[java,rust], 2=[go], 1=[c]}",
  '''Map<Integer, List<String>> byLen = words.stream()
  .collect(Collectors.groupingBy(String::length));''',
  "stream → groupingBy(length)", "Classifier on String::length.",
  "O(n)", "O(n)", "Sorting groups without TreeMap.",
  "Add TreeMap::new if sorted lengths required.",
  javaSince="Java 8")

P("s11", "strings", "Intermediate", "Pattern.splitAsStream",
  "Extract numbers from a noisy string.",
  '"order-12,qty=3;ok"', "[12, 3]",
  '''List<Integer> nums = Pattern.compile("\\\\D+").splitAsStream("order-12,qty=3;ok")
  .filter(s -> !s.isBlank())
  .map(Integer::valueOf)
  .toList();''',
  "Pattern.splitAsStream → filter → map → toList",
  "splitAsStream avoids intermediate arrays.",
  "O(n)", "O(k)", "Compiling Pattern inside a loop.",
  "Reuse static final Pattern.",
  javaSince="Java 8")

P("s12", "strings", "Staff", "Case-insensitive frequency",
  "Word frequency ignoring case.",
  '"Java java JAVA"', "{java=3}",
  '''Map<String, Long> freq = Arrays.stream(text.split("\\\\s+"))
  .map(s -> s.toLowerCase(Locale.ROOT))
  .collect(Collectors.groupingBy(Function.identity(), Collectors.counting()));''',
  "split → toLowerCase → groupingBy counting",
  "Normalize before grouping.",
  "O(n)", "O(k)", "Grouping raw case variants as different keys.",
  "Normalize early in text pipelines.",
  javaSince="Java 8")

P("s13", "strings", "Beginner", "StartsWith filter",
  "Filter packages starting with com.bank.",
  "package names", "filtered list",
  'List<String> bank = pkgs.stream().filter(p -> p.startsWith("com.bank.")).toList();',
  "stream → filter(startsWith) → toList", "Prefix filter.",
  "O(n)", "O(k)", "regex when startsWith suffices.",
  "Prefer startsWith for literal prefixes.",
  javaSince="Java 16")

P("s14", "strings", "Advanced", "Longest common prefix via Streams (pairwise reduce)",
  "Find LCP of a list of strings using reduce.",
  '["flower","flow","flight"]', "fl",
  '''Optional<String> lcp = words.stream().reduce((a, b) -> {
  int i = 0;
  int n = Math.min(a.length(), b.length());
  while (i < n && a.charAt(i) == b.charAt(i)) i++;
  return a.substring(0, i);
});''',
  "stream → reduce(pairwise LCP)", "Associative LCP reduction.",
  "O(n*m)", "O(m)", "Parallel reduce with non-associative string ops carefully.",
  "LCP reduce is associative — parallel-safe.",
  javaSince="Java 8")

P("s15", "strings", "Intermediate", "Sort by length then alpha",
  "Sort words by length ascending, then alphabetically.",
  '["pear","fig","apple"]', "[fig, pear, apple]",
  '''List<String> sorted = words.stream()
  .sorted(Comparator.comparingInt(String::length).thenComparing(Comparator.naturalOrder()))
  .toList();''',
  "stream → sorted(length then alpha) → toList", "thenComparing chains criteria.",
  "O(n log n)", "O(n)", "Only sorting by length leaving unstable ties.",
  "Always define tie-breakers in interviews.",
  javaSince="Java 16")

# ---------------------------------------------------------------------------
# ARRAYS-LISTS (5)
# ---------------------------------------------------------------------------
P("al01", "arrays-lists", "Beginner", "Array to Stream sum",
  "Sum int array.",
  "[1,2,3]", "6",
  "int sum = Arrays.stream(new int[]{1,2,3}).sum();",
  "Arrays.stream → sum", "Arrays.stream for primitives.",
  "O(n)", "O(1)", "Stream.of(intArray) boxes to Stream<int[]> one element.",
  "Critical trap: Stream.of(array) vs Arrays.stream(array).",
  javaSince="Java 8")

P("al02", "arrays-lists", "Intermediate", "Two lists zip via IntStream",
  "Zip names and scores into 'name=score' strings.",
  "names, scores same length", "[Ada=10, ...]",
  '''List<String> zipped = IntStream.range(0, names.size())
  .mapToObj(i -> names.get(i) + "=" + scores.get(i))
  .toList();''',
  "IntStream.range → mapToObj → toList", "Index-based zip without third-party libs.",
  "O(n)", "O(n)", "Assuming lists same size without check.",
  "Validate sizes; Streams don't zip natively.",
  javaSince="Java 16")

P("al03", "arrays-lists", "Intermediate", "Partition list by predicate to two lists",
  "Split numbers into evens and odds lists via partitioningBy.",
  "[1,2,3,4]", "evens/odds",
  '''Map<Boolean, List<Integer>> m = nums.stream().collect(Collectors.partitioningBy(n -> n % 2 == 0));
List<Integer> evens = m.get(true);
List<Integer> odds = m.get(false);''',
  "stream → partitioningBy", "Cleaner than two filters.",
  "O(n)", "O(n)", "Two-pass filter for both sides on huge data.",
  "One pass with partitioningBy.",
  javaSince="Java 8")

P("al04", "arrays-lists", "Advanced", "Sliding window sums",
  "Compute sum of each window of size k.",
  "[1,2,3,4,5], k=3", "[6,9,12]",
  '''List<Integer> windowSums = IntStream.rangeClosed(0, nums.size() - k)
  .mapToObj(i -> nums.subList(i, i + k).stream().mapToInt(Integer::intValue).sum())
  .toList();''',
  "range → mapToObj(subList sum)", "Index windows over a random-access list.",
  "O(n*k)", "O(n)", "subList on non-RandomAccess lists repeatedly.",
  "Follow-up: O(n) sliding with running sum.",
  javaSince="Java 16")

P("al05", "arrays-lists", "Beginner", "Convert Stream to array",
  "Materialize String stream to array.",
  '["a","b"]', "String[]",
  'String[] arr = Stream.of("a","b").toArray(String[]::new);',
  "stream → toArray(generator)", "toArray with generator avoids Object[].",
  "O(n)", "O(n)", "toArray() returning Object[].",
  "Always pass String[]::new (or typed generator).",
  javaSince="Java 8")

# ---------------------------------------------------------------------------
# MAPS (4)
# ---------------------------------------------------------------------------
P("mp01", "maps", "Beginner", "Stream map values",
  "Collect values greater than 10.",
  "{a:5,b:15}", "[15]",
  '''List<Integer> vals = map.values().stream().filter(v -> v > 10).toList();''',
  "values → filter → toList", "Stream map.values() or entrySet().",
  "O(n)", "O(k)", "map.stream() compile error.",
  "entrySet when you need keys too.",
  javaSince="Java 16")

P("mp02", "maps", "Intermediate", "Invert map (value → list of keys)",
  "Invert Map<String,String> grouping keys by value.",
  "{a:X,b:Y,c:X}", "{X=[a,c], Y=[b]}",
  '''Map<String, List<String>> inverted = map.entrySet().stream()
  .collect(Collectors.groupingBy(Map.Entry::getValue,
      Collectors.mapping(Map.Entry::getKey, Collectors.toList())));''',
  "entrySet → groupingBy(value, mapping(key))",
  "Multi-valued invert handles non-unique values.",
  "O(n)", "O(n)", "toMap invert without merge on duplicate values.",
  "groupingBy is the safe invert.",
  javaSince="Java 8")

P("mp03", "maps", "Advanced", "Sort map by value",
  "Return keys sorted by value descending.",
  "{a:2,b:5,c:1}", "[b, a, c]",
  '''List<String> keys = map.entrySet().stream()
  .sorted(Map.Entry.<String,Integer>comparingByValue().reversed())
  .map(Map.Entry::getKey)
  .toList();''',
  "entrySet → sorted(byValue) → map(key)", "Maps don't sort in place via Streams; produce a list/LinkedHashMap.",
  "O(n log n)", "O(n)", "Expecting HashMap to become sorted.",
  "Collect to LinkedHashMap if a map view is required.",
  javaSince="Java 16")

P("mp04", "maps", "Intermediate", "Merge two maps with Streams",
  "Merge two Map<String,Integer> summing values for common keys.",
  "m1, m2", "merged sums",
  '''Map<String, Integer> merged = Stream.concat(m1.entrySet().stream(), m2.entrySet().stream())
  .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue, Integer::sum));''',
  "concat(entrySet streams) → toMap(sum)", "concat + merge function.",
  "O(n)", "O(k)", "putAll overwriting instead of summing.",
  "Map.merge in a loop is also fine; Streams shine for multi-source.",
  javaSince="Java 8")

# ---------------------------------------------------------------------------
# EMPLOYEE (35)
# ---------------------------------------------------------------------------
P("emp01", "employee", "Beginner", "List employee names",
  "Collect all employee names.",
  "List<Employee>", "[...]",
  "List<String> names = employees.stream().map(Employee::name).toList();",
  "stream → map(name) → toList", "Basic projection.",
  "O(n)", "O(n)", "Null names without filter.",
  "record Employee(String id, String name, String department, int salary, String title, String email, List<String> skills, boolean contractor) {}",
  javaSince="Java 16")

P("emp02", "employee", "Beginner", "Filter by department ENG",
  "Engineering employees only.",
  "employees", "ENG list",
  'List<Employee> eng = employees.stream().filter(e -> "ENG".equals(e.department())).toList();',
  "stream → filter(dept) → toList", "Department filter.",
  "O(n)", "O(k)", "Null department NPE with e.department().equals.",
  "Constant.equals(variable) pattern.",
  javaSince="Java 16")

P("emp03", "employee", "Intermediate", "Average salary by department",
  "Map department → average salary.",
  "employees", "Map<String, Double>",
  '''Map<String, Double> avg = employees.stream()
  .collect(Collectors.groupingBy(Employee::department, Collectors.averagingInt(Employee::salary)));''',
  "groupingBy(dept, averagingInt)", "HR analytics staple.",
  "O(n)", "O(d)", "Integer division mistakes if manual.",
  "averagingInt returns Double.",
  javaSince="Java 8")

P("emp04", "employee", "Intermediate", "Highest paid employee",
  "Find max salary employee.",
  "employees", "Optional<Employee>",
  "Optional<Employee> top = employees.stream().max(Comparator.comparingInt(Employee::salary));",
  "stream → max(salary)", "Optional max.",
  "O(n)", "O(1)", "get() on empty company list.",
  "orElseThrow with domain exception.",
  javaSince="Java 8")

P("emp05", "employee", "Intermediate", "Sort by salary then name",
  "Order employees for a compensation report.",
  "employees", "sorted list",
  '''List<Employee> sorted = employees.stream()
  .sorted(Comparator.comparingInt(Employee::salary).reversed().thenComparing(Employee::name))
  .toList();''',
  "stream → sorted → toList", "Stable multi-key sort.",
  "O(n log n)", "O(n)", "Inconsistent ordering across pages without total order.",
  "thenComparing prevents jittery ties.",
  javaSince="Java 16")

P("emp06", "employee", "Advanced", "Top earner per department",
  "Map dept → highest paid employee.",
  "employees", "Map<String, Employee>",
  '''Map<String, Employee> top = employees.stream()
  .collect(Collectors.groupingBy(Employee::department,
      Collectors.collectingAndThen(
          Collectors.maxBy(Comparator.comparingInt(Employee::salary)),
          Optional::orElseThrow)));''',
  "groupingBy → maxBy → orElseThrow", "Best-per-group pattern.",
  "O(n)", "O(d)", "Multiple employees same max without tie-break.",
  "Add thenComparing(name) inside maxBy.",
  javaSince="Java 8")

P("emp07", "employee", "Intermediate", "Payroll total",
  "Sum all salaries.",
  "employees", "int/long sum",
  "long payroll = employees.stream().mapToLong(Employee::salary).sum();",
  "stream → mapToLong → sum", "Avoid int overflow.",
  "O(n)", "O(1)", "mapToInt.sum on large orgs.",
  "Use long for payroll aggregates.",
  javaSince="Java 8")

P("emp08", "employee", "Beginner", "Count contractors",
  "How many contractors?",
  "employees", "long",
  "long n = employees.stream().filter(Employee::contractor).count();",
  "stream → filter(contractor) → count", "Boolean accessor filter.",
  "O(n)", "O(1)", "Counting with collect(counting) verbosity.",
  "count() is enough.",
  javaSince="Java 8")

P("emp09", "employee", "Advanced", "Partition full-time vs contractor",
  "Partition by contractor flag.",
  "employees", "Map<Boolean, List<Employee>>",
  "Map<Boolean, List<Employee>> parts = employees.stream().collect(Collectors.partitioningBy(Employee::contractor));",
  "stream → partitioningBy(contractor)", "Workforce split.",
  "O(n)", "O(n)", "Missing false key assumption.",
  "Both keys always present.",
  javaSince="Java 8")

P("emp10", "employee", "Intermediate", "Employees with salary in range",
  "Filter salary between 80k and 120k inclusive.",
  "employees", "filtered",
  '''List<Employee> mid = employees.stream()
  .filter(e -> e.salary() >= 80_000 && e.salary() <= 120_000)
  .toList();''',
  "stream → filter(range) → toList", "Inclusive band filter.",
  "O(n)", "O(k)", "Off-by-one on bounds.",
  "Confirm inclusive/exclusive with interviewer.",
  javaSince="Java 16")

P("emp11", "employee", "Advanced", "Department headcount and payroll",
  "Using teeing at top level: total headcount and total payroll.",
  "employees", "record(count, payroll)",
  '''record HeadcountPayroll(long count, long payroll) {}
HeadcountPayroll hp = employees.stream().collect(Collectors.teeing(
  Collectors.counting(),
  Collectors.summingLong(Employee::salary),
  HeadcountPayroll::new));''',
  "stream → teeing(counting, summingLong)", "Single-pass dual aggregate.",
  "O(n)", "O(1)", "Two separate stream passes without need.",
  "teeing is Java 12+ interview signal.",
  javaSince="Java 12")

P("emp12", "employee", "Intermediate", "Join names in department",
  "Comma-separated ENG names sorted.",
  "employees", "Ada, Grace, Linus",
  '''String names = employees.stream()
  .filter(e -> "ENG".equals(e.department()))
  .map(Employee::name)
  .sorted()
  .collect(Collectors.joining(", "));''',
  "filter → map → sorted → joining", "Readable roster string.",
  "O(n log k)", "O(k)", "Unsorted joining for UI lists.",
  "Sort before joining for deterministic UI.",
  javaSince="Java 8")

P("emp13", "employee", "Expert", "Detect duplicate emails",
  "Find emails used by more than one employee.",
  "employees", "dup emails",
  '''Set<String> dups = employees.stream()
  .collect(Collectors.groupingBy(e -> e.email().toLowerCase(Locale.ROOT), Collectors.counting()))
  .entrySet().stream()
  .filter(e -> e.getValue() > 1)
  .map(Map.Entry::getKey)
  .collect(Collectors.toSet());''',
  "groupingBy(email) → filter count>1", "HR data quality.",
  "O(n)", "O(n)", "Case-sensitive duplicates missed.",
  "Normalize emails.",
  javaSince="Java 8")

P("emp14", "employee", "Intermediate", "Group titles per department",
  "Map dept → set of titles.",
  "employees", "Map<String, Set<String>>",
  '''Map<String, Set<String>> titles = employees.stream()
  .collect(Collectors.groupingBy(Employee::department,
      Collectors.mapping(Employee::title, Collectors.toSet())));''',
  "groupingBy → mapping → toSet", "Org structure summary.",
  "O(n)", "O(n)", "List with duplicates when Set needed.",
  "toSet for uniqueness.",
  javaSince="Java 8")

P("emp15", "employee", "Advanced", "Nth highest salary distinct",
  "Return the nth highest distinct salary.",
  "employees, n=3", "3rd distinct salary",
  '''OptionalInt nth = employees.stream().mapToInt(Employee::salary).distinct()
  .boxed().sorted(Comparator.reverseOrder()).skip(n - 1L).mapToInt(Integer::intValue).findFirst();''',
  "mapToInt → distinct → sorted desc → skip → findFirst",
  "Distinct ranking for compensation bands.",
  "O(n log n)", "O(n)", "Skipping without distinct when required.",
  "Confirm distinct with interviewer.",
  javaSince="Java 8")

P("emp16", "employee", "Beginner", "Any employee in Sales",
  "Boolean: is there at least one SALES employee?",
  "employees", "true/false",
  'boolean ok = employees.stream().anyMatch(e -> "SALES".equals(e.department()));',
  "stream → anyMatch", "Existence check.",
  "O(k)", "O(1)", "filter+findFirst verbosity.",
  "anyMatch is the clearest API.",
  javaSince="Java 8")

P("emp17", "employee", "Intermediate", "Skills flatMap search",
  "Find employees who have skill 'Kafka'.",
  "employees.skills", "filtered employees",
  '''List<Employee> kafka = employees.stream()
  .filter(e -> e.skills().stream().anyMatch(s -> s.equalsIgnoreCase("Kafka")))
  .toList();''',
  "stream → filter(skills.anyMatch) → toList", "Nested stream for membership.",
  "O(n*s)", "O(k)", "flatMap skills then losing employee context.",
  "Keep employee as outer stream; query skills inside.",
  javaSince="Java 16")

P("emp18", "employee", "Advanced", "All skills union",
  "Unique skills across company.",
  "employees", "Set<String>",
  '''Set<String> all = employees.stream()
  .flatMap(e -> e.skills().stream())
  .collect(Collectors.toCollection(TreeSet::new));''',
  "flatMap(skills) → TreeSet", "Company skill inventory.",
  "O(n log k)", "O(k)", "Null skills list.",
  "Empty list over null.",
  javaSince="Java 8")

P("emp19", "employee", "Staff", "Salary raise simulation",
  "Return new list with ENG salaries * 1.10 (immutable records).",
  "employees", "updated list",
  '''List<Employee> raised = employees.stream()
  .map(e -> "ENG".equals(e.department())
      ? new Employee(e.id(), e.name(), e.department(), (int)(e.salary()*1.10), e.title(), e.email(), e.skills(), e.contractor())
      : e)
  .toList();''',
  "stream → map(copy with raise) → toList", "Immutable update via map.",
  "O(n)", "O(n)", "Mutating employee objects inside peek.",
  "map to new records; never mutate in peek.",
  javaSince="Java 16")

P("emp20", "employee", "Intermediate", "Median salary (sort)",
  "Compute median salary (odd/even sizes).",
  "employees", "median double",
  '''double median = employees.stream().mapToInt(Employee::salary).sorted().toArray() instanceof int[] a
  ? (a.length % 2 == 1 ? a[a.length/2] : (a[a.length/2 - 1] + a[a.length/2]) / 2.0)
  : 0;''',
  "mapToInt → sorted → toArray → median index", "Classic median after sort.",
  "O(n log n)", "O(n)", "Average vs median confusion.",
  "Clarify odd/even policy.",
  javaSince="Java 8")

P("emp21", "employee", "Expert", "Managers vs ICs by title prefix",
  "Partition titles starting with 'Manager'.",
  "employees", "partition map",
  '''Map<Boolean, List<Employee>> parts = employees.stream()
  .collect(Collectors.partitioningBy(e -> e.title().startsWith("Manager")));''',
  "stream → partitioningBy(title prefix)", "Org role split.",
  "O(n)", "O(n)", "Fragile string prefix vs role enum.",
  "Prefer Role enum in real systems.",
  javaSince="Java 8")

P("emp22", "employee", "Intermediate", "Group by first letter of name",
  "Directory index by starting letter.",
  "employees", "Map<Character, List<Employee>>",
  '''Map<Character, List<Employee>> dir = employees.stream()
  .collect(Collectors.groupingBy(e -> Character.toUpperCase(e.name().charAt(0))));''',
  "stream → groupingBy(first letter)", "Phonebook style index.",
  "O(n)", "O(n)", "Empty name charAt(0).",
  "Guard blank names.",
  javaSince="Java 8")

P("emp23", "employee", "Advanced", "Compare department averages",
  "Return department with highest average salary.",
  "employees", "Optional<String> dept",
  '''Optional<String> best = employees.stream()
  .collect(Collectors.groupingBy(Employee::department, Collectors.averagingInt(Employee::salary)))
  .entrySet().stream()
  .max(Map.Entry.comparingByValue())
  .map(Map.Entry::getKey);''',
  "groupingBy averaging → max entry", "Leadership metric.",
  "O(n)", "O(d)", "Empty map max.",
  "Handle empty company.",
  javaSince="Java 8")

P("emp24", "employee", "Beginner", "Map id to employee",
  "Index employees by id (unique).",
  "employees", "Map<String, Employee>",
  '''Map<String, Employee> byId = employees.stream()
  .collect(Collectors.toMap(Employee::id, Function.identity()));''',
  "stream → toMap(id, identity)", "Primary key index.",
  "O(n)", "O(n)", "Duplicate ids without merge.",
  "Provide merge or ensure uniqueness upstream.",
  javaSince="Java 8")

P("emp25", "employee", "Intermediate", "Filter then sort page",
  "ENG employees, salary desc, page size 10.",
  "employees", "page list",
  '''List<Employee> page = employees.stream()
  .filter(e -> "ENG".equals(e.department()))
  .sorted(Comparator.comparingInt(Employee::salary).reversed())
  .limit(10)
  .toList();''',
  "filter → sorted → limit", "Filtered top page.",
  "O(n log n)", "O(k)", "limit before sorted.",
  "Order of intermediate ops matters.",
  javaSince="Java 16")

P("emp26", "employee", "Advanced", "Nested group dept → title → names",
  "Build Map dept → title → joined names.",
  "employees", "nested map of strings",
  '''Map<String, Map<String, String>> roster = employees.stream()
  .collect(Collectors.groupingBy(Employee::department,
      Collectors.groupingBy(Employee::title,
          Collectors.mapping(Employee::name, Collectors.joining(", ")))));''',
  "groupingBy → groupingBy → mapping joining", "Nested HR roster.",
  "O(n)", "O(n)", "Too much nesting for API payloads.",
  "Consider DTOs beyond two levels.",
  javaSince="Java 8")

P("emp27", "employee", "Staff", "Salary band histogram",
  "Bucket salaries: <50k, 50-100k, 100k+.",
  "employees", "Map<String, Long>",
  '''Map<String, Long> bands = employees.stream().collect(Collectors.groupingBy(e -> {
  int s = e.salary();
  if (s < 50_000) return "<50k";
  if (s < 100_000) return "50-100k";
  return "100k+";
}, Collectors.counting()));''',
  "stream → groupingBy(band classifier, counting)", "Compensation distribution.",
  "O(n)", "O(1)", "Overlapping band predicates.",
  "Use clear half-open intervals.",
  javaSince="Java 8")

P("emp28", "employee", "Intermediate", "AllMatch positive salary",
  "Validate all salaries are positive.",
  "employees", "boolean",
  "boolean ok = employees.stream().allMatch(e -> e.salary() > 0);",
  "stream → allMatch", "Data validation.",
  "O(n)", "O(1)", "Vacuous true on empty list — may hide bugs.",
  "Decide empty policy explicitly.",
  javaSince="Java 8")

P("emp29", "employee", "Expert", "Find first employee by email domain",
  "findFirst employee with email ending @meridian.bank.",
  "employees", "Optional<Employee>",
  '''Optional<Employee> e = employees.stream()
  .filter(x -> x.email().endsWith("@meridian.bank"))
  .findFirst();''',
  "stream → filter → findFirst", "Domain membership.",
  "O(n)", "O(1)", "findAny when order matters for HR seniority lists.",
  "findFirst for encounter-order dependent rules.",
  javaSince="Java 8")

P("emp30", "employee", "Advanced", "CollectingAndThen to unmodifiable dept map",
  "Unmodifiable map of dept → employee list.",
  "employees", "unmodifiable map",
  '''Map<String, List<Employee>> frozen = employees.stream()
  .collect(Collectors.collectingAndThen(
      Collectors.groupingBy(Employee::department),
      Map::copyOf));''',
  "groupingBy → collectingAndThen(Map::copyOf)", "Defensive publish of reports.",
  "O(n)", "O(n)", "Map.copyOf does shallow freeze — lists inside still mutable if not copied.",
  "Deep freeze needs mapping lists to List.copyOf too.",
  javaSince="Java 10")

P("emp31", "employee", "Intermediate", "Min salary in department",
  "Minimum salary in ENG.",
  "employees", "OptionalInt",
  '''OptionalInt min = employees.stream()
  .filter(e -> "ENG".equals(e.department()))
  .mapToInt(Employee::salary)
  .min();''',
  "filter → mapToInt → min", "Dept-scoped aggregate.",
  "O(n)", "O(1)", "min on empty OptionalInt.",
  "orElseThrow / orElse.",
  javaSince="Java 8")

P("emp32", "employee", "Beginner", "Distinct departments",
  "Sorted unique departments.",
  "employees", "[ENG, HR, ...]",
  '''List<String> deps = employees.stream().map(Employee::department).distinct().sorted().toList();''',
  "map → distinct → sorted → toList", "Org unit list.",
  "O(n log n)", "O(d)", "distinct after sorted vs before — both OK; sorted after distinct is fine.",
  "TreeSet collector also works.",
  javaSince="Java 16")

P("emp33", "employee", "Architect", "Parallel payroll sum with caution",
  "Parallel sum salaries when n is large and CPU-bound.",
  "1e6 employees", "long sum",
  "long sum = employees.parallelStream().mapToLong(Employee::salary).sum();",
  "parallelStream → mapToLong → sum", "Associative sum is parallel-safe.",
  "O(n/p)", "O(1)", "parallelStream for tiny lists or blocking HR calls inside map.",
  "Only parallelize pure CPU aggregates on large datasets.",
  javaSince="Java 8", tags=["employee", "parallel"])

P("emp34", "employee", "Advanced", "Employees joined this year via Optional date",
  "Filter employees whose Optional<LocalDate> startDate is present and in current year.",
  "employees with Optional startDate", "filtered",
  '''int year = Year.now().getValue();
List<Employee> newbie = employees.stream()
  .filter(e -> e.startDate().filter(d -> d.getYear() == year).isPresent())
  .toList();''',
  "stream → filter(Optional date year)", "Optional in domain filters.",
  "O(n)", "O(k)", "get() on Optional startDate.",
  "Use Optional.filter / stream.",
  javaSince="Java 8", tags=["employee", "datetime-optional"])

P("emp35", "employee", "Staff", "Department skill matrix",
  "Map dept → skill → employee count having that skill.",
  "employees", "Map<String, Map<String, Long>>",
  '''Map<String, Map<String, Long>> matrix = employees.stream()
  .flatMap(e -> e.skills().stream().map(skill -> Map.entry(e.department(), skill)))
  .collect(Collectors.groupingBy(Map.Entry::getKey,
      Collectors.groupingBy(Map.Entry::getValue, Collectors.counting())));''',
  "flatMap(dept,skill pairs) → nested groupingBy counting",
  "Capability heatmap for org planning.",
  "O(n*s)", "O(d*s)", "Cartesian explosion without care.",
  "Architect-level nested grouping with flatMap pair expansion.",
  javaSince="Java 9")

# ---------------------------------------------------------------------------
# ECOMMERCE (12)
# ---------------------------------------------------------------------------
P("ec01", "ecommerce", "Beginner", "Order totals list",
  "Map orders to BigDecimal totals.",
  "orders", "list of totals",
  "List<BigDecimal> totals = orders.stream().map(Order::total).toList();",
  "stream → map(total) → toList", "Order projection.",
  "O(n)", "O(n)", "Using double for money.",
  "record Order(String id, String customerId, Status status, BigDecimal total, List<LineItem> items, Instant createdAt) {}",
  javaSince="Java 16")

P("ec02", "ecommerce", "Intermediate", "GMV sum",
  "Gross merchandise value: sum of order totals.",
  "orders", "BigDecimal GMV",
  "BigDecimal gmv = orders.stream().map(Order::total).reduce(BigDecimal.ZERO, BigDecimal::add);",
  "stream → map(total) → reduce(add)", "GMV aggregation.",
  "O(n)", "O(1)", "double GMV.",
  "BigDecimal ZERO identity.",
  javaSince="Java 8")

P("ec03", "ecommerce", "Intermediate", "Orders by status count",
  "Count orders per Status enum.",
  "orders", "Map<Status, Long>",
  '''Map<Status, Long> byStatus = orders.stream()
  .collect(Collectors.groupingBy(Order::status, Collectors.counting()));''',
  "groupingBy(status, counting)", "Fulfillment dashboard.",
  "O(n)", "O(1)", "String status typos.",
  "Enum status keys.",
  javaSince="Java 8")

P("ec04", "ecommerce", "Advanced", "Flatten line item SKUs",
  "All SKUs across all orders.",
  "orders.items", "List<String>",
  '''List<String> skus = orders.stream()
  .flatMap(o -> o.items().stream())
  .map(LineItem::sku)
  .toList();''',
  "orders → flatMap(items) → map(sku)", "Catalog pull from carts.",
  "O(n)", "O(n)", "Null items.",
  "Empty list default.",
  javaSince="Java 16")

P("ec05", "ecommerce", "Advanced", "SKU quantity merge toMap",
  "Aggregate quantity per SKU across all orders.",
  "orders", "Map<String, Integer>",
  '''Map<String, Integer> qty = orders.stream()
  .flatMap(o -> o.items().stream())
  .collect(Collectors.toMap(LineItem::sku, LineItem::qty, Integer::sum));''',
  "flatMap items → toMap(sku, qty, sum)", "Inventory demand signal.",
  "O(n)", "O(skus)", "toMap without merge.",
  "Always merge quantities.",
  javaSince="Java 8")

P("ec06", "ecommerce", "Intermediate", "Top customers by spend",
  "Top 5 customerIds by sum of totals.",
  "orders", "List<String> customer ids",
  '''List<String> top = orders.stream()
  .collect(Collectors.groupingBy(Order::customerId,
      Collectors.mapping(Order::total, Collectors.reducing(BigDecimal.ZERO, BigDecimal::add))))
  .entrySet().stream()
  .sorted(Map.Entry.<String, BigDecimal>comparingByValue().reversed())
  .limit(5)
  .map(Map.Entry::getKey)
  .toList();''',
  "groupingBy spend → sort → limit", "VIP customers.",
  "O(n log c)", "O(c)", "Averaging instead of summing spend.",
  "Reduce BigDecimal per customer.",
  javaSince="Java 16")

P("ec07", "ecommerce", "Beginner", "Filter PAID orders",
  "Keep orders with Status.PAID.",
  "orders", "paid orders",
  "List<Order> paid = orders.stream().filter(o -> o.status() == Status.PAID).toList();",
  "stream → filter(PAID) → toList", "Payment-complete subset.",
  "O(n)", "O(k)", "equals on enums unnecessarily.",
  "== for enum status.",
  javaSince="Java 16")

P("ec08", "ecommerce", "Expert", "Average basket size (items count)",
  "Average number of line items per order.",
  "orders", "double",
  '''double avgBasket = orders.stream()
  .collect(Collectors.averagingInt(o -> o.items().size()));''',
  "stream → averagingInt(items.size)", "Basket analytics.",
  "O(n)", "O(1)", "Averaging totals instead of item counts.",
  "Clarify basket size metric.",
  javaSince="Java 8")

P("ec09", "ecommerce", "Advanced", "Partition free shipping",
  "Partition orders by total >= 50 for free shipping.",
  "orders", "Map<Boolean, List<Order>>",
  '''Map<Boolean, List<Order>> parts = orders.stream()
  .collect(Collectors.partitioningBy(o -> o.total().compareTo(new BigDecimal("50.00")) >= 0));''',
  "stream → partitioningBy(total>=50)", "Shipping threshold.",
  "O(n)", "O(n)", "Comparing BigDecimal with equals for threshold.",
  "compareTo for numeric thresholds.",
  javaSince="Java 8")

P("ec10", "ecommerce", "Intermediate", "Recent orders limit",
  "Latest 20 orders by createdAt desc.",
  "orders", "20 orders",
  '''List<Order> recent = orders.stream()
  .sorted(Comparator.comparing(Order::createdAt).reversed())
  .limit(20)
  .toList();''',
  "sorted(createdAt desc) → limit", "Activity feed.",
  "O(n log n)", "O(k)", "Sorting after limit.",
  "Sort then limit.",
  javaSince="Java 16")

P("ec11", "ecommerce", "Staff", "Revenue by day",
  "Sum totals grouped by LocalDate of createdAt.",
  "orders", "Map<LocalDate, BigDecimal>",
  '''Map<LocalDate, BigDecimal> byDay = orders.stream()
  .collect(Collectors.groupingBy(o -> LocalDate.ofInstant(o.createdAt(), ZoneOffset.UTC),
      Collectors.mapping(Order::total, Collectors.reducing(BigDecimal.ZERO, BigDecimal::add))));''',
  "groupingBy(date) → reducing BigDecimal", "Daily revenue report.",
  "O(n)", "O(days)", "System default zone surprises.",
  "Pin ZoneOffset/ZoneId explicitly.",
  javaSince="Java 8", tags=["ecommerce", "datetime-optional"])

P("ec12", "ecommerce", "Advanced", "Distinct products purchased by customer",
  "For one customerId, distinct SKUs ordered.",
  "orders, customer C1", "sorted SKUs",
  '''List<String> skus = orders.stream()
  .filter(o -> "C1".equals(o.customerId()))
  .flatMap(o -> o.items().stream())
  .map(LineItem::sku)
  .distinct()
  .sorted()
  .toList();''',
  "filter → flatMap → map → distinct → sorted", "Customer purchase history.",
  "O(n log k)", "O(k)", "distinct without sorted when UI needs alpha order.",
  "distinct then sorted for display.",
  javaSince="Java 16")

# ---------------------------------------------------------------------------
# FINTECH (15)
# ---------------------------------------------------------------------------
P("ft01", "fintech", "Beginner", "Sum payment amounts",
  "Sum BigDecimal payment amounts.",
  "payments", "total",
  "BigDecimal total = payments.stream().map(Payment::amount).reduce(BigDecimal.ZERO, BigDecimal::add);",
  "stream → map(amount) → reduce(add)", "Ledger sum.",
  "O(n)", "O(1)", "double for currency.",
  "record Payment(String id, String merchantId, String currency, BigDecimal amount, boolean settled, Instant bookedAt) {}",
  javaSince="Java 8")

P("ft02", "fintech", "Intermediate", "Group volume by currency",
  "Sum amounts per ISO currency code.",
  "payments", "Map<String, BigDecimal>",
  '''Map<String, BigDecimal> byCcy = payments.stream()
  .collect(Collectors.toMap(Payment::currency, Payment::amount, BigDecimal::add));''',
  "stream → toMap(ccy, amount, add)", "Multi-currency book.",
  "O(n)", "O(c)", "Mixing FX without conversion.",
  "Don't sum different currencies into one total without FX.",
  javaSince="Java 8")

P("ft03", "fintech", "Intermediate", "Filter settled payments",
  "Only settled=true payments.",
  "payments", "settled list",
  "List<Payment> settled = payments.stream().filter(Payment::settled).toList();",
  "stream → filter(settled) → toList", "Settlement subset.",
  "O(n)", "O(k)", "Confusing booked vs settled.",
  "Name domain flags carefully.",
  javaSince="Java 16")

P("ft04", "fintech", "Advanced", "High-value transaction alert",
  "Payments with amount compareTo 10_000 >= 0.",
  "payments", "alerts",
  '''List<Payment> hv = payments.stream()
  .filter(p -> p.amount().compareTo(new BigDecimal("10000")) >= 0)
  .toList();''',
  "stream → filter(amount>=10k)", "AML-style thresholding (illustrative).",
  "O(n)", "O(k)", "Using double thresholds.",
  "BigDecimal thresholds from config.",
  javaSince="Java 16")

P("ft05", "fintech", "Expert", "Merchant teeing count and volume",
  "Per merchantId: count and total amount.",
  "payments", "Map to Stats",
  '''record MerchantStats(long count, BigDecimal volume) {}
Map<String, MerchantStats> stats = payments.stream()
  .collect(Collectors.groupingBy(Payment::merchantId,
      Collectors.teeing(
          Collectors.counting(),
          Collectors.mapping(Payment::amount, Collectors.reducing(BigDecimal.ZERO, BigDecimal::add)),
          MerchantStats::new)));''',
  "groupingBy → teeing(count, volume)", "Merchant performance.",
  "O(n)", "O(m)", "Two grouping passes.",
  "teeing downstream is staff-level.",
  javaSince="Java 12")

P("ft06", "fintech", "Intermediate", "Sort by amount desc",
  "Rank payments by amount.",
  "payments", "sorted",
  '''List<Payment> ranked = payments.stream()
  .sorted(Comparator.comparing(Payment::amount).reversed())
  .toList();''',
  "stream → sorted(amount desc)", "Value ranking.",
  "O(n log n)", "O(n)", "equals vs compareTo scale issues for uniqueness.",
  "compareTo for ordering money.",
  javaSince="Java 16")

P("ft07", "fintech", "Advanced", "Daily settled volume",
  "Sum settled amounts by UTC date.",
  "payments", "Map<LocalDate, BigDecimal>",
  '''Map<LocalDate, BigDecimal> daily = payments.stream()
  .filter(Payment::settled)
  .collect(Collectors.groupingBy(p -> LocalDate.ofInstant(p.bookedAt(), ZoneOffset.UTC),
      Collectors.mapping(Payment::amount, Collectors.reducing(BigDecimal.ZERO, BigDecimal::add))));''',
  "filter settled → groupingBy(date) → reduce", "Ops settlement report.",
  "O(n)", "O(days)", "Local timezone drift.",
  "Fix ZoneOffset in financial reporting.",
  javaSince="Java 8", tags=["fintech", "datetime-optional"])

P("ft08", "fintech", "Beginner", "Count by currency",
  "Number of payments per currency.",
  "payments", "Map<String, Long>",
  '''Map<String, Long> counts = payments.stream()
  .collect(Collectors.groupingBy(Payment::currency, Collectors.counting()));''',
  "groupingBy(currency, counting)", "Traffic mix.",
  "O(n)", "O(c)", "Assuming only USD.",
  "Always group multi-ccy explicitly.",
  javaSince="Java 8")

P("ft09", "fintech", "Staff", "Running balance style reduce",
  "Compute ending balance from ordered signed ledger deltas.",
  "List<BigDecimal> deltas", "ending balance",
  "BigDecimal end = deltas.stream().reduce(BigDecimal.ZERO, BigDecimal::add);",
  "stream → reduce(ZERO, add)", "Ledger fold.",
  "O(n)", "O(1)", "Parallel unordered ledger reduce when order defines causality — usually sequential.",
  "Keep ledger folds sequential when audit order matters.",
  javaSince="Java 8")

P("ft10", "fintech", "Intermediate", "Partition settled vs open",
  "partitioningBy settled flag.",
  "payments", "Map<Boolean, List<Payment>>",
  "Map<Boolean, List<Payment>> parts = payments.stream().collect(Collectors.partitioningBy(Payment::settled));",
  "stream → partitioningBy(settled)", "Settlement WIP vs done.",
  "O(n)", "O(n)", "Empty side missing key myth.",
  "Both keys exist.",
  javaSince="Java 8")

P("ft11", "fintech", "Advanced", "Top N merchants by volume",
  "Top 3 merchants by summed amount.",
  "payments", "List merchantIds",
  '''List<String> top = payments.stream()
  .collect(Collectors.groupingBy(Payment::merchantId,
      Collectors.mapping(Payment::amount, Collectors.reducing(BigDecimal.ZERO, BigDecimal::add))))
  .entrySet().stream()
  .sorted(Map.Entry.<String, BigDecimal>comparingByValue().reversed())
  .limit(3)
  .map(Map.Entry::getKey)
  .toList();''',
  "groupingBy volume → sort → limit", "Partner ranking.",
  "O(n log m)", "O(m)", "Top-N before aggregate.",
  "Aggregate then rank.",
  javaSince="Java 16")

P("ft12", "fintech", "Expert", "FX-aware filter then convert (illustrative)",
  "Filter USD payments and scale amounts by a given FX rate to INR (BigDecimal).",
  "payments, rate", "INR amounts",
  '''BigDecimal rate = new BigDecimal("83.20");
List<BigDecimal> inr = payments.stream()
  .filter(p -> "USD".equals(p.currency()))
  .map(p -> p.amount().multiply(rate))
  .toList();''',
  "filter(USD) → map(multiply FX)", "Simple FX projection (not a full FX engine).",
  "O(n)", "O(k)", "Floating FX rates.",
  "Use BigDecimal rate tables; document as-of time.",
  javaSince="Java 16")

P("ft13", "fintech", "Intermediate", "FindAny failed payment id parallel",
  "Discover any unsettled payment id using findAny on parallel stream.",
  "payments", "Optional id",
  '''Optional<String> id = payments.parallelStream()
  .filter(p -> !p.settled())
  .map(Payment::id)
  .findAny();''',
  "parallelStream → filter → map → findAny", "Existence witness without order.",
  "O(n/p)", "O(1)", "findFirst when any unsettled is enough — slower parallel.",
  "findAny for unordered existence in parallel.",
  javaSince="Java 8", tags=["fintech", "parallel"])

P("ft14", "fintech", "Architect", "Idempotent ledger merge by payment id",
  "toMap payment id → payment, last booked wins.",
  "payments possibly redelivered", "Map id→Payment",
  '''Map<String, Payment> idem = payments.stream()
  .collect(Collectors.toMap(Payment::id, Function.identity(),
      (a, b) -> a.bookedAt().isAfter(b.bookedAt()) ? a : b));''',
  "stream → toMap(id, identity, latest booked)", "At-least-once ingestion dedupe.",
  "O(n)", "O(n)", "First-win silently dropping newer bookings.",
  "Merge by business timestamp, not encounter order.",
  javaSince="Java 8")

P("ft15", "fintech", "Advanced", "Percentile-ish top 1% by amount (approx via sort)",
  "Take top 1% payments by amount (ceil at least 1).",
  "payments n>=1", "top slice",
  '''int k = Math.max(1, (int)Math.ceil(payments.size() * 0.01));
List<Payment> top = payments.stream()
  .sorted(Comparator.comparing(Payment::amount).reversed())
  .limit(k)
  .toList();''',
  "sorted desc → limit(1%)", "High-value cohort.",
  "O(n log n)", "O(k)", "True percentile algorithms differ — say so.",
  "Clarify approximate vs exact percentile.",
  javaSince="Java 16")

# ---------------------------------------------------------------------------
# DATETIME-OPTIONAL (5)
# ---------------------------------------------------------------------------
P("dt01", "datetime-optional", "Beginner", "Optional orElse",
  "Map Optional names to upper or default.",
  'Optional.of("ada")', "ADA",
  'String name = Optional.of("ada").map(String::toUpperCase).orElse("UNKNOWN");',
  "Optional → map → orElse", "Optional is not a Stream but pairs with map/flatMap.",
  "O(1)", "O(1)", "orElse(getExpensive()) always evaluates — use orElseGet.",
  "orElseGet for lazy defaults.",
  javaSince="Java 8")

P("dt02", "datetime-optional", "Intermediate", "Optional.stream in pipeline",
  "FlatMap list of Optional<LocalDate> to dates in 2024.",
  "Optionals of dates", "2024 dates",
  '''List<LocalDate> dates = optionals.stream()
  .flatMap(Optional::stream)
  .filter(d -> d.getYear() == 2024)
  .toList();''',
  "stream → flatMap(Optional::stream) → filter → toList",
  "Optional.stream bridges to Stream API.",
  "O(n)", "O(k)", "filter(isPresent).map(get).",
  "Optional::stream is preferred.",
  javaSince="Java 9")

P("dt03", "datetime-optional", "Advanced", "Group events by YearMonth",
  "Group Instant events by YearMonth UTC.",
  "events", "Map<YearMonth, Long>",
  '''Map<YearMonth, Long> byMonth = events.stream()
  .collect(Collectors.groupingBy(
      e -> YearMonth.from(LocalDate.ofInstant(e.at(), ZoneOffset.UTC)),
      Collectors.counting()));''',
  "stream → groupingBy(YearMonth) → counting", "Time-bucket KPIs.",
  "O(n)", "O(m)", "System zone default.",
  "Be explicit with ZoneOffset.",
  javaSince="Java 8")

P("dt04", "datetime-optional", "Intermediate", "Filter weekends",
  "Keep LocalDates that are weekdays.",
  "dates", "Mon-Fri",
  '''List<LocalDate> weekdays = dates.stream()
  .filter(d -> d.getDayOfWeek().getValue() <= 5)
  .toList();''',
  "stream → filter(weekday) → toList", "Business-day filter.",
  "O(n)", "O(k)", "Ignoring holidays — mention limitation.",
  "Weekday ≠ business day in banking.",
  javaSince="Java 16")

P("dt05", "datetime-optional", "Expert", "Earliest Optional timestamp",
  "Min of Optional<Instant> values that are present.",
  "list of Optional<Instant>", "Optional min",
  '''Optional<Instant> earliest = stamps.stream()
  .flatMap(Optional::stream)
  .min(Comparator.naturalOrder());''',
  "flatMap(Optional::stream) → min", "Earliest present event.",
  "O(n)", "O(1)", "Comparing empty Optionals directly.",
  "Flatten first, then min.",
  javaSince="Java 9")

# ---------------------------------------------------------------------------
# PARALLEL (12)
# ---------------------------------------------------------------------------
P("par01", "parallel", "Advanced", "Parallel sum associative",
  "Parallel sum of 1..1_000_000.",
  "range", "500000500000",
  "long sum = LongStream.rangeClosed(1, 1_000_000).parallel().sum();",
  "range → parallel → sum", "Associative reduction parallelizes well.",
  "O(n/p)", "O(1)", "Parallel on tiny n — overhead dominates.",
  "Measure; don't cargo-cult parallel.",
  javaSince="Java 8")

P("par02", "parallel", "Expert", "Mutable state trap in parallel",
  "Show why a shared ArrayList add in forEach/parallel is unsafe.",
  "parallel stream", "race / CME / lost updates",
  '''List<Integer> unsafe = new ArrayList<>();
IntStream.range(0, 1000).parallel().forEach(unsafe::add); // BROKEN
List<Integer> safe = IntStream.range(0, 1000).parallel().boxed().toList();''',
  "parallel → collect/toList (safe) vs shared mutable (unsafe)",
  "Parallel + shared mutable structure is a classic production bug.",
  "O(n)", "O(n)", "Synchronizing ArrayList as a 'fix' — still poor design.",
  "Prefer concurrent collectors / toList; never mutate shared lists.",
  javaSince="Java 8", tags=["parallel", "production"])

P("par03", "parallel", "Advanced", "findFirst vs findAny parallel",
  "Explain performance/order trade-off.",
  "parallel filtered stream", "Optional",
  '''Optional<Integer> ordered = IntStream.range(0, 10_000).parallel().filter(i -> i % 997 == 0).findFirst();
Optional<Integer> any = IntStream.range(0, 10_000).parallel().filter(i -> i % 997 == 0).findAny();''',
  "parallel → filter → findFirst|findAny",
  "findFirst may do more coordination to respect order.",
  "O(n/p)", "O(1)", "Asserting findAny == findFirst in tests under parallel.",
  "Tests for findAny must allow any matching value.",
  javaSince="Java 8")

P("par04", "parallel", "Staff", "Distinct-by-key parallel safe",
  "Deduplicate employees by email under parallel using ConcurrentHashMap.",
  "employees parallel", "unique by email",
  '''Map<String, Employee> uniq = employees.parallelStream()
  .collect(Collectors.toConcurrentMap(Employee::email, Function.identity(), (a, b) -> a));''',
  "parallelStream → toConcurrentMap(email, identity, first)",
  "Concurrent map merge is the safe distinct-by-key.",
  "O(n)", "O(n)", "HashSet seen in filter with parallelStream.",
  "toConcurrentMap or groupingByConcurrent.",
  javaSince="Java 8", tags=["parallel", "distinct"])

P("par05", "parallel", "Intermediate", "parallelStream vs stream.parallel",
  "Two ways to request parallel execution.",
  "list", "parallel pipeline",
  '''long a = list.parallelStream().mapToLong(Long::longValue).sum();
long b = list.stream().parallel().mapToLong(Long::longValue).sum();''',
  "parallelStream | stream.parallel → sum", "Equivalent parallel flags.",
  "O(n/p)", "O(1)", "Calling sequential() later accidentally.",
  "Know sequential()/parallel() toggles.",
  javaSince="Java 8")

P("par06", "parallel", "Architect", "commonPool blocking trap",
  "Why blocking IO inside parallel map starves ForkJoinPool.commonPool.",
  "URLs", "don't",
  '''// BAD: urls.parallelStream().map(this::httpGet).toList();
// GOOD: use a dedicated Executor / reactive IO; keep commonPool CPU-bound.''',
  "avoid parallel + blocking IO", "commonPool is shared JVM-wide.",
  "N/A", "N/A", "parallelStream for HTTP fan-out.",
  "Architect red flag: blocking in commonPool.",
  javaSince="Java 8", tags=["parallel", "production"])

P("par07", "parallel", "Advanced", "Reduce combiner required",
  "Parallel reduce of sets needs combiner.",
  "stream of ints", "sum of squares",
  '''int sumSq = IntStream.rangeClosed(1, 100).parallel()
  .reduce(0, (acc, x) -> acc + x * x); // IntStream 2-arg reduce OK
// For Stream<T> parallel reduce of non-associative string concat, provide combiner.''',
  "parallel → reduce(+ combiner when needed)", "Combiner merges partials.",
  "O(n)", "O(1)", "Identity side effects in accumulator.",
  "Identity must be true identity; accumulator/combiner associative.",
  javaSince="Java 8")

P("par08", "parallel", "Expert", "groupingBy vs groupingByConcurrent",
  "Parallel group merchants safely.",
  "payments", "ConcurrentMap",
  '''Map<String, List<Payment>> m = payments.parallelStream()
  .collect(Collectors.groupingByConcurrent(Payment::merchantId));''',
  "parallelStream → groupingByConcurrent", "Thread-safe grouping.",
  "O(n)", "O(n)", "groupingBy with parallel and custom non-concurrent downstream mutation.",
  "Prefer groupingByConcurrent for parallel grouping.",
  javaSince="Java 8")

P("par09", "parallel", "Intermediate", "Unordered for speed",
  "Call unordered() before distinct on parallel to relax constraints.",
  "parallel stream", "faster distinct possibly",
  '''long n = data.parallelStream().unordered().distinct().count();''',
  "parallel → unordered → distinct → count", "unordered removes encounter-order constraints.",
  "O(n)", "O(k)", "unordered when caller needed stable order.",
  "Document that unordered sacrifices determinism.",
  javaSince="Java 8")

P("par10", "parallel", "Staff", "Thread-confined mutable accumulator via collect",
  "Correct mutable parallel collection with Collector.",
  "strings", "List",
  '''List<String> out = strings.parallelStream()
  .collect(Collectors.toList()); // supplier/accumulator/combiner managed''',
  "parallelStream → collect(toList)", "Collector contract handles partial lists.",
  "O(n)", "O(n)", "reduce(new ArrayList(), ... ) sharing one list identity.",
  "collect is the mutable parallel story.",
  javaSince="Java 8")

P("par11", "parallel", "Advanced", "Side-effect logging race",
  "Why peek(System.out::println) order is nondeterministic in parallel.",
  "parallel", "jumbled logs",
  '''list.parallelStream().peek(System.out::println).toList();''',
  "parallel → peek → toList", "Encounter order not preserved for peek side effects.",
  "O(n)", "O(n)", "Relying on peek order in parallel for audit logs.",
  "Log after sequential materialization if order matters.",
  javaSince="Java 8")

P("par12", "parallel", "Expert", "Custom Spliterator awareness",
  "Note that poor splitability (linked lists) hurts parallel speedup.",
  "LinkedList vs ArrayList", "weak speedup on LinkedList",
  '''// ArrayList / arrays split well; LinkedList splits poorly.
long sum = arrayList.parallelStream().mapToLong(Long::longValue).sum();''',
  "parallelStream on random-access sources", "Parallel efficiency depends on Spliterator.",
  "O(n/p) best", "O(1)", "Expecting LinkedList parallel to scale linearly.",
  "Know your source's Spliterator characteristics.",
  javaSince="Java 8")

# ---------------------------------------------------------------------------
# ADVANCED-COLLECTORS (5)
# ---------------------------------------------------------------------------
P("ac01", "advanced-collectors", "Expert", "Collectors.teeing basics",
  "Compute count and sum of ints in one pass with teeing.",
  "[1,2,3,4]", "count=4 sum=10",
  '''record CountSum(long count, int sum) {}
CountSum cs = List.of(1,2,3,4).stream().collect(Collectors.teeing(
  Collectors.counting(),
  Collectors.summingInt(Integer::intValue),
  CountSum::new));''',
  "stream → teeing(counting, summingInt, merge)", "Dual collector fan-out.",
  "O(n)", "O(1)", "Java version < 12.",
  "teeing is Java 12+.",
  javaSince="Java 12")

P("ac02", "advanced-collectors", "Advanced", "collectingAndThen to unmodifiable Set",
  "Finish toSet with Set.copyOf.",
  "tags", "unmodifiable Set",
  '''Set<String> frozen = tags.stream()
  .collect(Collectors.collectingAndThen(Collectors.toSet(), Set::copyOf));''',
  "collectingAndThen(toSet, copyOf)", "Finisher transforms result.",
  "O(n)", "O(n)", "Returning mutable set from API.",
  "Defensive copies at API boundaries.",
  javaSince="Java 10")

P("ac03", "advanced-collectors", "Staff", "filtering + flatMapping combo",
  "Group orders by customer keeping only SKUs starting with 'A'.",
  "orders", "Map customer → Set sku",
  '''Map<String, Set<String>> m = orders.stream()
  .collect(Collectors.groupingBy(Order::customerId,
      Collectors.flatMapping(o -> o.items().stream().map(LineItem::sku),
          Collectors.filtering(sku -> sku.startsWith("A"), Collectors.toSet()))));''',
  "groupingBy → flatMapping → filtering → toSet", "Java 9 downstream combinators.",
  "O(n)", "O(n)", "Wrong order filtering vs flatMapping.",
  "Compose downstream collectors deliberately.",
  javaSince="Java 9", tags=["advanced-collectors", "ecommerce"])

P("ac04", "advanced-collectors", "Expert", "Custom Collector sketch via of",
  "Outline Collector.of for joining uniquely with '|'.",
  "strings", "a|b|c",
  '''Collector<String, ?, String> uniquePipe = Collector.of(
  LinkedHashSet::new,
  Set::add,
  (a, b) -> { a.addAll(b); return a; },
  set -> String.join("|", set));
String out = stream.collect(uniquePipe);''',
  "Collector.of(supplier, acc, combiner, finisher)", "Custom collector anatomy.",
  "O(n)", "O(n)", "Non-concurrent collector used with CONCURRENT characteristic wrongly.",
  "Know the four functions + characteristics.",
  javaSince="Java 8")

P("ac05", "advanced-collectors", "Architect", "teeing min and max salary",
  "Single pass min and max employee salary.",
  "employees", "record(min,max)",
  '''record MinMax(int min, int max) {}
MinMax mm = employees.stream().collect(Collectors.teeing(
  Collectors.collectingAndThen(Collectors.minBy(Comparator.comparingInt(Employee::salary)),
      o -> o.orElseThrow().salary()),
  Collectors.collectingAndThen(Collectors.maxBy(Comparator.comparingInt(Employee::salary)),
      o -> o.orElseThrow().salary()),
  MinMax::new));''',
  "teeing(minBy, maxBy)", "Range in one pass.",
  "O(n)", "O(1)", "Two passes summarizing without need.",
  "summarizingInt also exposes min/max — mention both.",
  alternative="IntSummaryStatistics stats = employees.stream().collect(Collectors.summarizingInt(Employee::salary));",
  javaSince="Java 12", tags=["advanced-collectors", "employee"])

# ---------------------------------------------------------------------------
# PRODUCTION (5)
# ---------------------------------------------------------------------------
P("pr01", "production", "Staff", "Files.lines must close",
  "Production-safe line count with try-with-resources.",
  "path", "count",
  '''try (Stream<String> lines = Files.lines(path)) {
  return lines.filter(l -> !l.isBlank()).count();
}''',
  "Files.lines → filter → count (closed)", "IO streams hold resources.",
  "O(lines)", "O(1)", "Returning Stream from method without closing.",
  "Never return open Files.lines to callers without ownership rules.",
  javaSince="Java 8")

P("pr02", "production", "Architect", "Avoid parallel in request thread blindly",
  "Why servlet/request threads should not blindly use parallelStream for light work.",
  "HTTP handler", "sequential preferred",
  "// Prefer sequential streams in request path unless CPU-bound and measured.",
  "sequential by default in request path", "commonPool contention across requests.",
  "N/A", "N/A", "parallelStream per request on small collections.",
  "Measure under load; isolate heavy jobs to dedicated pools.",
  javaSince="Java 8", tags=["production", "parallel"])

P("pr03", "production", "Advanced", "Lazy pipeline until terminal",
  "Demonstrate filter/map not running before terminal collect.",
  "list", "side effects only on terminal",
  '''List<String> out = source.stream()
  .filter(s -> { System.out.println("f="+s); return true; })
  .map(s -> { System.out.println("m="+s); return s; })
  .toList();''',
  "lazy intermediates → terminal toList", "Debugging laziness.",
  "O(n)", "O(n)", "Assuming intermediate ops run at declaration.",
  "Interview: Streams are lazy; pull-based by terminal.",
  javaSince="Java 16")

P("pr04", "production", "Expert", "Exception wrapping in map",
  "Handle checked exceptions in map without silent swallow.",
  "paths", "list of contents",
  '''List<String> texts = paths.stream().map(p -> {
  try { return Files.readString(p); }
  catch (IOException e) { throw new UncheckedIOException(e); }
}).toList();''',
  "stream → map(readString unchecked) → toList", "Bridge checked exceptions.",
  "O(n)", "O(n)", "swallowing exceptions returning null.",
  "UncheckedIOException preserves cause for ops.",
  javaSince="Java 11")

P("pr05", "production", "Staff", "Deterministic collectors for APIs",
  "Publish stable ordered JSON: LinkedHashMap grouping.",
  "events", "stable map",
  '''Map<String, Long> stable = events.stream()
  .collect(Collectors.groupingBy(Event::type, LinkedHashMap::new, Collectors.counting()));''',
  "groupingBy(type, LinkedHashMap::new, counting)", "API stability.",
  "O(n)", "O(k)", "HashMap key order flapping in snapshots/tests.",
  "Specify map supplier for deterministic outputs.",
  javaSince="Java 8")

# ---------------------------------------------------------------------------
# Validate & write
# ---------------------------------------------------------------------------
ids = [p["id"] for p in problems]
if len(ids) != len(set(ids)):
    dup = [i for i, c in Counter(ids).items() if c > 1]
    raise SystemExit(f"duplicate ids: {dup}")

cats = Counter(p["category"] for p in problems)
required_mins = {
    "employee": 35,
    "ecommerce": 12,
    "fintech": 15,
    "strings": 15,
    "parallel": 12,
    "grouping": 15,
}
for k, m in required_mins.items():
    if cats[k] < m:
        raise SystemExit(f"category {k} has {cats[k]} < required {m}")

if not (180 <= len(problems) <= 200):
    raise SystemExit(f"total {len(problems)} not in 180-200")

OUT.parent.mkdir(parents=True, exist_ok=True)
with OUT.open("w", encoding="utf-8") as f:
    json.dump(problems, f, indent=2, ensure_ascii=False)
    f.write("\n")

print("total", len(problems))
for c in sorted(cats):
    print(f"{c}: {cats[c]}")
print("wrote", OUT)
