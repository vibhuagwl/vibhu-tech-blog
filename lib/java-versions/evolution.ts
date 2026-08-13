export const FEATURE_EVOLUTIONS = [
  {
    name: 'Records',
    steps: [
      {version: 'Java 14', status: 'PREVIEW'},
      {version: 'Java 15', status: 'PREVIEW'},
      {version: 'Java 16', status: 'FINAL'},
      {version: 'Java 17+', status: 'Production LTS'},
    ],
  },
  {
    name: 'Sealed Classes',
    steps: [
      {version: 'Java 15', status: 'PREVIEW'},
      {version: 'Java 16', status: 'PREVIEW'},
      {version: 'Java 17', status: 'FINAL'},
    ],
  },
  {
    name: 'Pattern Matching for instanceof',
    steps: [
      {version: 'Java 14', status: 'PREVIEW'},
      {version: 'Java 15', status: 'PREVIEW'},
      {version: 'Java 16', status: 'FINAL'},
      {version: 'Java 17+', status: 'Production LTS'},
    ],
  },
  {
    name: 'Switch Expressions',
    steps: [
      {version: 'Java 12', status: 'PREVIEW'},
      {version: 'Java 13', status: 'PREVIEW'},
      {version: 'Java 14', status: 'FINAL'},
      {version: 'Java 17+', status: 'Everyday style'},
    ],
  },
  {
    name: 'Pattern Matching for switch',
    steps: [
      {version: 'Java 17', status: 'PREVIEW'},
      {version: 'Java 18–20', status: 'PREVIEW'},
      {version: 'Java 21', status: 'FINAL'},
    ],
  },
  {
    name: 'Virtual Threads',
    steps: [
      {version: 'Java 19', status: 'PREVIEW'},
      {version: 'Java 20', status: 'PREVIEW'},
      {version: 'Java 21', status: 'FINAL'},
    ],
  },
  {
    name: 'Structured Concurrency',
    steps: [
      {version: 'Java 21', status: 'PREVIEW'},
      {version: 'Java 22–24', status: 'PREVIEW'},
      {version: 'Java 25', status: 'PREVIEW (JEP 505, 5th)'},
    ],
  },
  {
    name: 'Scoped Values',
    steps: [
      {version: 'Java 20–21', status: 'PREVIEW'},
      {version: 'Java 22–24', status: 'PREVIEW'},
      {version: 'Java 25', status: 'FINAL (JEP 506)'},
    ],
  },
  {
    name: 'String Templates',
    steps: [
      {version: 'Java 21', status: 'PREVIEW'},
      {version: 'Java 22', status: 'PREVIEW'},
      {version: 'Java 23', status: 'Withdrawn from final path'},
      {version: 'Java 25', status: 'Not a JDK 25 final feature'},
    ],
  },
  {
    name: 'Foreign Function & Memory API',
    steps: [
      {version: 'Java 17–20', status: 'Incubator/Preview lineage'},
      {version: 'Java 21', status: 'PREVIEW'},
      {version: 'Java 22', status: 'FINAL (JEP 454)'},
      {version: 'Java 25', status: 'Production (from 22+)'},
    ],
  },
  {
    name: 'Vector API',
    steps: [
      {version: 'Java 16+', status: 'INCUBATOR'},
      {version: 'Java 21', status: 'INCUBATOR'},
      {version: 'Java 25', status: 'INCUBATOR (JEP 508, 10th)'},
    ],
  },
] as const;

export const JVM_PIPELINE = [
  '.java source',
  'javac',
  '.class bytecode',
  'ClassLoader',
  'Interpreter / templates',
  'C1 (client) JIT',
  'C2 (server) JIT',
  'Native code + code cache',
];

export const JVM_TOPICS = [
  {
    title: 'Class loading & bytecode',
    body: 'Loaders define namespaces. Bytecode is verified then executed. Across 8→25, stronger module encapsulation changes what reflective frameworks can touch without flags.',
  },
  {
    title: 'Interpreter → C1 → C2',
    body: 'Tiered compilation: interpret, C1 with profiling, C2 for hot methods. Code cache sizing still matters. AOT profiling in 25 aims to shrink warm-up cliffs.',
  },
  {
    title: 'Escape analysis & scalar replacement',
    body: 'JIT may allocate on stack / explode fields if objects do not escape. Records/small immutables can help clarity; the JIT decides. Never promise EA in design docs as a guarantee.',
  },
  {
    title: 'Lock elimination / biased locking evolution',
    body: 'Biased locking was disabled by default in modern JDKs and later removed — do not recommend -XX:+UseBiasedLocking on current LTS. Contended locks still dominate some profiles; VT changes contention shapes.',
  },
  {
    title: 'Metaspace / heap / stacks',
    body: 'Metaspace (since 8) holds class metadata. Native memory tracking (NMT) matters when “RSS grew but heap did not”. Virtual threads change stack sizing economics vs platform threads.',
  },
  {
    title: 'JFR',
    body: 'Preferred always-on profiler. 25 adds cooperative sampling and method timing/tracing finals — use for GC, lock, I/O, and pinning investigations.',
  },
];

export const JVM_ACROSS_VERSIONS = [
  {version: '8', notes: 'Metaspace; lambda linkage via invokedynamic; CMS still common'},
  {version: '11', notes: 'JFR in OpenJDK; Epsilon; ZGC experimental; modular JDK pressure'},
  {version: '17', notes: 'Strong encapsulation default; G1/Z/Shenandoah mature options'},
  {version: '21', notes: 'VT scheduler; Generational ZGC; Loom foundations'},
  {version: '25', notes: 'Compact headers; AOT ergonomics/profiling; Gen Shenandoah; Scoped Values'},
];

export const GC_ROWS = [
  {
    name: 'Serial',
    latency: 'Poor for multi-core services',
    throughput: 'OK for small heaps / single core',
    typical: 'Tiny tools, constrained containers',
    status: 'Still exists; rarely chosen for servers',
  },
  {
    name: 'Parallel',
    latency: 'Higher pauses',
    throughput: 'Strong throughput focus',
    typical: 'Batch / ETL where pauses OK',
    status: 'Legacy server default lineage; often replaced by G1',
  },
  {
    name: 'CMS',
    latency: 'Lower than Parallel (era-dependent)',
    throughput: 'Moderate',
    typical: 'Legacy low-pause attempts',
    status: 'REMOVED (Java 14)',
  },
  {
    name: 'G1',
    latency: 'Balanced, region-based',
    throughput: 'Strong general-purpose',
    typical: 'Default choice for many microservices',
    status: 'Default on modern HotSpot server configs',
  },
  {
    name: 'ZGC',
    latency: 'Ultra-low pause design',
    throughput: 'Improved markedly with generations (21)',
    typical: 'Large heaps, tight pause budgets',
    status: 'Production; Generational ZGC final in 21',
  },
  {
    name: 'Shenandoah',
    latency: 'Ultra-low pause design',
    throughput: 'Improved with generations (25)',
    typical: 'Low-pause alternative on supporting builds',
    status: 'Generational Shenandoah final in 25 (JEP 521)',
  },
  {
    name: 'Epsilon',
    latency: 'No GC',
    throughput: 'N/A — allocates until death',
    typical: 'Short-lived jobs / experiments',
    status: 'Since 11; catastrophic if misused',
  },
];

export const CONCURRENCY_TIMELINE = [
  {era: 'Java 5', items: ['ExecutorService', 'ConcurrentHashMap', 'Locks', 'Atomic*']},
  {era: 'Java 8', items: ['CompletableFuture', 'Parallel Streams', 'StampedLock']},
  {era: 'Java 9+', items: ['Flow API (Reactive Streams SPI)']},
  {era: 'Java 19–20', items: ['Virtual Threads preview', 'Scoped Values preview lineage']},
  {era: 'Java 21', items: ['Virtual Threads FINAL', 'Structured Concurrency preview']},
  {era: 'Java 25', items: ['Scoped Values FINAL', 'Structured Concurrency still PREVIEW']},
];

export const CONCURRENCY_MATRIX = [
  {workload: 'CPU-bound', pool: 'Sized ~cores', cf: 'Careful', reactive: 'Not required', vt: 'No magic speedup'},
  {workload: 'I/O-bound', pool: 'Hard to size', cf: 'Good', reactive: 'Strong', vt: 'Excellent fit'},
  {workload: 'High concurrency', pool: 'Thread explosion', cf: 'OK with async', reactive: 'Strong', vt: 'Excellent fit'},
  {workload: 'Streaming + backpressure', pool: 'Poor fit', cf: 'Weak alone', reactive: 'Best fit', vt: 'Not a backpressure system'},
  {workload: 'Legacy blocking API', pool: 'Common', cf: 'Wrapping', reactive: 'Needs adapters', vt: 'Best incremental path'},
];

export const PERFORMANCE_NOTES = [
  'Newer Java ≠ automatically faster — measure warm throughput, p99, RSS, GC, error rate.',
  'Compact headers (25) and GC generational designs change capacity math.',
  'Virtual threads change concurrency, not single-thread CPU speed.',
  'AOT/profile-guided warm-up helps scale-to-zero; may be irrelevant for always-hot pods.',
  'JIT inlining/EA dominate microbench noise — prefer production-like JFR.',
];

export const SECURITY_NOTES = [
  'TLS defaults and disabled algorithms tighten across CPUs — test mutual TLS and older brokers.',
  'Deserialization filters (17+) are mandatory for untrusted Java serialization paths.',
  'Strong encapsulation (17) breaks shady agents — prefer supported APMs.',
  'KEM (21) + KDF (25) matter for crypto platform teams; most business apps feel them indirectly.',
  'Preview crypto APIs (PEM in 25) need governance equal to any experimental cipher suite.',
];
