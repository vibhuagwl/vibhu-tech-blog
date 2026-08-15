import type {BeforeAfter, CaseStudy, PerfTopic, PlaybookScenario} from './types';

/** Cache hit / miss request path. */
export const CACHE_ASCII = `
Request
  │
  ▼
App  ── GET key ──►  Redis / Caffeine
  │                    │
  │                    ├─ HIT  → return value (no DB)
  │                    │
  │                    └─ MISS → load DB / service
  │                                │
  │                                ▼
  │                           populate cache (TTL + versioned key)
  │                                │
  ▼                                ▼
Response ◄─────────────────────────┘

Rules: know hit-ratio target, TTL, invalidation trigger, and stale tolerance
before you add a cache. Cache is a correctness trade, not a free speedup.
`.trim();

/**
 * Cache patterns & failure modes.
 * Columns: pattern | idea | when | risk | heuristic (starting point)
 */
export const CACHE_PATTERN_ROWS: string[][] = [
  ['Pattern', 'Idea', 'When', 'Risk', 'Heuristic (starting point)'],
  [
    'Cache-aside (lazy)',
    'App reads cache; on miss loads DB then puts',
    'Default for catalog/profile reads in Spring (@Cacheable / RedisTemplate)',
    'Stampede on expiry; stale until TTL/evict',
    'Versioned keys product:v3:{id}; TTL 5–15m + event eviction',
  ],
  [
    'Write-through',
    'Write updates DB and cache in the same request path',
    'Read-after-write must see fresh data',
    'Write latency ↑; partial failure needs careful ordering',
    'Use when UX requires immediate read of own write',
  ],
  [
    'Write-behind',
    'Write cache (or outbox) first; async flush to DB via Kafka/worker',
    'High write fan-in; brief staleness OK',
    'Durability / ordering / replay complexity',
    'Outbox → Kafka → consumer; never silent fire-and-forget for money',
  ],
  [
    'Stampede (dogpile)',
    'Hot key TTL expires → thundering herd to DB',
    'Peaks after deploy or aligned TTLs',
    'DB overload, cascading timeouts',
    'Single-flight lock / Redisson; TTL jitter; refresh-ahead',
  ],
  [
    'Penetration',
    'Repeated queries for missing keys bypass cache',
    'Scrapers, bugs, id enumeration',
    'DB hit every time',
    'Cache negative entries short TTL; bloom filter; validate IDs',
  ],
  [
    'Avalanche',
    'Many keys expire together → mass miss',
    'Fixed TTL from cold start / batch load',
    'Cluster-wide DB spike',
    'Jitter TTLs; staggered warmup; soft expire + background refresh',
  ],
  [
    'Hot keys',
    'One key absorbs huge QPS (celebrity / flash sale)',
    'Uneven popularity',
    'Redis CPU single-thread saturation; local stampede',
    'Local Caffeine L1; key split/sharding; replica reads; rate-limit',
  ],
];

/** Kafka producer knobs — heuristics. */
export const KAFKA_PRODUCER_ROWS: string[][] = [
  ['Setting / topic', 'Meaning', 'Heuristic (starting point)'],
  [
    'acks',
    'How many brokers must ack a produce',
    'acks=all for money / commands; acks=1 only for loss-tolerant telemetry',
  ],
  [
    'enable.idempotence',
    'Broker dedupes producer retries in-session',
    'true in production (Spring Boot default for new clients often on) — do not disable for speed',
  ],
  [
    'linger.ms + batch.size',
    'Batching for throughput',
    'linger 5–50ms + larger batch for high TPS; lower linger for latency SLOs',
  ],
  [
    'compression.type',
    'CPU vs network/disk',
    'lz4 or zstd starting point; measure CPU on producers',
  ],
  [
    'buffer.memory',
    'Total memory for unsent records',
    'Default often fine; raise only with evidence of block/exhaustion — watch GC',
  ],
  [
    'key selection',
    'Partition assignment + ordering scope',
    'Stable business key for order; fix hot keys explicitly (salting pipeline)',
  ],
];

/** Kafka consumer knobs — heuristics. */
export const KAFKA_CONSUMER_ROWS: string[][] = [
  ['Setting / topic', 'Meaning', 'Heuristic (starting point)'],
  [
    'max.poll.records',
    'Records returned per poll',
    'Start 100–500; lower if per-record work is heavy / TX long',
  ],
  [
    'max.poll.interval.ms',
    'Max processing time before considered dead',
    'Must exceed worst-case batch processing; too low → rebalance storms',
  ],
  [
    'fetch.min.bytes / fetch.max.wait.ms',
    'Server-side batching of fetches',
    'Tune for throughput vs latency; defaults OK until load-tested',
  ],
  [
    'concurrency (Spring)',
    'Listener threads / consumers in the group',
    'concurrency ≤ topic partitions for that group — extras sit idle',
  ],
  [
    'commit mode',
    'When offsets advance',
    'Prefer ack after successful side-effect (or transactional EOS in Kafka scope); idempotent sink always',
  ],
  [
    'DLT / error handler',
    'Poison isolation',
    'DefaultErrorHandler + DLT; never infinite retry on bad payload',
  ],
];

export const KAFKA_RULE =
  'Consumer parallelism ≤ partitions (per consumer group). Adding a 13th consumer to a 12-partition topic does not increase throughput — fix partitions/keys or speed up handlers instead.';

export const MICROSERVICES_NETWORK_ASCII = `
Monolith (in-process)
─────────────────────
  Controller → ServiceA.method() → ServiceB.method() → DB
  cost ≈ stack frames + 1 DB RTT

Microservice hops (same feature)
────────────────────────────────
  Edge → API Gateway → Service A ──HTTP/gRPC──► Service B ──► DB
                         │                       │
                         └── Redis / Kafka ───────┘

  Each hop adds: serialize + TLS + LB + queueing + deserialize + tail latency
  Fan-out: 1 user request → N downstream calls (amplification)

Interview line: "We split for team autonomy, not because network is free.
                Chatty N+1 HTTP across services is worse than monolith N+1 SQL."
`.trim();

/** AWS compute options — cold start & perf notes. */
export const AWS_COMPUTE_ROWS: string[][] = [
  ['Service', 'Model', 'Perf / cold start notes', 'Heuristic (starting point)'],
  [
    'EC2',
    'VMs you manage',
    'No platform cold start; you own AMI, agents, packing',
    'Steady high RPS, custom kernels, GPU, or strict placement',
  ],
  [
    'ECS (Fargate/EC2)',
    'Containers + scheduler',
    'Task start seconds–tens of seconds; keep min tasks for SLO',
    'Default for Spring Boot APIs on AWS; pair with ALB',
  ],
  [
    'EKS',
    'Kubernetes control plane',
    'Pod scheduling + image pull dominate; sidecars add hop latency',
    'When you need K8s ecosystem; watch DNS, CNI, and HPA signals',
  ],
  [
    'Lambda',
    'Functions / scale-to-zero',
    'Cold start: JVM/Spring can be seconds — SnapStart, provisioned concurrency, or native/AOT help; warm is ms-level overhead',
    'Spiky, event-driven, short work; avoid fat Spring contexts without SnapStart/PC',
  ],
];

/** ALB vs NLB. */
export const AWS_LB_ROWS: string[][] = [
  ['Dimension', 'ALB (L7)', 'NLB (L4)'],
  [
    'Layer',
    'HTTP/HTTPS, path/host routing, gRPC, WebSocket',
    'TCP/UDP/TLS passthrough — ultra low latency',
  ],
  [
    'Features',
    'WAF integrate, sticky cookies, OIDC, redirects',
    'Static IPs, PrivateLink, preserve source IP',
  ],
  [
    'Latency overhead',
    'Slightly higher (HTTP features)',
    'Minimal — prefer for extreme p99 or non-HTTP',
  ],
  [
    'Health checks',
    'HTTP path checks common',
    'TCP / HTTP; fail open carefully',
  ],
  [
    'Heuristic',
    'Default for Spring REST / browsers',
    'When you need raw TCP, static IP, or microsecond-sensitive paths',
  ],
];

/** AWS data plane highlights. */
export const AWS_DATA_ROWS: string[][] = [
  ['Service', 'Role', 'Perf highlight', 'Watch-out'],
  [
    'RDS / Aurora',
    'Managed relational',
    'Aurora storage scales; reader endpoints for read-heavy',
    'Connection storms (use RDS Proxy); cross-AZ chat; long TX',
  ],
  [
    'DynamoDB',
    'Managed key-value',
    'Single-digit ms at any scale with right keys; DAX optional',
    'Hot partitions; scans; eventually consistent reads by default',
  ],
  [
    'ElastiCache',
    'Redis / Memcached',
    'Sub-ms cache; cluster mode for scale-out',
    'Hot keys; oversize values; treating Redis as durable SOJ',
  ],
  [
    'S3',
    'Object storage',
    'Massive throughput; CloudFront for reads',
    'Chatty LIST; small-object overhead; strong vs eventual consistency nuances for overwrite listings',
  ],
  [
    'CloudFront',
    'CDN',
    'Edge cache cuts origin RPS and latency',
    'Cache-key design; TTLs; origin shield; purge discipline',
  ],
];

/** AWS network cost/latency traps. */
export const AWS_NETWORK_ROWS: string[][] = [
  ['Topic', 'What happens', 'Perf / cost impact', 'Heuristic (starting point)'],
  [
    'Cross-AZ traffic',
    'Chatty microservice calls across AZs',
    'Extra latency + data transfer charges',
    'Co-locate chatty pairs; accept cross-AZ for HA, not for gossip',
  ],
  [
    'NAT Gateway',
    'Private subnet egress to internet',
    'Per-GB processing + bottleneck risk',
    'VPC endpoints for S3/DynamoDB; minimize NAT for AWS APIs',
  ],
  [
    'VPC endpoints',
    'Private connectivity to AWS services',
    'Lower latency/variance vs NAT; often cheaper at volume',
    'Gateway endpoints for S3/DynamoDB; Interface endpoints where needed',
  ],
  [
    'Multi-region',
    'Cross-region replication / calls',
    '100ms+ RTT; transfer $; dual ops',
    'Region-local serve; async replicate; measure RPO/RTO deliberately',
  ],
];

/** Serialization choices on the hot path. */
export const SERIALIZATION_ROWS: string[][] = [
  ['Format', 'Pros', 'Cons', 'Heuristic (starting point)'],
  [
    'JSON (Jackson)',
    'Human-debuggable; ubiquitous HTTP APIs',
    'CPU + size heavier; schema drift is social',
    'Default for external REST; slim DTOs; avoid logging full bodies',
  ],
  [
    'Protobuf',
    'Compact, fast, strong codegen contracts',
    'Tooling barrier; versioning discipline required',
    'Internal gRPC / high-QPS service meshes',
  ],
  [
    'Avro (+ Schema Registry)',
    'Compact; evolved schemas; Kafka ecosystem fit',
    'Registry dependency; less handy for ad-hoc HTTP',
    'Kafka event pipelines with compatibility rules (FORWARD/BACKWARD)',
  ],
];

/**
 * Logging on the hot path — code + explanation.
 * (BeforeAfter shape reused for teaching consistency.)
 */
export const LOGGING_DANGER: BeforeAfter = {
  id: 'logging-danger',
  title: 'Sync / chatty logging on the request path',
  problem:
    'INFO/DEBUG logs with huge payloads or per-item loops turn CPU, disk, and GC into the bottleneck — and can leak PII.',
  bad: `// Java 21 · Spring Boot 3 · BAD
@PostMapping("/payments")
PaymentResponse pay(@RequestBody PaymentRequest req) {
  log.info("payment request {}", req);           // may serialize secrets / PAN
  for (LineItem line : req.lines()) {
    log.debug("line {}", line);                  // N log events per request
  }
  PaymentResponse res = paymentService.charge(req);
  log.info("payment response {}", res);          // large JSON on every call
  return res;
}
// Also bad: log.info("payload " + expensiveToString(req)); // always computes`,
  whySlow:
    'String building + Jackson + sync appenders block threads; disk I/O stalls; allocation spikes → GC pauses; log pipelines amplify cost.',
  good: `// GOOD: structured, sampled, parameterized, no secrets
@PostMapping("/payments")
PaymentResponse pay(@RequestBody PaymentRequest req) {
  log.info("payment start paymentId={} customerId={} lines={}",
      req.paymentId(), req.customerId(), req.lines().size());
  PaymentResponse res = paymentService.charge(req);
  log.info("payment done paymentId={} status={} latencyMs={}",
      req.paymentId(), res.status(), res.latencyMs());
  return res;
}

// application.yml sketch
// logging.level.root: INFO
// logging.level.com.example: INFO
// use async appender (e.g. Logback AsyncAppender) with sane queue + discard policy
// never log tokens, passwords, full card data; mask at the edge`,
  whyFaster:
    'Fewer allocations, smaller I/O, stable p99. Parameterized loggers skip work when level disabled. Metrics/traces carry volume; logs carry incidents.',
  tradeoff:
    'Less narrative detail in INFO — recover via correlation id + targeted DEBUG in lower envs + trace sampling.',
  interview:
    'I treat logs as a production cost center: structured fields, async appenders, no payload dumps on hot paths, and sampling for chatty debug.',
  validate:
    'Compare P99 and alloc rate with logging on/off at production level; watch appender queue and disk util under load.',
};
