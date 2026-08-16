import type {ConceptRow} from './types';

export const PROBLEM_STORY = `Meridian Bank exposes POST /payments. On a normal Tuesday the payment API sees ~1,000 RPS. At 14:03 a mobile release ships a retry bug, a partner starts a reconciliation scan, and a credential-stuffing botnet joins in. Observed ingress hits ~50,000 RPS.

Without a rate limiter the blast radius is not "slow payments" — it is a cascade:

  Client → API Gateway → Payment Service → PostgreSQL → External card/UPI provider
                              │
                              ├─ Tomcat/Netty thread pool saturates
                              ├─ HikariCP pool waits → timeouts
                              ├─ CPU 100%, GC thrash, then OOM killers
                              ├─ Kafka producer buffer fills → client blocks
                              ├─ Provider returns 429/503 → more client retries
                              └─ Neighboring services (ledger, notify) starve

A rate limiter is the controlled admission door:

  Client → (edge WAF / gateway) → Rate Limiter → Payment Service

It does not make the system infinitely scalable. It buys fairness, predictability, and time for autoscaling — and it stops one bad actor (or bug) from taking the bank offline.`;

export const DEFINITION =
  'Rate limiting controls how many requests a client, user, API, tenant, or system can make within a defined capacity so that the system remains available, fair, and protected from overload.';

export const RATE_FORMULA = `Rate Limit = Requests allowed / Time window

Examples
  100 requests / second          (API)
  1,000 requests / minute        (user)
  10 login attempts / minute     (auth)
  100 API calls / tenant / sec   (SaaS)
  20,000 req/sec global          (payment cluster)`;

export const CONCEPT_ROWS: ConceptRow[] = [
  {
    name: 'Rate limiting',
    definition: 'Cap how many requests are admitted per identity per time.',
    controls: 'Request rate (tokens / window)',
    typicalResponse: 'HTTP 429 + Retry-After',
  },
  {
    name: 'Throttling',
    definition: 'Slow or shape traffic rather than hard-reject (sometimes used interchangeably).',
    controls: 'Delay / queue / reduced priority',
    typicalResponse: 'Delayed processing or 429',
  },
  {
    name: 'Backpressure',
    definition: 'Downstream signals it cannot accept more work; upstream must slow produce.',
    controls: 'Queue depth, consumer lag, TCP window',
    typicalResponse: 'Block/slow producer, pause Kafka consumer',
  },
  {
    name: 'Load shedding',
    definition: 'Drop low-priority work under overload to keep critical paths alive.',
    controls: 'Priority classes, shed %',
    typicalResponse: '503 / drop non-critical',
  },
  {
    name: 'Concurrency limiting',
    definition: 'Cap in-flight work (semaphores), not rate over time.',
    controls: 'Max parallel requests',
    typicalResponse: 'Queue or 429/503 when full',
  },
  {
    name: 'Circuit breaker',
    definition: 'Stop calling a failing dependency after error threshold.',
    controls: 'Error rate / slow calls',
    typicalResponse: 'Fast-fail without calling downstream',
  },
  {
    name: 'Quota',
    definition: 'Product/contract entitlement (plan limits), often longer windows.',
    controls: 'Plan capacity (day/month)',
    typicalResponse: '429 + upgrade UX',
  },
];

export const FUNCTIONAL_LIMITS = `Multiple limits can apply to one request — ALL must allow:

  User limit       = 100/sec
  Tenant limit     = 1,000/sec
  API limit        = 5,000/sec
  Global limit     = 20,000/sec

Identity dimensions (often combined):
  user · IP · API key · tenant · endpoint · region · service · global

Example payment stack:
  User       = 20 req/sec
  Tenant     = 1,000 req/sec
  API        = 5,000 req/sec
  Region     = 20,000 req/sec
  Global     = 100,000 req/sec`;

export const NFR_BLOCKS: {title: string; body: string}[] = [
  {
    title: 'Performance',
    body: 'Admission check should add << business latency. Target p99 < 5–10 ms; with co-located Redis often sub-millisecond for EVAL. Never turn the limiter into a chatty MULTI round-trip.',
  },
  {
    title: 'Availability',
    body: 'The limiter must not be a worse SPOF than Redis HA. Declare fail-open / fail-closed / local-fallback per route. Tight Redis timeouts + circuit breaker.',
  },
  {
    title: 'Scalability',
    body: 'Design for 100K → 1M RPS with Redis Cluster, hierarchical keys, local pre-admission, regional clusters. Horizontal scale of app pods must not multiply the quota.',
  },
  {
    title: 'Consistency',
    body: 'Single-key Redis Lua is linearizable on one primary. Cross-region exact global caps are expensive. Prefer high availability + bounded approximation over perfect global precision.',
  },
  {
    title: 'Fault tolerance',
    body: 'Redis down, slow Redis, network partition, region loss — each needs an explicit policy. Slow Redis without timeouts exhausts app threads and causes cascade.',
  },
];

export const WHY_WITHOUT = [
  'CPU exhaustion on payment pods',
  'Thread pool / event-loop starvation',
  'DB connection pool exhaustion + lock contention',
  'Kafka producer blocking / consumer lag explosion',
  'Downstream provider throttling → retry amplification',
  'Latency spike → client timeouts → more retries',
  'Cascading failure across ledger/notify',
  'OOM / pod restarts / autoscaler thrash',
];
