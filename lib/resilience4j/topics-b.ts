import type {R4jTopic} from './types';

export const TOPICS_B: R4jTopic[] = [
  {
    id: 'bulkhead',
    title: 'Bulkhead Isolation',
    badge: 'Isolate',
    problem: 'Slow notifications exhaust Order threads → payments die too.',
    whenToUse: 'Isolate dependency call pools so one slow friend cannot sink the ship.',
    whenAvoid: 'Tiny pools that reject healthy traffic; BH around everything.',
    mermaid: `flowchart TB
  ORD[Order Service]
  ORD --> PAY[Payment Pool]
  ORD --> NOT[Notification Pool]
  ORD --> FRD[Fraud Pool]
  NOT --> EXH[Exhausted]
  PAY --> OK[Still serving]`,
    code: `// TYPE 1 — Semaphore (sync payment, same Tomcat thread)
resilience4j.bulkhead:
  instances:
    payment:
      maxConcurrentCalls: 20
      maxWaitDuration: 0s          # 0 = BulkheadFullException immediately
      fairCallHandlingEnabled: false

@Bulkhead(name="payment") // default SEMAPHORE
public PaymentResult charge(PayRequest r) { return bank.charge(r); }

// TYPE 2 — ThreadPool (fraud vendor, dedicated workers)
resilience4j.thread-pool-bulkhead:
  instances:
    fraud:
      coreThreadPoolSize: 2
      maxThreadPoolSize: 4
      queueCapacity: 8

@Bulkhead(name="fraud", type=Bulkhead.Type.THREADPOOL)
@TimeLimiter(name="fraud")
public CompletableFuture<String> screen(String customerId) { ... }

// Uses in one app (yes, together):
//  - isolate by dependency (payment vs notify vs fraud)
//  - isolate by tenant
//  - isolate by operation (capture vs refund)
// Size: maxConcurrent ≈ RPS × p99 seconds
// RL = starts per second; BH = in-flight now`,
    failure: 'maxWaitDuration long → request pile-up looks like success until latency cliff.',
    production: 'Size pools from p99 latency × RPS + headroom; alert on rejected calls.',
    interview30s: 'Bulkhead = compartments — payment threads survive notification meltdown.',
    followUp: 'Semaphore vs thread-pool bulkhead?',
    tradeoff: 'Isolation vs under-utilization / rejects.',
    memoryTrick: 'Ship compartments — flood one, float the rest.',
  },
  {
    id: 'ratelimit',
    title: 'Rate Limiter (Local ≠ Global)',
    badge: 'Traffic',
    problem: 'Burst 10k req/s into bank gateway — need admission control.',
    whenToUse: 'Protect self or downstream with token-bucket style limits.',
    whenAvoid: 'Assuming in-process RL is cluster-wide; one global limit for all tenants.',
    mermaid: `flowchart TD
  REQ[Request 101] --> RL[limitForPeriod=100]
  RL --> REJ[Timeout / Reject]
  T1[Tenant A 100/s]
  T2[Tenant B 100/s]
  T3[Tenant C 100/s]`,
    code: `// Implementations
// 1) AtomicRateLimiter (default, lock-free) — use this
// 2) SemaphoreBasedRateLimiter — older, more locking

resilience4j.ratelimiter:
  instances:
    paymentApi:
      limitForPeriod: 50          # tokens each period
      limitRefreshPeriod: 1s      # refill interval
      timeoutDuration: 0s         # 0 = fail-fast RequestNotPermitted

// timeoutDuration > 0 → thread waits for next refill (avoid on Tomcat)

@RateLimiter(name="paymentApi")
public PaymentResult charge(PayRequest r) { return bank.charge(r); }

// 10 pods × 50/s = 500/s to the bank
// Cluster-wide: API Gateway / Envoy / Redis GCRA
// Per tenant: RateLimiterRegistry.rateLimiter("tenant-"+id)

// Contrast (not R4j internals):
// token-bucket / leaky-bucket / sliding window → often at the gateway`,
    failure: 'Local RL gives false confidence under horizontal scale.',
    production: 'GW/mesh for edge; app RL as second line; tenant-aware keys.',
    interview30s: 'R4j RateLimiter is per JVM — multiply by instances for true load.',
    followUp: 'How to do tenant-level RL?',
    tradeoff: 'Simplicity vs accurate global fairness.',
    memoryTrick: 'Local tickets ≠ stadium capacity.',
  },
  {
    id: 'timelimit',
    title: 'TimeLimiter vs Timeouts',
    badge: 'Bound',
    problem: 'Payment hangs 30s — Order threads stuck; clients already gone.',
    whenToUse: 'Bound async CompletableFuture / reactive calls.',
    whenAvoid: 'Thinking TimeLimiter replaces HTTP connect/read timeouts.',
    mermaid: `flowchart TD
  A[Order] --> TL[TimeLimiter 2s]
  TL --> B[Payment takes 8s]
  B --> TO[Timeout + cancel?]`,
    code: `| Knob | Layer | Meaning |
| connect timeout | TCP | fail to establish |
| read timeout | HTTP client | socket idle |
| request timeout | client total | overall budget |
| TimeLimiter | R4j async | Future time bound |
| CB slowCall | R4j | count as slow failure |

resilience4j.timelimiter:
  instances:
    payment:
      timeoutDuration: 2s
      cancelRunningFuture: true

TimeLimiter.decorateFutureSupplier(tl,
  () -> CompletableFuture.supplyAsync(() -> client.pay()));

// Budget: client 3s > TimeLimiter 2s > read 1.5s > connect 200ms`,
    failure: 'Upstream timeout 1s, downstream TL 5s → wasted work after client left.',
    production: 'Align timeout budgets end-to-end; cancelRunningFuture carefully with non-interruptible IO.',
    interview30s: 'TimeLimiter bounds async execution; still set HTTP connect/read timeouts.',
    followUp: 'cancelRunningFuture with blocking JDBC?',
    tradeoff: 'Fast fail vs false timeouts under GC pauses.',
    memoryTrick: 'Nested budgets: outer ≤ sum of inners — never longer inside.',
  },
  {
    id: 'fallback',
    title: 'Fallback — Never Fake Payment Success',
    badge: 'Safety',
    problem: 'Bank down — what can Order return without lying?',
    whenToUse: 'Degrade non-critical paths (recs, FX cache, profile) or return PENDING.',
    whenAvoid: 'Fallback that reports payment SUCCESS / captured funds.',
    mermaid: `flowchart TD
  P[Payment] -->|fail| F[Fallback]
  F --> PEND[status=PENDING]
  F --> CACHE[stale FX rate]
  F --> X[NEVER fake SUCCESS]`,
    code: `@CircuitBreaker(name="payment", fallbackMethod="payFallback")
public PaymentResult pay(PayRequest r) { return client.charge(r); }

private PaymentResult payFallback(PayRequest r, Throwable t) {
  log.warn("payment degraded corr={}", MDC.get("corrId"), t);
  return PaymentResult.pending(r.idempotencyKey()); // NOT success
}

// OK fallbacks: cached profile, default recommendations, queued notify
// BAD: "paid": true when bank never confirmed`,
    failure: 'Fake SUCCESS → reconciliation hell, customer charged twice later.',
    production: 'Fallback must be explicitly approved by product/risk for money paths.',
    interview30s: 'Fallback = graceful degradation; for payments return pending/fail — never invent success.',
    followUp: 'Is empty list OK for recommendations?',
    tradeoff: 'UX continuity vs correctness.',
    memoryTrick: 'Degrade truthfully — pending ≠ paid.',
  },
  {
    id: 'combine',
    title: 'Combining Patterns — Order Matters',
    badge: 'Compose',
    problem: 'Retry outside CB can keep hammering; Retry inside can delay OPEN.',
    whenToUse: 'Explicit decorator order per dependency after load tests.',
    whenAvoid: 'Copy-pasting one mega-annotation stack everywhere.',
    mermaid: `flowchart TB
  C[Client] --> RL[RateLimiter]
  RL --> BH[Bulkhead]
  BH --> TL[TimeLimiter]
  TL --> CB[CircuitBreaker]
  CB --> RT[Retry]
  RT --> HTTP[RestClient]
  HTTP --> PAY[Payment]`,
    code: `// Common payment outbound stack (sync):
// RateLimiter → Bulkhead → CircuitBreaker → (optional Retry) → HTTP
// TimeLimiter mainly with async/CompletableFuture

// Interactions:
// Retry inside CB: each attempt counts toward CB window
// Retry outside CB: may call even when you'd rather fail fast
// TL + Retry: multiply latency (2s × 3 attempts)
// BH + Retry: holds bulkhead slot during waits — danger
// RL + Retry: retries consume rate tokens

Supplier<PaymentResult> call = () -> client.pay(req);
call = CircuitBreaker.decorateSupplier(cb, call);
call = Retry.decorateSupplier(retry, call);
call = Bulkhead.decorateSupplier(bh, call);
call = RateLimiter.decorateSupplier(rl, call);`,
    failure: 'Retry×Timeout without budget → thread starvation.',
    production: 'Document decorator order in ADR; chaos-test the stack.',
    interview30s: 'Order is a design choice — know how Retry and CB share metrics and latency budgets.',
    followUp: 'Where does fallback attach?',
    tradeoff: 'Resilience depth vs tail latency.',
    memoryTrick: 'Admit → Isolate → Bound → Break → Retry → IO.',
  },
  {
    id: 'spring',
    title: 'Spring Boot 3 Integration',
    badge: 'Code',
    problem: 'Wire payment client with annotations + YAML + Actuator.',
    whenToUse: 'Spring services calling HTTP/Redis/DB with AOP or registries.',
    whenAvoid: 'Annotations on private/self-invoked methods (proxy bypass).',
    mermaid: `flowchart LR
  POST[POST /orders] --> OS[OrderService]
  OS --> PC[PaymentClient]
  PC --> R4J[Resilience4j AOP]
  R4J --> PS[Payment Service]`,
    code: `// pom: resilience4j-spring-boot3 2.4.0 + actuator + aop

@RestController
@RequestMapping("/orders")
class OrderController {
  private final OrderService orders;
  @PostMapping public OrderResponse create(@RequestBody CreateOrder req) {
    return orders.create(req);
  }
}

@Service
class PaymentGatewayClient {
  @CircuitBreaker(name="payment", fallbackMethod="pending")
  @Bulkhead(name="payment")
  @RateLimiter(name="paymentApi")
  public PaymentResult charge(PayRequest r) { return rest.post(...); }

  private PaymentResult pending(PayRequest r, Throwable t) {
    return PaymentResult.pending(r.idempotencyKey());
  }
}

// Programmatic when dynamic names / tests:
circuitBreakerRegistry.circuitBreaker("payment")
  .executeSupplier(() -> ...);

// Annotations: declarative, SpEL fallback
// Programmatic: tests, dynamic tenants, non-Spring code`,
    failure: 'Fallback method signature mismatch → NoSuchMethod at runtime.',
    production: 'Enable management.endpoints for circuitbreakers; separate instances per host.',
    interview30s: 'spring-boot3 starter + @CircuitBreaker/@Retry… via AOP; registries for programmatic.',
    followUp: 'Why fallbackMethod must match args + Throwable?',
    tradeoff: 'AOP convenience vs explicit composition clarity.',
    memoryTrick: 'YAML names ↔ annotation names ↔ Actuator.',
  },
  {
    id: 'scenarios',
    title: 'Five Production Failure Scenarios',
    badge: 'Sims',
    problem: 'Show what R4j does for temp/permanent/slow/spike/cascade.',
    whenToUse: 'Game days and interview storytelling.',
    whenAvoid: 'Demo-only happy path.',
    mermaid: `sequenceDiagram
  participant C as Client
  participant O as Order
  participant CB as CircuitBreaker
  participant P as Payment
  C->>O: Create Order
  O->>CB: charge
  CB->>P: pay
  P-->>CB: 503
  CB->>CB: retry/window
  P-->>CB: 503
  CB-->>O: OPEN + fallback
  O-->>C: PENDING`,
    code: `S1 Temporary: 503 → Retry → 200 → OK
S2 Permanent: failures ≥ threshold → OPEN → fallback PENDING
S3 Slow: > slowCallDuration → counts slow → OPEN / TimeLimiter
S4 Spike: RateLimiter rejects → 429; Bulkhead rejects overflow
S5 Cascade: without BH/CB, C slow → B threads gone → A down
   with R4j: BH isolates, CB opens, A stays up for other routes

// Simulate:
GET /payment/simulate?mode=error|slow|flaky|down`,
    failure: 'Cascade when shared Tomcat pool — BH must wrap outbound calls.',
    production: 'Script modes in lower envs; verify metrics + customer status semantics.',
    interview30s: 'Walk five scenarios: retry success, CB open, timeout, admit control, anti-cascade.',
    followUp: 'What does client see on OPEN?',
    tradeoff: 'Availability messaging vs instant hard fail.',
    memoryTrick: 'Temp/Perm/Slow/Spike/Cascade — five stories.',
  },
];
