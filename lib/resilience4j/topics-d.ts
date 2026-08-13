import type {R4jTopic} from './types';

export const TOPICS_D: R4jTopic[] = [
  {
    id: 'cache',
    title: 'Cache — Don\'t Ask the Bank 1000 Times',
    badge: 'Repeat',
    problem: 'Every payment reads USD/INR from the bank FX API.',
    whenToUse: 'Read-mostly reference data with a known staleness budget.',
    whenAvoid: 'Balances, ledgers, authorization decisions, one-time payment status.',
    mermaid: `flowchart TD
  REQ[Get FX] --> C{Cache}
  C -->|hit| D[Return 83.25]
  C -->|miss| B[Bank FX]
  B --> W[Write TTL 30s]
  W --> D`,
    code: `@Cacheable("fxRates")
public BigDecimal usdInr() { return bankFx.fetch(); }

// Types
// 1) Resilience4j Cache = decorator over JCache (Ehcache/Hazelcast/Caffeine-jcache)
// 2) Spring Cache + Caffeine — this lab (local per pod)
// 3) Redis / distributed — multi-pod same FX
// 4) Cache-aside (app miss → bank → put) vs read-through (loader)

Pitfalls:
  stampede → singleflight / lock on miss
  stale FX → bound TTL + mark as indicative
  memory → maximumSize
  never cache captures / balances / "paid?"`,
    failure: 'Cached "account closed=false" for 10 minutes after freeze.',
    production: 'FX/holiday calendars: cache. Payment capture: never cache as source of truth.',
    interview30s: 'Cache cuts duplicate reads; R4j Cache is JCache. Payments still need a real store for money.',
    followUp: 'Cache stampede vs retry storm?',
    tradeoff: 'Latency vs freshness.',
    memoryTrick: 'Cache = don\'t ask the same question — never for the ledger.',
  },
  {
    id: 'threadpool',
    title: 'ThreadPool Bulkhead',
    badge: 'Isolate',
    problem: 'Fraud vendor is slow — must not occupy payment Tomcat threads.',
    whenToUse: 'Async isolation with a bounded queue + dedicated workers.',
    whenAvoid: 'Huge pools (you just moved the exhaustion) or blocking the event loop.',
    mermaid: `flowchart TD
  IN[Requests] --> Q[Bounded queue]
  Q --> W[core..max workers]
  W --> API[Fraud API]
  Q -->|full| REJ[BulkheadFullException]`,
    code: `resilience4j.thread-pool-bulkhead:
  instances:
    fraud:
      maxThreadPoolSize: 4
      coreThreadPoolSize: 2
      queueCapacity: 8

@Bulkhead(name="fraud", type=Bulkhead.Type.THREADPOOL)
@TimeLimiter(name="fraud")
public CompletableFuture<String> screen(String customerId) { ... }

// Queue full → BulkheadFullException → fallback / 503
// Pair with TimeLimiter — that is the usual combo`,
    failure: 'queueCapacity=10_000 → latency cliff, not protection.',
    production: 'Size from concurrent fraud RPS × p99. Alert on rejected calls.',
    interview30s: 'Semaphore limits concurrency on the caller thread; ThreadPool moves work to isolated workers + queue.',
    followUp: 'What happens when the queue is full?',
    tradeoff: 'Isolation vs context-switch / extra threads.',
    memoryTrick: 'First-class cabin ≠ economy — separate seats.',
  },
  {
    id: 'aop',
    title: 'Spring AOP Order (Not Annotation Order)',
    badge: 'Critical',
    problem: 'You stacked @Retry @CircuitBreaker — which actually runs first?',
    whenToUse: 'Always document aspect order in the ADR for payments.',
    whenAvoid: 'Assuming the order of annotations on the method is the runtime order.',
    mermaid: `flowchart TD
  REQ[Request] --> RT[Retry outer]
  RT --> CB[CircuitBreaker]
  CB --> RL[RateLimiter]
  RL --> TL[TimeLimiter]
  TL --> BH[Bulkhead inner]
  BH --> FN[Bank call]`,
    code: `Default Spring Boot 3 aspect nesting (Resilience4j docs):
Retry (
  CircuitBreaker (
    RateLimiter (
      TimeLimiter (
        Bulkhead (
          function
        )))))

Retry(CircuitBreaker(API))
  → retries count in the CB window; OPEN stops further retries on that call stack

CircuitBreaker(Retry(API))  // programmatic if you invert
  → CB sees one result after retries; slower to OPEN, longer tail latency

resilience4j:
  circuitbreaker.circuitBreakerAspectOrder: 400
  retry.retryAspectOrder: 500   # higher = outer in some versions — check your BOM

This lab's programmatic pipeline (inner first):
Bulkhead → RateLimiter → CircuitBreaker → Retry`,
    failure: 'Retry outside CB keeps hammering an OPEN dependency via a second bean.',
    production: 'Prefer default AOP; if you invert, do it programmatically and test OPEN timing.',
    interview30s: 'Annotation order on the method is not execution order. Default: Retry wraps CircuitBreaker wraps RateLimiter wraps TimeLimiter wraps Bulkhead.',
    followUp: 'Why would you put Retry inside CB?',
    tradeoff: 'Faster fail-fast vs more recovery from blips.',
    memoryTrick: 'AOP order ≠ source order. Draw the onion.',
  },
  {
    id: 'selfinvoke',
    title: 'Self-Invocation Breaks Annotations',
    badge: 'AOP',
    problem: 'this.charge() inside the same class — no proxy, no Resilience4j.',
    whenToUse: 'Keep @CircuitBreaker on a Spring bean called from another bean.',
    whenAvoid: 'Private methods, same-class this.foo(), final classes if using CGLIB poorly.',
    mermaid: `flowchart TD
  C[Controller] --> A[OrderService bean]
  A --> B[PaymentGatewayClient bean]
  B --> ANN[@CircuitBreaker method]
  X[this.charge inside client] --> SKIP[AOP skipped]`,
    code: `// BAD — self invocation
@Service
class PaymentGatewayClient {
  public PaymentResult pay(PayRequest r) {
    return this.charge(r); // NO proxy → annotations skipped
  }
  @CircuitBreaker(name="payment")
  public PaymentResult charge(PayRequest r) { ... }
}

// GOOD
Controller → OrderService → PaymentGatewayClient.charge()

// Also GOOD: programmatic CircuitBreaker.decorateSupplier in the same class`,
    failure: 'Prod CB never opens because every call is this.xxx from a facade.',
    production: 'One facade bean per dependency; unit-test that metrics move.',
    interview30s: 'Spring AOP is a proxy. Same-class calls skip @CircuitBreaker/@Retry.',
    followUp: 'AspectJ compile-time weaving?',
    tradeoff: 'Extra bean vs self-call convenience.',
    memoryTrick: 'Must cross a Spring bean boundary.',
  },
  {
    id: 'webflux',
    title: 'Resilience4j + WebFlux',
    badge: 'Reactor',
    problem: 'Blocking Retry/Bulkhead on the event loop stalls the whole app.',
    whenToUse: 'Mono/Flux pipelines with resilience4j-reactor operators.',
    whenAvoid: 'Thread.sleep, blocking RestClient, ThreadPool bulkhead on Netty threads without care.',
    mermaid: `flowchart TD
  M[Mono] --> CB[CircuitBreakerOperator]
  CB --> RT[RetryOperator]
  RT --> TO[timeout]
  TO --> FB[onErrorReturn PENDING]`,
    code: `// pom: resilience4j-reactor (this lab keeps MVC; operators are in BankReactiveClient)

return bankCall
  .transformDeferred(CircuitBreakerOperator.of(cb))
  .transformDeferred(RetryOperator.of(retry))
  .timeout(Duration.ofSeconds(1))
  .onErrorReturn("PENDING");

// TimeLimiter ≈ Mono.timeout
// Semaphore bulkhead has a Reactor operator; ThreadPool BH is a poor fit on event loop`,
    failure: 'Blocking JDBC inside map() + Retry → event-loop deadlock.',
    production: 'BoundedElastic for blocking adapters; operators stay non-blocking.',
    interview30s: 'Use resilience4j-reactor operators; never block Netty. Timeout via Mono.timeout.',
    followUp: 'publishOn vs subscribeOn?',
    tradeoff: 'Reactive efficiency vs blocking-client simplicity.',
    memoryTrick: 'If it blocks, it is not on the loop.',
  },
  {
    id: 'exceptions',
    title: 'Exception & HTTP Classification',
    badge: 'Matrix',
    problem: 'Retrying 400 or ignoring 503 makes the circuit lie.',
    whenToUse: 'Explicit recordExceptions / ignoreExceptions / retryExceptions per dependency.',
    whenAvoid: 'catch Exception retry everything.',
    mermaid: `flowchart TD
  E[Exception] --> T{Transient?}
  T -->|yes| RT[Retry + CB]
  T -->|no| BIZ[No retry · ignore CB]`,
    code: `| Exception / HTTP | Retry? | CircuitBreaker? |
| Timeout / ConnectException | YES | YES |
| HTTP 500/502/503/504 | usually YES | YES |
| HTTP 429 | maybe after Retry-After | usually NO |
| HTTP 400/401/403/404/409 | NO | NO / ignore |
| Validation / BusinessException | NO | ignoreExceptions |
| DuplicatePaymentException | NO | ignore |
| CallNotPermittedException | NO | n/a — already OPEN |
| RequestNotPermitted | NO | ignore (else RL trips CB) |
| BulkheadFullException | NO | ignore |

recordExceptions: BankUnavailableException
ignoreExceptions: BusinessException, RequestNotPermitted, BulkheadFullException

Fallback matching ≈ catch blocks: more specific signatures first.
Never let fallback(Throwable) swallow BusinessException into fake PENDING.`,
    failure: 'RL reject counted as CB failure → OPEN under load, not under bank outage.',
    production: 'Review the matrix with risk when adding a new bank adapter.',
    interview30s: 'Classify retryable vs business vs admit-control. Ignore RL/BH rejects on the CB.',
    followUp: 'Is 404 retryable for GET payment status?',
    tradeoff: 'Sensitivity vs correct OPEN reason.',
    memoryTrick: '4xx think twice · 5xx maybe · money never without a key.',
  },
  {
    id: 'k8s',
    title: 'Kubernetes — Local State × N Pods',
    badge: 'Scale',
    problem: '10 pods each think they have a private circuit and a 100/s limiter.',
    whenToUse: 'Always reason in cluster units when you autoscale.',
    whenAvoid: 'Treating in-memory RL/CB as a global bank quota.',
    mermaid: `flowchart TB
  LB[Load Balancer]
  LB --> P1[Pod1 CB RL BH]
  LB --> P2[Pod2 CB RL BH]
  LB --> P3[Pod3 CB RL BH]
  P1 --> BANK[Bank]
  P2 --> BANK
  P3 --> BANK`,
    code: `Local:
  10 pods × 100 rps RL ≈ 1000 rps to the bank
  10 independent CBs → one pod OPEN, others still hammer

Need distributed coordination when:
  bank quota is global
  fairness across tenants/pods
  you must fail closed as a fleet

Then: API Gateway / Envoy / Redis GCRA / shared token bucket
Keep R4j as the per-process fuse (threads, local storms)

HPA: more pods = more local permits. Recalculate.`,
    failure: 'Black Friday HPA 3→30 pods, bank 429s, each pod retries → worse.',
    production: 'Edge RL for global; R4j RL as second line; CB still per pod (that is OK for thread protection).',
    interview30s: 'R4j state is per JVM. Multiply limits by replicas. CB is local — that still protects that pod\'s threads.',
    followUp: 'Do we want a distributed circuit breaker?',
    tradeoff: 'Shared OPEN can protect the bank; local OPEN protects the pod.',
    memoryTrick: 'Local fuse ≠ fleet quota.',
  },
  {
    id: 'corners',
    title: 'Corner Cases Senior Engineers Must Know',
    badge: 'Prod',
    problem: 'The library is fine — the interactions are where outages hide.',
    whenToUse: 'Game days, design reviews, incident retros.',
    whenAvoid: 'Copying YAML from a blog as "bank ready".',
    mermaid: `flowchart TD
  BAD[Misconfig] --> STORM[Retry storm]
  BAD --> HERD[Thundering herd]
  BAD --> DUP[Duplicate payment]
  BAD --> FLAP[CB flapping]
  BAD --> MULT[Timeout × retries]`,
    code: `1 Retry storm — nested 3×3×3. One retry owner.
2 Thundering herd — jitter + CB.
3 Cascading failure — BH + CB + timeouts.
4 CB flapping — min calls + waitDuration.
5 HALF_OPEN spike — permittedNumberOfCallsInHalfOpenState small.
6 Timeout multiplication — 1s × 3 retries ≈ 3s+backoff.
7 Retry + TimeLimiter — budget the product.
8 Retry + payment — Idempotency-Key.
9 RL per instance — × replica count.
10 Bulkhead queue full — fail fast, not infinite wait.
11 Thread starvation — shared Tomcat vs BH.
12 Slow downstream — slowCallRate + read timeout.
13 Slow vs fail — both can OPEN.
14 Wrong exception class — 400 in retryExceptions.
15 Fallback failure — fallback must not call the same bank.
16 Fallback hides outage — PENDING + alert, not silent.
17 Stale cache — TTL + don't cache money.
18 Cache stampede — singleflight.
19 Self-invocation — proxy boundary.
20 Annotation vs AOP order — draw the onion.
21 Reactive blocking — no sleep on event loop.
22 ThreadPool too big — not a bulkhead.
23 K8s HPA — local RL multiplies.
24 Multi-region — independent CBs; don't assume shared OPEN.
25 Distributed RL — Redis/GW when quota is global.
26 Clock skew — TIME_BASED windows; NTP.
27 Blind metrics — no alert on OPEN.
28 Health indicator DOWN — don't kill the pod on one bank CB unless you mean to.
29 Infinite retry — maxAttempts.
30 Non-idempotent retry — unique key or don't.`,
    failure: 'Any one of these in a payment path is an incident.',
    production: 'Checklist in the last section; chaos each quarterly.',
    interview30s: 'Pick three: duplicate payments, local RL × pods, Retry×timeout latency product.',
    followUp: 'Which one bit you in prod?',
    tradeoff: 'More guards vs operational complexity.',
    memoryTrick: 'Interactions kill you, not the happy-path annotation.',
  },
];
