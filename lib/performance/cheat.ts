/** Rapid memory sheet — API / JAVA / SPRING / DATABASE / KAFKA / AWS */
export const CHEAT_ASCII = `
PERFORMANCE CHEAT — rapid memory
═════════════════════════════════

API / HTTP
  • Budget timeouts downward (client > GW > service > dep)
  • p95/p99 SLOs; never tune on average alone
  • Pagination + max page size; reject giant payloads at edge
  • Idempotency-Key on mutating retries
  • Compression for large text; slim DTOs over fat graphs
  • Cache-Control/ETag/CDN for safe GETs & static assets

JAVA
  • Measure: JFR / async-profiler before micro-opts
  • Alloc rate drives GC → cut churn (boxing, concat, streams abuse)
  • Thread dump for waits; heap dump for leaks
  • Virtual threads ≠ infinite DB; bound scarce resources
  • Prefer primitive-friendly hot loops; reuse buffers carefully
  • Avoid synchronized pinning pitfalls with VT when relevant

SPRING
  • Disable OSIV on APIs; DTO / entity graph fetch
  • RestClient/WebClient: connect+read timeouts + pool TTL
  • @Transactional short; no remote I/O inside
  • Hikari metrics: active/pending/timeout — fleet×pool ≤ DB max
  • Micrometer histograms; Resilience4j CB/bulkhead/timelimiter
  • Graceful shutdown + readiness after warmup

DATABASE
  • EXPLAIN ANALYZE before adding indexes
  • Fix N+1 / SELECT * / missing composite indexes
  • Short transactions; watch lock wait class
  • Connection budget across pods; PgBouncer if needed
  • Keyset pagination; keep analytics off OLTP primary
  • Stats/plans change with data growth — re-verify hot SQL

KAFKA
  • Lag = produce − consume rate problem
  • Parallelism ≤ partitions; fix hot keys
  • Batch produce (linger/batch) + batch side effects
  • No sync request-reply for UX paths
  • Rebalance storms: GC/session/network — stabilize first
  • DLQ poison; pause/resume for backpressure

AWS
  • CloudFront → APIGW → ALB → app → Redis/Kafka → RDS
  • Co-locate chatty tiers (AZ); cut cross-AZ chattiness
  • ALB 502=target connect; 503=no healthy; 504=backend slow
  • Right-size + HPA on useful SLIs (not CPU-only for I/O apps)
  • Multi-AZ HA ≠ free latency; measure hop budgets
  • Cold cache / smaller DR capacity after failover
`.trim();

export const TOP_50_RULES: string[] = [
  'Measure before you change; prove after with the same load.',
  'Optimize the bottleneck, not the convenience.',
  'SLO on p95/p99 — averages lie.',
  'Little\'s Law sizes pools: concurrency ≈ RPS × latency.',
  'Timeouts on every remote call; budgets decrease inward.',
  'One retry owner; jitter; idempotent mutations.',
  'Circuit break + bulkhead; don\'t share one giant pool.',
  'Traces find where time went; profiles find CPU/alloc.',
  'Thread dump for hangs; heap dump for leaks.',
  'GC: cut allocation first, tune second.',
  'N+1 is guilty until SQL count says otherwise.',
  'SELECT only columns you need.',
  'EXPLAIN ANALYZE before and after index changes.',
  'Short @Transactional; never HTTP inside a transaction.',
  'Disable OSIV for JSON APIs.',
  'Hikari pending ≈ 0 at peak; investigate if not.',
  'pods × poolSize must stay under DB max_connections.',
  'Cache hot reads; version or avoid caching money blindly.',
  'Prevent cache stampedes with singleflight/staggered TTL.',
  'Paginate everything unbounded; prefer keyset.',
  'Bound queues; shed load with 503 rather than melt.',
  'Kafka lag: speed consumer or add partitions — know which.',
  'Consumers cannot out-parallel partitions.',
  'Batch Kafka I/O; avoid per-record sync HTTP.',
  'Rebalance storms are a performance incident.',
  'Virtual threads still need DB/HTTP connection bounds.',
  'Head-of-line blocking: separate latency classes.',
  'Cross-AZ chatter taxes every N+1.',
  'ALB 504 is usually your app exceeding timeout.',
  'Canary on latency and saturation, not errors only.',
  'Soak tests catch leaks that load tests miss.',
  'Prod-like data skew or your load test lies.',
  'Cardinality-bomb metrics destroy observability.',
  'Logging full payloads is a CPU and PII bug.',
  'Compression and binary codecs when CPU/network prove it.',
  'Graceful shutdown prevents deploy-time retry storms.',
  'Connection maxLifetime for K8s/LB target churn.',
  'Read-your-writes: primary when replica lag matters.',
  'Autoscaling on CPU fails for I/O-bound services.',
  'Fix queries before buying bigger RDS.',
  'Scale-out multiplies bad algorithms and cost.',
  'Percentiles need merged histograms — don\'t average p99s.',
  'Feature-flag expensive paths for instant mitigation.',
  'Document hop latency budgets in an ADR.',
  'Capacity plan for N-1 AZ loss.',
  'Backpressure: lag beats melting the database.',
  'Tail-sample traces; keep RED metrics always on.',
  'Performance claims in PRs need before/after numbers.',
  'Platform defaults (timeouts/pools/metrics) beat wikis.',
  'Never cargo-cult threads, pools, indexes, cache, or CPU.',
];

export const FORMULAS_ASCII = `
FORMULAS
────────
Little's Law
  L = λ × W
  in_flight ≈ RPS × latency_seconds
  eg. 1000 rps × 0.1s = 100 concurrency

Amdahl's Law (intuition)
  Speedup limited by serial fraction
  If 10% serial → theoretical max ~10× even with infinite cores

Universal Scalability Law (interview)
  Throughput rises then flattens/falls as contention + coherency grow
  Explains why "more threads" eventually hurts

Concurrency / pool sizing
  pool ≈ peak_RPS × p99_latency × safety_factor
  fleet_DB_conns = pods × hikari_max  ≤  db_max_connections

DB connections (rule of thumb)
  start from measured hold_time, not CPU cores alone
  pending_acquires → increase only after fixing slow holders

Kafka
  needed_partitions ≳ peak_produce_RPS / per_partition_consume_RPS
  lag_rate ≈ produce_rate − consume_rate
  consumer_parallelism ≤ partitions

Cache hit ratio
  hit_ratio = hits / (hits + misses)
  effective_DB_QPS ≈ client_RPS × (1 − hit_ratio) × queries_per_request
  stampede ≈ miss_concurrency on same key

AWS cost × performance
  Performance = latency + throughput + reliability + cost
  Cross-AZ chatty calls: +RTT and +$ data transfer
`.trim();

export const ARCHITECTURE_ASCII = `
Typical request path (perf lens)
════════════════════════════════
  Client
    → CloudFront (TLS, cache static / cacheable GET)
      → API Gateway (auth, throttle, request size)
        → ALB (health, timeout)
          → Spring Boot (Tomcat/VT, RestClient, @Transactional)
            → Redis (cache-aside)     → Kafka (async fan-out)
            → downstream services (timeouts + CB + bulkhead)
            → RDS / Aurora (Hikari pool, indexes, short txs)

Watch per hop: latency budget · errors · saturation (pools/CPU/lag)
`.trim();

export const CARGO_CULT: string[] = [
  'More threads ≠ more performance',
  'More Hikari connections ≠ more performance',
  'More pods ≠ more performance',
  'More indexes ≠ more performance',
  'More cache ≠ more performance',
  'More heap ≠ more performance',
  'More partitions ≠ more performance (without consumers/keys)',
  'More retries ≠ more resilience or speed',
  'More logging ≠ faster incident response',
  'More microservices ≠ lower latency',
  'More CPU cores ≠ fixed N+1',
  'More GC tuning ≠ fixed allocation leaks',
  'More APM sampling ≠ automatic answers',
  'More feature flags ≠ substitute for budgets',
  'More async ≠ correct sync boundaries',
];
