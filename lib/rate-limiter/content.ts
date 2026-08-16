export const MEMORY_SENTENCE =
  'Story → Token bucket → Redis Lua atomicity → hierarchical AND → 429+Retry-After → fail policy per route → hot keys & multi-region honesty.';

export const ASSUMPTIONS: string[][] = [
  ['Dimension', 'Interview default', 'Why it matters'],
  ['Peak RPS', '100K cluster-wide (10K/server × 10 servers)', 'Sets Redis QPS and Lua budget'],
  ['Users / clients', '50M identities, 5M active/day', 'Key cardinality + TTL'],
  ['App servers', '10 → 200 behind an API gateway', 'Why in-memory maps fail'],
  ['Rate-limit rules', '~5K policies, ~10 matching per request', 'Config cache, multi-level AND'],
  ['Latency SLO', 'p99 rate-limit check < 5–10 ms', 'Co-located Redis, pipelining, no chatty MULTI'],
  ['Consistency', 'Approximately global: Redis single-key atomic', 'Not linearizable across regions'],
  ['Availability', '99.95% API; limiter must not be a worse SPOF than Redis HA', 'Fail policy per endpoint'],
  ['Windows', 'sec / min / hour / day', 'TTL ≥ 2× window so idle buckets vanish'],
  ['Burst', 'capacity = sustained + burst (e.g. 100/min + 20)', 'Token bucket capacity'],
];

export const ALGORITHM_ROWS: string[][] = [
  ['Algorithm', 'How it works', 'Memory', 'Accuracy', 'Burst', 'Distributed complexity'],
  [
    'Fixed Window Counter',
    'INCR a counter keyed by floor(now / window). Reset when the window id changes.',
    'O(1) per key',
    'Poor at boundaries: 2× limit across two windows',
    'Accidental double-burst at edges',
    'Easy: INCR + EXPIRE',
  ],
  [
    'Sliding Window Log',
    'Store every request timestamp; drop entries older than the window; reject if count ≥ limit.',
    'O(requests in window) — worst',
    'Exact',
    'True sliding; no extra burst beyond limit',
    'Hard: ZADD/ZREMRANGEBYSCORE/ZCARD must be atomic (Lua)',
  ],
  [
    'Sliding Window Counter',
    'Weight current window count + previous window × overlap fraction.',
    'O(1) (two counters)',
    'Good approximation',
    'Smoother than fixed; still not a true leak',
    'Medium: two keys or a hash, Lua recommended',
  ],
  [
    'Token Bucket',
    'Bucket holds up to capacity tokens; refillRate tokens per period; request costs 1 token.',
    'O(1): tokens + timestamp',
    'Exact vs the bucket model',
    'First-class: capacity is the burst ceiling',
    'Medium: refill+consume must be one Lua/eval',
  ],
  [
    'Leaky Bucket',
    'Queue leaks at constant rate; overflow rejects. Smooths to a hard ceiling.',
    'O(1) or O(queue) if you model a real queue',
    'Exact vs leak model',
    'Poor — bursts are queued or dropped',
    'Medium: similar Lua; queue depth is extra state',
  ],
];

export const ALGORITHM_PROS: {name: string; how: string; pros: string; cons: string}[] = [
  {
    name: 'Fixed Window Counter',
    how: 'Count requests in [T, T+W). Cheap INCR. At T+W the counter is a new key (or EXPIRE).',
    pros: 'Trivial, tiny memory, easy Redis Cluster (one key). Good as a coarse gateway shield.',
    cons: 'At the window boundary a client can send limit just before reset and limit just after — up to 2×. No native burst vs sustained split.',
  },
  {
    name: 'Sliding Window Log',
    how: 'Redis sorted set of timestamps. Remove scores < now-W, add now, count. Reject if count > limit.',
    pros: 'Most accurate “N per rolling W”. Fair for billing-grade quotas.',
    cons: 'Memory and CPU grow with RPS per key. Hot users with 10K/hour logs are expensive. Rarely the default at 1M RPS.',
  },
  {
    name: 'Sliding Window Counter',
    how: 'Blend previous and current fixed windows by how far we are into the current window.',
    pros: 'Almost-sliding accuracy at O(1) memory. Common Cloudflare/API-GW pattern.',
    cons: 'Still an estimate. Burst math is less intuitive than a bucket. Two counters to keep atomic.',
  },
  {
    name: 'Token Bucket (chosen)',
    how: 'tokens = min(capacity, tokens + elapsed × rate). If tokens ≥ cost, subtract; else Retry-After = deficit / rate.',
    pros: 'Burst + sustained in one model. Remaining quota and retry-after fall out of the math. O(1) memory. Industry default (Stripe, AWS, Envoy).',
    cons: 'Needs atomic refill+consume. Clock skew on client-supplied now. Idle keys need TTL.',
  },
  {
    name: 'Leaky Bucket',
    how: 'Work arrives into a bucket that drains at constant rate. Overflow = reject (or 429).',
    pros: 'Smooth egress to downstreams (protect Kafka/DB). Easy to reason about “never exceed R”.',
    cons: 'Punishes legitimate bursts. If you queue instead of reject, you add latency. Often used as a shaper behind an admitter.',
  },
];

export const ASCII_HLD = `Client
  |
  v
Load Balancer / API Gateway     <— coarse IP / WAF / global RPS
  |
  v
App servers (embedded library)  <— identity-aware limits
  |          |
  |          +------> Redis Cluster (token buckets, Lua)
  |
  v
Application Services
  |
  +------> Database
  +------> Kafka`;

export const ASCII_WHERE = `Two layers, not one:

  Edge / Gateway
    - Unauthenticated flood (IP, TLS fingerprint)
    - Cheap fixed-window or GW-native limiter
    - Protects origin from junk

  Application library (this design)
    - userId / clientId / tenantId from JWT
    - Per-API and multi-level policies
    - Remaining quota + Retry-After on the business response

Centralized sidecar/service:
  + one place to patch
  − extra hop (kills <5ms SLO unless local)
  − new SPOF

Embedded library + Redis:
  + p99 in the same AZ as Redis
  + scales with the app
  − every service must take the dependency (platform library)`;

export const ASCII_CLASS = `                    <<interface>>
                    RateLimiter
                    + allow(RequestContext): RateLimitResult
                           ^
                           |
          +----------------+------------------+
          |                                   |
 TokenBucketRateLimiter              CompositeRateLimiter
          |                                   |
          | uses                              | uses
          v                                   v
   <<interface>>                    RateLimiterFactory
   RateLimitStore                   RateLimitConfigProvider
          ^                                   ^
     +----+----+                              |
     |         |                    InMemoryRateLimitConfigProvider
InMemory     Redis
Store        RateLimitStore
             (Lua EVAL)`;

export const ASCII_SEQ = `Client          Gateway         Filter/Limiter      Redis Cluster      Config
  |                |                  |                    |              |
  |  POST /payments|                  |                    |              |
  |--------------->|                  |                    |              |
  |                |  JWT + headers   |                    |              |
  |                |----------------->|                    |              |
  |                |                  | policiesFor(ctx)   |              |
  |                |                  |---------------------------------->|
  |                |                  |  [global, tenant, client, user, api]
  |                |                  | EVAL Lua key=tenant/client/api     |
  |                |                  |------------------->|              |
  |                |                  |  {allowed, remaining, retry}      |
  |                |                  |<-------------------|              |
  |                |                  |  (repeat per matching policy;     |
  |                |                  |   fail-fast on first reject)      |
  |                |  200 + X-RateLimit-*   OR  429 + Retry-After         |
  |<---------------|<-----------------|                    |              |`;

export const ASCII_MULTI = `Request
  |
  +--> Global   1M / hour
  |
  +--> Tenant   100K / hour
  |
  +--> Client   10K / hour
  |
  +--> User     100 / minute
  |
  +--> API      20 / second
  |
  v
ALLOW only if ALL matching policies grant a token
REJECT with the first failing policy (tightest remaining on allow)`;

export const ASCII_CONFIG = `Admin
  |
  v
Rate Limit Config Service  (lab: /api/rate-limits)
  |
  +--> Database (source of truth in prod)
  |
  +--> Kafka / event bus  topic=rate-limit.policy.changed
           |
           v
    Application Servers  (in-memory ConcurrentHashMap of policies)
           |
           v
    Next allow() uses new capacity/refill — no restart
    Existing Redis buckets refill toward the new capacity`;

export const LUA_LINES: {line: string; why: string}[] = [
  {line: 'HMGET key tokens ts', why: 'Read previous bucket. Missing fields ⇒ treat as full bucket at now.'},
  {line: 'elapsed = now - ts (clamp ≥ 0)', why: 'Clock skew / NTP step: never subtract tokens because time went backwards.'},
  {line: 'tokens = min(capacity, tokens + elapsed/period * rate)', why: 'Continuous refill. Burst ceiling is capacity.'},
  {line: 'if tokens ≥ cost then tokens -= cost else retry_after = deficit/rate', why: 'Admit or compute wait. Remaining is floor(tokens).'},
  {line: 'HSET tokens, ts; PEXPIRE ttl', why: 'Persist + idle GC. TTL ≥ 2× window so a slow client does not lose leftover tokens instantly.'},
  {line: 'single KEYS[1]', why: 'Redis Cluster: one hash slot. Hash-tag {tenant} if you later need multi-key scripts.'},
];

export const SCENARIOS: {title: string; what: string}[] = [
  {
    title: 'Scenario 1 — 10 servers, same user, simultaneous',
    what: 'Every server EVAL the same Redis key. Lua is single-threaded per shard: only capacity tokens succeed. Remaining is shared. An in-memory map would have granted 10× capacity.',
  },
  {
    title: 'Scenario 2 — Redis primary fails',
    what: 'Replica is promoted (Sentinel/Cluster). In-flight EVAL may error. Payment APIs FAIL_CLOSED → 429/503 with Retry-After. Public reads FAIL_OPEN for a short window. LOCAL_FALLBACK keeps a per-pod approximation for internal workers.',
  },
  {
    title: 'Scenario 3 — Redis becomes slow',
    what: 'Time the EVAL. Circuit-break when p99 > SLO (e.g. 20ms) or timeouts fire. Same fail policy as an outage. Do not pile threads on Redis — that turns a slowdown into an app outage.',
  },
  {
    title: 'Scenario 4 — One client 100K RPS',
    what: 'Hot key on one hash slot. Gateway IP/client pre-limit sheds junk. Hierarchical limits: local token bucket (1–2% of quota) then Redis. Optionally shard a mega-tenant into N sub-keys and sum (approximate). Alert hot_keys.',
  },
  {
    title: 'Scenario 5 — Tenant with 1,000 clients',
    what: 'Tenant bucket is one key (the hot one). Each client has its own key (cardinality 1,000). Tenant check runs first so one abusive client cannot silently eat the tenant quota without a tenant reject. Isolation is by key prefix {tenant}.',
  },
  {
    title: 'Scenario 6 — Config changes under traffic',
    what: 'Admin PUT upserts the policy map (lab) or publishes Kafka. Factory evicts the flyweight limiter. Next allow() uses new capacity/refill. Redis state is not wiped: tokens refill toward the new ceiling. Tests advance the clock to prove refill respects the new rate.',
  },
  {
    title: 'Scenario 7 — Two Redis nodes, same key',
    what: 'Cluster: the key hashes to one slot, owned by one primary. Both app servers talk to that primary (redirected by MOVED). Two primaries holding the same key means a split-brain — you lost the cluster invariant; fail closed and page. Never hash-tag incorrectly across slots for one logical quota.',
  },
];

export const TRADEOFFS: string[][] = [
  ['Choice', 'We pick', 'Cost'],
  ['Algorithm', 'Token bucket', 'Need Lua; leaky is better if you must shape egress'],
  ['State', 'Redis Cluster', 'Network hop; HA complexity vs local map'],
  ['Placement', 'Library + gateway', 'Two policies to keep in sync'],
  ['Multi-level', 'Sequential fail-fast AND', 'Not one MULTI across slots; outer reject may skip inner spend'],
  ['Consistency', 'Single-key atomic, regional', 'Global exactly-once quota across continents is a different product'],
  ['Failure', 'Per-route fail policy', 'Fail-open can be abused; fail-closed can outage payments'],
  ['Accuracy vs cost', 'O(1) bucket, not request log', 'Not a perfect sliding log'],
  ['Clock', 'Server now in ARGV (or Redis TIME)', 'App clocks still need NTP; we clamp negative elapsed'],
];

export const FIVE_MIN = `Requirements: per user/client/API/IP/tenant/service limits, multiple windows, burst, dynamic config, Allow/Reject/Retry-After/remaining, multi-tenant, abuse blocks. Assumptions: 100K RPS, tens of millions of identities, ~10 app servers growing to hundreds, p99 check under 10ms, approximately global consistency via Redis, 99.95% API with an explicit fail policy.

Algorithm: I compare fixed window (boundary 2× burst), sliding log (exact, expensive), sliding counter (good cheap approx), leaky bucket (smooth, anti-burst), token bucket (burst + sustained, O(1)). I choose token bucket.

Architecture: gateway does coarse unauth/IP protection. The app embeds a RateLimiter library so identity comes from JWT. All pods share Redis Cluster. Config is a map updated via admin API + (in prod) Kafka — no restart.

Redis: key rate_limit:{tenant}:CLIENT_API:client:/payments. Lua HMGET, refill, consume, HSET, PEXPIRE in one EVAL so two servers cannot spend the same token.

Concurrency: Redis single-threads the script per shard. In-memory lab uses ConcurrentHashMap.compute.

Failure: payments fail-closed, public GET fail-open, internal workers local-fallback. Slow Redis is treated like down (timeout + circuit).

Scaling: 10K RPS is one Redis primary; 100K is a cluster plus gateway pre-limit; 1M needs local admission, hierarchical keys, hot-key sharding, maybe multiple clusters by region/tenant range.

Trade-off I say out loud: we are not linearizable across regions, and multi-level checks are sequential ANDs, not one cross-slot transaction.`;

export const FOLLOWUPS: {q: string; a: string}[] = [
  {
    q: 'Why Redis instead of an in-memory ConcurrentHashMap?',
    a: 'A map is per JVM. Ten servers with limit 100 become 1,000. Redis is the shared counter. Use a map only as LOCAL_FALLBACK or as a tiny local pre-limiter in front of Redis.',
  },
  {
    q: 'Why token bucket instead of fixed window?',
    a: 'Fixed window allows up to 2× at the boundary and has no first-class burst vs sustained. Token bucket capacity is burst; refillRate is sustained; Retry-After is deficit/rate.',
  },
  {
    q: 'How do you make Redis operations atomic?',
    a: 'One Lua EVAL on a single key: read tokens+ts, refill, maybe consume, write, PEXPIRE. Alternatives: Redis 7 functions, or a Lua-less GET+WATCH+MULTI (more round trips, more retries). Never GET then SET from Java.',
  },
  {
    q: 'How do you handle a Redis outage?',
    a: 'Declare a fail policy per route. Public catalog: fail-open + alert. /payments: fail-closed. Internal batch: local token bucket so a Redis blip does not stall the mesh. Timeouts must be tight (a few ms) or the app thread pool dies.',
  },
  {
    q: 'How do you prevent a hot Redis key?',
    a: 'Detect via commandstats / hot_keys. Mitigate with gateway pre-limit, local fractional buckets, hierarchical tenant/client keys, or split a celebrity key into N shards with an approximate sum. Move the slot; do not put two logical hot tenants on one tiny cluster.',
  },
  {
    q: 'How do you implement per-user and per-API limits?',
    a: 'Two policies, two keys. CompositeRateLimiter ANDs them. User key uses userId from JWT; API key uses normalized path. A request needs both tokens. Fail-fast on the first reject.',
  },
  {
    q: 'What would you change at 10K vs 1M RPS?',
    a: '10K: one Redis, library, Lua, metrics. 1M: regional clusters, local admission, pipeline/batch where safe, shorter TTLs, maybe sliding-counter for the coarsest global key, isolate payment Redis from public-read Redis.',
  },
  {
    q: 'Does clock skew break the limiter?',
    a: 'If each app sends its own now, a fast clock refills faster. Prefer Redis TIME inside Lua, or NTP + clamp negative elapsed (lab). Do not use client-device clocks.',
  },
  {
    q: 'Should multi-level checks be one Redis transaction?',
    a: 'Ideally atomic AND, but Cluster CROSSSLOT blocks multi-key Lua unless you hash-tag every level onto one slot — that creates a hotter partition. Production: sequential single-key EVALs, fail-fast, accept rare extra inner-token spend on races.',
  },
  {
    q: 'HTTP status on reject?',
    a: '429 Too Many Requests with Retry-After and X-RateLimit-Limit/Remaining/Reset. 503 if the limiter itself is down and the route is fail-closed. Do not 401 — that confuses auth with quota.',
  },
];

export const CHECKLIST = [
  'Identity from auth (JWT/API key), not spoofable IP alone',
  'Token bucket Lua (or equivalent) — no GET/SET race',
  'TTL on keys; hash-tags documented for Cluster',
  'Multi-level AND with explicit order',
  'Fail policy per route (payments closed, public open)',
  'Timeouts + circuit on Redis',
  'Dynamic config without restart',
  '429 + Retry-After + X-RateLimit-*',
  'Metrics: allowed/rejected/latency/redis errors/hot keys',
  'Concurrency test: allowed ≤ capacity',
  'Hot-key and celebrity-tenant plan',
  'Admin API authorized (RATE_LIMIT_ADMIN)',
];

export const CHEAT: [string, string][] = [
  ['Primary algorithm', 'Token bucket'],
  ['Shared state', 'Redis Cluster + Lua'],
  ['Local map', 'Fallback / pre-limit only'],
  ['Key', 'rate_limit:{tenant}:scope:id'],
  ['Burst', 'capacity'],
  ['Sustained', 'refillRate / period'],
  ['Reject', 'HTTP 429'],
  ['Payments outage', 'FAIL_CLOSED'],
  ['Public GET outage', 'FAIL_OPEN'],
  ['Multi-level', 'AND, fail-fast'],
  ['Atomicity', 'EVAL one key'],
  ['Lab port', '8098'],
];

export const REST_EXAMPLE = `POST /api/rate-limits
{
  "id": "payments-client-minute",
  "scope": "CLIENT_API",
  "clientId": "client-123",
  "api": "/api/payments",
  "capacity": 120,
  "refillRate": 100,
  "refillPeriod": "MINUTE",
  "failPolicy": "FAIL_CLOSED"
}

Allow:
  200
  X-RateLimit-Limit: 120
  X-RateLimit-Remaining: 87
  X-RateLimit-Reset: 1760000000

Reject:
  429 Too Many Requests
  Retry-After: 3
  X-RateLimit-Limit: 120
  X-RateLimit-Remaining: 0
  X-RateLimit-Reset: 1760000003`;

export const JAVA_SNIPPET = `public interface RateLimiter {
  RateLimitResult allow(RequestContext request);
}

public record RequestContext(
    String userId, String clientId, String tenantId,
    String ipAddress, String apiPath, String httpMethod,
    String serviceName) {}

public record RateLimitPolicy(
    String id, RateLimitScope scope, RateLimitAlgorithm algorithm,
    long capacity, long refillRate, RefillPeriod refillPeriod,
    Duration timeWindow, FailPolicy failPolicy, ...) {}

public record RateLimitResult(
    boolean allowed, long remainingTokens,
    Duration retryAfter, long limit, ...) {}

// Patterns
// Strategy  — RateLimiter / TokenBucketRateLimiter
// Factory   — RateLimiterFactory.limiterFor(policy)
// Store     — RateLimitStore / RedisRateLimitStore / InMemoryRateLimitStore
// Config    — RateLimitConfigProvider (swap DB+Kafka in prod)
// DI        — RateLimitBeans wires Clock, stores, CompositeRateLimiter`;

export const OBS_ALERTS: string[][] = [
  ['Signal', 'Dashboard', 'Alert'],
  ['rate_limit_rejected_total spike', 'Reject ratio by policy/tenant', 'Page if payments reject > 5% for 5m without deploy'],
  ['rate_limit_latency / redis_latency', 'p50/p99 EVAL time', 'Page if p99 > 10ms (SLO) or timeouts'],
  ['redis_errors', 'Errors by type', 'Page on fail-closed storm'],
  ['hot_keys', 'Top keys by QPS', 'Ticket celebrity tenant; consider sharding'],
  ['unconfigured_total', 'Requests with zero policies', 'Config bug — fail open accidentally unlimited'],
  ['degraded=true allows', 'Fail-open volume', 'Security: abuse during Redis incident'],
];

export const SCALE_ROWS: string[][] = [
  ['RPS', 'What changes'],
  ['10K', 'One Redis primary + replica, embedded library, Lua, gateway IP limit. p99 easily <5ms in-AZ.'],
  ['100K', 'Redis Cluster, connection pooling, pipeline health checks, hierarchical keys, local 1–2% pre-limit, HPA on gateway.'],
  ['1M', 'Regional clusters (approximate global), isolate payment Redis, shard hot tenants, maybe sliding-counter for the coarsest global key, edge enforcement, dedicated limiter fleet only if the library hop is still too hot.'],
];
