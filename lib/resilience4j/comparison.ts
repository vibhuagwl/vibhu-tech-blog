export const MODULE_COMPARE = [
  {m: 'CircuitBreaker', solves: 'Repeated fail/slow dep', avoid: 'Sparse traffic w/o min calls'},
  {m: 'Retry', solves: 'Transient blips', avoid: 'Non-idempotent money POST'},
  {m: 'RateLimiter', solves: 'Admit control', avoid: 'Thinking it is cluster-global'},
  {m: 'Bulkhead', solves: 'Isolate pools', avoid: 'Starving healthy traffic'},
  {m: 'TimeLimiter', solves: 'Bound async wait', avoid: 'Replacing socket timeouts'},
  {m: 'Fallback', solves: 'Degrade UX', avoid: 'Fake payment SUCCESS'},
];

export const BENEFITS = [
  {b: 'Circuit breaking', e: 'Fail fast when bank is dead', i: 'Protects thread pools'},
  {b: 'Retry', e: 'Recover from blips', i: 'Higher success if idempotent'},
  {b: 'Bulkhead', e: 'Compartment isolation', i: 'Contains blast radius'},
  {b: 'Rate limiting', e: 'Token bucket admit', i: 'Shields downstream'},
  {b: 'Timeout', e: 'Bound waits', i: 'Predictable SLOs'},
  {b: 'Observability', e: 'Micrometer hooks', i: 'Tunable ops'},
  {b: 'Lightweight', e: 'No Hystrix server', i: 'Simple Boot apps'},
  {b: 'Spring integration', e: 'AOP + YAML', i: 'Fast adoption'},
];

export const CHEAT: [string, string][] = [
  ['TIMEOUT', "Don't wait forever"],
  ['RETRY', 'Transient + idempotent'],
  ['CIRCUIT BREAKER', 'Dependency repeatedly failing'],
  ['BULKHEAD', 'Protect resources / isolate'],
  ['RATE LIMITER', 'Control traffic (local!)'],
  ['FALLBACK', 'Graceful degradation — truthful'],
  ['TIME LIMITER', 'Limit async execution'],
  ['DLQ', 'Failed async message'],
];

export const REMEMBER: [string, string][] = [
  ['SLOW', 'TIMEOUT / TimeLimiter'],
  ['TEMPORARY', 'RETRY + backoff + jitter'],
  ['DEAD', 'CIRCUIT BREAKER'],
  ['BUSY', 'BULKHEAD'],
  ['TOO MANY', 'RATE LIMITER'],
  ['NO ANSWER', 'FALLBACK (not fake OK)'],
  ['ASYNC', 'TIME LIMITER'],
  ['MESSAGE', 'RETRY TOPIC + DLQ'],
];

export const DECISION = [
  {q: 'Is the op idempotent?', yes: 'Bounded retry OK', no: 'Idempotency key or no retry'},
  {q: 'Dependency repeatedly failing?', yes: 'Circuit breaker', no: 'Timeouts may suffice'},
  {q: 'One slow friend sinks threads?', yes: 'Bulkhead', no: 'Shared pool OK for now'},
  {q: 'Burst risk / fair tenants?', yes: 'RL (+ GW for global)', no: 'CB/timeout focus'},
  {q: 'Async Future / WebFlux?', yes: 'TimeLimiter', no: 'HTTP client timeouts'},
  {q: 'Money path fallback?', yes: 'PENDING / fail', no: 'Never invent SUCCESS'},
];

export const SIXTY_SEC =
  'Resilience4j gives CircuitBreaker, Retry, RateLimiter, Bulkhead, TimeLimiter for Spring Boot. For payments: HTTP timeouts first; retry only with idempotency; CB fails fast when the bank is down; bulkhead isolates; rate limit admits; fallback returns PENDING — never fake SUCCESS. Remember R4j state is per JVM.';

export const FIVE_MIN =
  'Start from failure taxonomy (network, 5xx, slow, pool exhaustion, cascade). Map each dependency (bank HTTP, Redis, DB, Kafka) to a named policy. Compose RateLimiter→Bulkhead→CB→optional Retry with a latency budget. Align connect/read/TimeLimiter/client timeouts. Use Micrometer+corrId. Multi-tenant: tenant RL/BH for fairness, shared CB for bank health. Mesh/GW add edge policies but one owner for retries. Chaos-test OPEN, rejects, and reconciliation.';
