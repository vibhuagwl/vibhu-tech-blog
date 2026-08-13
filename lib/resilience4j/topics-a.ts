import type {R4jTopic} from './types';

export const TOPICS_A: R4jTopic[] = [
  {
    id: 'modules',
    title: 'Resilience4j Modules',
    badge: 'Map',
    problem: 'Which module stops which payment failure mode?',
    whenToUse: 'Protect Order→Payment (and Redis/DB/Kafka clients) with explicit policies.',
    whenAvoid: 'Wrapping every method blindly — tune per dependency risk.',
    mermaid: `flowchart TB
  R4J[Resilience4j]
  R4J --> CB[CircuitBreaker]
  R4J --> RT[Retry]
  R4J --> RL[RateLimiter]
  R4J --> BH[Bulkhead]
  R4J --> TL[TimeLimiter]
  R4J --> CACHE[Cache]
  R4J --> MET[Micrometer]`,
    code: `| Module | Solves | Banking analogy |
| CircuitBreaker | Stop calling a dead bank | Close the teller window |
| Retry | Transient blips | Ask once more politely |
| RateLimiter | Protect capacity | Queue tickets |
| Bulkhead | Isolate pools | Separate ship compartments |
| TimeLimiter | Bound async wait | Meeting hard stop |
| Fallback | Degrade safely | "Pending" not fake SUCCESS |`,
    failure: 'Stacking all modules with defaults → latency spikes + retry storms.',
    production: 'One named instance per dependency: paymentCb, redisCb, kafkaProducerRl.',
    interview30s: 'Resilience4j is a lightweight fault-tolerance library — CB, Retry, RL, Bulkhead, TimeLimiter — Spring Boot 3 native via AOP/registries.',
    followUp: 'Why not Hystrix?',
    tradeoff: 'App-level control vs mesh-level policies.',
    memoryTrick: 'SLOW→TL · TEMP→Retry · DEAD→CB · BUSY→BH · TOO MANY→RL · NO ANSWER→Fallback',
  },
  {
    id: 'failures',
    title: 'What Can Actually Fail?',
    badge: 'Critical',
    problem: 'Payment path dies in many ways — map each to a Resilience4j action.',
    whenToUse: 'Design resilience from a failure taxonomy, not from annotations.',
    whenAvoid: 'Treating every Exception the same (retry NPE / OOM).',
    mermaid: `flowchart TD
  F[Failure] --> D[Detection]
  D --> M[Resilience4j]
  M --> A[Action]
  A --> R[Fallback / Retry / Reject]
  R --> REC[Recovery]
  F --> NET[Network]
  F --> APP[HTTP 5xx / OOM]
  F --> DEP[DB Redis Kafka Bank]
  F --> DIST[Cascade / storm / partition]`,
    code: `Network: connect/read timeout, reset, DNS, TLS, partition
App: 500/502/503/504, RTE, pool exhaustion
Dep: DB/Redis/Kafka/bank gateway down or slow
Dist: partial failure, cascade, retry storm, thundering herd

Map:
  connect timeout → retry (bounded) + CB
  read timeout / slow → TimeLimiter + CB slowCall
  503 transient → retry + backoff
  4xx client → usually NO retry
  OOM / Error → fail fast, do not retry
  bank POST → idempotency key OR no retry`,
    failure: 'Retrying connection-pool-exhausted calls worsens saturation.',
    production: 'Classify exceptions: retryable vs fatal vs business; wire ignoreExceptions.',
    interview30s: 'List failure classes first; pick CB/Retry/BH/RL/TL per class — never one policy for all.',
    followUp: 'Does CB protect against slow calls?',
    tradeoff: 'Sensitivity vs noise — thresholds need traffic.',
    memoryTrick: 'Detect → Mechanism → Action → Recover.',
  },
  {
    id: 'circuit',
    title: 'Circuit Breaker Deep Dive',
    badge: 'Core',
    problem: 'Bank gateway returns 30% 503 — when do we stop calling?',
    whenToUse: 'Repeated dependency failure or slow calls; fail fast + recover probe.',
    whenAvoid: 'Sparse traffic without minimumNumberOfCalls — false OPEN.',
    mermaid: `stateDiagram-v2
  [*] --> CLOSED
  CLOSED --> OPEN: failure/slow threshold
  OPEN --> HALF_OPEN: waitDuration
  HALF_OPEN --> CLOSED: probe success
  HALF_OPEN --> OPEN: probe failure`,
    code: `resilience4j.circuitbreaker:
  instances:
    payment:
      slidingWindowType: COUNT_BASED
      slidingWindowSize: 100
      minimumNumberOfCalls: 20
      failureRateThreshold: 50
      slowCallRateThreshold: 50
      slowCallDurationThreshold: 2s
      waitDurationInOpenState: 30s
      permittedNumberOfCallsInHalfOpenState: 5
      automaticTransitionFromOpenToHalfOpenEnabled: true

// 100 calls, 30 failures → 30% failure rate
// OPEN only if rate ≥ threshold AND calls ≥ minimumNumberOfCalls

CircuitBreakerRegistry.ofDefaults()
  .circuitBreaker("payment")
  .executeSupplier(() -> client.pay(req));`,
    failure: 'Threshold 5% with noisy neighbors → flapping OPEN; too high → cascade.',
    production: 'Per-dependency windows; alert on state transitions; record events to logs+metrics.',
    interview30s: 'CLOSED→OPEN on failure/slow rate over window after min calls; HALF_OPEN probes; success closes.',
    followUp: 'COUNT_BASED vs TIME_BASED?',
    tradeoff: 'Fail-fast protection vs temporary availability loss.',
    memoryTrick: 'CB = fuse box — trip, wait, test, restore.',
  },
  {
    id: 'retry',
    title: 'Retry + Idempotency',
    badge: 'Danger',
    problem: 'POST /payment timed out — retry or not?',
    whenToUse: 'Idempotent reads / safe writes with idempotency keys; transient errors only.',
    whenAvoid: 'Blind POST money moves; infinite retries; retrying business 4xx.',
    mermaid: `sequenceDiagram
  participant O as Order
  participant R as Retry
  participant P as Payment
  O->>R: pay
  R->>P: attempt1
  P-->>R: 503
  R->>R: wait+jitter
  R->>P: attempt2
  P-->>R: 200
  R-->>O: ok`,
    code: `resilience4j.retry:
  instances:
    paymentRead:
      maxAttempts: 3
      waitDuration: 200ms
      enableExponentialBackoff: true
      exponentialBackoffMultiplier: 2
      retryExceptions:
        - java.io.IOException
        - org.springframework.web.client.HttpServerErrorException
      ignoreExceptions:
        - com.vibhu.resilience.BusinessException

// BAD: nested retries amplify
// A x3 → B x3 → C x3 = 27x load

// SAFE payment write:
// Idempotency-Key: uuid
// UNIQUE(idempotency_key) on payments
// Retry only with same key`,
    failure: 'Timeout after bank committed → duplicate charge without idempotency.',
    production: 'Retry only at one layer; prefer consumer DLQ for Kafka; document retry budget.',
    interview30s: 'Retry transient + idempotent ops; payment POST needs idempotency key or no auto-retry.',
    followUp: 'Retry amplification across 3 services?',
    tradeoff: 'Higher success vs duplicate side effects.',
    memoryTrick: 'GET maybe retry · POST money only with key.',
  },
  {
    id: 'backoff',
    title: 'Exponential Backoff + Jitter',
    badge: 'Herd',
    problem: '1000 pods all retry bank at t=0 after outage — thundering herd.',
    whenToUse: 'Any multi-instance retry after shared dependency recovery.',
    whenAvoid: 'Zero jitter synchronized retries; unbounded max wait.',
    mermaid: `flowchart LR
  R1[100ms] --> R2[200ms] --> R3[400ms] --> R4[800ms]
  J[Jitter] --> Spread[Desynchronize pods]`,
    code: `wait = min(maxWait, base * 2^attempt)
wait = wait * random(0.5, 1.5)  // jitter

resilience4j.retry:
  instances:
    payment:
      enableExponentialBackoff: true
      exponentialBackoffMultiplier: 2
      exponentialMaxWaitDuration: 5s
      enableRandomizedWait: true
      randomizedWaitFactor: 0.5

// Without jitter: herd hammer recovers bank
// With jitter: staggered recovery load`,
    failure: 'Fixed 1s wait across fleet → synchronized waves.',
    production: 'Cap attempts + max wait; combine with CB so OPEN stops herd.',
    interview30s: 'Backoff grows wait; jitter randomizes to prevent thundering herd.',
    followUp: 'Full vs equal jitter?',
    tradeoff: 'Slower recovery vs safer dependency.',
    memoryTrick: 'Backoff = patience · Jitter = not marching in step.',
  },
];
