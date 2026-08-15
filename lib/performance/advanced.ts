/**
 * Advanced Staff/Principal coverage: JVM internals, GC deep dive, Java 21,
 * networking, distributed API resilience, DB internals, distributed systems,
 * Kafka deep, AWS cost×performance, advanced cache, JMH methodology, math.
 */

export const MASTER_FRAMEWORK_ASCII = `
                    USER REPORTS SLOW API
                             |
                             ↓
                       Measure P50/P95/P99
                       (+ error rate, saturation)
                             |
                             ↓
                     Distributed Trace
                             |
          +------------------+------------------+
          ↓                  ↓                  ↓
        CPU                Memory             I/O
          |                  |                  |
       JFR/Profiler       Heap/GC           DB/Network
          |                  |                  |
          +------------------+------------------+
                             |
                             ↓
                       Find Bottleneck
                             |
                             ↓
                     Optimize ONE thing
                             |
                             ↓
                        Load Test
                             |
                             ↓
                     Compare Baseline
                             |
                             ↓
                    Production Rollout
                             |
                             ↓
                         Monitor
`;

export const JVM_INTERNALS_ROWS: string[][] = [
  ['JIT (C1/C2)', 'Interprets → C1 (fast compile) → C2 (heavy optimize)', 'Warm-up matters; cold paths look slow in short tests'],
  ['Tiered compilation', 'Default: mix C1 profiles + C2', 'Disable only with evidence; usually leave on'],
  ['Inlining', 'Collapse call chains for optimization', 'Huge methods / megamorphic calls resist inlining'],
  ['Escape analysis', 'Stack-allocate / scalar-replace non-escaping objects', 'Helps hot loops; do not rely on it for large graphs'],
  ['Scalar replacement', 'Object fields → registers/locals', 'Visible in JFR allocation after warm-up'],
  ['Deoptimization', 'Bail to interpreter when assumptions break', 'Spikes after class load / uncommon traps'],
  ['Safepoints', 'Stop-the-world points for GC/deopt', 'Long time-to-safepoint → latency blips'],
  ['Compressed OOPs', '32-bit refs in heap < ~32G', 'Default win; huge heaps may disable'],
  ['TLAB', 'Thread-local allocation buffer', 'Reduces alloc contention; watch TLAB waste'],
  ['Native / direct', 'Metaspace, code cache, DirectByteBuffer, JNI', 'NMT + Native Memory Tracking for off-heap leaks'],
  ['Biased locking', 'Historical; largely obsolete/disabled in modern JDKs', 'Do not tune; understand legacy advice'],
];

export const GC_DEEP_ROWS: string[][] = [
  ['G1 regions', 'Heap split into equal regions', 'Humongous objects span regions → fragmentation risk'],
  ['Remembered sets', 'Track cross-region refs', 'High RSet scan → pause pressure'],
  ['Concurrent mark', 'Mark while app runs', 'Marking not enough if evacuation fails'],
  ['Evacuation', 'Copy live objects from collection set', 'To-space exhaustion → Full GC'],
  ['Humongous', 'Objects ≥ region size', 'Avoid large short-lived byte[]/JSON buffers'],
  ['ZGC', 'Colored pointers + load barriers; ultra-low pause', 'Great for large heaps; still pay alloc + barrier cost'],
  ['Shenandoah', 'Concurrent compaction family', 'Similar low-pause goal; pick with evidence'],
  ['Allocation rate', 'MB/s into young gen', 'First lever before collector shopping'],
  ['GC logs', 'Pause, heap before/after, humongous, to-space', 'Correlate pauses with p99 spikes'],
];

export const GC_LOG_ASCII = `
Read GC logs as a story:
  allocation rate ↑  →  young collections more frequent
  promotion ↑        →  old growth / mixed GC pressure
  humongous ↑        →  large buffers / JSON / byte[]
  to-space exhausted →  evacuation failure → Full GC
  pause correlates   →  p99 blip at same timestamps

Example questions in interview:
  "Was it young GC, mixed, or Full?"
  "Did allocation rate change after the deploy?"
  "Any humongous allocation spike?"
`;

export const JAVA21_PERF_ROWS: string[][] = [
  ['Virtual threads', 'Cheap blocking concurrency', 'Still bound DB/HTTP pools; watch pinning'],
  ['Structured concurrency', 'Treat related tasks as a unit', 'Cancel siblings on failure; clearer timeouts'],
  ['ScopedValue', 'Immutable alternative to ThreadLocal for VT', 'Avoid unbounded ThreadLocal maps on VT'],
  ['Records', 'Shallow immutable carriers', 'Less boilerplate; still allocate if escaping'],
  ['Pattern matching', 'Clearer control flow', 'Usually neutral; prefer readability'],
  ['Modern JVM', 'Better JIT + GC defaults (G1/ZGC)', 'Upgrade JDK before exotic flags'],
];

export const NETWORKING_ROWS: string[][] = [
  ['DNS', 'Extra RTT before connect', 'Cache resolvers; avoid per-request lookup'],
  ['TCP handshake', 'SYN/SYN-ACK/ACK', 'Connection pools amortize'],
  ['TLS handshake', 'CPU + RTTs; session tickets help', 'Reuse connections; TLS offload at ALB/CDN'],
  ['Keep-alive', 'Hold idle sockets for reuse', 'Align idle timeouts end-to-end'],
  ['HTTP/2 mux', 'Many streams / connection', 'HOL at TCP still exists; H3 helps lossy nets'],
  ['HTTP/3 QUIC', 'UDP + connection migration', 'Edge benefit first'],
  ['Socket buffers', 'Kernel buffering', 'Tune only with packet loss / throughput evidence'],
  ['Nagle', 'Small-packet coalescing', 'Often disabled with TCP_NODELAY for RPC'],
  ['HOL blocking', 'One loss stalls H1/H2 TCP pipe', 'Timeouts + hedged requests carefully'],
  ['Net backpressure', 'Slow consumer → TCP window shrink', 'Bounded queues; do not buffer unboundedly'],
];

export const DIST_API_ROWS: string[][] = [
  ['Timeout budget', 'End-to-end deadline shared across hops', 'Subtract spent time per hop'],
  ['Retry budget', 'Cap retries as % of traffic', 'Stops retry storms'],
  ['Retry storm', 'Layered retries amplify load', 'One retry owner + jitter + idempotency'],
  ['Hedged requests', 'Duplicate after delay to another replica', 'Only for idempotent reads; watch 2× load'],
  ['Request collapsing', 'Coalesce identical in-flight gets', 'Stampede cousin; great for hot keys'],
  ['Adaptive concurrency', 'Limit in-flight by observed latency', 'Better than static huge pools'],
  ['Bulkhead', 'Isolate pools per dependency', 'Protect checkout from recommendations'],
  ['Load shedding', '503 non-critical when saturated', 'Keep money path alive'],
  ['Graceful degradation', 'Serve cached/partial', 'Never fake SETTLED for payments'],
];

export const DB_INTERNALS_ROWS: string[][] = [
  ['MVCC', 'Readers see snapshots; writers version rows', 'Long tx → bloat / snapshot too old'],
  ['WAL', 'Durability log before data', 'Sync settings trade durability vs latency'],
  ['Buffer pool', 'Cached pages in memory', 'Cache hit ratio + working set sizing'],
  ['Vacuum / purge', 'Reclaim dead tuples (PG) / purge history', 'Autovacuum lag → bloat + slow scans'],
  ['Bloat', 'Dead space in tables/indexes', 'Plan reindex/vacuum; watch disk'],
  ['Statistics', 'Planner cardinality inputs', 'Stale stats → bad plans after big loads'],
  ['Cardinality', 'Estimated rows', 'Skewed data fools planners'],
  ['Partitioning', 'Prune by key ranges', 'Wrong key → no prune'],
  ['Sharding', 'Horizontal split', 'Hot shard = global bottleneck'],
  ['R/W split', 'Reads to replicas', 'Replication lag → stale reads'],
  ['Locks', 'Row/table locks, gap locks', 'Deadlock graphs; shorten tx'],
];

export const DISTRIBUTED_PERF_ROWS: string[][] = [
  ['CAP vs latency', 'Strong consistency often adds RTT', 'Say which slice is CP vs AP'],
  ['Quorum', 'R + W > N for strong reads', 'Higher quorum → higher latency'],
  ['Leader/follower', 'Writes to leader', 'Leader hotspot; failover blips'],
  ['Replication', 'Sync vs async', 'Sync = safer + slower; async = lag risk'],
  ['Distributed lock', 'Serialize critical sections', 'Lock wait can dominate p99'],
  ['Consistent hashing', 'Stable shard mapping', 'Virtual nodes reduce hot keys'],
  ['Hot partitions', 'One key owns traffic', 'Salting, fan-out, local cache'],
  ['Queue leveling', 'Absorb spikes in Kafka/SQS', 'Smooths compute; adds lag SLO'],
];

export const KAFKA_DEEP_ROWS: string[][] = [
  ['ISR', 'In-sync replicas for durability', 'ISR shrink → produce risk / under-replicated'],
  ['Leader election', 'New leader on failure', 'Brief unavailability; watch controller'],
  ['Page cache', 'OS cache for log segments', 'RAM > working set of hot partitions'],
  ['Replication traffic', 'Follower fetch load', 'Cross-AZ replication costs + latency'],
  ['Partition skew', 'Uneven key → hot partition', 'Key design + produce metrics'],
  ['Batching + linger', 'Amortize RPC', 'latency vs throughput trade-off'],
  ['Compression', 'CPU vs network', 'lz4/zstd common starting points — benchmark'],
  ['Rebalance', 'Stop-the-world risk (eager)', 'Prefer cooperative sticky; minimize'],
  ['Fetch tuning', 'min bytes / max wait', 'Idle waste vs latency'],
  ['EOS cost', 'Transactions / idempotent produce', 'Correctness tax on throughput'],
];

export const AWS_COST_PERF_ROWS: string[][] = [
  ['Perf equation', 'Latency + throughput + reliability + cost', 'Architect interviews expect this framing'],
  ['Compute Optimizer', 'Right-size recommendations', 'Validate with load tests'],
  ['CloudWatch', 'CPU, mem, net, custom p99', 'Alarm on saturation not only CPU'],
  ['Perf Insights', 'RDS/Aurora wait events', 'Find SQL / lock waits fast'],
  ['Scale-out vs up', 'More tasks vs bigger instance', 'Stateless APIs prefer out; DB often up+replicas'],
  ['Cross-AZ', 'HA + extra RTT + data transfer $', 'Keep chatty tiers co-located when safe'],
  ['NAT Gateway', 'Egress path + $ per GB', 'VPC endpoints for S3/Dynamo to cut NAT'],
  ['Data transfer', 'Cross-AZ/region/Internet costs', 'Design topologies for both $ and ms'],
  ['IOPS / throughput', 'gp3/io2, Aurora storage', 'Do not buy CPU when disk-bound'],
  ['Graviton', 'Often better perf/$ for Java', 'Benchmark; watch native libs'],
  ['Spot', 'Cheap interruptible capacity', 'Stateless workers; not sole path for critical writes'],
];

export const ADV_CACHE_ROWS: string[][] = [
  ['Stampede', 'Many miss same key', 'Singleflight / lock / request coalescing'],
  ['Coalescing', 'One load for N waiters', 'In-process or Redis lock'],
  ['Probabilistic early expire', 'Refresh before TTL hits zero', 'Smooths expiry cliffs'],
  ['Stale-while-revalidate', 'Serve stale; refresh async', 'UX win; consistency trade-off'],
  ['Negative caching', 'Cache "not found"', 'TTL short; prevents penetration'],
  ['Cache consistency', 'Invalidate vs TTL', 'Versioned keys + events'],
  ['Warming', 'Preload hot keys', 'After deploy / failover'],
  ['Hot-key', 'One key dominates', 'Local cache + replicate / shard key'],
];

export const JMH_METHOD_ROWS: string[][] = [
  ['Baseline', 'Capture before change', 'Same hardware, same build flags'],
  ['Warm-up', 'JIT + caches stabilize', 'Short runs lie; use JMH warm-up iters'],
  ['JMH', 'Microbenchmark harness', 'Avoid hand-rolled System.nanoTime loops'],
  ['Coordinated omission', 'Load generators hide tail latency', 'Prefer modern tools that correct for it'],
  ['Isolation', 'One variable changed', 'No drive-by flag soup'],
  ['Workload model', 'Realistic mix + sizes', 'Replay prod traces when possible'],
  ['Percentiles', 'p50/p95/p99/p999', 'Means hide tail'],
  ['Regression gate', 'CI compares to baseline', 'Fail build on p99 regression threshold'],
];

export const MATH_ROWS: string[][] = [
  ["Little's Law", 'L = λW', 'Concurrency ≈ throughput × latency'],
  ["Amdahl's Law", 'Speedup limited by serial fraction', 'Parallelize only the hotspot'],
  ['Universal Scalability Law', 'Contention + coherency penalties', 'Why more threads eventually hurt'],
  ['Utilization', 'Busy / capacity', 'High util → queueing explodes'],
  ['Saturation', 'Queue depth growing', 'Often the true bottleneck signal'],
  ['Latency decomposition', 'Sum of span times (+ queue)', 'Trace first'],
];

export const MATH_ASCII = `
Little's Law:
  L = λ × W
  concurrency ≈ RPS × latency_seconds
  Example: 1000 RPS × 0.1 s = 100 concurrent requests

Amdahl (intuition):
  If 10% of work is serial, infinite cores cannot beat 10×.

USL (interview one-liner):
  Throughput rises, then flattens/falls as contention and
  cross-talk (locks, shared caches, coherent traffic) grow.

Utilization → latency:
  As ρ → 1, queue wait blows up (simple M/M/1 intuition).
  Running at 90%+ utilization without shedding is how p99 dies.
`;

export const PERF_COST_EQUATION = `
Performance (architect definition)
  = latency
  + throughput
  + reliability
  + cost

Faster at 5× cost with no reliability may lose the interview.
Cheaper at 10× p99 may lose the customer.
`;
