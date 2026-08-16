/**
 * Top 100 Tough Java Stream API Interview Programs — Senior / SDE3 / Staff focus.
 * Not beginner filter/map drills: grouping, multi-level aggregation, flatMap,
 * duplicates, strings, nested collections, custom collectors, edge cases.
 */

export type ToughLevel = 1 | 2 | 3 | 4 | 5 | 6;

export type ToughProblem = {
  n: number;
  level: ToughLevel;
  title: string;
  keyConcept: string;
  /** Master these first for 12+ year interviews */
  priority?: boolean;
  solution: string;
  time: string;
  space: string;
  /** Duplicate / null / empty / ordering traps */
  edges: string;
  withoutStreams?: string;
  parallel?: string;
};

export const TOUGH_LEVELS: {level: ToughLevel; title: string; focus: string}[] = [
  {level: 1, title: 'Advanced fundamentals', focus: 'Nth salary, per-dept extremes, average comparisons'},
  {level: 2, title: 'Grouping & aggregation', focus: 'groupingBy, partitioningBy, nested collectors, stats'},
  {level: 3, title: 'Duplicates & frequency', focus: 'counting, LinkedHashMap order, top-K frequent'},
  {level: 4, title: 'String streams', focus: 'anagrams, palindromes, vowels, first unique char'},
  {level: 5, title: 'Nested collections', focus: 'flatMap skills/projects, set intersections'},
  {level: 6, title: 'Very tough / senior', focus: 'Nth per dept, ties, custom Collector, multi-list ops'},
];

export const SENIOR_PROGRESSION = `Basic Streams
     ↓
map / filter / sorted
     ↓
distinct / limit / skip
     ↓
reduce
     ↓
groupingBy
     ↓
partitioningBy
     ↓
mapping / counting / summing / averaging
     ↓
Nested grouping
     ↓
flatMap
     ↓
toMap + merge functions
     ↓
Optional
     ↓
Primitive Streams
     ↓
Complex aggregation
     ↓
Custom Collector
     ↓
Parallel Streams
     ↓
Performance + memory analysis

Staff judgment: map vs flatMap · groupingBy vs partitioningBy · reduce vs collect ·
sequential vs parallel · complexity · null/empty/duplicates · when a loop/SQL is better.`;

export const INTERVIEWER_FOLLOWUPS: {q: string; a: string}[] = [
  {q: 'What is the time complexity?', a: 'State assumptions (sort vs hash). sorted/distinct often dominate.'},
  {q: 'What is the space complexity?', a: 'groupingBy/toMap/distinct buffers; streaming terminals can be O(1).'},
  {q: 'Can you solve it without streams?', a: 'Yes — often clearer for index algorithms / early exit. Show a loop.'},
  {q: 'Can you do it in one pass?', a: 'Prefer summarizing*/custom collector/teeing over multiple stream() calls.'},
  {q: 'What happens with duplicate values?', a: 'Define distinct salary vs employee rank; ties need a policy.'},
  {q: 'What happens with null?', a: 'NPE in method refs; filter Objects::nonNull or nullsLast comparators.'},
  {q: 'What happens with an empty collection?', a: 'max/min/findFirst empty Optional; averaging returns 0.0 — know the API.'},
  {q: 'Is the solution stable with respect to ordering?', a: 'sorted is stable; HashMap grouping is not; LinkedHashMap preserves encounter.'},
  {q: 'Can this be parallelized?', a: 'Only if associative/stateless and no shared mutable state.'},
  {q: 'Is parallelStream() actually beneficial here?', a: 'Usually no for small N; measure. Avoid on tiny employee lists.'},
  {
    q: 'Can Collectors.toMap() throw?',
    a: 'Yes — duplicate keys without mergeFunction → IllegalStateException.',
  },
  {q: 'Why map() vs flatMap()?', a: '1:1 vs 1:many / Optional unwrap / nested collections.'},
  {q: 'groupingBy vs partitioningBy?', a: 'Arbitrary classifier vs boolean → Map<Boolean, List>.'},
  {q: 'findFirst vs findAny?', a: 'Order-sensitive vs parallel-friendly any match.'},
  {q: 'reduce vs collect?', a: 'reduce for immutable folds; collect for mutable containers / parallel-friendly.'},
  {q: 'map vs mapToInt?', a: 'Avoid boxing on numeric hot paths.'},
  {q: 'What if a stream is consumed twice?', a: 'IllegalStateException — streams are single-use.'},
  {q: 'Why avoid side effects in stream ops?', a: 'Breaks parallelism and laziness reasoning; use collect.'},
  {q: 'When is a traditional loop better?', a: 'Index math, complex early exit, checked exceptions, hot tight loops.'},
  {q: 'What changes with parallelStream()?', a: 'FJP commonPool, ordering weaker, need combiner, no shared mutable.'},
];

const EMP = `record Employee(long id, String name, String department, String gender, double salary, int age, LocalDate joiningDate, String email, String title, List<String> skills, List<String> projects) {}`;

export const TOUGH_100: ToughProblem[] = [
  // ── Level 1 ────────────────────────────────────────────────────────────
  {
    n: 1,
    level: 1,
    title: '2nd highest salary',
    keyConcept: 'sorted · skip · findFirst (decide distinct policy)',
    priority: true,
    solution: `// Distinct salaries (usual interview ask)
emps.stream().map(Employee::salary).distinct()
  .sorted(Comparator.reverseOrder()).skip(1).findFirst();
// Non-distinct: omit distinct() — second employee by salary may share rank`,
    time: 'O(n log n) sort; O(n) two-pass selection possible',
    space: 'O(u) uniques after distinct',
    edges: 'Ties: clarify distinct vs rank. Empty → empty Optional. Null salaries NPE.',
    withoutStreams: 'Track max and secondMax in one O(n) loop.',
    parallel: 'Rarely worth it; ordering of skip needs care.',
  },
  {
    n: 2,
    level: 1,
    title: 'Nth highest salary',
    keyConcept: 'distinct · sorted · skip(n-1)',
    priority: true,
    solution: `int n = 3;
emps.stream().map(Employee::salary).distinct()
  .sorted(Comparator.reverseOrder()).skip(n - 1L).findFirst();`,
    time: 'O(n log n)',
    space: 'O(u)',
    edges: 'n > unique salaries → empty. n<=0 invalid.',
    withoutStreams: 'TreeSet reverse or QuickSelect.',
  },
  {
    n: 3,
    level: 1,
    title: '2nd highest salary in each department',
    keyConcept: 'groupingBy + per-group distinct sort skip',
    priority: true,
    solution: `Map<String, Optional<Double>> second = emps.stream().collect(
  Collectors.groupingBy(Employee::department,
    Collectors.collectingAndThen(Collectors.mapping(Employee::salary, Collectors.toList()),
      list -> list.stream().distinct().sorted(Comparator.reverseOrder()).skip(1).findFirst())));`,
    time: 'O(n log k) per dept sizes',
    space: 'O(n)',
    edges: 'Dept with <2 unique salaries → empty Optional. Ties: use distinct.',
    parallel: 'groupingByConcurrent possible; then sort per group sequential.',
  },
  {
    n: 4,
    level: 1,
    title: 'Highest-paid employee in each department',
    keyConcept: 'groupingBy + maxBy',
    priority: true,
    solution: `Map<String, Employee> top = emps.stream().collect(
  Collectors.groupingBy(Employee::department,
    Collectors.collectingAndThen(
      Collectors.maxBy(Comparator.comparingDouble(Employee::salary)),
      Optional::orElseThrow)));`,
    time: 'O(n)',
    space: 'O(d)',
    edges: 'Salary ties: maxBy picks one — define tie-break (name, id). Empty dept impossible if grouping from data.',
  },
  {
    n: 5,
    level: 1,
    title: 'Lowest-paid employee in each department',
    keyConcept: 'groupingBy + minBy',
    solution: `Map<String, Employee> low = emps.stream().collect(
  Collectors.groupingBy(Employee::department,
    Collectors.collectingAndThen(
      Collectors.minBy(Comparator.comparingDouble(Employee::salary)),
      Optional::orElseThrow)));`,
    time: 'O(n)',
    space: 'O(d)',
    edges: 'Same tie-break as maxBy.',
  },
  {
    n: 6,
    level: 1,
    title: 'Employees having the same salary',
    keyConcept: 'groupingBy salary → filter size>1',
    solution: `emps.stream().collect(Collectors.groupingBy(Employee::salary)).entrySet().stream()
  .filter(e -> e.getValue().size() > 1)
  .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));`,
    time: 'O(n)',
    space: 'O(n)',
    edges: 'Double equality — prefer BigDecimal/cents in FinTech.',
  },
  {
    n: 7,
    level: 1,
    title: 'Maximum salary without max()',
    keyConcept: 'reduce / sorted.findFirst',
    solution: `emps.stream().map(Employee::salary).reduce(Double::max);
// or .sorted(Comparator.reverseOrder()).findFirst()`,
    time: 'O(n) reduce; O(n log n) sort',
    space: 'O(1) reduce',
    edges: 'Empty → empty Optional.',
  },
  {
    n: 8,
    level: 1,
    title: 'Minimum salary without min()',
    keyConcept: 'reduce(Double::min)',
    solution: `emps.stream().map(Employee::salary).reduce(Double::min);`,
    time: 'O(n)',
    space: 'O(1)',
    edges: 'Empty stream.',
  },
  {
    n: 9,
    level: 1,
    title: 'Top 3 highest-paid employees',
    keyConcept: 'sorted · limit',
    solution: `emps.stream()
  .sorted(Comparator.comparingDouble(Employee::salary).reversed())
  .limit(3).toList();`,
    time: 'O(n log n)',
    space: 'O(n) sort buffer',
    edges: 'n<3 returns fewer. Ties: add thenComparing(Employee::id).',
  },
  {
    n: 10,
    level: 1,
    title: 'Salary greater than company average',
    keyConcept: 'average then filter (two passes or teeing)',
    solution: `double avg = emps.stream().mapToDouble(Employee::salary).average().orElse(0);
emps.stream().filter(e -> e.salary() > avg).toList();
// One pipeline: Collectors.teeing(averagingDouble, toList(), (a, list) -> list.stream().filter(...))`,
    time: 'O(n)',
    space: 'O(1)+result',
    edges: 'Empty company avg 0 — document. Prefer BigDecimal for money.',
  },
  {
    n: 11,
    level: 1,
    title: 'Salary greater than department average',
    keyConcept: 'dept avg map then filter',
    priority: true,
    solution: `Map<String, Double> avg = emps.stream().collect(
  Collectors.groupingBy(Employee::department, Collectors.averagingDouble(Employee::salary)));
emps.stream().filter(e -> e.salary() > avg.get(e.department())).toList();`,
    time: 'O(n)',
    space: 'O(d)',
    edges: 'Two logical passes over data. Parallel: build avg first.',
  },
  {
    n: 12,
    level: 1,
    title: 'Average salary of each department',
    keyConcept: 'groupingBy + averagingDouble',
    solution: `emps.stream().collect(
  Collectors.groupingBy(Employee::department, Collectors.averagingDouble(Employee::salary)));`,
    time: 'O(n)',
    space: 'O(d)',
    edges: 'Double precision.',
  },
  {
    n: 13,
    level: 1,
    title: 'Sum of salaries by department',
    keyConcept: 'groupingBy + summingDouble',
    solution: `emps.stream().collect(
  Collectors.groupingBy(Employee::department, Collectors.summingDouble(Employee::salary)));`,
    time: 'O(n)',
    space: 'O(d)',
    edges: 'Overflow unlikely for double; money → BigDecimal reducing.',
  },
  {
    n: 14,
    level: 1,
    title: 'Count of employees by department',
    keyConcept: 'groupingBy + counting',
    solution: `emps.stream().collect(
  Collectors.groupingBy(Employee::department, Collectors.counting()));`,
    time: 'O(n)',
    space: 'O(d)',
    edges: 'Returns Long.',
  },
  {
    n: 15,
    level: 1,
    title: 'Department with highest total salary',
    keyConcept: 'summing then max entry',
    solution: `emps.stream()
  .collect(Collectors.groupingBy(Employee::department, Collectors.summingDouble(Employee::salary)))
  .entrySet().stream().max(Map.Entry.comparingByValue());`,
    time: 'O(n)',
    space: 'O(d)',
    edges: 'Ties between departments — define policy.',
  },
  {
    n: 16,
    level: 1,
    title: 'Department with highest average salary',
    keyConcept: 'averaging then max entry',
    solution: `emps.stream()
  .collect(Collectors.groupingBy(Employee::department, Collectors.averagingDouble(Employee::salary)))
  .entrySet().stream().max(Map.Entry.comparingByValue());`,
    time: 'O(n)',
    space: 'O(d)',
    edges: 'Small depts can dominate averages.',
  },
  {
    n: 17,
    level: 1,
    title: 'Department with maximum employees',
    keyConcept: 'counting then max',
    solution: `emps.stream().collect(Collectors.groupingBy(Employee::department, Collectors.counting()))
  .entrySet().stream().max(Map.Entry.comparingByValue());`,
    time: 'O(n)',
    space: 'O(d)',
    edges: 'Tie departments.',
  },
  {
    n: 18,
    level: 1,
    title: 'Department with minimum employees',
    keyConcept: 'counting then min',
    solution: `emps.stream().collect(Collectors.groupingBy(Employee::department, Collectors.counting()))
  .entrySet().stream().min(Map.Entry.comparingByValue());`,
    time: 'O(n)',
    space: 'O(d)',
    edges: 'Empty company.',
  },
  {
    n: 19,
    level: 1,
    title: 'Same name, different salaries',
    keyConcept: 'groupingBy name → filter varying salaries',
    solution: `emps.stream().collect(Collectors.groupingBy(Employee::name)).values().stream()
  .filter(list -> list.stream().map(Employee::salary).distinct().count() > 1)
  .toList();`,
    time: 'O(n)',
    space: 'O(n)',
    edges: 'Case sensitivity of names.',
  },
  {
    n: 20,
    level: 1,
    title: 'Duplicate email addresses',
    keyConcept: 'groupingBy email + counting > 1',
    solution: `emps.stream().collect(Collectors.groupingBy(Employee::email, Collectors.counting()))
  .entrySet().stream().filter(e -> e.getValue() > 1).map(Map.Entry::getKey).toList();`,
    time: 'O(n)',
    space: 'O(n)',
    edges: 'Normalize email lowercase. Null emails.',
  },

  // ── Level 2 ────────────────────────────────────────────────────────────
  {
    n: 21,
    level: 2,
    title: 'Group employees by department',
    keyConcept: 'groupingBy',
    solution: `emps.stream().collect(Collectors.groupingBy(Employee::department));`,
    time: 'O(n)',
    space: 'O(n)',
    edges: 'HashMap unordered keys.',
  },
  {
    n: 22,
    level: 2,
    title: 'Group by department then gender',
    keyConcept: 'nested groupingBy',
    priority: true,
    solution: `emps.stream().collect(
  Collectors.groupingBy(Employee::department,
    Collectors.groupingBy(Employee::gender)));`,
    time: 'O(n)',
    space: 'O(n)',
    edges: 'Map<String, Map<String, List<Employee>>>.',
  },
  {
    n: 23,
    level: 2,
    title: 'Group by department + average salary',
    keyConcept: 'groupingBy + averagingDouble',
    solution: `emps.stream().collect(
  Collectors.groupingBy(Employee::department, Collectors.averagingDouble(Employee::salary)));`,
    time: 'O(n)',
    space: 'O(d)',
    edges: 'Double avg.',
  },
  {
    n: 24,
    level: 2,
    title: 'Group by department + highest salary',
    keyConcept: 'groupingBy + maxBy / collectingAndThen',
    solution: `emps.stream().collect(
  Collectors.groupingBy(Employee::department,
    Collectors.collectingAndThen(
      Collectors.maxBy(Comparator.comparingDouble(Employee::salary)), Optional::orElseThrow)));`,
    time: 'O(n)',
    space: 'O(d)',
    edges: 'Returns Employee not Double.',
  },
  {
    n: 25,
    level: 2,
    title: 'Group by department + lowest salary',
    keyConcept: 'minBy',
    solution: `emps.stream().collect(
  Collectors.groupingBy(Employee::department,
    Collectors.collectingAndThen(
      Collectors.minBy(Comparator.comparingDouble(Employee::salary)), Optional::orElseThrow)));`,
    time: 'O(n)',
    space: 'O(d)',
    edges: 'Ties.',
  },
  {
    n: 26,
    level: 2,
    title: 'Group by department → names only',
    keyConcept: 'groupingBy + mapping',
    solution: `emps.stream().collect(
  Collectors.groupingBy(Employee::department,
    Collectors.mapping(Employee::name, Collectors.toList())));`,
    time: 'O(n)',
    space: 'O(n)',
    edges: 'Duplicate names kept unless distinct.',
  },
  {
    n: 27,
    level: 2,
    title: 'Group by department → employees sorted by salary',
    keyConcept: 'groupingBy + collectingAndThen sort',
    solution: `emps.stream().collect(
  Collectors.groupingBy(Employee::department,
    Collectors.collectingAndThen(Collectors.toList(),
      list -> list.stream()
        .sorted(Comparator.comparingDouble(Employee::salary).reversed()).toList())));`,
    time: 'O(n log k)',
    space: 'O(n)',
    edges: 'Sort after group.',
  },
  {
    n: 28,
    level: 2,
    title: 'Group by department → top 2 employees',
    keyConcept: 'groupingBy + sorted + limit',
    solution: `emps.stream().collect(
  Collectors.groupingBy(Employee::department,
    Collectors.collectingAndThen(Collectors.toList(),
      list -> list.stream()
        .sorted(Comparator.comparingDouble(Employee::salary).reversed())
        .limit(2).toList())));`,
    time: 'O(n log k)',
    space: 'O(n)',
    edges: 'Dept size 1 → one element. Prefer PriorityQueue for huge groups.',
  },
  {
    n: 29,
    level: 2,
    title: 'Per department: count, min, max, avg, sum',
    keyConcept: 'summarizingDouble',
    priority: true,
    solution: `Map<String, DoubleSummaryStatistics> stats = emps.stream().collect(
  Collectors.groupingBy(Employee::department, Collectors.summarizingDouble(Employee::salary)));
// stats.get(dept).getCount()/getMin()/getMax()/getAverage()/getSum()`,
    time: 'O(n) one pass',
    space: 'O(d)',
    edges: 'Empty dept impossible; company empty → empty map.',
  },
  {
    n: 30,
    level: 2,
    title: 'Department salary statistics object',
    keyConcept: 'teeing or summarizing → record',
    solution: `record DeptStats(long count, double min, double max, double avg, double sum) {}
Map<String, DeptStats> m = emps.stream().collect(
  Collectors.groupingBy(Employee::department,
    Collectors.collectingAndThen(Collectors.summarizingDouble(Employee::salary),
      s -> new DeptStats(s.getCount(), s.getMin(), s.getMax(), s.getAverage(), s.getSum()))));`,
    time: 'O(n)',
    space: 'O(d)',
    edges: 'Immutable DTO for API responses.',
  },
  {
    n: 31,
    level: 2,
    title: 'Departments with average salary > 10L',
    keyConcept: 'averaging then filter entries',
    solution: `emps.stream()
  .collect(Collectors.groupingBy(Employee::department, Collectors.averagingDouble(Employee::salary)))
  .entrySet().stream().filter(e -> e.getValue() > 1_000_000).map(Map.Entry::getKey).toList();`,
    time: 'O(n)',
    space: 'O(d)',
    edges: 'Currency units.',
  },
  {
    n: 32,
    level: 2,
    title: 'Departments with at least 3 employees',
    keyConcept: 'counting filter',
    solution: `emps.stream().collect(Collectors.groupingBy(Employee::department, Collectors.counting()))
  .entrySet().stream().filter(e -> e.getValue() >= 3).map(Map.Entry::getKey).toList();`,
    time: 'O(n)',
    space: 'O(d)',
    edges: 'None.',
  },
  {
    n: 33,
    level: 2,
    title: 'Departments where all earn > 5L',
    keyConcept: 'groupingBy + collectingAndThen allMatch',
    solution: `emps.stream().collect(Collectors.groupingBy(Employee::department)).entrySet().stream()
  .filter(e -> e.getValue().stream().allMatch(x -> x.salary() > 500_000))
  .map(Map.Entry::getKey).toList();`,
    time: 'O(n)',
    space: 'O(n)',
    edges: 'Vacuous truth if empty group — grouping won\'t create empty.',
  },
  {
    n: 34,
    level: 2,
    title: 'Departments where any earns > 20L',
    keyConcept: 'anyMatch per group',
    solution: `emps.stream().collect(Collectors.groupingBy(Employee::department)).entrySet().stream()
  .filter(e -> e.getValue().stream().anyMatch(x -> x.salary() > 2_000_000))
  .map(Map.Entry::getKey).toList();`,
    time: 'O(n)',
    space: 'O(n)',
    edges: 'Short-circuit inside group.',
  },
  {
    n: 35,
    level: 2,
    title: 'Partition salary > 10L vs <= 10L',
    keyConcept: 'partitioningBy',
    solution: `emps.stream().collect(Collectors.partitioningBy(e -> e.salary() > 1_000_000));`,
    time: 'O(n)',
    space: 'O(n)',
    edges: 'Always both keys true/false present (maybe empty lists).',
  },
  {
    n: 36,
    level: 2,
    title: 'Partition employees by age (e.g. >= 40)',
    keyConcept: 'partitioningBy',
    solution: `emps.stream().collect(Collectors.partitioningBy(e -> e.age() >= 40));`,
    time: 'O(n)',
    space: 'O(n)',
    edges: 'Boolean partition only — use groupingBy for age bands.',
  },
  {
    n: 37,
    level: 2,
    title: 'Partition then group each by department',
    keyConcept: 'partitioningBy + downstream groupingBy',
    solution: `emps.stream().collect(
  Collectors.partitioningBy(e -> e.salary() > 1_000_000,
    Collectors.groupingBy(Employee::department)));`,
    time: 'O(n)',
    space: 'O(n)',
    edges: 'Map<Boolean, Map<String, List<Employee>>>.',
  },
  {
    n: 38,
    level: 2,
    title: 'Group by department then partition by gender',
    keyConcept: 'groupingBy + partitioningBy',
    solution: `emps.stream().collect(
  Collectors.groupingBy(Employee::department,
    Collectors.partitioningBy(e -> "F".equals(e.gender()))));`,
    time: 'O(n)',
    space: 'O(n)',
    edges: 'Gender encoding.',
  },
  {
    n: 39,
    level: 2,
    title: 'Group employees by joining year',
    keyConcept: 'groupingBy LocalDate.getYear',
    solution: `emps.stream().collect(
  Collectors.groupingBy(e -> e.joiningDate().getYear()));`,
    time: 'O(n)',
    space: 'O(n)',
    edges: 'Timezone N/A for LocalDate.',
  },
  {
    n: 40,
    level: 2,
    title: 'Group by joining year + average salary',
    keyConcept: 'groupingBy year + averaging',
    solution: `emps.stream().collect(
  Collectors.groupingBy(e -> e.joiningDate().getYear(),
    Collectors.averagingDouble(Employee::salary)));`,
    time: 'O(n)',
    space: 'O(y)',
    edges: 'None.',
  },

  // ── Level 3 ────────────────────────────────────────────────────────────
  {
    n: 41,
    level: 3,
    title: 'Find duplicate integers',
    keyConcept: 'groupingBy counting > 1',
    solution: `nums.stream().collect(Collectors.groupingBy(n -> n, Collectors.counting()))
  .entrySet().stream().filter(e -> e.getValue() > 1).map(Map.Entry::getKey).toList();`,
    time: 'O(n)',
    space: 'O(u)',
    edges: 'Order of duplicates not guaranteed unless LinkedHashMap.',
  },
  {
    n: 42,
    level: 3,
    title: 'Find unique integers (appear once)',
    keyConcept: 'counting == 1',
    solution: `nums.stream().collect(Collectors.groupingBy(n -> n, Collectors.counting()))
  .entrySet().stream().filter(e -> e.getValue() == 1).map(Map.Entry::getKey).toList();`,
    time: 'O(n)',
    space: 'O(u)',
    edges: 'vs distinct() which keeps one of each.',
  },
  {
    n: 43,
    level: 3,
    title: 'Frequency of every number',
    keyConcept: 'groupingBy counting',
    solution: `nums.stream().collect(Collectors.groupingBy(n -> n, Collectors.counting()));`,
    time: 'O(n)',
    space: 'O(u)',
    edges: 'None.',
  },
  {
    n: 44,
    level: 3,
    title: 'Character frequency in a String',
    keyConcept: 'chars · mapToObj · groupingBy',
    solution: `s.chars().mapToObj(c -> (char) c)
  .collect(Collectors.groupingBy(c -> c, Collectors.counting()));`,
    time: 'O(n)',
    space: 'O(alphabet)',
    edges: 'Surrogate pairs — use codePoints() for Unicode.',
  },
  {
    n: 45,
    level: 3,
    title: 'First non-repeated character',
    keyConcept: 'LinkedHashMap frequency + findFirst',
    priority: true,
    solution: `s.chars().mapToObj(c -> (char) c)
  .collect(Collectors.groupingBy(c -> c, LinkedHashMap::new, Collectors.counting()))
  .entrySet().stream().filter(e -> e.getValue() == 1L).map(Map.Entry::getKey).findFirst();`,
    time: 'O(n)',
    space: 'O(alphabet)',
    edges: 'Order preservation requires LinkedHashMap. Empty → empty.',
  },
  {
    n: 46,
    level: 3,
    title: 'First repeated character',
    keyConcept: 'LinkedHashMap count > 1 first',
    solution: `s.chars().mapToObj(c -> (char) c)
  .collect(Collectors.groupingBy(c -> c, LinkedHashMap::new, Collectors.counting()))
  .entrySet().stream().filter(e -> e.getValue() > 1L).map(Map.Entry::getKey).findFirst();
// Alternative O(n) loop with Set seen`,
    time: 'O(n)',
    space: 'O(alphabet)',
    edges: '“First repeated” = first char whose second occurrence appears earliest — loop with Set clearer.',
    withoutStreams: 'LinkedHashSet/seen Set while iterating.',
  },
  {
    n: 47,
    level: 3,
    title: 'All non-repeated characters',
    keyConcept: 'count == 1',
    solution: `s.chars().mapToObj(c -> (char) c)
  .collect(Collectors.groupingBy(c -> c, LinkedHashMap::new, Collectors.counting()))
  .entrySet().stream().filter(e -> e.getValue() == 1L).map(Map.Entry::getKey).toList();`,
    time: 'O(n)',
    space: 'O(alphabet)',
    edges: 'Preserve order with LinkedHashMap.',
  },
  {
    n: 48,
    level: 3,
    title: 'All repeated characters',
    keyConcept: 'count > 1',
    solution: `s.chars().mapToObj(c -> (char) c)
  .collect(Collectors.groupingBy(c -> c, Collectors.counting()))
  .entrySet().stream().filter(e -> e.getValue() > 1L).map(Map.Entry::getKey).toList();`,
    time: 'O(n)',
    space: 'O(alphabet)',
    edges: 'None.',
  },
  {
    n: 49,
    level: 3,
    title: 'Duplicate words in a sentence',
    keyConcept: 'split · groupingBy · count>1',
    solution: `Arrays.stream(sentence.toLowerCase(Locale.ROOT).split("\\\\W+"))
  .filter(w -> !w.isBlank())
  .collect(Collectors.groupingBy(w -> w, Collectors.counting()))
  .entrySet().stream().filter(e -> e.getValue() > 1).map(Map.Entry::getKey).toList();`,
    time: 'O(n)',
    space: 'O(w)',
    edges: 'Locale, punctuation.',
  },
  {
    n: 50,
    level: 3,
    title: 'Most frequently occurring word',
    keyConcept: 'counting + maxBy',
    solution: `Arrays.stream(sentence.toLowerCase(Locale.ROOT).split("\\\\W+")).filter(w -> !w.isBlank())
  .collect(Collectors.groupingBy(w -> w, Collectors.counting()))
  .entrySet().stream().max(Map.Entry.comparingByValue());`,
    time: 'O(n)',
    space: 'O(w)',
    edges: 'Ties — maxBy picks one.',
  },
  {
    n: 51,
    level: 3,
    title: 'Second most frequent word',
    keyConcept: 'sort frequencies skip 1',
    solution: `Arrays.stream(sentence.toLowerCase(Locale.ROOT).split("\\\\W+")).filter(w -> !w.isBlank())
  .collect(Collectors.groupingBy(w -> w, Collectors.counting()))
  .entrySet().stream()
  .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
  .skip(1).findFirst();`,
    time: 'O(w log w)',
    space: 'O(w)',
    edges: '<2 unique words.',
  },
  {
    n: 52,
    level: 3,
    title: 'Character with highest frequency',
    keyConcept: 'maxBy on counts',
    solution: `s.chars().mapToObj(c -> (char) c)
  .collect(Collectors.groupingBy(c -> c, Collectors.counting()))
  .entrySet().stream().max(Map.Entry.comparingByValue());`,
    time: 'O(n)',
    space: 'O(alphabet)',
    edges: 'Ties.',
  },
  {
    n: 53,
    level: 3,
    title: 'Character with lowest frequency',
    keyConcept: 'minBy on counts',
    solution: `s.chars().mapToObj(c -> (char) c)
  .collect(Collectors.groupingBy(c -> c, Collectors.counting()))
  .entrySet().stream().min(Map.Entry.comparingByValue());`,
    time: 'O(n)',
    space: 'O(alphabet)',
    edges: 'Usually many with count 1.',
  },
  {
    n: 54,
    level: 3,
    title: 'Number occurring maximum times',
    keyConcept: 'max frequency entry',
    solution: `nums.stream().collect(Collectors.groupingBy(n -> n, Collectors.counting()))
  .entrySet().stream().max(Map.Entry.comparingByValue()).map(Map.Entry::getKey);`,
    time: 'O(n)',
    space: 'O(u)',
    edges: 'Ties.',
  },
  {
    n: 55,
    level: 3,
    title: 'Top 3 most frequent numbers',
    keyConcept: 'groupingBy + sort by count',
    priority: true,
    solution: `nums.stream().collect(Collectors.groupingBy(n -> n, Collectors.counting()))
  .entrySet().stream()
  .sorted(Map.Entry.<Integer, Long>comparingByValue().reversed())
  .limit(3).map(Map.Entry::getKey).toList();`,
    time: 'O(u log u)',
    space: 'O(u)',
    edges: 'Tie-break by key optional.',
  },
  {
    n: 56,
    level: 3,
    title: 'Duplicate employees by ID',
    keyConcept: 'groupingBy id count>1',
    priority: true,
    solution: `emps.stream().collect(Collectors.groupingBy(Employee::id, Collectors.counting()))
  .entrySet().stream().filter(e -> e.getValue() > 1).map(Map.Entry::getKey).toList();`,
    time: 'O(n)',
    space: 'O(n)',
    edges: 'Or return full Employee lists.',
  },
  {
    n: 57,
    level: 3,
    title: 'Remove duplicate employees by ID',
    keyConcept: 'toMap id→emp merge',
    solution: `emps.stream().collect(Collectors.toMap(Employee::id, e -> e, (a, b) -> a)).values().stream().toList();`,
    time: 'O(n)',
    space: 'O(u)',
    edges: 'Merge picks first or last — document.',
  },
  {
    n: 58,
    level: 3,
    title: 'Remove duplicates preserving insertion order',
    keyConcept: 'distinct on encounter / LinkedHashSet',
    solution: `list.stream().distinct().toList(); // distinct uses encounter order for ordered streams
// or new LinkedHashSet<>(list)`,
    time: 'O(n)',
    space: 'O(u)',
    edges: 'equals/hashCode for objects.',
  },
  {
    n: 59,
    level: 3,
    title: 'Duplicates by multiple fields',
    keyConcept: 'composite key grouping',
    solution: `emps.stream().collect(
  Collectors.groupingBy(e -> e.name() + "|" + e.department()))
  .entrySet().stream().filter(e -> e.getValue().size() > 1).toList();`,
    time: 'O(n)',
    space: 'O(n)',
    edges: 'Prefer record key(name, dept) over string concat.',
  },
  {
    n: 60,
    level: 3,
    title: 'Frequency of employees by department',
    keyConcept: 'counting',
    solution: `emps.stream().collect(Collectors.groupingBy(Employee::department, Collectors.counting()));`,
    time: 'O(n)',
    space: 'O(d)',
    edges: 'Same as #14.',
  },

  // ── Level 4 ────────────────────────────────────────────────────────────
  {
    n: 61,
    level: 4,
    title: 'Reverse a String using streams',
    keyConcept: 'IntStream indices / reduce',
    solution: `new StringBuilder(s).reverse().toString(); // clearest
// Stream: IntStream.range(0,s.length()).map(i -> s.charAt(s.length()-1-i))
//   .collect(StringBuilder::new, StringBuilder::appendCodePoint, StringBuilder::append).toString();`,
    time: 'O(n)',
    space: 'O(n)',
    edges: 'Loop/StringBuilder preferred in senior interviews.',
    withoutStreams: 'StringBuilder.reverse()',
  },
  {
    n: 62,
    level: 4,
    title: 'Reverse every word in a sentence',
    keyConcept: 'split · map reverse · joining',
    solution: `Arrays.stream(sentence.split(" "))
  .map(w -> new StringBuilder(w).reverse().toString())
  .collect(Collectors.joining(" "));`,
    time: 'O(n)',
    space: 'O(n)',
    edges: 'Multiple spaces.',
  },
  {
    n: 63,
    level: 4,
    title: 'Longest word in a sentence',
    keyConcept: 'max comparing length',
    solution: `Arrays.stream(sentence.split("\\\\W+")).filter(w -> !w.isBlank())
  .max(Comparator.comparingInt(String::length));`,
    time: 'O(n)',
    space: 'O(1)',
    edges: 'Ties.',
  },
  {
    n: 64,
    level: 4,
    title: 'Shortest word',
    keyConcept: 'min length',
    solution: `Arrays.stream(sentence.split("\\\\W+")).filter(w -> !w.isBlank())
  .min(Comparator.comparingInt(String::length));`,
    time: 'O(n)',
    space: 'O(1)',
    edges: 'Empty tokens.',
  },
  {
    n: 65,
    level: 4,
    title: 'Top 3 longest words',
    keyConcept: 'sorted length · limit',
    solution: `Arrays.stream(sentence.split("\\\\W+")).filter(w -> !w.isBlank())
  .sorted(Comparator.comparingInt(String::length).reversed()).limit(3).toList();`,
    time: 'O(w log w)',
    space: 'O(w)',
    edges: 'Duplicates words.',
  },
  {
    n: 66,
    level: 4,
    title: 'Sort words by length',
    keyConcept: 'sorted comparingInt length',
    solution: `words.stream().sorted(Comparator.comparingInt(String::length)).toList();`,
    time: 'O(w log w)',
    space: 'O(w)',
    edges: 'Stable sort keeps equal-length order.',
  },
  {
    n: 67,
    level: 4,
    title: 'Sort by length then alphabetically',
    keyConcept: 'thenComparing',
    solution: `words.stream()
  .sorted(Comparator.comparingInt(String::length).thenComparing(Comparator.naturalOrder()))
  .toList();`,
    time: 'O(w log w)',
    space: 'O(w)',
    edges: 'Case sensitivity.',
  },
  {
    n: 68,
    level: 4,
    title: 'Words starting with a vowel',
    keyConcept: 'filter first char',
    solution: `words.stream()
  .filter(w -> !w.isEmpty() && "AEIOUaeiou".indexOf(w.charAt(0)) >= 0).toList();`,
    time: 'O(w)',
    space: 'O(1)+result',
    edges: 'Unicode letters.',
  },
  {
    n: 69,
    level: 4,
    title: 'Words containing duplicate characters',
    keyConcept: 'chars distinct count < length',
    solution: `words.stream()
  .filter(w -> w.chars().distinct().count() < w.length()).toList();`,
    time: 'O(total chars)',
    space: 'O(alphabet) per word',
    edges: 'Case.',
  },
  {
    n: 70,
    level: 4,
    title: 'Palindrome words from a sentence',
    keyConcept: 'filter palindrome check',
    solution: `Arrays.stream(sentence.split("\\\\W+")).filter(w -> !w.isBlank())
  .filter(w -> w.equalsIgnoreCase(new StringBuilder(w).reverse().toString())).toList();`,
    time: 'O(n)',
    space: 'O(1)+result',
    edges: 'Two-pointer clearer for seniors.',
  },
  {
    n: 71,
    level: 4,
    title: 'Longest palindrome word',
    keyConcept: 'filter palindromes · max length',
    solution: `Arrays.stream(sentence.split("\\\\W+")).filter(w -> !w.isBlank())
  .filter(w -> w.equalsIgnoreCase(new StringBuilder(w).reverse().toString()))
  .max(Comparator.comparingInt(String::length));`,
    time: 'O(n)',
    space: 'O(1)',
    edges: 'None.',
  },
  {
    n: 72,
    level: 4,
    title: 'Find all anagrams from a list',
    keyConcept: 'normalize sort chars as key',
    solution: `words.stream()
  .collect(Collectors.groupingBy(w -> w.chars().sorted()
      .collect(StringBuilder::new, StringBuilder::appendCodePoint, StringBuilder::append).toString()))
  .values().stream().filter(g -> g.size() > 1).toList();`,
    time: 'O(n * k log k)',
    space: 'O(n)',
    edges: 'See #73.',
  },
  {
    n: 73,
    level: 4,
    title: 'Group words that are anagrams',
    keyConcept: 'groupingBy sorted-char key',
    priority: true,
    solution: `List.of("eat","tea","tan","ate","nat","bat").stream()
  .collect(Collectors.groupingBy(w -> w.chars().sorted()
      .collect(StringBuilder::new, StringBuilder::appendCodePoint, StringBuilder::append).toString()))
  .values().stream().toList();
// → [[eat,tea,ate],[tan,nat],[bat]] (group order not guaranteed)`,
    time: 'O(n * k log k)',
    space: 'O(n)',
    edges: 'Frequency-count key is O(k) better than sort for ASCII.',
  },
  {
    n: 74,
    level: 4,
    title: 'First character appearing only once',
    keyConcept: 'same as #45',
    solution: `// identical to first non-repeated (#45)`,
    time: 'O(n)',
    space: 'O(alphabet)',
    edges: 'LinkedHashMap.',
  },
  {
    n: 75,
    level: 4,
    title: 'First character appearing more than once',
    keyConcept: 'same as #46',
    solution: `// identical to first repeated (#46)`,
    time: 'O(n)',
    space: 'O(alphabet)',
    edges: 'Define “first” carefully.',
  },
  {
    n: 76,
    level: 4,
    title: 'Count vowels using streams',
    keyConcept: 'filter vowels · count',
    solution: `s.toLowerCase(Locale.ROOT).chars().filter(c -> "aeiou".indexOf(c) >= 0).count();`,
    time: 'O(n)',
    space: 'O(1)',
    edges: 'y as vowel?',
  },
  {
    n: 77,
    level: 4,
    title: 'Count consonants',
    keyConcept: 'letters and not vowel',
    solution: `s.toLowerCase(Locale.ROOT).chars()
  .filter(Character::isLetter).filter(c -> "aeiou".indexOf(c) < 0).count();`,
    time: 'O(n)',
    space: 'O(1)',
    edges: 'Digits/spaces ignored.',
  },
  {
    n: 78,
    level: 4,
    title: 'Most frequent vowel',
    keyConcept: 'filter vowels · frequency · max',
    solution: `s.toLowerCase(Locale.ROOT).chars().filter(c -> "aeiou".indexOf(c) >= 0)
  .mapToObj(c -> (char) c)
  .collect(Collectors.groupingBy(c -> c, Collectors.counting()))
  .entrySet().stream().max(Map.Entry.comparingByValue());`,
    time: 'O(n)',
    space: 'O(1)',
    edges: 'No vowels → empty.',
  },
  {
    n: 79,
    level: 4,
    title: 'Words containing all five vowels',
    keyConcept: 'filter set of vowels size 5',
    solution: `words.stream().filter(w -> {
  var v = w.toLowerCase(Locale.ROOT).chars().filter(c -> "aeiou".indexOf(c) >= 0)
    .mapToObj(c -> (char) c).collect(Collectors.toSet());
  return v.containsAll(Set.of('a','e','i','o','u'));
}).toList();`,
    time: 'O(n)',
    space: 'O(1) per word',
    edges: 'Case.',
  },
  {
    n: 80,
    level: 4,
    title: 'Longest word with no repeated characters',
    keyConcept: 'filter unique chars · max length',
    solution: `words.stream()
  .filter(w -> w.chars().distinct().count() == w.length())
  .max(Comparator.comparingInt(String::length));`,
    time: 'O(n)',
    space: 'O(1)',
    edges: 'Case sensitivity.',
  },

  // ── Level 5 ────────────────────────────────────────────────────────────
  {
    n: 81,
    level: 5,
    title: 'Flatten List<List<Integer>>',
    keyConcept: 'flatMap',
    priority: true,
    solution: `nested.stream().flatMap(List::stream).toList();`,
    time: 'O(n)',
    space: 'O(n)',
    edges: 'Null inner lists NPE — filter nonNull.',
  },
  {
    n: 82,
    level: 5,
    title: 'Flatten nested employee/project structures',
    keyConcept: 'flatMap projects',
    solution: `emps.stream().flatMap(e -> e.projects().stream()).toList();`,
    time: 'O(n)',
    space: 'O(n)',
    edges: 'Duplicates across employees — add distinct.',
  },
  {
    n: 83,
    level: 5,
    title: 'All unique skills across employees',
    keyConcept: 'flatMap · distinct',
    priority: true,
    solution: `emps.stream().flatMap(e -> e.skills().stream()).distinct().toList();`,
    time: 'O(n)',
    space: 'O(u)',
    edges: 'Case of skill names.',
  },
  {
    n: 84,
    level: 5,
    title: 'Most common skill',
    keyConcept: 'flatMap · groupingBy counting · max',
    solution: `emps.stream().flatMap(e -> e.skills().stream())
  .collect(Collectors.groupingBy(s -> s, Collectors.counting()))
  .entrySet().stream().max(Map.Entry.comparingByValue());`,
    time: 'O(n)',
    space: 'O(u)',
    edges: 'Ties.',
  },
  {
    n: 85,
    level: 5,
    title: 'Employees having a specific skill',
    keyConcept: 'filter skills.contains',
    solution: `emps.stream().filter(e -> e.skills().contains("Java")).toList();`,
    time: 'O(n)',
    space: 'O(1)+result',
    edges: 'Use Set for skills for O(1).',
  },
  {
    n: 86,
    level: 5,
    title: 'Employees having all required skills',
    keyConcept: 'filter containsAll',
    solution: `Set<String> required = Set.of("Java", "Kafka");
emps.stream().filter(e -> e.skills().containsAll(required)).toList();`,
    time: 'O(n * k)',
    space: 'O(1)+result',
    edges: 'Empty required → all match.',
  },
  {
    n: 87,
    level: 5,
    title: 'Employees having at least one required skill',
    keyConcept: 'anyMatch on skills',
    solution: `Set<String> required = Set.of("Java", "Kafka");
emps.stream().filter(e -> e.skills().stream().anyMatch(required::contains)).toList();`,
    time: 'O(n * k)',
    space: 'O(1)+result',
    edges: 'None.',
  },
  {
    n: 88,
    level: 5,
    title: 'Top 3 most common skills',
    keyConcept: 'flatMap · frequency · limit 3',
    solution: `emps.stream().flatMap(e -> e.skills().stream())
  .collect(Collectors.groupingBy(s -> s, Collectors.counting()))
  .entrySet().stream()
  .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
  .limit(3).map(Map.Entry::getKey).toList();`,
    time: 'O(n + u log u)',
    space: 'O(u)',
    edges: 'Ties.',
  },
  {
    n: 89,
    level: 5,
    title: 'Projects with maximum employees',
    keyConcept: 'flatMap invert employee→project · count',
    solution: `emps.stream().flatMap(e -> e.projects().stream())
  .collect(Collectors.groupingBy(p -> p, Collectors.counting()))
  .entrySet().stream().max(Map.Entry.comparingByValue());`,
    time: 'O(n)',
    space: 'O(p)',
    edges: 'Project naming consistency.',
  },
  {
    n: 90,
    level: 5,
    title: 'Employees on maximum number of projects',
    keyConcept: 'max comparing projects size',
    solution: `emps.stream().max(Comparator.comparingInt(e -> e.projects().size()));`,
    time: 'O(n)',
    space: 'O(1)',
    edges: 'Ties.',
  },

  // ── Level 6 ────────────────────────────────────────────────────────────
  {
    n: 91,
    level: 6,
    title: 'Nth highest salary per department',
    keyConcept: 'groupingBy + distinct salaries skip',
    solution: `int n = 2;
Map<String, Optional<Double>> nth = emps.stream().collect(
  Collectors.groupingBy(Employee::department,
    Collectors.collectingAndThen(Collectors.mapping(Employee::salary, Collectors.toList()),
      sal -> sal.stream().distinct().sorted(Comparator.reverseOrder()).skip(n - 1L).findFirst())));`,
    time: 'O(n log k)',
    space: 'O(n)',
    edges: 'Clarify distinct. Empty Optional if dept too small.',
  },
  {
    n: 92,
    level: 6,
    title: 'Top N employees per department',
    keyConcept: 'groupingBy + sorted + limit',
    priority: true,
    solution: `int n = 3;
Map<String, List<Employee>> top = emps.stream().collect(
  Collectors.groupingBy(Employee::department,
    Collectors.collectingAndThen(Collectors.toList(),
      list -> list.stream()
        .sorted(Comparator.comparingDouble(Employee::salary).reversed()
          .thenComparing(Employee::id))
        .limit(n).toList())));`,
    time: 'O(n log k)',
    space: 'O(n)',
    edges: 'Tie-break mandatory for determinism.',
  },
  {
    n: 93,
    level: 6,
    title: 'Above department average',
    keyConcept: 'same as #11',
    solution: `// see #11`,
    time: 'O(n)',
    space: 'O(d)',
    edges: 'Two-pass vs teeing.',
  },
  {
    n: 94,
    level: 6,
    title: 'Above company avg but below department max',
    keyConcept: 'company avg + per-dept max maps',
    solution: `double companyAvg = emps.stream().mapToDouble(Employee::salary).average().orElse(0);
Map<String, Double> deptMax = emps.stream().collect(
  Collectors.groupingBy(Employee::department,
    Collectors.collectingAndThen(Collectors.mapping(Employee::salary, Collectors.maxBy(Double::compare)),
      o -> o.orElseThrow())));
emps.stream()
  .filter(e -> e.salary() > companyAvg && e.salary() < deptMax.get(e.department()))
  .toList();`,
    time: 'O(n)',
    space: 'O(d)',
    edges: 'Employee who is the dept max excluded by <.',
  },
  {
    n: 95,
    level: 6,
    title: 'Department with second-highest average salary',
    keyConcept: 'averages · sort · skip 1',
    solution: `emps.stream()
  .collect(Collectors.groupingBy(Employee::department, Collectors.averagingDouble(Employee::salary)))
  .entrySet().stream()
  .sorted(Map.Entry.<String, Double>comparingByValue().reversed())
  .skip(1).findFirst();`,
    time: 'O(n + d log d)',
    space: 'O(d)',
    edges: '<2 departments.',
  },
  {
    n: 96,
    level: 6,
    title: 'Second-highest salary employee per dept (ties)',
    keyConcept: 'distinct salary ranks then pick employees',
    solution: `// Rank by distinct salary: 2nd distinct value, then employees with that salary
Map<String, List<Employee>> result = emps.stream().collect(
  Collectors.groupingBy(Employee::department,
    Collectors.collectingAndThen(Collectors.toList(), list -> {
      Optional<Double> second = list.stream().map(Employee::salary).distinct()
        .sorted(Comparator.reverseOrder()).skip(1).findFirst();
      return second.map(s -> list.stream().filter(e -> e.salary() == s).toList())
        .orElse(List.of());
    })));`,
    time: 'O(n log k)',
    space: 'O(n)',
    edges: 'Must define: second distinct salary vs second row after sort.',
  },
  {
    n: 97,
    level: 6,
    title: 'Highest-paid per job title within each department',
    keyConcept: 'nested groupingBy + maxBy',
    solution: `emps.stream().collect(
  Collectors.groupingBy(Employee::department,
    Collectors.groupingBy(Employee::title,
      Collectors.collectingAndThen(
        Collectors.maxBy(Comparator.comparingDouble(Employee::salary)),
        Optional::orElseThrow))));`,
    time: 'O(n)',
    space: 'O(n)',
    edges: 'Map<dept, Map<title, Employee>>.',
  },
  {
    n: 98,
    level: 6,
    title: 'Longest consecutive sequence (streams-assisted)',
    keyConcept: 'Set + stream lengths — loop often clearer',
    solution: `Set<Integer> set = new HashSet<>(nums);
int best = set.stream().filter(x -> !set.contains(x - 1))
  .mapToInt(start -> {
    int len = 1; while (set.contains(start + len)) len++; return len;
  }).max().orElse(0);
// Senior: prefer pure loop for this algorithm interview classic`,
    time: 'O(n)',
    space: 'O(n)',
    edges: 'Streams wrapping while is awkward — say so.',
    withoutStreams: 'HashSet + expand forward from starts.',
    parallel: 'Not natural.',
  },
  {
    n: 99,
    level: 6,
    title: 'Intersection of multiple lists',
    keyConcept: 'reduce with retainAll / filter containsAll',
    solution: `List<List<Integer>> lists = ...;
Set<Integer> inter = lists.stream()
  .map(HashSet::new)
  .reduce((a, b) -> { a.retainAll(b); return a; })
  .orElseGet(HashSet::new);`,
    time: 'O(n)',
    space: 'O(min list)',
    edges: 'Empty lists → empty. Order not preserved.',
  },
  {
    n: 100,
    level: 6,
    title: 'Custom Collector: count, sum, min, max, average',
    keyConcept: 'Collector.of supplier/accumulator/combiner/finisher',
    priority: true,
    solution: `record Stats(long count, double sum, double min, double max) {
  double avg() { return count == 0 ? 0 : sum / count; }
}
Collector<Employee, double[], Stats> statsCollector = Collector.of(
  () -> new double[]{0, 0, Double.POSITIVE_INFINITY, Double.NEGATIVE_INFINITY}, // count,sum,min,max
  (a, e) -> { a[0]++; a[1]+=e.salary(); a[2]=Math.min(a[2], e.salary()); a[3]=Math.max(a[3], e.salary()); },
  (a, b) -> { a[0]+=b[0]; a[1]+=b[1]; a[2]=Math.min(a[2],b[2]); a[3]=Math.max(a[3],b[3]); return a; },
  a -> new Stats((long)a[0], a[1], a[2], a[3]));
Stats s = emps.stream().collect(statsCollector);
// Or prefer summarizingDouble / teeing for readability`,
    time: 'O(n) one pass',
    space: 'O(1)',
    edges: 'Empty → min=+∞ unless finisher guards. Prefer DoubleSummaryStatistics in prod.',
    parallel: 'Combiner must be associative — this one is.',
  },
];

export const PRIORITY_15 = TOUGH_100.filter((p) => p.priority);

export const PRIORITY_TABLE: {n: number; title: string; keyConcept: string}[] = PRIORITY_15.map((p) => ({
  n: p.n,
  title: p.title,
  keyConcept: p.keyConcept,
}));

/** Model reminder for solutions */
export const TOUGH_MODEL = EMP;
