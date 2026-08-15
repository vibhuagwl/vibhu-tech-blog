/** Performance engineering fundamentals — senior/staff interview content. */

export const LOOP_STEPS: string[] = [
  'Define the SLO and user-visible symptom (P95/P99 latency, error rate, saturation) — never optimize without a contract.',
  'Baseline: capture golden-path latency breakdown (client → LB → app → DB → deps) under representative load.',
  'Instrument: RED/USE metrics, distributed traces with spans on pools and SQL, structured logs with correlation IDs.',
  'Reproduce: load test or traffic shadow that hits the same code path; fix data skew and cold-cache illusions.',
  'Locate the bottleneck: CPU, memory, disk, network, lock, pool wait, or remote dependency — one primary constraint.',
  'Form a hypothesis tied to evidence (flame graph, wait event, pool queue depth) — not folklore.',
  'Optimize only that bottleneck with the smallest change that moves the metric (index, batch, cache, pool, algorithm).',
  'Validate: same load profile; prove P95/P99 and error budget improved without regressing throughput or cost.',
  'Ship safely: canary/blue-green, feature flag, rollback plan, and capacity headroom documented.',
  'Monitor continuously: alerts on saturation and SLO burn; feed the next loop — performance is never “done.”',
];

export const LOOP_ASCII = `
                         ┌─────────────────┐
                         │     MEASURE     │
                         │  (baseline SLO) │
                         └────────┬────────┘
                                  │
                                  ▼
                         ┌─────────────────┐
                         │ FIND BOTTLENECK │
                         │ CPU|IO|lock|dep │
                         └────────┬────────┘
                                  │
                                  ▼
                         ┌─────────────────┐
                         │    OPTIMIZE     │
                         │  one constraint │
                         └────────┬────────┘
                                  │
                                  ▼
                         ┌─────────────────┐
                         │    VALIDATE     │
                         │  load + P95/P99 │
                         └────────┬────────┘
                                  │
                                  ▼
                         ┌─────────────────┐
                         │     MONITOR     │
                         │  SLO burn rate  │
                         └────────┬────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │  feedback into MEASURE    │
                    │  (never cargo-cult fixes) │
                    └───────────────────────────┘

Rule: Measure → Find Bottleneck → Optimize → Validate → Monitor → repeat.
Never skip Validate. Never optimize without a named bottleneck.
`.trim();

export const METRICS_ROWS: string[][] = [
  [
    'Latency (P50 / P95 / P99)',
    'Time to complete one request; tail (P99) drives user pain and timeouts',
    'Always quote percentile + window. Mean hides outliers. Staff: separate app time vs wait time.',
  ],
  [
    'Throughput (RPS / TPS)',
    'Successful work units completed per second under a given concurrency',
    'High RPS with rising P99 is still a failure. Capacity = throughput at SLO.',
  ],
  [
    'Error rate / availability',
    'Failed requests ÷ total; often 5xx, timeouts, circuit opens',
    'Tie to error budget. Distinguish client 4xx from dependency/server faults.',
  ],
  [
    'Saturation',
    'How full a resource is: CPU, heap, pool, disk queue, network',
    'USE method: Utilization, Saturation, Errors. Queue depth predicts latency cliffs.',
  ],
  [
    'Apdex / SLO burn',
    'Fraction of requests meeting latency goal; budget burn rate',
    'Alert on burn, not raw CPU. Multi-window burn (fast+slow) reduces noise.',
  ],
  [
    'Time-in-state (wait)',
    'Where time is spent: DB wait, lock wait, GC pause, pool acquire',
    'Interview gold: “latency is wait, not always CPU.” Show flame or span breakdown.',
  ],
  [
    'Concurrency / in-flight',
    'Requests (or threads/VTs) currently executing',
    'Little’s Law: L = λW. Raising concurrency without fixing W only queues.',
  ],
  [
    'Resource cost',
    'CPU-ms, memory, DB CU, egress $ per request or per 1k RPS',
    'Staff angle: optimize for $ and carbon under SLO, not microbenchmark vanity.',
  ],
];

export const LATENCY_VS_THROUGHPUT = `
Latency ≠ Throughput ≠ Scalability ≠ Performance ≠ Reliability
────────────────────────────────────────────────────────────────

LATENCY
  Wall-clock time for ONE unit of work (e.g. one HTTP call).
  Improves by removing waits: indexes, batching, closer data, less lock hold.
  Example: P99 800ms → 120ms after fixing N+1 SQL.

THROUGHPUT
  How MANY units complete per second at a given concurrency and hardware.
  Improves by parallelism, batching, reducing per-request work, right-sizing pools.
  Example: 200 RPS → 2k RPS after removing sync lock on hot path.

SCALABILITY
  How latency/throughput behave as load or data SIZE grows (users, shards, QPS).
  Vertical: bigger box. Horizontal: more boxes + partitionable work.
  Example: single Postgres primary caps writes — add sharding / CQRS for scale-out.

PERFORMANCE
  Umbrella: meeting latency + throughput + resource-efficiency goals under load.
  “Fast code” alone is not performance if the system melts at 2× traffic.

RELIABILITY
  Correctness under failure: timeouts, retries, idempotency, backpressure, SLO.
  A “fast” API that returns wrong data or cascades on dep failure is not reliable.
  Reliability can trade latency (retries, quorum) for correctness/availability.

INTERVIEW ONE-LINER
  “I optimize the metric that maps to the user SLO. Latency and throughput are
   related by Little’s Law but are different goals; scalability is the growth
   curve; reliability is what happens when something breaks.”
`.trim();

export const PYRAMID_ASCII = `
Performance leverage (top = largest impact when wrong; bottom = polish)

                    ┌──────────────────────────┐
                    │      ARCHITECTURE        │  sync vs async, boundaries,
                    │   (service topology)     │  fan-out, data ownership
                    └────────────┬─────────────┘
                                 │
                    ┌────────────▼─────────────┐
                    │      DISTRIBUTED         │  timeouts, caches, queues,
                    │   (network & deps)       │  circuit breakers, CDN
                    └────────────┬─────────────┘
                                 │
                    ┌────────────▼─────────────┐
                    │       DATABASE           │  schema, indexes, queries,
                    │   (SQL / NoSQL / pool)   │  transactions, connection pool
                    └────────────┬─────────────┘
                                 │
                    ┌────────────▼─────────────┐
                    │        SPRING            │  MVC vs WebFlux, AOP, TX,
                    │   (framework wiring)     │  Jackson, Actuator, pools
                    └────────────┬─────────────┘
                                 │
                    ┌────────────▼─────────────┐
                    │         JVM              │  heap, GC, JIT, containers,
                    │   (runtime)              │  CPU shares / memory limits
                    └────────────┬─────────────┘
                                 │
                    ┌────────────▼─────────────┐
                    │         JAVA             │  collections, streams,
                    │   (language & libs)      │  concurrency APIs, VT
                    └────────────┬─────────────┘
                                 │
                    ┌────────────▼─────────────┐
                    │         CODE             │  algorithms, hot loops,
                    │   (local micro-opts)     │  allocations — last mile
                    └──────────────────────────┘

Staff rule: climb the pyramid first. Micro-optimizing Java loops while
the API does N+1 SQL across three services is cargo-cult performance.
`.trim();

export const TWO_SEC_TREE = `
API takes ~2 seconds — decision tree (speak this out loud in interviews)

START: Confirm scope
  ├─ One endpoint or many? One tenant or all?
  ├─ P50 vs P99? Sudden or gradual?
  └─ Reproduce with traceId + same payload size

Q1: Where is the time? (distributed trace / access log timings)
  ├─ >50% outside this service ──► dependency / network path
  │     ├─ Downstream P99 high? ──► their SLO / timeout / retry storm
  │     ├─ Fan-out N calls sequential? ──► parallelize or BFF aggregate
  │     ├─ DNS / TLS / LB? ──► connection reuse, keep-alive, region affinity
  │     └─ Cold start (Lambda/scale-from-zero)? ──► provisioned concurrency
  │
  ├─ >50% in DB / Redis / Kafka ──► data path
  │     ├─ Slow query / missing index? ──► EXPLAIN, composite index
  │     ├─ N+1 ORM? ──► join fetch / batch size / DTO query
  │     ├─ Lock wait / long TX? ──► shorten TX, isolate hot rows
  │     ├─ Pool wait (Hikari)? ──► size vs DB max; leak check
  │     └─ Large result / SELECT *? ──► pagination, projection
  │
  └─ >50% in app CPU / GC / locks ──► runtime path
        ├─ GC pause / allocation rate? ──► heap, G1/ZGC, object churn
        ├─ Synchronized / contended lock? ──► striping, ConcurrentHashMap
        ├─ Thread pool queueing? ──► size for IO vs CPU; reject policy
        ├─ Serialization / logging? ──► fewer fields, async appender
        └─ Algorithm O(n²) on payload? ──► fix complexity first

Q2: After hypothesis, validate
  ├─ Change ONE thing
  ├─ Re-run same load profile
  └─ Prove P95/P99 drop; watch error rate & saturation

Anti-patterns: “add more pods” before knowing wait vs CPU;
               “add Redis” before fixing the query;
               “switch to virtual threads” when DB is the bottleneck.
`.trim();

export const SPOKEN_30S =
  'I treat performance as an engineering loop, not a bag of tricks. First I define the SLO — usually P95 or P99 latency and error rate — and baseline where time is spent with traces and RED metrics. Then I name one bottleneck: CPU, lock, pool wait, SQL, or a dependency. I change only that, load-test with the same profile, and prove the percentile moved. In Java/Spring on AWS that usually means database and connection pools before JVM flags or micro-optimizations.';

export const SPOKEN_2M =
  'Interview framing: latency, throughput, scalability, and reliability are different axes. Latency is time per request; throughput is work per second; scalability is how those degrade as load grows; reliability is correct behavior under failure. Little’s Law links concurrency, latency, and throughput — raising thread count without cutting wait time just builds queues. My pyramid is architecture and data path first, then Spring wiring, then JVM/GC, then Java collections, then local code. For a slow API I open a trace, split time into network, app, and DB, check pool saturation and GC, and only then talk about streams or virtual threads. Virtual threads raise concurrency for blocking IO; they do not make a slow query faster. Every heuristic — pool size, heap, cache TTL — is a starting point I benchmark and validate against P99 and error budget before calling it done.';

export const SPOKEN_5M = `
How I answer performance questions at senior/staff level (≈5 minutes)

1) Contract first (30s)
   Restate the user-visible problem and the SLO. Ask for P95/P99, window,
   traffic shape, and whether correctness or cost is also on the table.
   Refuse “make it faster” without a metric.

2) System sketch (45s)
   Draw the path: client → ALB/API GW → Spring service → pools → DB/Redis/Kafka
   → downstreams. Mark timeouts and retries. Staff signal: you know cascades
   and retry amplification matter as much as CPU.

3) Measure & locate (90s)
   RED + USE + one distributed trace of the golden path. Break latency into
   wait categories: DNS/TLS, thread/queue wait, GC, SQL, remote calls.
   State the bottleneck as a resource: “Hikari pool wait 1.4s” not “DB is slow.”

4) Hypothesis & fix ladder (90s)
   Climb the pyramid: architecture (fan-out, sync boundaries) → data model/
   indexes → Spring TX/ORM → pools → JVM/GC → algorithms.
   Propose the smallest reversible change. Call out tradeoffs: cache = stale,
   more connections = DB pressure, bigger heap = longer or different GC.

5) Validate & operate (60s)
   Same load test; compare P50/P95/P99, errors, CPU, pool metrics, $.
   Ship with canary and burn-rate alerts. Document the new capacity limit.
   Close with: “I would not claim victory until production SLO burn is healthy.”

Sound bites interviewers expect
   • “Optimize the bottleneck you measured.”
   • “P99 over averages.”
   • “Pools and timeouts are part of performance.”
   • “Heuristics are starting points — benchmark.”
   • “Reliability can cost latency; say the tradeoff out loud.”
`.trim();
