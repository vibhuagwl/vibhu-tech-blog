import type {R4jTopic} from './types';

export const TOPICS_C: R4jTopic[] = [
  {
    id: 'kafka',
    title: 'Kafka · Redis · Database',
    badge: 'Deps',
    problem: 'Same library, different semantics for messaging vs cache vs SQL.',
    whenToUse: 'HTTP-style sync deps with CB/RL; Kafka prefers non-blocking retry/DLQ.',
    whenAvoid: 'Blocking Resilience4j Retry inside Kafka poll loop as your only strategy.',
    mermaid: `flowchart TB
  K[Kafka] --> C[Consumer]
  C --> F[Fail]
  F --> RT[Retry topic]
  RT --> DLQ[DLQ]
  DLQ --> REP[Replay]
  APP --> REDIS[(Redis)]
  APP --> DB[(Postgres)]`,
    code: `Kafka:
  poison msg → retry topic → DLQ → replay
  R4j Retry ≠ Kafka retry topics (offset/commit semantics differ)
  Use CB around sync side-effects inside consumer carefully

Redis:
  timeout → CB + fall back to DB / stale cache
  stampede: singleflight / lock — not only Retry
  cluster fail: degrade reads, queue writes

Database:
  pool exhaustion → BH + fail fast (don't Retry forever)
  slow query → timeouts at JDBC + CB slowCall
  NEVER blind-retry uncertain writes without idempotent upsert

@CircuitBreaker(name="redis")
public Profile getProfile(String id) { return redis.get(id); }`,
    failure: 'Retrying INSERT payment on socket timeout → duplicates.',
    production: 'Separate CB instances: redis, postgres, bankHttp, kafkaProduce.',
    interview30s: 'Kafka needs DLQ/retry topics; R4j shines on sync HTTP/Redis; DB writes need idempotency.',
    followUp: 'Blocking vs non-blocking Kafka retries?',
    tradeoff: 'Uniform toolkit vs domain-correct semantics.',
    memoryTrick: 'Messages→DLQ · Cache→stale OK · SQL write→idempotent.',
  },
  {
    id: 'clients',
    title: 'RestClient · WebClient · OpenFeign',
    badge: 'HTTP',
    problem: 'Wire timeouts + R4j around the actual client you use.',
    whenToUse: 'All outbound payment HTTP — set client timeouts first.',
    whenAvoid: 'Only R4j TimeLimiter with infinite HTTP read timeout.',
    mermaid: `flowchart LR
  SVC[Order] --> RC[RestClient]
  SVC --> WC[WebClient]
  SVC --> FEIGN[OpenFeign]
  RC --> R4J[CB Retry BH]
  WC --> R4J
  FEIGN --> R4J`,
    code: `// RestClient (Boot 3.2+)
RestClient.builder()
  .requestFactory(factoryWithTimeouts(200, 1500))
  .baseUrl(paymentUrl)
  .build();

// WebClient
HttpClient.create()
  .responseTimeout(Duration.ofMillis(1500));

// OpenFeign + resilience4j-feign or Spring Cloud CircuitBreaker

@Bean
CircuitBreaker paymentCb(CircuitBreakerRegistry r) {
  return r.circuitBreaker("payment");
}

// Decorate Feign/RestClient calls with registry or annotations on facade`,
    failure: 'Feign default timeouts too high → thread pile-up before CB trips.',
    production: 'One facade bean per dependency; chaos via WireMock.',
    interview30s: 'Client timeouts are mandatory; R4j decorates the facade, not a substitute.',
    followUp: 'Spring Cloud Circuit Breaker abstraction?',
    tradeoff: 'Portable abstraction vs R4j-specific features.',
    memoryTrick: 'Socket timeouts first, patterns second.',
  },
  {
    id: 'observe',
    title: 'Observability · Correlation',
    badge: 'Ops',
    problem: 'CB opened — which corrId and tenant caused the window?',
    whenToUse: 'Always — untuned resilience is invisible debt.',
    whenAvoid: 'Metrics without dashboards/alerts on state change.',
    mermaid: `flowchart TB
  REQ[Request + corrId] --> A[Order]
  A --> B[Payment]
  A --> M[Micrometer]
  M --> P[Prometheus]
  P --> G[Grafana]
  M --> CB[state failureRate retries bulkhead]`,
    code: `// Actuator: /actuator/circuitbreakers, /actuator/prometheus
management.endpoints.web.exposure.include: health,info,prometheus,circuitbreakers,ratelimiters

Metrics:
  resilience4j_circuitbreaker_state
  resilience4j_circuitbreaker_failure_rate
  resilience4j_retry_calls
  resilience4j_bulkhead_available_concurrent_calls
  resilience4j_ratelimiter_available_permissions
  resilience4j_timelimiter_calls

MDC: corrId → log every retry/fallback/state transition
tracing: span events for CB OPEN

Alert: CB OPEN > 1m, BH reject rate, retry exhaust`,
    failure: 'Silent OPEN for payments overnight.',
    production: 'Dashboard per dependency; runbook links from alerts.',
    interview30s: 'Micrometer + Actuator expose CB/retry/BH/RL; correlate with MDC corrId.',
    followUp: 'Which metric detects retry storm?',
    tradeoff: 'Cardinality of tenant tags vs cost.',
    memoryTrick: 'If you cannot graph it, you cannot tune it.',
  },
  {
    id: 'tenant',
    title: 'Multi-Tenant Resilience',
    badge: 'SaaS',
    problem: 'Tenant A 10k rps starves Tenant B/C.',
    whenToUse: 'Shared platforms with noisy neighbors.',
    whenAvoid: 'One global CB/RL for all tenants.',
    mermaid: `flowchart TB
  GW[API GW] --> TRL[Tenant RateLimiter]
  TRL --> TBH[Tenant Bulkhead]
  TBH --> CB[Dep CircuitBreaker]
  CB --> PAY[Payment]`,
    code: `// Per-tenant RateLimiter / Bulkhead via Registry
RateLimiter rl = rateLimiterRegistry.rateLimiter("pay-" + tenantId, config);

// Shared dependency CB still global for bank gateway health
// Tenant RL protects fairness; CB protects bank

// Metrics tagged: tenant_id (bounded cardinality!)
// Extreme tenants: dedicated pool / shard`,
    failure: 'Unbounded tenant metric labels → Prometheus card explosion.',
    production: 'GW quotas + in-app tenant BH; shared CB for true dependency death.',
    interview30s: 'Fairness = tenant RL/BH; dependency health = shared CB.',
    followUp: 'Directory of limiters in Redis?',
    tradeoff: 'Isolation vs registry memory.',
    memoryTrick: 'Noisy neighbor → tenant tickets; dead bank → shared fuse.',
  },
  {
    id: 'drawbacks',
    title: 'Drawbacks & 20 Mistakes',
    badge: 'Honest',
    problem: 'Resilience4j can amplify harm when misconfigured.',
    whenToUse: 'Review checklist before prod promote.',
    whenAvoid: 'Assuming library defaults are bank-safe.',
    mermaid: `flowchart TD
  P[Problem] --> W[Why]
  W --> I[Impact]
  I --> F[Fix]`,
    code: `Drawbacks:
  config complexity · retry amplification · JVM-local state
  CB hides outages · fallback lies · timeout interactions
  testing hard · thread/memory overhead · reactive differences

Mistakes (sample):
1 Retry all exceptions  2 POST pay without idempotency
3 Infinite retries  4 No timeout  5 Inner timeout > outer
6 CB threshold too low/high  7 No minimumNumberOfCalls
8 Fake SUCCESS fallback  9 No bulkhead  10 Global RL for tenants
11 Local RL as distributed  12 Ignore metrics
13 Nested service retries  14 Kafka wrong retry model
15 Retry on pool exhaustion  16 One config all deps
17 Annotate every method  18 No failure tests
19 Self-invocation bypass AOP  20 No retry budget

Problem: local RL → Why: per JVM → Impact: 10x traffic → Fix: GW/Redis`,
    failure: 'Prod outage caused by “protective” retries.',
    production: 'Chaos + load test each dependency profile quarterly.',
    interview30s: 'Name drawbacks: local state, amplification, bad fallbacks — show mitigations.',
    followUp: 'How do you test CB OPEN in CI?',
    tradeoff: 'Safety engineering cost vs outage cost.',
    memoryTrick: 'Protection without tests is decoration.',
  },
  {
    id: 'vs',
    title: 'R4j vs Hystrix · Retry · Mesh',
    badge: 'Compare',
    problem: 'Where should the policy live — app, GW, or mesh?',
    whenToUse: 'App-level fine control for payment semantics; mesh for fleet defaults.',
    whenAvoid: 'Double-retry at mesh and app without budgets.',
    mermaid: `flowchart TB
  APP[App Resilience4j]
  GW[API Gateway RL]
  MESH[Istio / Envoy]
  APP --> SEM[Idempotency-aware]
  MESH --> TRANS[Transport retries]
  GW --> EDGE[Edge admit]`,
    code: `| Tool | Layer | Notes |
| Resilience4j | App | Lightweight, Boot3, fine APIs |
| Spring Retry | App | Retries mainly; less CB/BH suite |
| Spring Cloud CB | App abstraction | Can delegate to R4j |
| Hystrix | App legacy | Netflix; maintenance mode |
| Envoy/Istio | Mesh | Out-of-process timeouts/retries/outlier |
| API GW | Edge | Auth + RL + WAF |

Use together: GW RL + mesh timeouts + app CB/idempotent retry
Never: mesh retry × app retry × gateway retry unbounded`,
    failure: 'Triple retry layers → 27× bank load.',
    production: 'ADR: which layer owns retry for payments (usually app+idempotency only).',
    interview30s: 'R4j = app toolkit; mesh = platform defaults; combine carefully with one retry owner.',
    followUp: 'Why Hystrix lost to R4j?',
    tradeoff: 'Central policy vs domain-aware correctness.',
    memoryTrick: 'Edge admits · Mesh transports · App knows money.',
  },
];
