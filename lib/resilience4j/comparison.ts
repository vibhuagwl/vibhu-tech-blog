export const MODULE_COMPARE = [
  {m: 'CircuitBreaker', solves: 'Repeated fail/slow dep', avoid: 'Sparse traffic w/o min calls'},
  {m: 'Retry', solves: 'Transient blips', avoid: 'Non-idempotent money POST'},
  {m: 'RateLimiter', solves: 'Admit control', avoid: 'Thinking it is cluster-global'},
  {m: 'Bulkhead', solves: 'Isolate pools', avoid: 'Starving healthy traffic'},
  {m: 'ThreadPool BH', solves: 'Dedicated workers + queue', avoid: 'Huge queues / event-loop'},
  {m: 'TimeLimiter', solves: 'Bound async wait', avoid: 'Replacing socket timeouts'},
  {m: 'Cache', solves: 'Repeated reads', avoid: 'Ledger / capture truth'},
  {m: 'Fallback', solves: 'Degrade UX', avoid: 'Fake payment SUCCESS'},
];

export const BENEFITS = [
  {b: 'Circuit breaking', e: 'Fail fast when bank is dead', i: 'Protects thread pools'},
  {b: 'Retry', e: 'Recover from blips', i: 'Higher success if idempotent'},
  {b: 'Bulkhead', e: 'Compartment isolation', i: 'Contains blast radius'},
  {b: 'Rate limiting', e: 'Token bucket admit', i: 'Shields downstream'},
  {b: 'Timeout', e: 'Bound waits', i: 'Predictable SLOs'},
  {b: 'Cache', e: 'Skip duplicate FX reads', i: 'Lower bank QPS'},
  {b: 'Observability', e: 'Micrometer hooks', i: 'Tunable ops'},
  {b: 'Lightweight', e: 'No Hystrix server', i: 'Simple Boot apps'},
  {b: 'Spring integration', e: 'AOP + YAML', i: 'Fast adoption'},
];

export const CHEAT: [string, string][] = [
  ['TIMEOUT', "Don't wait forever"],
  ['RETRY', 'Transient + idempotent'],
  ['CIRCUIT BREAKER', 'Dependency repeatedly failing'],
  ['BULKHEAD', 'Protect resources / isolate'],
  ['THREADPOOL BH', 'Bounded queue + workers'],
  ['RATE LIMITER', 'Control traffic (local!)'],
  ['CACHE', 'Repeated reads, never the ledger'],
  ['FALLBACK', 'Graceful degradation — truthful'],
  ['TIME LIMITER', 'Limit async execution'],
  ['DLQ', 'Failed async message'],
];

export const REMEMBER: [string, string][] = [
  ['TEMPORARY', 'RETRY + backoff + jitter'],
  ['PERSISTENT', 'CIRCUIT BREAKER'],
  ['TRAFFIC', 'RATE LIMITER'],
  ['RESOURCES', 'BULKHEAD'],
  ['WAITING', 'TIME LIMITER'],
  ['REPEATED WORK', 'CACHE'],
  ['CANNOT COMPLETE', 'FALLBACK (PENDING, not fake OK)'],
];

export const DECISION = [
  {q: 'Is the op idempotent?', yes: 'Bounded retry OK', no: 'Idempotency key or no retry'},
  {q: 'Dependency repeatedly failing?', yes: 'Circuit breaker', no: 'Timeouts may suffice'},
  {q: 'One slow friend sinks threads?', yes: 'Bulkhead', no: 'Shared pool OK for now'},
  {q: 'Burst risk / fair tenants?', yes: 'RL (+ GW for global)', no: 'CB/timeout focus'},
  {q: 'Async Future / WebFlux?', yes: 'TimeLimiter', no: 'HTTP client timeouts'},
  {q: 'Same read repeatedly?', yes: 'Cache with TTL', no: 'Do not cache captures'},
  {q: 'Money path fallback?', yes: 'PENDING / fail', no: 'Never invent SUCCESS'},
];

export const SIXTY_SEC =
  'Retry the temporary failure, Break the persistent failure, Limit the traffic, Isolate the resources, Time-box the waiting, Cache repeated work, and Fall back gracefully. For payments: HTTP timeouts first; retry only with idempotency; CB fails fast; fallback returns PENDING — never fake SUCCESS. R4j state is per JVM.';

export const FIVE_MIN =
  'Start from failure taxonomy (network, 5xx, slow, pool exhaustion, cascade). Map each dependency (Visa/SWIFT/ACH, Redis, DB, Kafka) to a named policy. Default AOP onion: Retry(CircuitBreaker(RateLimiter(TimeLimiter(Bulkhead(fn))))). Align connect/read/TimeLimiter budgets. Ignore business/RL/BH exceptions on the CB. Micrometer+corrId. Multi-tenant: tenant RL/BH, shared bank CB. Mesh/GW add edge policies but one owner for retries. Chaos-test OPEN, rejects, duplicate keys, and reconciliation.';

export const MEMORY_SENTENCE =
  'Retry the temporary failure, Break the persistent failure, Limit the traffic, Isolate the resources, Time-box the waiting, Cache repeated work, and Fall back gracefully.';

export const CLOSING =
  'Resilience is not about making failures disappear. It is about controlling the blast radius when failures happen.';

export const CHECKLIST: string[] = [
  'CircuitBreaker configured per bank/dependency',
  'Retry only transient errors',
  'Idempotency implemented for money writes',
  'Retry count bounded + exponential backoff + jitter',
  'RateLimiter configured (and × replica count considered)',
  'Distributed rate limiting considered at the gateway',
  'Bulkhead / ThreadPoolBulkhead sized from RPS × p99',
  'TimeLimiter + HTTP connect/read timeouts aligned',
  'Fallback implemented and does not hide failures',
  'Cache strategy defined (not for captures)',
  'Exception classification reviewed (ignore RL/BH/business on CB)',
  'Resilience aspect order reviewed',
  'Self-invocation avoided',
  'Metrics + Actuator protected',
  'Alerts on OPEN / BH reject / retry exhaust',
  'Logs sanitized (no PAN/JWT/secrets)',
  'Kubernetes local-state behavior tested',
  'Failure scenarios + load/chaos tested',
];
