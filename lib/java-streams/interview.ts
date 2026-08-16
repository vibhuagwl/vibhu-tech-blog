import type {InterviewQ} from './types';

export const SENIOR: InterviewQ[] = [
  {
    id: 's1',
    level: 'senior',
    topic: 'Basics',
    question: 'Intermediate vs terminal operations?',
    answer30s: 'Intermediate ops are lazy and return a Stream; terminal ops trigger execution and produce a result/side effect.',
    answer2m:
      'filter/map/sorted build a pipeline. collect/findFirst/forEach run it. Nothing executes until a terminal. Reuse after terminal → IllegalStateException.',
    followUps: ['Is peek intermediate?', 'Stateful vs stateless?'],
    wrongAnswer: 'Every map runs immediately when written.',
  },
  {
    id: 's2',
    level: 'senior',
    topic: 'flatMap',
    question: 'map vs flatMap?',
    answer30s: 'map is 1:1; flatMap is 1:many and flattens Streams.',
    answer2m:
      'map(List::stream) yields Stream<Stream<T>>. flatMap(Collection::stream) yields Stream<T>. Same idea as Optional.flatMap vs Optional.map.',
    followUps: ['Optional.stream?', 'flatMapToInt?'],
  },
  {
    id: 's3',
    level: 'senior',
    topic: 'Collectors',
    question: 'groupingBy vs partitioningBy?',
    answer30s: 'groupingBy → Map by classifier; partitioningBy → Map<Boolean, List> for a predicate.',
    answer2m:
      'partitioningBy always has true/false keys (possibly empty lists). groupingBy can have many keys and rich downstream collectors.',
    followUps: ['groupingByConcurrent?', 'Downstream mapping?'],
  },
  {
    id: 's4',
    level: 'senior',
    topic: 'toMap',
    question: 'What happens on duplicate keys in toMap?',
    answer30s: 'IllegalStateException unless you supply a merge function.',
    answer2m:
      'toMap(k,v) throws on collision. toMap(k,v,(a,b)->…) defines policy. LinkedHashMap supplier preserves encounter order.',
    followUps: ['groupingBy as multimap?', 'Concurrent toMap?'],
    wrongAnswer: 'Last value silently wins by default.',
  },
  {
    id: 's5',
    level: 'senior',
    topic: 'find',
    question: 'findFirst vs findAny?',
    answer30s: 'findFirst respects encounter order; findAny may pick any, better for parallel unordered.',
    answer2m:
      'On ordered sequential streams they often look the same. Parallel + unordered: findAny can be cheaper. Prefer findFirst when order is a product requirement.',
    followUps: ['unordered()?', 'Short-circuit?'],
  },
  {
    id: 's6',
    level: 'senior',
    topic: 'reduce',
    question: 'Why does parallel reduce need a combiner?',
    answer30s: 'Partial results from splits must be merged associatively.',
    answer2m:
      'identity + accumulator process a partition; combiner merges partitions. Non-associative ops give wrong answers under parallel.',
    followUps: ['mutable reduction via collect?', 'Identity value mistakes?'],
  },
  {
    id: 's7',
    level: 'senior',
    topic: 'Nth',
    question: 'Second highest salary with duplicates?',
    answer30s: 'Clarify distinct vs order-statistic. 100,90,90,80 → second distinct is 90 or 80 depending on definition.',
    answer2m:
      'sorted desc distinct skip 1 findFirst for distinct. Without distinct, skip 1 gives another 90. Interviewers listen for the question back.',
    followUps: ['Per department?', 'Performance?'],
    seniorInsight: 'Ask which definition before coding.',
  },
  {
    id: 's8',
    level: 'senior',
    topic: 'Performance',
    question: 'Are Streams always slower than loops?',
    answer30s: 'No. Often comparable; sometimes slower; sometimes parallel faster. Measure.',
    answer2m:
      'Overhead exists for simple loops. Clarity may win. Boxing and stateful ops dominate more than “Stream tax”. JMH before dogma.',
    followUps: ['When prefer loops?', 'Primitive streams?'],
  },
];

export const STAFF: InterviewQ[] = [
  {
    id: 'st1',
    level: 'staff',
    topic: 'Parallel',
    question: 'When is parallelStream an anti-pattern?',
    answer30s: 'Tiny data, blocking IO on commonPool, shared mutable state, order-sensitive pipelines.',
    answer2m:
      'parallelStream uses ForkJoinPool.commonPool(). Blocking HTTP inside it starves the JVM. Prefer virtual-thread executors for IO concurrency (Java 21), not parallel streams.',
    followUps: ['custom FJP?', 'unordered findAny?'],
    wrongAnswer: 'Always use parallel for speed.',
  },
  {
    id: 'st2',
    level: 'staff',
    topic: 'JPA',
    question: 'Why is findAll().stream().collect(groupingBy…) dangerous?',
    answer30s: 'Loads entire table + PC; may N+1 on lazy graphs; GC risk.',
    answer2m:
      'Aggregation belongs in SQL for large datasets. If streaming from DB, use bounded queries and close Stream resources. DTO projections beat entity graphs.',
    followUps: ['Spring Data Stream close?', 'Keyset pagination?'],
  },
  {
    id: 'st3',
    level: 'staff',
    topic: 'Spliterator',
    question: 'How do parallel streams split work?',
    answer30s: 'Spliterator.trySplit recursively until tasks are small; FJP runs them.',
    answer2m:
      'Characteristics (SIZED, ORDERED, SUBSIZED) affect split quality. Poor splits → imbalance. ORDERED constraints reduce freedom.',
    followUps: ['Custom Spliterator ever?', 'estimateSize?'],
  },
  {
    id: 'st4',
    level: 'staff',
    topic: 'Collectors',
    question: 'What makes a collector parallel-safe?',
    answer30s: 'Associative accumulator/combiner; supplier isolates mutable buffers; CONCURRENT characteristic only when truly concurrent.',
    answer2m:
      'groupingBy uses thread-local maps then merge; groupingByConcurrent uses ConcurrentMap. Wrong combiner → lost/corrupt data.',
    followUps: ['teeing?', 'collectingAndThen?'],
  },
  {
    id: 'st5',
    level: 'staff',
    topic: 'Memory',
    question: 'Why can distinct/sorted blow memory?',
    answer30s: 'Stateful ops buffer elements (seen set / sort buffer).',
    answer2m:
      'distinct needs a set of uniques; sorted needs all elements before emit (unless special sources). On huge streams prefer DB DISTINCT/ORDER BY or external sort.',
    followUps: ['limit after sort?', 'Short-circuit interactions?'],
  },
  {
    id: 'st6',
    level: 'staff',
    topic: 'Debugging',
    question: 'How do you debug a slow Stream pipeline?',
    answer30s: 'Confirm size, find stateful ops, boxing, N+1, accidental parallel, measure with JMH/profiler.',
    answer2m:
      'Check for sorted/distinct early, repeated collects, peek side effects, lazy JPA inside map, skip on huge lists. Replace with SQL if IO-bound aggregation.',
    followUps: ['Logging every element?', 'peek pitfalls?'],
  },
  {
    id: 'st7',
    level: 'staff',
    topic: 'API coverage',
    question: 'Why does an API coverage checklist matter more than 200 random Stream problems?',
    answer30s: 'Interviews probe obscure APIs and judgment; gaps hide weak fundamentals.',
    answer2m:
      'Business-domain variants are infinite. A checklist forces Stream.ofNullable, takeWhile, mapMulti, onClose, primitive summaryStatistics, toUnmodifiable*, collector characteristics, and Spliterator — the items candidates skip when only grinding groupingBy.',
    followUps: ['Which API do juniors never see?', 'When is Stream.builder justified?'],
    seniorInsight: 'Completeness of API surface + when-not-to-use beats volume of employee salary problems.',
  },
];

export const ARCHITECT: InterviewQ[] = [
  {
    id: 'a1',
    level: 'architect',
    topic: 'Design',
    question: 'Should business logic be written as Streams?',
    answer30s: 'When it clarifies transforms; not as a religion.',
    answer2m:
      'Architects optimize for maintainability and failure modes. Complex domain rules with checked exceptions and multi-branch control flow often read better as methods/loops. Streams excel at declarative data shaping.',
    followUps: ['Code review standards?', 'Team skill mix?'],
  },
  {
    id: 'a2',
    level: 'architect',
    topic: 'Scale',
    question: 'How do you process 1B records?',
    answer30s: 'Not one JVM Stream over a List. Batch, DB, or distributed compute.',
    answer2m:
      'Push filters/aggregations to the store; stream bounded pages; use files with backpressure; Spark/Flink/Kafka for true streaming. Java Streams are in-memory pipelines.',
    followUps: ['Kafka vs Stream API?', 'Memory limits?'],
    wrongAnswer: 'parallelStream on a billion-element ArrayList.',
  },
  {
    id: 'a3',
    level: 'architect',
    topic: 'FinTech',
    question: 'Streams for payment aggregation in-process?',
    answer30s: 'Fine for bounded batches; not for ledger truth at infinite scale.',
    answer2m:
      'Use BigDecimal, deterministic ordering when required, idempotent batch jobs, and prefer DB/warehouse for large reconciliations. Clarify money correctness over clever pipelines.',
    followUps: ['Floating point?', 'Replayable batches?'],
  },
  {
    id: 'a4',
    level: 'architect',
    topic: 'Virtual threads',
    question: 'Do virtual threads replace parallelStream?',
    answer30s: 'No. Different tools: VT for concurrent blocking; parallelStream for CPU split.',
    answer2m:
      'Virtual threads (21) shine for many blocking tasks. parallelStream splits CPU work on FJP. Mixing them incorrectly still hurts. Do not attribute VT to Streams.',
    followUps: ['Structured concurrency?', 'commonPool pollution?'],
  },
];

export const RAPID: InterviewQ[] = [
  {id:'r1',level:'rapid',topic:'Rapid',question:'Java version of Stream.toList()?',answer30s:'Java 16',answer2m:'Unmodifiable list',followUps:['collect(toList())?']},
  {id:'r2',level:'rapid',topic:'Rapid',question:'takeWhile version?',answer30s:'Java 9',answer2m:'Also dropWhile',followUps:['iterate predicate?']},
  {id:'r3',level:'rapid',topic:'Rapid',question:'Optional.stream version?',answer30s:'Java 9',answer2m:'0/1 element stream',followUps:['flatMap Optional?']},
  {id:'r4',level:'rapid',topic:'Rapid',question:'teeing version?',answer30s:'Java 12',answer2m:'Two collectors → merge',followUps:['min and max?']},
  {id:'r5',level:'rapid',topic:'Rapid',question:'Stateful ops?',answer30s:'sorted, distinct, limit, skip',answer2m:'May buffer',followUps:['parallel cost?']},
  {id:'r6',level:'rapid',topic:'Rapid',question:'Reuse stream?',answer30s:'IllegalStateException',answer2m:'Single-use',followUps:['Why?']},
  {id:'r7',level:'rapid',topic:'Rapid',question:'findAny parallel?',answer30s:'Any match',answer2m:'Not order-bound',followUps:['findFirst?']},
  {id:'r8',level:'rapid',topic:'Rapid',question:'Files.lines must?',answer30s:'Be closed',answer2m:'try-with-resources',followUps:['Leak?']},
  {id:'r9',level:'rapid',topic:'Rapid',question:'Stream.ofNullable version?',answer30s:'Java 9',answer2m:'0/1 element',followUps:['Optional.stream?']},
  {id:'r10',level:'rapid',topic:'Rapid',question:'mapMulti version?',answer30s:'Java 16',answer2m:'Imperative flatMap',followUps:['When vs flatMap?']},
  {id:'r11',level:'rapid',topic:'Rapid',question:'IDENTITY_FINISH means?',answer30s:'Finisher is identity',answer2m:'Framework may cast A→R',followUps:['CONCURRENT?']},
  {id:'r12',level:'rapid',topic:'Rapid',question:'range vs rangeClosed?',answer30s:'Exclusive vs inclusive end',answer2m:'Off-by-one trap',followUps:['sum 1..n?']},
];

export const ALL: InterviewQ[] = [...SENIOR, ...STAFF, ...ARCHITECT, ...RAPID];
