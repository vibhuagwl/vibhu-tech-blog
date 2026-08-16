/** AWS, capacity, retry, CAP, payment, fairness — Staff interview addenda. */

export const AWS_ASCII = `Internet
   ↓
CloudFront          (TLS, cache, geo)
   ↓
AWS WAF             (rate-based rules, bot control, IP sets)
   ↓
API Gateway / ALB   (stage throttling, usage plans, WAF association)
   ↓
EKS / ECS pods      (Spring RateLimitFilter + library)
   ↓
ElastiCache Redis   (Cluster mode, multi-AZ)
   ↓
Aurora/PostgreSQL · MSK/Kafka · External providers

Layer roles
  WAF / CloudFront  → volumetric DDoS / bot flood (not product quotas)
  API Gateway       → coarse per-key/stage throttle
  App + Redis       → tenant/user/API product quotas + 429 semantics
  Shield Advanced   → network DDoS (does not replace app quotas)`;

export const CAPACITY_MATH = `Assumptions for 1M RPS admission checks:
  - Every request: 1 Redis EVAL (single key) ≈ 1 Redis op
  - Average matching policies: 3 (tenant+user+api) → ~3M EVAL/s worst case
  - Mitigate: fail-fast order, local pre-limit (cut Redis QPS 5–20×), pipeline only when safe

Sample plan
  Redis ops needed after local pre-limit: ~200K EVAL/s
  Per Redis primary comfortable: ~50–100K simple ops/s (measure yours)
  → ~4–8 primaries (Cluster), with replicas
  Memory: 5M active keys × ~64B hash ≈ hundreds of MB (+ overhead)
  Network: EVAL request/response tiny vs payment payloads
  App pods: sized for business work, not limiter CPU

Show the interviewer your assumptions. Do not invent magic numbers without measurement.`;

export const PERF_COMPARE: string[][] = [
  ['Store', 'Latency', 'Throughput', 'Consistency', 'Scalability', 'Availability'],
  ['Local memory', 'μs', 'Highest', 'Per JVM only', 'Wrong for global', 'Survives Redis loss'],
  ['Redis Lua', 'sub-ms–few ms', 'Very high', 'Single-key atomic', 'Cluster + hierarchy', 'Needs HA + fail policy'],
  ['PostgreSQL', 'ms–tens ms', 'Poor for hot path', 'Strong row locks', 'Contends on hot rows', 'DB is critical path'],
];

export const RETRY_CODE = `// Client after 429 — NEVER tight-loop
Duration wait = retryAfterOrElse(response, Duration.ofSeconds(1));
for (int attempt = 0; attempt < 5; attempt++) {
  Duration jitter = Duration.ofMillis(ThreadLocalRandom.current().nextLong(0, 250));
  Thread.sleep(wait.plus(jitter));
  response = call();
  if (response.status() != 429) return response;
  wait = wait.multipliedBy(2); // exponential backoff
}
throw new RateLimitedException("exhausted retries");`;

export const RESILIENCE_ORDER = `Correct ordering (interview answer):

  1) Edge rate limit / WAF          — drop junk early
  2) App rate limit (Redis)         — product quotas
  3) Concurrency limit / bulkhead   — protect thread pools
  4) Circuit breaker                — stop calling sick dependency
  5) Retry with backoff             — only for idempotent + transient
  6) Timeout                        — always

Bad ordering example:
  Retry wraps a rate-limited call without respecting 429
  → retry amplification → Redis + DB melt

Rate limit rejects should NOT be retried immediately.
Circuit open should NOT be retried as if it were a blip without backoff.`;

export const KAFKA_RL = `Kafka consumer protecting DB:

  Consumer poll
     ↓
  RateLimiter.allow(partitionKey or tenant)
     ↓
  DB write

If limited: do not busy-spin — pause partition / delay / nack with backoff.
Lag is the backpressure signal; rate limit is the admission valve.

Producer side: throttle send rate per tenant to avoid broker + downstream overload.
Do not confuse consumer pause with losing offsets — pause/resume is intentional.`;

export const CONCURRENCY_VS_RATE = `Rate limit: 100 requests/sec
  → how often you may start work

Concurrency limit: max 20 in flight
  → how many may run at once (slow handlers)

Both matter:
  100 rps of 2s handlers ⇒ need ~200 concurrency mathematically.
  Cap concurrency to protect pools even if rate allows.
  Example: 100 rps + 20 concurrent for expensive /payments/confirm.`;

export const CAP_VIEW = `During a partition between app and Redis:

  - You cannot have perfect shared counters AND uninterrupted admits.
  - Pick by route: fail-closed (C-leaning for money) or fail-open (A-leaning for public reads).
  - CAP is not “pick any two forever” — it is about what you sacrifice when the network splits.
  - Redis Cluster itself chooses primary per slot; split-brain dual primaries for one key is a broken invariant — fail closed and page.

Staff phrasing: “We optimize for availability of the payment API with bounded over-admit risk only where product allows; money paths prefer reject-on-uncertainty.”`;

export const CLOCK_NOTES = `Wall clock vs monotonic:
  - Refill math needs comparable timestamps; Redis TIME is ideal inside Lua.
  - Monotonic clocks (nanoTime) are for latency measurement, not cross-process refill.
  - NTP step backwards: clamp elapsed ≥ 0 so you do not steal tokens.
  - Never trust client device time in ARGV.`;

export const HYBRID = `Request → Local fractional bucket → Redis bucket → Service

Why: cut Redis QPS; absorb micro-bursts.
Risk: local admits that Redis would deny (over-admit); stale local state after deploy.
Use: 1–2% of quota locally, then Redis for the rest; document approximation.
Complexity is real — only add when Redis is the hotspot.`;

export const PAYMENT_FLOW = `POST /payments — Meridian Bank

Rules
  User 20/s · Tenant 1K/s · API 5K/s · Region 20K/s · Global 100K/s

Flow
  Client → CloudFront → WAF → API Gateway (coarse)
        → Payment Service RateLimitFilter
        → Composite AND (global→region→tenant→user→api)
        → Controller → Kafka → Processor → Ledger DB

Protects
  HikariCP, ledger CPU/IOPS, provider TPS, Kafka producer buffers.
  Fail-closed on Redis errors for /payments.
  429 + Retry-After; clients must back off.`;

export const FAIRNESS = `Without fairness, Tenant A at 90% RPS starves Tenant B.

Design
  Per-tenant quotas (hard)
  Plan tiers: Premium 10K/s · Standard 2K/s · Free 100/s
  Reserved capacity for premium (do not sell 100% of cluster)
  Weighted fair admission at gateway for overload shedding
  Alert when one tenant approaches tenant+global simultaneously`;

export const DYNAMIC_CONFIG = `PostgreSQL (source of truth)
   ↓
Config Service / Admin API
   ↓
Kafka rate-limit.policy.changed
   ↓
Pods refresh ConcurrentHashMap (versioned)
   ↓
Next allow() uses new capacity/refill

Validate: capacity > 0, refill > 0, TTL sane, failPolicy set.
Rollback: previous version pointer.
Propagation is eventually consistent across pods — acceptable for quotas.
Shadow mode: count would-reject before enforce.`;

export const THIRTY_SEC =
  'Shared Redis token bucket with Lua so refill+consume is atomic across pods; gateway for floods; app library for JWT identity; hierarchical AND limits; 429+Retry-After; fail-closed on payments, fail-open on public reads; watch hot keys and Redis p99.';

export const ONE_PAGE = `Rate Limiting
  → Algorithms (fixed / sliding log / sliding counter / token / leaky)
  → Choose Token Bucket (burst=capacity, sustained=refill)
  → Redis Cluster + single-key Lua (atomicity)
  → Never GET+SET race
  → Hierarchical: global→tenant→user→api (AND)
  → HTTP 429 + Retry-After + X-RateLimit-*
  → Client: exponential backoff + jitter
  → Fail open / closed / local fallback per route
  → Hot keys: local pre-limit, shard, gateway
  → Multi-region: usually approximate, not perfect global
  → Observability: allowed/rejected/latency/redis_errors/hot_keys
  → Lab: spring-rate-limiter-lab :8098`;
