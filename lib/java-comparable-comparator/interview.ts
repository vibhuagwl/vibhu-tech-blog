import type {CodingProblem, InterviewQ, OutputPredict} from './types';

export const TRAP_QS: InterviewQ[] = [
  {
    id: 't1',
    topic: 'TreeSet',
    question: 'Does TreeSet use equals() to reject duplicates?',
    answer30s: 'No — sameness is compare/compareTo == 0, not equals.',
    answer2m:
      'TreeSet walks the red-black tree using Comparator or Comparable. Two objects can be unequal by equals but still compare as 0 (e.g. dept-only Comparator), so only one survives. Conversely, equals-true with compare≠0 can store both.',
    followUps: ['HashSet vs TreeSet duplicate rule?'],
    trick: '“TreeSet checks equals like HashSet.”',
    wrongAnswer: 'Yes — if equals is true it is a duplicate.',
  },
  {
    id: 't2',
    topic: 'Overflow',
    question: 'Why is return this.id - other.id dangerous in compareTo?',
    answer30s: 'Integer subtraction overflows and can flip the sign.',
    answer2m:
      'When ids are near Integer.MIN_VALUE and MAX_VALUE, (a - b) can become positive while a < b. TreeMap/TreeSet get corrupted order. Always use Integer.compare, Long.compare, or Comparator.comparingInt.',
    followUps: ['Same bug with long subtraction?'],
    trick: '“Subtraction is fine for int ids.”',
    wrongAnswer: 'Overflow only happens with long — ints are safe.',
  },
  {
    id: 't3',
    topic: 'BigDecimal',
    question: 'BigDecimal 1.0 and 1.00 — equals vs compareTo?',
    answer30s: 'equals is false (scale differs); compareTo is 0 (same numeric value).',
    answer2m:
      'HashSet/HashMap keep both entries. TreeSet/TreeMap collapse to one because compareTo==0. Production fix: stripTrailingZeros, Comparator.comparing(bd -> bd.stripTrailingZeros()), or document scale policy.',
    followUps: ['ConcurrentSkipListMap behavior?'],
    trick: '“If compareTo is 0 they must be equals.”',
    wrongAnswer: 'Both equals and compareTo are true.',
  },
  {
    id: 't4',
    topic: 'Comparator zero',
    question: 'Comparator returns 0 for objects that are not equals — what breaks?',
    answer30s: 'TreeMap/TreeSet silently drop or replace distinct business keys.',
    answer2m:
      'HashMap may store both (different equals) while TreeMap keeps one. SortedSet contract: compare==0 means same key. Fix with thenComparing on id or full business key fields.',
    followUps: ['PriorityQueue impact?'],
    trick: '“Zero only affects sort order, not membership.”',
    wrongAnswer: 'IllegalArgumentException on put.',
  },
  {
    id: 't5',
    topic: 'PriorityQueue',
    question: 'Is iterating a PriorityQueue sorted?',
    answer30s: 'No — internal heap array order is not sorted.',
    answer2m:
      'poll()/peek() respect Comparator order. for-each walks the backing array in heap layout. Interviewers love this vs TreeSet iteration which is sorted.',
    followUps: ['How to drain in order?'],
    trick: '“PriorityQueue iteration is ascending.”',
    wrongAnswer: 'Yes — it is always sorted like TreeSet.',
  },
  {
    id: 't6',
    topic: 'Mutable key',
    question: 'Can you mutate a TreeMap key field after put?',
    answer30s: 'Never — tree position becomes wrong; lookups fail.',
    answer2m:
      'Node was placed using old compare values. Mutating compare fields breaks the BST invariant. Same class of bug as mutating hashCode on HashMap keys. Use immutable keys or remove+reinsert.',
    followUps: ['What if only non-compare field mutates?'],
    trick: '“TreeMap rebalances on mutation.”',
    wrongAnswer: 'Safe if you do not call put again.',
  },
  {
    id: 't7',
    topic: 'Records',
    question: 'Is a Java record automatically Comparable?',
    answer30s: 'No — records get equals/hashCode/toString, not compareTo.',
    answer2m:
      'TreeMap<Record> needs an explicit Comparator or implement Comparable on a wrapper. Do not assume record natural order exists.',
    followUps: ['Enum as TreeMap key?'],
    trick: '“Records sort by field declaration order.”',
    wrongAnswer: 'Yes — all records are Comparable.',
  },
  {
    id: 't8',
    topic: 'Null key',
    question: 'Can TreeMap with natural ordering store a null key?',
    answer30s: 'No — NullPointerException on compareTo.',
    answer2m:
      'Natural-order TreeMap forbids null keys. Comparator.nullsFirst/nullsLast can allow nulls if you design for it — rare and usually avoided.',
    followUps: ['Null values in TreeMap?'],
    trick: '“Null key sorts first like SQL NULL.”',
    wrongAnswer: 'Yes — null is allowed and sorts first.',
  },
  {
    id: 't9',
    topic: 'comparing vs comparingInt',
    question: 'Comparator.comparing(Employee::id) when id is int — trap?',
    answer30s: 'Autoboxes to Integer — extra objects and null-boxing NPE risk.',
    answer2m:
      'comparingInt/comparingLong/comparingDouble avoid boxing. For primitives always prefer the primitive specialized methods.',
    followUps: ['What if id is Integer nullable field?'],
    trick: '“comparing and comparingInt are identical for int.”',
    wrongAnswer: 'comparing is always faster.',
  },
  {
    id: 't10',
    topic: 'String sort',
    question: 'Does String natural order match locale-aware collation?',
    answer30s: 'No — String.compareTo is Unicode lexicographic (Unicode code point order).',
    answer2m:
      'Locale sorting needs Collator or RuleBasedCollator. Interview trap: "apple" vs "Apple" vs accented characters sort differently than human expectations.',
    followUps: ['Case-insensitive Comparator?'],
    trick: '“String sort is always case-insensitive ASCII.”',
    wrongAnswer: 'String uses English dictionary order.',
  },
  {
    id: 't11',
    topic: 'Stable sort',
    question: 'Is Collections.sort / List.sort stable?',
    answer30s: 'Yes — TimSort preserves relative order of equal elements (Java 7+).',
    answer2m:
      'Equal per Comparator means compare returns 0; earlier elements stay before later ones. Useful when sorting by one field then another with compound Comparator instead.',
    followUps: ['Arrays.sort objects stable?'],
    trick: '“Stable sort means O(n) time.”',
    wrongAnswer: 'No — equal elements may reorder.',
  },
  {
    id: 't12',
    topic: 'reverseOrder',
    question: 'Comparator.reverseOrder() on Integer — what type?',
    answer30s: 'Comparator<Comparable> — erasure pain with generics.',
    answer2m:
      'Prefer Comparator.comparingInt(x -> x).reversed() or Comparator.<Integer>reverseOrder() with explicit type. Raw reverseOrder in generic APIs causes warnings/errors.',
    followUps: ['naturalOrder vs reverseOrder?'],
    trick: '“reverseOrder works on any type without casts.”',
    wrongAnswer: 'It only works on int primitives.',
  },
  {
    id: 't13',
    topic: 'Float compare',
    question: 'Why not (float)a - (float)b in compare?',
    answer30s: 'NaN ordering and -0.0 vs +0.0 break naive subtraction.',
    answer2m:
      'Float.compare and Double.compare handle NaN (NaN > other) and distinguish ±0.0. equals on Double says +0.0 and -0.0 are different.',
    followUps: ['TreeSet with Double wrapper?'],
    trick: '“Floating compare is same as int subtraction.”',
    wrongAnswer: 'NaN causes compareTo to return 0.',
  },
  {
    id: 't14',
    topic: 'inheritance',
    question: 'Subclass instance in TreeSet<Super> with compare on Super fields only?',
    answer30s: 'Distinct subclass instances with same Super fields compare as 0 — one entry.',
    answer2m:
      'Comparator on base fields ignores runtime subtype identity. If equals distinguishes subtype, you have inconsistency with sorted collections.',
    followUps: ['getClass in equals for keys?'],
    trick: '“Subclass always sorts separately.”',
    wrongAnswer: 'TreeSet stores both subclass instances.',
  },
  {
    id: 't15',
    topic: 'Enum order',
    question: 'TreeSet<Day> natural order — declaration or ordinal?',
    answer30s: 'Declaration order in enum (ordinal), not name alphabetical.',
    answer2m:
      'Enum implements Comparable using ordinal. Reordering enum constants changes sort order — breaking change for persisted ordinal-based data.',
    followUps: ['Custom enum Comparator by name?'],
    trick: '“Enums sort alphabetically by name.”',
    wrongAnswer: 'Enums are not Comparable.',
  },
  {
    id: 't16',
    topic: 'Arrays.sort primitives',
    question: 'Arrays.sort(int[]) vs Arrays.sort(Integer[]) — algorithm difference?',
    answer30s: 'Primitives: dual-pivot quicksort (unstable). Objects: TimSort (stable).',
    answer2m:
      'Primitive sort does not need stability and uses faster quicksort. Object sort needs Comparator/Comparable and stability guarantee.',
    followUps: ['parallelSort?'],
    trick: '“Both use TimSort.”',
    wrongAnswer: 'Primitive sort is stable.',
  },
  {
    id: 't17',
    topic: 'ConcurrentSkipListMap',
    question: 'Does ConcurrentSkipListMap use hashCode?',
    answer30s: 'No for structure — Comparable/Comparator like TreeMap.',
    answer2m:
      'Concurrent sorted map. Same compare==0 key rule. No null keys or values. Weakly consistent iterators.',
    followUps: ['When pick over TreeMap?'],
    trick: '“It is a concurrent HashMap that sorts.”',
    wrongAnswer: 'It uses hashCode then sorts buckets.',
  },
  {
    id: 't18',
    topic: 'Stream sorted',
    question: 'Stream.sorted() without Comparator on non-Comparable elements?',
    answer30s: 'ClassCastException at runtime.',
    answer2m:
      'sorted() uses natural order; must implement Comparable or use sorted(Comparator). Parallel sorted is expensive merge.',
    followUps: ['sorted vs min/max with Comparator?'],
    trick: '“Compiler enforces Comparable at compile time.”',
    wrongAnswer: 'Elements sort by hashCode.',
  },
  {
    id: 't19',
    topic: 'thenComparing null',
    question: 'comparing(Function) when extracted field is null?',
    answer30s: 'NullPointerException unless nullsFirst/nullsLast on that Comparator.',
    answer2m:
      'comparing(Employee::dept) delegates to String natural order which NPEs on null dept. Wrap: comparing(Employee::dept, nullsLast(naturalOrder())).',
    followUps: ['Optional field sorting?'],
    trick: '“null sorts as empty string automatically.”',
    wrongAnswer: 'null always sorts first without extra code.',
  },
  {
    id: 't20',
    topic: 'Identity',
    question: 'Two Employee objects compareTo==0 but equals false — HashSet size?',
    answer30s: '2 — HashSet uses equals/hashCode, not compareTo.',
    answer2m:
      'Classic inconsistency demo: HashMap keeps both, TreeSet keeps one. Align compareTo/Comparator with equals fields for sorted-map keys.',
    followUps: ['Can you mix HashSet and TreeSet dedupe?'],
    trick: '“compareTo==0 implies equals true always.”',
    wrongAnswer: '1 — same as TreeSet.',
  },
  {
    id: 't21',
    topic: 'Comparator contract',
    question: 'Must Comparator be consistent with equals?',
    answer30s: 'Strongly recommended for sorted collections; equals true should imply compare==0.',
    answer2m:
      'Not a Java language requirement for Comparator interface, but violating it breaks Set/Map semantics. compare==0 should match equals for TreeSet/TreeMap keys.',
    followUps: ['Anti-symmetric requirement?'],
    trick: '“Comparator contract requires equals consistency.”',
    wrongAnswer: 'Comparator has no relation to equals.',
  },
  {
    id: 't22',
    topic: 'reversed mutability',
    question: 'Does reversed() mutate the original Comparator?',
    answer30s: 'No — returns a new Comparator view.',
    answer2m:
      'reversed() wraps the original; both can be used. Order of composition matters: comparing(A).thenComparing(B).reversed() differs from reversed thenComparing.',
    followUps: ['reverseOrder vs reversed?'],
    trick: '“reversed() flips internal state in place.”',
    wrongAnswer: 'reversed() is only for Comparable, not Comparator.',
  },
  {
    id: 't23',
    topic: 'TreeMap null value',
    question: 'TreeMap allows null values?',
    answer30s: 'Yes — null values are allowed; null keys are not (natural order).',
    answer2m:
      'Many interviewers confuse null key vs null value. ConcurrentSkipListMap forbids both null key and null value.',
    followUps: ['Hashtable null value?'],
    trick: '“TreeMap forbids all nulls.”',
    wrongAnswer: 'Neither null key nor null value allowed.',
  },
  {
    id: 't24',
    topic: 'List sort mutability',
    question: 'Does Collections.sort mutate the original list?',
    answer30s: 'Yes — in-place reorder; does not create new list.',
    answer2m:
      'List.sort same. For immutable pipeline use stream sorted().toList() (new list).',
    followUps: ['Copy before sort when?'],
    trick: '“sort returns a new sorted list.”',
    wrongAnswer: 'Collections.sort copies first.',
  },
  {
    id: 't25',
    topic: 'Comparable symmetry',
    question: 'compareTo must be antisymmetric — what does a.compareTo(b)==0 imply?',
    answer30s: 'Symmetric zero: b.compareTo(a) should also be 0.',
    answer2m:
      'Violating compare contract yields undefined TreeSet behavior. Only sign matters for non-zero; magnitude is ignored.',
    followUps: ['Can compare return 2 instead of 1?'],
    trick: '“Must return exactly 1 or -1.”',
    wrongAnswer: 'a.compareTo(b)==0 means a==b reference equality.',
  },
  {
    id: 't26',
    topic: 'NavigableMap',
    question: 'floorKey vs get — key not present?',
    answer30s: 'floorKey returns nearest ≤ key; get returns null if no exact mapping.',
    answer2m:
      'TreeMap navigable views depend on Comparator ordering. Custom Comparator must match business “nearest” definition.',
    followUps: ['ceilingKey vs higherKey?'],
    trick: '“floorKey throws if absent.”',
    wrongAnswer: 'floorKey only works for exact keys.',
  },
  {
    id: 't27',
    topic: 'PriorityQueue comparator',
    question: 'PriorityQueue with Comparator — is it a min-heap or max-heap?',
    answer30s: 'Head is least per Comparator — “min” relative to Comparator.',
    answer2m:
      'reverseOrder Comparator gives max-heap behavior at head. null Comparator uses natural order of Comparable elements.',
    followUps: ['remove() vs poll()?'],
    trick: '“PriorityQueue is always max-heap.”',
    wrongAnswer: 'Comparator makes it a TreeSet internally.',
  },
  {
    id: 't28',
    topic: 'Sort performance',
    question: 'Already-sorted list — TimSort complexity?',
    answer30s: 'O(n) best case on partially/already sorted data.',
    answer2m:
      'TimSort exploits runs. Reverse-sorted is still O(n log n). Interview tie-in: stable + adaptive vs quicksort on primitives.',
    followUps: ['When prefer explicit sort key?'],
    trick: '“Sorted input is still O(n log n) always.”',
    wrongAnswer: 'TimSort is always O(n).',
  },
  {
    id: 't29',
    topic: 'Serialized Comparator',
    question: 'TreeMap serialized with Comparator — safe across versions?',
    answer30s: 'Comparator must remain semantically identical after deserialize.',
    answer2m:
      'Changing Comparator logic breaks stored order assumptions. Prefer stable business keys in persisted maps or store sorted entries as lists.',
    followUps: ['Serializable anonymous Comparator?'],
    trick: '“Serialization ignores Comparator.”',
    wrongAnswer: 'TreeMap re-sorts on deserialize automatically.',
  },
  {
    id: 't30',
    topic: 'Optional field',
    question: 'Sort employees by optional salary — null salary first?',
    answer30s: 'Comparator.comparing(Employee::salary, nullsFirst(naturalOrder())).',
    answer2m:
      'Or nullsLast for “paid employees first”. comparing on Optional works: comparing(e -> e.salary().orElse(null), nullsLast(...)).',
    followUps: ['Optional.empty vs null in Comparator?'],
    trick: '“Optional sorts empty first by default.”',
    wrongAnswer: 'Optional cannot be used in Comparator.',
  },
  {
    id: 't31',
    topic: 'Date sort',
    question: 'Sort java.util.Date in TreeSet — natural order?',
    answer30s: 'Date implements Comparable — chronological by millisecond.',
    answer2m:
      'Prefer Instant or LocalDate with explicit Comparator. Legacy Date mutable — do not use as key if fields can change.',
    followUps: ['LocalDate in TreeMap?'],
    trick: '“Date sorts by day-of-month only.”',
    wrongAnswer: 'Date is not Comparable.',
  },
  {
    id: 't32',
    topic: 'Comparator chain',
    question: 'thenComparing vs thenComparingInt order matters?',
    answer30s: 'Yes — primary key first, tie-breaker second.',
    answer2m:
      'comparing(dept).thenComparingInt(id) sorts by dept then id. Reversing chain changes total order completely.',
    followUps: ['How to sort dept desc, id asc?'],
    trick: '“thenComparing is commutative.”',
    wrongAnswer: 'Order only affects performance, not result.',
  },
  {
    id: 't33',
    topic: 'HashSet sorted',
    question: 'Can you get sorted iteration from HashSet?',
    answer30s: 'No inherent order — copy to TreeSet or sort stream.',
    answer2m:
      'LinkedHashSet gives insertion order, not sort order. For sorted unique collection use TreeSet or stream().sorted().distinct().',
    followUps: ['TreeSet vs LinkedHashSet?'],
    trick: '“HashSet sorts on iteration in Java 8+.”',
    wrongAnswer: 'HashSet iterates in Comparator order.',
  },
  {
    id: 't34',
    topic: 'compare contract magnitude',
    question: 'Is compare(a,b)=5 different from compare(a,b)=1?',
    answer30s: 'No — only sign matters; non-zero means greater.',
    answer2m:
      'Returning arbitrary positive/negative is fine. Some code wrongly uses Math.abs or thresholds.',
    followUps: ['Why not return (a>b)?1:0?'],
    trick: '“Must return ±1 exactly.”',
    wrongAnswer: '5 means “much greater” and affects position.',
  },
  {
    id: 't35',
    topic: 'Lambda capture',
    question: 'Comparator capturing mutable external state — trap?',
    answer30s: 'Sort order changes when captured state changes — unstable ordering.',
    answer2m:
      'E.g. comparing by volatile config without documenting. Prefer immutable captured values or explicit strategy objects.',
    followUps: ['Thread-safe Comparator?'],
    trick: '“Lambdas make Comparators thread-safe.”',
    wrongAnswer: 'Compiler forbids mutable captures.',
  },
  {
    id: 't36',
    topic: 'TreeSet add return',
    question: 'TreeSet.add returns false when?',
    answer30s: 'When compare finds existing equal element — add rejected.',
    answer2m:
      'Unlike HashSet which checks equals/hashCode. Duplicate per Comparator means add returns false and set unchanged.',
    followUps: ['TreeSet remove uses compare or equals?'],
    trick: '“add always returns true for new object instance.”',
    wrongAnswer: 'Returns false only on null.',
  },
  {
    id: 't37',
    topic: 'Collections.max',
    question: 'Collections.max(list) without Comparator requirements?',
    answer30s: 'Elements must implement Comparable; throws if not.',
    answer2m:
      'Uses iterator and compares each element. Empty collection throws NoSuchElementException. O(n) not O(n log n).',
    followUps: ['max vs stream max?'],
    trick: '“max sorts the list first.”',
    wrongAnswer: 'max returns first element if not Comparable.',
  },
  {
    id: 't38',
    topic: 'SubList sort',
    question: 'Does sorting a subList affect parent list?',
    answer30s: 'Yes — subList is backed view; sort mutates parent range.',
    answer2m:
      'Concurrent modification if parent structurally changed while sorting subList. Copy subList if isolation needed.',
    followUps: ['subList clear effect?'],
    trick: '“subList sort is independent copy.”',
    wrongAnswer: 'subList sort throws always.',
  },
  {
    id: 't39',
    topic: 'CharSequence',
    question: 'Comparator.comparing(Employee::name) when name is String — case trap?',
    answer30s: 'Natural String order is case-sensitive — "A" before "a" (Unicode).',
    answer2m:
      'Use String.CASE_INSENSITIVE_ORDER as second arg or comparing(String::toLowerCase) with locale care.',
    followUps: ['Turkish locale i/I trap?'],
    trick: '“Java String sort is case-insensitive.”',
    wrongAnswer: 'ASCII order puts lowercase before uppercase.',
  },
  {
    id: 't40',
    topic: 'parallelSort',
    question: 'Arrays.parallelSort always faster?',
    answer30s: 'No — fork overhead; best on large arrays.',
    answer2m:
      'Uses common ForkJoinPool. Small arrays slower. Object parallelSort still needs Comparable/Comparator.',
    followUps: ['When threshold matters?'],
    trick: '“parallelSort is default in Java 8.”',
    wrongAnswer: 'parallelSort is unstable so avoided.',
  },
  {
    id: 't41',
    topic: 'Strategy reuse',
    question: 'Same Comparator instance across threads — safe?',
    answer30s: 'Yes if immutable — stateless Comparators are thread-safe.',
    answer2m:
      'Comparator.comparing static methods return immutable objects. Do not share Comparators with mutable closure state.',
    followUps: ['static final Comparator pattern?'],
    trick: '“Each thread needs its own Comparator.”',
    wrongAnswer: 'Comparator is always thread-local.',
  },
  {
    id: 't42',
    topic: 'TreeMap put replace',
    question: 'TreeMap put same compare key — replaces value?',
    answer30s: 'Yes — compare==0 means same key; value replaced, size unchanged.',
    answer2m:
      'Same as HashMap equals key replace. Distinct only when compare≠0.',
    followUps: ['putIfAbsent with Comparator zero?'],
    trick: '“Second put throws duplicate key.”',
    wrongAnswer: 'Size increases to 2.',
  },
];

export const RAPID_QS: InterviewQ[] = [
  {id: 'r1', topic: 'Rapid', question: 'Comparable defines what method?', answer30s: 'compareTo(T o).', answer2m: 'Natural ordering inside the class.', followUps: []},
  {id: 'r2', topic: 'Rapid', question: 'Comparator defines what method?', answer30s: 'compare(T a, T b).', answer2m: 'External ordering strategy.', followUps: []},
  {id: 'r3', topic: 'Rapid', question: 'TreeSet duplicate rule?', answer30s: 'compare/compareTo == 0.', answer2m: 'Not equals.', followUps: []},
  {id: 'r4', topic: 'Rapid', question: 'HashSet duplicate rule?', answer30s: 'equals true (with hashCode contract).', answer2m: 'Not compareTo.', followUps: []},
  {id: 'r5', topic: 'Rapid', question: 'Safe int compare in compareTo?', answer30s: 'Integer.compare(a,b).', answer2m: 'Not a - b.', followUps: []},
  {id: 'r6', topic: 'Rapid', question: 'BigDecimal equals 1.0 vs 1.00?', answer30s: 'false.', answer2m: 'compareTo == 0.', followUps: []},
  {id: 'r7', topic: 'Rapid', question: 'PriorityQueue iteration sorted?', answer30s: 'No.', answer2m: 'poll() is ordered.', followUps: []},
  {id: 'r8', topic: 'Rapid', question: 'TreeSet iteration sorted?', answer30s: 'Yes.', answer2m: 'Ascending per Comparator.', followUps: []},
  {id: 'r9', topic: 'Rapid', question: 'Natural-order TreeMap null key?', answer30s: 'NPE — forbidden.', answer2m: 'No compareTo on null.', followUps: []},
  {id: 'r10', topic: 'Rapid', question: 'Record automatically Comparable?', answer30s: 'No.', answer2m: 'Only equals/hashCode.', followUps: []},
  {id: 'r11', topic: 'Rapid', question: 'Enum natural order?', answer30s: 'Declaration ordinal.', answer2m: 'Comparable by ordinal.', followUps: []},
  {id: 'r12', topic: 'Rapid', question: 'Collections.sort stable?', answer30s: 'Yes — TimSort.', answer2m: 'Since Java 7.', followUps: []},
  {id: 'r13', topic: 'Rapid', question: 'Arrays.sort(int[]) stable?', answer30s: 'No — quicksort.', answer2m: 'Primitive sort.', followUps: []},
  {id: 'r14', topic: 'Rapid', question: 'comparingInt vs comparing for int?', answer30s: 'comparingInt avoids boxing.', answer2m: 'Prefer primitive variants.', followUps: []},
  {id: 'r15', topic: 'Rapid', question: 'nullsFirst vs nullsLast?', answer30s: 'Wrap Comparator for null placement.', answer2m: 'On specific key Comparator.', followUps: []},
  {id: 'r16', topic: 'Rapid', question: 'reversed() on Comparator?', answer30s: 'Returns new reversed Comparator.', answer2m: 'Does not mutate original.', followUps: []},
  {id: 'r17', topic: 'Rapid', question: 'TreeMap uses hashCode?', answer30s: 'No for placement.', answer2m: 'Comparator/Comparable.', followUps: []},
  {id: 'r18', topic: 'Rapid', question: 'ConcurrentSkipListMap null key?', answer30s: 'Forbidden.', answer2m: 'NPE.', followUps: []},
  {id: 'r19', topic: 'Rapid', question: 'compare==0 for SortedSet means?', answer30s: 'Same key — one element.', answer2m: 'Set uniqueness.', followUps: []},
  {id: 'r20', topic: 'Rapid', question: 'Float compare safe API?', answer30s: 'Float.compare.', answer2m: 'Handles NaN.', followUps: []},
  {id: 'r21', topic: 'Rapid', question: 'Double +0.0 equals -0.0?', answer30s: 'false.', answer2m: 'Different hashCodes too.', followUps: []},
  {id: 'r22', topic: 'Rapid', question: 'String compareTo case sensitive?', answer30s: 'Yes.', answer2m: 'Unicode lexicographic.', followUps: []},
  {id: 'r23', topic: 'Rapid', question: 'Stream.sorted() needs?', answer30s: 'Comparable or sorted(Comparator).', answer2m: 'Else ClassCastException.', followUps: []},
  {id: 'r24', topic: 'Rapid', question: 'thenComparing purpose?', answer30s: 'Tie-breaker second key.', answer2m: 'Multi-level sort.', followUps: []},
  {id: 'r25', topic: 'Rapid', question: 'Comparator comparing only dept trap?', answer30s: 'False zeros collapse distinct ids.', answer2m: 'Add thenComparingInt(id).', followUps: []},
  {id: 'r26', topic: 'Rapid', question: 'Mutable TreeMap key after put?', answer30s: 'Broken tree — avoid.', answer2m: 'Immutable keys.', followUps: []},
  {id: 'r27', topic: 'Rapid', question: 'PriorityQueue head element?', answer30s: 'Least per Comparator.', answer2m: 'Min-heap semantics.', followUps: []},
  {id: 'r28', topic: 'Rapid', question: 'TreeMap floorKey absent exact?', answer30s: 'Returns nearest ≤ key.', answer2m: 'NavigableMap.', followUps: []},
  {id: 'r29', topic: 'Rapid', question: 'IdentityHashMap ordering?', answer30s: 'No meaningful sort order.', answer2m: 'Not Comparable-based.', followUps: []},
  {id: 'r30', topic: 'Rapid', question: 'LinkedHashSet iteration order?', answer30s: 'Insertion order.', answer2m: 'Not sorted.', followUps: []},
  {id: 'r31', topic: 'Rapid', question: 'List.sort mutates list?', answer30s: 'Yes in-place.', answer2m: 'Same as Collections.sort.', followUps: []},
  {id: 'r32', topic: 'Rapid', question: 'Comparator anti-symmetric?', answer30s: 'sign(compare(a,b)) == -sign(compare(b,a)).', answer2m: 'Except zeros.', followUps: []},
  {id: 'r33', topic: 'Rapid', question: 'compare magnitude matters?', answer30s: 'No — only sign.', answer2m: 'Non-zero any positive/negative.', followUps: []},
  {id: 'r34', topic: 'Rapid', question: 'TreeSet add returns false when?', answer30s: 'Duplicate per compare.', answer2m: 'Not new instance.', followUps: []},
  {id: 'r35', topic: 'Rapid', question: 'Collections.max complexity?', answer30s: 'O(n) single pass.', answer2m: 'Not sort.', followUps: []},
  {id: 'r36', topic: 'Rapid', question: 'LocalDate Comparable?', answer30s: 'Yes — ISO chronological.', answer2m: 'Immutable — good key.', followUps: []},
  {id: 'r37', topic: 'Rapid', question: 'Instant Comparable?', answer30s: 'Yes — timeline order.', answer2m: 'Prefer over Date.', followUps: []},
  {id: 'r38', topic: 'Rapid', question: 'Comparator as TreeMap ctor arg?', answer30s: 'Defines key order.', answer2m: 'Overrides natural order.', followUps: []},
  {id: 'r39', topic: 'Rapid', question: 'naturalOrder() requires?', answer30s: 'Comparable elements.', answer2m: 'Typed Comparator.', followUps: []},
  {id: 'r40', topic: 'Rapid', question: 'reverseOrder() type erasure trap?', answer30s: 'Raw Comparable comparator.', answer2m: 'Use explicit generic.', followUps: []},
  {id: 'r41', topic: 'Rapid', question: 'Sort subList affects parent?', answer30s: 'Yes — backed view.', answer2m: 'Mutates parent range.', followUps: []},
  {id: 'r42', topic: 'Rapid', question: 'TimSort best case?', answer30s: 'O(n) on sorted runs.', answer2m: 'Adaptive.', followUps: []},
  {id: 'r43', topic: 'Rapid', question: 'parallelSort uses?', answer30s: 'ForkJoin common pool.', answer2m: 'Large arrays.', followUps: []},
  {id: 'r44', topic: 'Rapid', question: 'Comparable only one per class?', answer30s: 'Yes — single natural order.', answer2m: 'Many Comparators possible.', followUps: []},
  {id: 'r45', topic: 'Rapid', question: 'Comparator many per class?', answer30s: 'Yes — strategies.', answer2m: 'Strategy pattern.', followUps: []},
  {id: 'r46', topic: 'Rapid', question: 'TreeMap descendingMap?', answer30s: 'Reverse-order view.', answer2m: 'Backed by same map.', followUps: []},
  {id: 'r47', topic: 'Rapid', question: 'PriorityQueue remove(Object)?', answer30s: 'Linear search O(n).', answer2m: 'Not heap-efficient.', followUps: []},
  {id: 'r48', topic: 'Rapid', question: 'PriorityQueue contains?', answer30s: 'O(n).', answer2m: 'Not hash-based.', followUps: []},
  {id: 'r49', topic: 'Rapid', question: 'Sorted map firstKey?', answer30s: 'Smallest per Comparator.', answer2m: 'Throws if empty.', followUps: []},
  {id: 'r50', topic: 'Rapid', question: 'Align compareTo with equals when?', answer30s: 'Sorted-map/set keys.', answer2m: 'compare==0 ⇔ equals.', followUps: []},
  {id: 'r51', topic: 'Rapid', question: 'HashMap key needs Comparable?', answer30s: 'No.', answer2m: 'hashCode+equals.', followUps: []},
  {id: 'r52', topic: 'Rapid', question: 'TreeMap key needs hashCode?', answer30s: 'Not for structure.', answer2m: 'Still implement for hybrid uses.', followUps: []},
  {id: 'r53', topic: 'Rapid', question: 'Comparator.comparing nullable field?', answer30s: 'Wrap with nullsFirst/Last.', answer2m: 'Avoid NPE.', followUps: []},
  {id: 'r54', topic: 'Rapid', question: 'Chained Comparator immutable?', answer30s: 'Yes — safe to share.', answer2m: 'Stateless.', followUps: []},
  {id: 'r55', topic: 'Rapid', question: 'Sort records in TreeSet?', answer30s: 'Need Comparator or Comparable wrapper.', answer2m: 'Record not Comparable.', followUps: []},
];

export const STAFF_QS: InterviewQ[] = [
  {
    id: 'st1',
    topic: 'Design',
    question: 'Design ordering for a multi-tenant leaderboard with tie-breakers.',
    answer30s: 'Immutable composite key; Comparator chaining score desc then timestamp asc then userId.',
    answer2m:
      'Use Comparator.comparingInt(Score::value).reversed().thenComparing(Score::ts).thenComparing(Score::userId). Store in ConcurrentSkipListMap or sort stream for snapshots. Document compare==0 only when true ties. Never mutate score objects in place after insert into sorted structures.',
    followUps: ['Sharding tenants?', 'Pagination with NavigableMap subMap?'],
    trick: 'Using float score without Double.compare.',
  },
  {
    id: 'st2',
    topic: 'Consistency',
    question: 'Team uses HashMap cache and TreeMap index on same Employee — how do bugs appear?',
    answer30s: 'HashMap finds both; TreeMap collapses — dual-view inconsistency.',
    answer2m:
      'Root cause: compareTo on id only, equals on id+dept. Production fix: single key type (record) with aligned equals and Comparator. Pick one canonical collection or one key definition document.',
    followUps: ['Migration without downtime?'],
    trick: '“They are always consistent if equals is correct.”',
  },
  {
    id: 'st3',
    topic: 'BigDecimal policy',
    question: 'How do you standardize BigDecimal in financial TreeSets?',
    answer30s: 'Document scale policy; stripTrailingZeros or uniform scale in Comparator.',
    answer2m:
      'Option A: Comparator.comparing(bd -> bd.stripTrailingZeros()). Option B: always store scale 2 in domain layer. Never mix HashSet dedupe (equals) with TreeSet dedupe (compare) without explicit policy doc.',
    followUps: ['Money record with Currency?'],
  },
  {
    id: 'st4',
    topic: 'Performance',
    question: 'When is sorting 10M items on heap vs external sort vs DB ORDER BY?',
    answer30s: 'Heap sort if fits memory and latency OK; else DB or chunked merge.',
    answer2m:
      'TimSort O(n log n) with low constant on partially sorted data. parallelSort only if array large and no blocking in FJP. DB wins when data not on heap, need paging, or index exists.',
    followUps: ['Off-heap BigArray?', 'Sort key denormalization?'],
  },
  {
    id: 'st5',
    topic: 'Concurrency',
    question: 'Can multiple threads share one TreeMap?',
    answer30s: 'No — external sync or concurrent sorted alternative.',
    answer2m:
      'ConcurrentSkipListMap for concurrent sorted map. Copy-on-write + sort for rare writes. Sorting synchronized list still needs lock around entire sort.',
    followUps: ['Read-write lock on TreeMap?'],
  },
  {
    id: 'st6',
    topic: 'Serialization',
    question: 'Risks serializing TreeMap with custom Comparator lambdas?',
    answer30s: 'Anonymous lambdas may not deserialize across JVMs/versions.',
    answer2m:
      'Use static named Comparator classes implementing Serializable. Document Comparator semantics as part of persisted format contract.',
    followUps: ['JSON export instead?'],
  },
  {
    id: 'st7',
    topic: 'Locale',
    question: 'Sort customer names for EU market — pitfalls?',
    answer30s: 'Use Collator with locale; not String.compareTo.',
    answer2m:
      'Turkish I/i, German ß, combined accents. Store normalized sort key if needed. Test with ICU4J Collator rules. Comparator stable for tie locale-insensitive id.',
    followUps: ['Unicode normalization NFC?'],
  },
  {
    id: 'st8',
    topic: 'Priority scheduling',
    question: 'PriorityQueue for job scheduler — production gaps?',
    answer30s: 'remove/update O(n); no blocking take with timeout without extra sync.',
    answer2m:
      'Consider DelayQueue for time-based, custom indexed heap, or external broker (Kafka priority). Comparator change mid-flight undefined. Document tie-breaking.',
    followUps: ['Virtual thread workers polling PQ?'],
  },
  {
    id: 'st9',
    topic: 'API design',
    question: 'Expose sort options in REST API — Comparable on entity?',
    answer30s: 'No — DTO sort field enums mapping to Comparator registry.',
    answer2m:
      'Registry: Map<SortKey, Comparator<Dto>>. Validate allowed keys. Avoid reflecting entity Comparable — couples API to DB entity natural order.',
    followUps: ['SQL injection via sort field?'],
  },
  {
    id: 'st10',
    topic: 'JPA',
    question: 'Sort JPA entities in memory after query — trap?',
    answer30s: 'Lazy collections trigger N+1; entities mutable; equals may include unsorted fields.',
    answer2m:
      'Sort DTOs. If must sort entities, Comparator on stable id only. Do not use TreeSet of entities with dept-only Comparator — duplicates vanish.',
    followUps: ['@OrderColumn vs Comparator?'],
  },
  {
    id: 'st11',
    topic: 'Versioning',
    question: 'Enum order change in release — impact?',
    answer30s: 'Ordinal Comparable order changes — breaks persisted sorted sets and ordinal DB columns.',
    answer2m:
      'Never persist ordinal. Use explicit string/int code in Comparator. Migration: rebuild sorted indexes from canonical key.',
    followUps: ['Feature flags on enum?'],
  },
  {
    id: 'st12',
    topic: 'Testing',
    question: 'How test Comparator contract?',
    answer30s: 'Property: sign symmetry; equals-compare consistency; transitivity spot checks.',
    answer2m:
      'Use equals samples for compare==0 pairs. Fuzz distinct pairs for antisymmetry. jqwik/quickcheck for transitivity on random triples.',
    followUps: ['Golden file sorted output?'],
  },
  {
    id: 'st13',
    topic: 'Debugging',
    question: 'TreeMap size smaller than expected — debug path?',
    answer30s: 'Log Comparator results; check compare==0 pairs with equals false.',
    answer2m:
      'Dump keys with identityHashCode. Reproduce with TreeSet. Compare with HashSet size. Fix thenComparing chain.',
    followUps: ['Visualize red-black tree?'],
  },
  {
    id: 'st14',
    topic: 'Streams',
    question: 'sorted().distinct() order semantics?',
    answer30s: 'distinct uses equals — may not match Comparator sorted order uniqueness.',
    answer2m:
      'Stream distinct is equals-based. For Comparator-unique stream, collect to TreeSet or custom reduction.',
    followUps: ['parallel sorted cost?'],
  },
  {
    id: 'st15',
    topic: 'Memory',
    question: 'TreeSet vs HashSet memory for 1M strings?',
    answer30s: 'TreeSet higher — tree nodes vs buckets.',
    answer2m:
      'TreeSet pays per-node pointers and color bit. HashSet array + linked/tree bins. Choose TreeSet only when need sorted iteration or range views.',
    followUps: ['Compact hash strategies?'],
  },
  {
    id: 'st16',
    topic: 'Navigable',
    question: 'Time-series data retention with TreeMap — pattern?',
    answer30s: 'Key=Instant; pollFirstEntry while before cutoff.',
    answer2m:
      'NavigableMap subMap for ranges. Immutable Instant keys. Watch concurrent modification — use lock or concurrent sorted map.',
    followUps: ['Ring buffer vs TreeMap?'],
  },
  {
    id: 'st17',
    topic: 'Kotlin interop',
    question: 'Kotlin data class in Java TreeSet?',
    answer30s: 'Not Comparable — provide Comparator or Java wrapper.',
    answer2m:
      'Kotlin comparisons often inline sortBy in collections — Java TreeSet needs explicit Comparator at boundary.',
    followUps: ['@JvmRecord?'],
  },
  {
    id: 'st18',
    topic: 'GC',
    question: 'PriorityQueue memory leak with remove never called?',
    answer30s: 'Elements linger until polled — bounded capacity + drain policy.',
    answer2m:
      'Stale tasks in heap if offers continue. Monitor size. Weak references rarely correct tool — prefer explicit caps.',
    followUps: ['DelayQueue expired cleanup?'],
  },
  {
    id: 'st19',
    topic: 'Equals hub',
    question: 'When interview asks Map key — Comparable vs equals first?',
    answer30s: 'Hash maps: equals/hashCode. Sorted maps: compare/Comparator.',
    answer2m:
      'State both contracts. TreeMap does not use hashCode for placement. Cross-link inconsistencies between hubs.',
    followUps: ['IdentityHashMap third case?'],
  },
  {
    id: 'st20',
    topic: 'Records migration',
    question: 'Migrate mutable Employee Comparable to record key?',
    answer30s: 'record EmployeeKey(id, dept); TreeMap Comparator on fields.',
    answer2m:
      'Remove mutable Comparable from entity. Entity is not a key. Comparator.comparing(EmployeeKey::dept).thenComparingLong(EmployeeKey::id).',
    followUps: ['JPA @EmbeddedId alignment?'],
  },
  {
    id: 'st21',
    topic: 'Observability',
    question: 'Metric: sort latency regression — what to check?',
    answer30s: 'Input size, sort key change, parallelSort accidental, Comparator allocation.',
    answer2m:
      'Profile TimSort merge counts. Check if list nearly sorted before. FJP contention if parallelSort on small arrays in request path.',
    followUps: ['JFR ObjectAllocation?'],
  },
];

export const SCENARIO_QS: InterviewQ[] = [
  {
    id: 'sc1',
    topic: 'Scenario',
    question:
      'Production bug: HR reports two employees in DB but TreeMap headcount shows 1 for ENG dept. Comparator is Comparator.comparing(Employee::dept). Walk through root cause and fix.',
    answer30s: 'Dept-only Comparator returns 0 for same dept — TreeMap treats as one key.',
    answer2m:
      'Alice ENG id=1 and Bob ENG id=99 compare as 0 — second put replaces first. HashMap by id would show 2. Fix: thenComparingInt(Employee::id). Add unit test: distinct equals must not compare 0 unless equals. Data recovery: rebuild map from source with fixed Comparator.',
    followUps: ['How detect in monitoring?', 'Backfill lost employee?'],
    trick: 'Blaming equals/hashCode first without checking Comparator.',
    wrongAnswer: 'TreeMap bug — file JDK issue.',
  },
  {
    id: 'sc2',
    topic: 'Scenario',
    question:
      'Payment service stores BigDecimal amounts in TreeSet. Audit finds duplicate amounts with different scale rejected incorrectly. Explain and fix.',
    answer30s: 'TreeSet uses compareTo — 1.0 and 1.00 compare 0 — one entry.',
    answer2m:
      'Financial audit expected equals-scale distinction (HashSet behavior). Choose policy: if numeric equality is intended, document TreeSet. If scale matters, use HashSet or Comparator comparing scale then unscaledValue. stripTrailingZeros for compare alignment.',
    followUps: ['Money type with Currency?'],
    trick: 'stripTrailingZeros without documenting rounding mode.',
  },
  {
    id: 'sc3',
    topic: 'Scenario',
    question:
      'Leaderboard API returns wrong top-10 order intermittently. Code uses PriorityQueue and returns new ArrayList<>(pq) without polling. What is wrong?',
    answer30s: 'Iteration order is heap layout — not sorted.',
    answer2m:
      'Fix: drain with poll() into list, or use stream sorted, or TreeSet if unique top-k. Add test asserting order equals expected ranks. Document O(n log k) for bounded heap vs full sort.',
    followUps: ['Concurrent updates while reading?'],
    trick: 'Switching to parallelStream without synchronization.',
  },
  {
    id: 'sc4',
    topic: 'Scenario',
    question:
      'After deploy, TreeMap lookups return null for valid keys. Keys are mutable Employee with changed salary field used in compareTo. Diagnose.',
    answer30s: 'Mutated compare field broke BST placement.',
    answer2m:
      'Employee.compareTo used salary; HR updated salary after map insert. Node still in old branch. Fix: immutable key (record), compare only on id. Migration: rebuild TreeMap. Add guard: keys must not implement Comparable on mutable fields.',
    followUps: ['Detect at compile time?'],
    trick: 'Assuming TreeMap rebalances on mutation.',
  },
  {
    id: 'sc5',
    topic: 'Scenario',
    question:
      'Microservice sorts transactions with (int)(a.amount - b.amount) for compare. Rare wrong order on large transfers. Explain overflow scenario.',
    answer30s: 'long/int subtraction overflow flips comparison sign.',
    answer2m:
      'Amounts stored as int cents near 2e9 — difference overflows int. Use Integer.compare or Long.compare on long cents. Add test with Integer.MAX_VALUE and Integer.MIN_VALUE pair. Static analysis rule: ban subtract in compare.',
    followUps: ['BigDecimal amounts?'],
    trick: 'Casting to long after subtraction in int.',
  },
  {
    id: 'sc6',
    topic: 'Scenario',
    question:
      'Design sort for customer list: name (locale-aware), then account age, null names last. Sketch Comparator chain.',
    answer30s: 'Collator + nullsLast on name, thenComparingLong age.',
    answer2m:
      'Comparator.comparing(Customer::name, nullsLast(collator::compare)).thenComparingLong(Customer::openedAt). Collator.getInstance(locale). Immutable Customer DTO. TreeSet for sorted export or Collections.sort copy.',
    followUps: ['Pagination without full sort?'],
    trick: 'String.CASE_INSENSITIVE_ORDER for Turkish customers.',
  },
  {
    id: 'sc7',
    topic: 'Scenario',
    question:
      'Two pods each hold local TreeMap cache keyed by Comparable Order. Orders compare by status only. Split-brain inventory counts diverge. Why?',
    answer30s: 'Each pod collapses orders per status — different survivors per pod if insertion order differs.',
    answer2m:
      'Not primarily concurrency — wrong key definition. Status-only compare loses distinct orders. Use OrderId in Comparator. Distributed cache should key by id in CHM/Redis, not sorted collapse.',
    followUps: ['Kafka ordering per partition?'],
    trick: 'Fixing with synchronized TreeMap only.',
  },
];

export const OUTPUT_PREDICT: OutputPredict[] = [
  {
    id: 'p1',
    code: `TreeSet<String> s = new TreeSet<>();
s.add("B"); s.add("A"); s.add("A");
System.out.println(s.size() + " " + s.first());`,
    expected: '2 A',
    why: 'TreeSet sorts; duplicate "A" rejected (compare==0).',
    trap: 'Expect size 3.',
  },
  {
    id: 'p2',
    code: `int a = Integer.MIN_VALUE, b = Integer.MAX_VALUE;
System.out.println((a - b) > 0);`,
    expected: 'true',
    why: 'int subtraction overflows to positive.',
    trap: 'Expect false — MIN < MAX.',
  },
  {
    id: 'p3',
    code: `BigDecimal x = new BigDecimal("1.0");
BigDecimal y = new BigDecimal("1.00");
TreeSet<BigDecimal> set = new TreeSet<>();
set.add(x); set.add(y);
System.out.println(set.size());`,
    expected: '1',
    why: 'compareTo==0 collapses scale difference.',
    trap: 'Expect 2 like HashSet.',
  },
  {
    id: 'p4',
    code: `PriorityQueue<Integer> pq = new PriorityQueue<>();
pq.add(5); pq.add(1); pq.add(3);
System.out.println(pq.peek());
System.out.println(new ArrayList<>(pq));`,
    expected: '1 then heap-order list (not sorted)',
    why: 'peek=min; iteration is internal heap array.',
    trap: 'Expect sorted iteration.',
  },
  {
    id: 'p5',
    code: `List<String> items = List.of("a-2","b-1","a-1");
List<String> copy = new ArrayList<>(items);
Collections.sort(copy, Comparator.comparing(s -> s.charAt(0)));
System.out.println(copy);`,
    expected: '[a-2, a-1, b-1]',
    why: 'Stable sort — a-2 before a-1 same first char.',
    trap: 'Expect a-1 before a-2.',
  },
  {
    id: 'p6',
    code: `TreeSet<Integer> set = new TreeSet<>(Comparator.reverseOrder());
set.add(1); set.add(3); set.add(2);
System.out.println(set);`,
    expected: '[3, 2, 1]',
    why: 'reverseOrder Comparator descending.',
    trap: 'Expect ascending TreeSet default.',
  },
  {
    id: 'p7',
    code: `HashSet<BigDecimal> h = new HashSet<>();
h.add(new BigDecimal("1.0"));
h.add(new BigDecimal("1.00"));
System.out.println(h.size());`,
    expected: '2',
    why: 'equals distinguishes scale.',
    trap: 'Expect 1 like TreeSet.',
  },
  {
    id: 'p8',
    code: `record Key(int id) {}
TreeSet<Key> set = new TreeSet<>();
set.add(new Key(1)); set.add(new Key(2));`,
    expected: 'ClassCastException or compile error if attempted',
    why: 'Record not Comparable — needs Comparator at runtime.',
    trap: 'Assume record sorts by id field.',
  },
  {
    id: 'p9',
    code: `TreeMap<String,Integer> m = new TreeMap<>();
m.put("b", 1);
m.put("a", 2);
System.out.println(m.firstKey());`,
    expected: 'a',
    why: 'Natural String order.',
    trap: 'Insertion order b first.',
  },
  {
    id: 'p10',
    code: `Double a = +0.0; Double b = -0.0;
System.out.println(a.equals(b));
System.out.println(Double.compare(a, b));`,
    expected: 'false then 1',
    why: 'equals distinguishes ±0; compare says +0 > -0.',
    trap: 'Both true and 0.',
  },
  {
    id: 'p11',
    code: `Comparator<Employee> c = Comparator.comparing(Employee::dept);
TreeSet<Employee> set = new TreeSet<>(c);
set.add(new Employee("ENG",1));
set.add(new Employee("ENG",2));
System.out.println(set.size());`,
    expected: '1',
    why: 'Dept-only compare returns 0.',
    trap: 'Expect 2 different ids.',
  },
  {
    id: 'p12',
    code: `List<Integer> list = Arrays.asList(1,2,3);
list.sort(Comparator.reverseOrder());
System.out.println(list);`,
    expected: '[3, 2, 1]',
    why: 'In-place reverse sort.',
    trap: 'UnsupportedOperation if fixed-size — actually sort mutates backing array OK for asList.',
  },
  {
    id: 'p13',
    code: `enum D { B, A }
TreeSet<D> set = new TreeSet<>();
set.add(D.B); set.add(D.A);
System.out.println(set);`,
    expected: '[B, A]',
    why: 'Enum order is declaration ordinal B before A.',
    trap: 'Alphabetical A before B.',
  },
  {
    id: 'p14',
    code: `Float a = Float.NaN; Float b = 1.0f;
System.out.println(Float.compare(a, b) > 0);`,
    expected: 'true',
    why: 'NaN considered greater than any other float.',
    trap: 'NaN compare 0.',
  },
  {
    id: 'p15',
    code: `TreeMap<Integer,String> m = new TreeMap<>();
m.put(1, "a");
m.put(1, "b");
System.out.println(m.size() + m.get(1));`,
    expected: '1b',
    why: 'Same compare key replaces value.',
    trap: 'Size 2.',
  },
  {
    id: 'p16',
    code: `String a = "Apple"; String b = "apple";
System.out.println(a.compareTo(b) < 0);`,
    expected: 'false (A uppercase before lowercase in Unicode)',
    why: 'Case-sensitive lexicographic.',
    trap: 'Dictionary case-insensitive.',
  },
  {
    id: 'p17',
    code: `Comparator<String> cmp = Comparator.nullsFirst(naturalOrder());
TreeSet<String> set = new TreeSet<>(cmp);
set.add("b"); set.add(null); set.add("a");
System.out.println(set.size());`,
    expected: '3',
    why: 'nullsFirst allows one null key in TreeSet.',
    trap: 'NPE on null add.',
  },
  {
    id: 'p18',
    code: `PriorityQueue<Integer> pq = new PriorityQueue<>(Comparator.reverseOrder());
pq.add(1); pq.add(3);
System.out.println(pq.peek());`,
    expected: '3',
    why: 'Reverse order max at head.',
    trap: '1 min heap.',
  },
  {
    id: 'p19',
    code: `List<String> l = new ArrayList<>(List.of("c","a","b"));
l.subList(0,2).sort(Comparator.naturalOrder());
System.out.println(l);`,
    expected: '[a, c, b]',
    why: 'subList sort mutates parent positions 0-1.',
    trap: '[c,a,b] unchanged.',
  },
  {
    id: 'p20',
    code: `Instant i1 = Instant.parse("2020-01-01T00:00:00Z");
Instant i2 = Instant.parse("2021-01-01T00:00:00Z");
System.out.println(i1.compareTo(i2) < 0);`,
    expected: 'true',
    why: 'Instant chronological compare.',
    trap: 'Parse exception or false.',
  },
  {
    id: 'p21',
    code: `TreeSet<String> set = new TreeSet<>();
boolean a = set.add("x");
boolean b = set.add("x");
System.out.println(a + " " + b);`,
    expected: 'true false',
    why: 'Second add duplicate returns false.',
    trap: 'true true new instances.',
  },
  {
    id: 'p22',
    code: `Comparator<Integer> c = Comparator.comparingInt(i -> i).reversed();
TreeSet<Integer> s = new TreeSet<>(c);
s.add(1); s.add(2);
System.out.println(s.first());`,
    expected: '2',
    why: 'reversed natural order — first is largest.',
    trap: '1 smallest.',
  },
];

export const CODING_PROBLEMS: CodingProblem[] = [
  {
    id: 'c1',
    level: 1,
    title: 'Implement Comparable Employee by id',
    statement: 'Employee implements Comparable<Employee> using Integer.compare on id.',
    approach: 'Single-field natural order; align equals/hashCode on id.',
    code: `class Employee implements Comparable<Employee> {
  final int id;
  public int compareTo(Employee o) { return Integer.compare(id, o.id); }
}`,
    complexity: 'O(1) compare',
    edgeCases: ['equal ids', 'MIN_VALUE id pair'],
    interviewExplain: 'Never subtract ids; mention overflow trap.',
  },
  {
    id: 'c2',
    level: 1,
    title: 'Sort string list',
    statement: 'Sort List<String> alphabetically in place.',
    approach: 'Collections.sort or list.sort with natural order.',
    code: `names.sort(Comparator.naturalOrder());`,
    complexity: 'O(n log n)',
    edgeCases: ['empty list', 'single element'],
    interviewExplain: 'TimSort stable; mutates list.',
  },
  {
    id: 'c3',
    level: 1,
    title: 'TreeSet from array',
    statement: 'Create sorted unique ints from array.',
    approach: 'TreeSet natural order or stream to TreeSet.',
    code: `TreeSet<Integer> set = new TreeSet<>();
for (int x : arr) set.add(x);`,
    complexity: 'O(n log n)',
    edgeCases: ['duplicates dropped'],
    interviewExplain: 'Duplicates compare==0.',
  },
  {
    id: 'c4',
    level: 2,
    title: 'Dept then id Comparator',
    statement: 'Sort employees by department then id ascending.',
    approach: 'comparing(dept).thenComparingInt(id).',
    code: `Comparator<Employee> cmp =
  Comparator.comparing(Employee::dept).thenComparingInt(Employee::id);`,
    complexity: 'O(n log n) sort',
    edgeCases: ['null dept — nullsLast'],
    interviewExplain: 'Primary vs tie-breaker order.',
  },
  {
    id: 'c5',
    level: 2,
    title: 'Null-safe dept sort',
    statement: 'Sort by dept with null departments last.',
    approach: 'nullsLast on dept Comparator.',
    code: `Comparator.comparing(Employee::dept, Comparator.nullsLast(naturalOrder()))`,
    complexity: 'O(n log n)',
    edgeCases: ['all null dept'],
    interviewExplain: 'NPE without nullsLast.',
  },
  {
    id: 'c6',
    level: 2,
    title: 'Reverse id sort',
    statement: 'TreeMap employees by id descending.',
    approach: 'comparingInt(id).reversed() on TreeMap ctor.',
    code: `new TreeMap<>(Comparator.comparingInt(Employee::id).reversed())`,
    complexity: 'O(log n) per op',
    edgeCases: ['firstKey is max id'],
    interviewExplain: 'reversed() not reverseOrder confusion.',
  },
  {
    id: 'c7',
    level: 3,
    title: 'Top K with PriorityQueue',
    statement: 'Return k smallest integers from stream.',
    approach: 'Max-heap of size k with reverseOrder.',
    code: `PriorityQueue<Integer> pq = new PriorityQueue<>(Comparator.reverseOrder());
for (int x : stream) {
  pq.offer(x);
  if (pq.size() > k) pq.poll();
}`,
    complexity: 'O(n log k)',
    edgeCases: ['k > n', 'k=0'],
    interviewExplain: 'Poll order vs iteration trap.',
  },
  {
    id: 'c8',
    level: 3,
    title: 'Merge two sorted lists',
    statement: 'Merge two sorted lists into one sorted list.',
    approach: 'Two-pointer or PriorityQueue for k lists.',
    code: `while (i < a.size() && j < b.size()) {
  if (a.get(i) <= b.get(j)) out.add(a.get(i++));
  else out.add(b.get(j++));
}`,
    complexity: 'O(n+m)',
    edgeCases: ['empty lists', 'equal elements stable'],
    interviewExplain: 'Linear merge vs sort O(n log n).',
  },
  {
    id: 'c9',
    level: 3,
    title: 'Align compareTo with equals',
    statement: 'Fix BadKey where equals uses id+tag but compareTo id only.',
    approach: 'Add tag to compareTo chain or narrow equals.',
    code: `return Comparator.comparingInt(BadKey::id)
  .thenComparing(BadKey::tag)
  .compare(this, o);`,
    complexity: 'O(1)',
    edgeCases: ['null tag'],
    interviewExplain: 'TreeMap vs HashMap divergence.',
  },
  {
    id: 'c10',
    level: 4,
    title: 'Range scan TreeMap',
    statement: 'Find all orders between two timestamps inclusive.',
    approach: 'subMap(from, true, to, true) on NavigableMap.',
    code: `map.subMap(t0, true, t1, true).values();`,
    complexity: 'O(log n + k)',
    edgeCases: ['empty range', 'exclusive bounds'],
    interviewExplain: 'NavigableMap API floor/ceiling/subMap.',
  },
  {
    id: 'c11',
    level: 4,
    title: 'Locale name sort',
    statement: 'Sort customers by locale-aware name.',
    approach: 'Collator.getInstance(locale) in comparing.',
    code: `Collator coll = Collator.getInstance(locale);
Comparator.comparing(Customer::name, coll::compare)`,
    complexity: 'O(n log n * compare cost)',
    edgeCases: ['Turkish locale', 'combining marks'],
    interviewExplain: 'Not String.compareTo in production.',
  },
  {
    id: 'c12',
    level: 4,
    title: 'Custom Comparator registry',
    statement: 'API sort=NAME|AGE maps to Comparator.',
    approach: 'Map<SortField, Comparator<Dto>> immutable.',
    code: `Map<SortField, Comparator<Dto>> REG = Map.of(
  SortField.NAME, Comparator.comparing(Dto::name),
  SortField.AGE, Comparator.comparingInt(Dto::age)
);`,
    complexity: 'O(n log n)',
    edgeCases: ['invalid sort key', 'default sort'],
    interviewExplain: 'Do not expose entity Comparable.',
  },
  {
    id: 'c13',
    level: 5,
    title: 'Concurrent leaderboard snapshot',
    statement: 'Thread-safe top-100 scores snapshot while writes continue.',
    approach: 'ConcurrentSkipListMap or copy-on-write + periodic sort.',
    code: `ConcurrentSkipListMap<ScoreKey, Long> board = new ConcurrentSkipListMap<>(cmp);
// snapshot: new ArrayList<>(board.entrySet()).subList(0, 100)`,
    complexity: 'O(log n) write; snapshot O(n)',
    edgeCases: ['tie scores', 'Comparator consistency'],
    interviewExplain: 'Skip list vs synchronized TreeMap.',
  },
  {
    id: 'c14',
    level: 5,
    title: 'BigDecimal TreeSet policy',
    statement: 'Design Comparator for monetary amounts with currency.',
    approach: 'Compare currency then amount with same scale policy.',
    code: `Comparator.comparing(Money::currency)
  .thenComparing(m -> m.amount().stripTrailingZeros())`,
    complexity: 'O(log n)',
    edgeCases: ['mixed scale', 'HALF_UP rounding doc'],
    interviewExplain: 'equals vs compareTo scale trap.',
  },
  {
    id: 'c15',
    level: 5,
    title: 'Fix overflow compare bug',
    statement: 'Audit codebase rule: ban subtract in compare.',
    approach: 'Static analysis + replace with Integer.compare.',
    code: `// BAD: return id - other.id;
return Integer.compare(id, other.id);`,
    complexity: 'N/A',
    edgeCases: ['long cents use Long.compare'],
    interviewExplain: 'MIN_VALUE/MAX_VALUE demo.',
  },
  {
    id: 'c16',
    level: 5,
    title: 'Immutable record TreeMap keys',
    statement: 'Migrate mutable Comparable entity keys to record keys.',
    approach: 'record Key(...); Comparator on TreeMap; entity not key.',
    code: `record OrderKey(long tenantId, long orderId) {}
TreeMap<OrderKey, Order> index = new TreeMap<>(comparingLong(OrderKey::tenantId)
  .thenComparingLong(OrderKey::orderId));`,
    complexity: 'O(log n)',
    edgeCases: ['JPA migration', 'serialization'],
    interviewExplain: 'Separation entity vs key type.',
  },
];

export const SPOKEN_TEMPLATES: {title: string; answer: string}[] = [
  {
    title: 'Comparable vs Comparator (30s)',
    answer:
      'Comparable is natural order inside the class — one compareTo. Comparator is an external strategy — many per type. TreeMap, TreeSet, and PriorityQueue use compare/compareTo, not equals. Hash collections use equals/hashCode.',
  },
  {
    title: 'TreeSet duplicate rule (30s)',
    answer:
      'TreeSet uniqueness is compare==0, not equals. Two unequal objects that compare as zero collapse to one element. Fix incomplete Comparators with thenComparing on id.',
  },
  {
    title: 'Integer subtraction trap (30s)',
    answer:
      'Never return this.id - other.id in compareTo — int overflow flips the sign. Use Integer.compare or Comparator.comparingInt. Demo with MIN_VALUE and MAX_VALUE.',
  },
  {
    title: 'BigDecimal equals vs compareTo (30s)',
    answer:
      'equals cares about scale — 1.0 and 1.00 are different. compareTo is numeric — they compare zero. HashSet keeps both; TreeSet keeps one. Pick and document a policy.',
  },
  {
    title: 'PriorityQueue vs TreeSet iteration (30s)',
    answer:
      'TreeSet iterates sorted. PriorityQueue iterates heap layout — unsorted. Use poll() to drain in order.',
  },
  {
    title: 'Mutable key trap (30s)',
    answer:
      'Never mutate fields used in compareTo or Comparator after insert into TreeMap/TreeSet. Tree structure breaks. Use immutable record keys.',
  },
  {
    title: 'Multi-level Comparator (30s)',
    answer:
      'Chain with comparing(primary).thenComparingInt(secondary). Order matters — primary first, tie-breaker second. Use nullsFirst/Last on nullable fields.',
  },
  {
    title: 'Stable sort (30s)',
    answer:
      'Collections.sort and List.sort use TimSort — stable. Equal per Comparator retain insertion order. Arrays.sort primitives is not stable.',
  },
  {
    title: 'compare consistent with equals (30s)',
    answer:
      'For sorted-map keys: if equals then compare==0, and if compare==0 then equals should be true. Violations cause HashMap vs TreeMap divergence.',
  },
  {
    title: 'Record as TreeMap key (30s)',
    answer:
      'Records are not Comparable. Provide Comparator.comparing on record components or wrap in a key type with explicit Comparator.',
  },
  {
    title: 'NavigableMap range query (30s)',
    answer:
      'TreeMap supports floorKey, ceilingKey, subMap for range scans. Ordering follows Comparator — useful for time-series retention.',
  },
  {
    title: 'Locale sorting (30s)',
    answer:
      'Do not use String.compareTo for human names. Use Collator with locale. Watch Turkish I/i. Store normalized sort key if needed.',
  },
  {
    title: 'When TreeMap over HashMap (30s)',
    answer:
      'Need sorted iteration, range views, or nearest-key queries — TreeMap O(log n). Need average O(1) lookup without order — HashMap.',
  },
  {
    title: 'Concurrent sorted map (30s)',
    answer:
      'ConcurrentSkipListMap — sorted, concurrent, no nulls. Same compare==0 key rule as TreeMap. Not hash-based.',
  },
  {
    title: 'Debugging missing TreeMap entries (30s)',
    answer:
      'Compare HashSet size vs TreeSet size. Log pairs where equals false but compare==0. Fix Comparator chain.',
  },
];

export const CHEAT_ROWS: string[][] = [
  ['Comparable.compareTo()', 'Natural order on the type', 'Sign only matters; antisymmetric', 'Never subtract ints — overflow'],
  ['Comparator.compare()', 'External ordering strategy', 'compare==0 = same key in Tree*', 'Dept-only Comparator drops ids'],
  ['Integer.compare / Long.compare', 'Safe primitive compare', 'Use in compareTo', 'id - other.id overflow'],
  ['Comparator.comparing()', 'Key extractor sort', 'Boxing for primitives', 'Use comparingInt/Long'],
  ['thenComparing / thenComparingInt', 'Multi-level tie-breaker', 'Order chain matters', 'Commutative trap'],
  ['reversed() / reverseOrder()', 'Descending order', 'reversed() wraps instance', 'Type erasure on reverseOrder'],
  ['nullsFirst / nullsLast', 'Null-safe sort keys', 'Wrap field Comparator', 'Natural TreeMap rejects null key'],
  ['TreeSet.add()', 'Sorted unique set', 'Duplicate = compare==0', 'Not equals-based'],
  ['TreeMap.put()', 'Sorted map', 'Replace on compare==0', 'hashCode unused for structure'],
  ['PriorityQueue', 'Heap by Comparator', 'peek/poll ordered', 'Iteration not sorted'],
  ['Collections.sort / List.sort', 'In-place stable sort', 'TimSort O(n log n)', 'Mutates list'],
  ['Arrays.sort(primitives)', 'Fast primitive sort', 'Dual-pivot quicksort', 'Not stable'],
  ['Stream.sorted()', 'New sorted stream', 'Needs Comparable or Comparator', 'ClassCastException'],
  ['ConcurrentSkipListMap', 'Concurrent sorted map', 'No null key/value', 'Compare-based not hash'],
  ['BigDecimal.compareTo()', 'Numeric order', 'Ignores scale difference', 'equals ≠ compareTo'],
  ['Float.compare / Double.compare', 'Safe floating compare', 'NaN ordering defined', 'Do not subtract floats'],
  ['Collator', 'Locale-aware String sort', 'Not String.compareTo', 'Turkish I trap'],
  ['Enum.compareTo()', 'Ordinal declaration order', 'Not name alphabetical', 'Ordinal persistence risk'],
  ['NavigableMap.subMap()', 'Range view', 'Backed by original map', 'Concurrent modification'],
  ['record key', 'Immutable key type', 'Not auto Comparable', 'Need explicit Comparator'],
];

export const DECISION_ASCII = `
Comparable / Comparator decision tree
────────────────────────────────────
Need ordering inside type (single natural order)?
  YES → implement Comparable (compareTo with Integer.compare etc.)
  NO  → use Comparator (lambda, method ref, or static util)

Which collection?
  HashMap / HashSet     → equals + hashCode (NOT compareTo)
  TreeMap / TreeSet     → Comparable OR Comparator ctor
  PriorityQueue         → Comparator optional (natural if Comparable)
  ConcurrentSkipListMap → Comparable OR Comparator; concurrent sorted

Comparator building:
  Primitive field?     → comparingInt / comparingLong / comparingDouble
  Nullable field?      → comparing(fn, nullsFirst/Last(inner))
  Multi-field?         → comparing(A).thenComparing(B).thenComparingInt(C)
  Descending?          → .reversed() on chain or reverseOrder()

Interview traps to voice:
  Tree* uniqueness     → compare==0 (not equals)
  BigDecimal           → equals scale vs compareTo numeric
  PQ iteration         → not sorted — use poll()
  Mutable keys         → forbidden after put
  int compare          → never subtract — overflow
`;

export const COVERAGE_CHECKLIST: string[] = [
  'Comparable compareTo contract (sign, antisymmetric, transitive)',
  'Comparator compare==0 equals SortedSet/Map key sameness',
  'Integer.compare vs subtraction overflow demo',
  'BigDecimal equals vs compareTo HashSet vs TreeSet',
  'TreeSet duplicate rule vs HashSet equals rule',
  'PriorityQueue poll order vs iteration heap layout',
  'Multi-level Comparator thenComparing chain',
  'nullsFirst / nullsLast on nullable sort fields',
  'comparingInt vs comparing autoboxing trap',
  'reversed() vs reverseOrder() generics',
  'Mutable key mutation breaks TreeMap',
  'Record keys need explicit Comparator',
  'Natural-order TreeMap null key NPE',
  'Enum ordinal order not alphabetical',
  'String.compareTo vs Collator locale sort',
  'Float.compare NaN and ±0.0',
  'TimSort stable vs Arrays.sort primitives unstable',
  'NavigableMap floorKey / subMap range queries',
  'ConcurrentSkipListMap concurrent sorted alternative',
  'compareTo consistent with equals for sorted keys',
  'HashMap vs TreeMap when to choose',
  'Stream.sorted Comparator requirement',
  'TreeSet.add false on duplicate compare',
  'Coding: top-K with PriorityQueue',
  'Production: Comparator registry for API sort params',
  'Debug: HashSet size vs TreeSet size mismatch',
  'Spoken 30s templates for each trap',
];

// Interview mode aliases
const trapSample = TRAP_QS.filter((_, i) => i % 2 === 0);
const scenarioAll = SCENARIO_QS;
export const SENIOR: InterviewQ[] = [...trapSample, ...scenarioAll];

export const ARCHITECT: InterviewQ[] = STAFF_QS;
export const RAPID: InterviewQ[] = RAPID_QS;
export const ALL: InterviewQ[] = [
  ...TRAP_QS,
  ...RAPID_QS,
  ...STAFF_QS,
  ...SCENARIO_QS,
];
