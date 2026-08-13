export type ModuleType = {
  name: string;
  when: string;
  how: string;
};

export type ModuleDeep = {
  id: string;
  title: string;
  emoji: string;
  analogy: string;
  oneLiner: string;
  simple: string;
  types: ModuleType[];
  uses: string[];
  yaml: string;
  java: string;
  mermaid: string;
  together: string;
  mistake: string;
  interview: string;
};

export const MODULES_DEEP: ModuleDeep[] = [
  {
    id: 'cb',
    title: 'CircuitBreaker',
    emoji: '⚡',
    analogy: 'Fuse box: trip when the bank is on fire, wait, test with a few probes, then restore.',
    oneLiner: 'Stop calling a dependency that is failing or too slow. Fail fast instead of waiting.',
    simple:
      'Every call is recorded in a sliding window. If too many fail or are slow, the circuit OPEN. New calls skip the bank and go to fallback. After waitDuration, HALF_OPEN lets a few probes through. Success → CLOSED. Failure → OPEN again.',
    types: [
      {
        name: 'COUNT_BASED window',
        when: 'Steady RPS (payments, card auth). Lab default.',
        how: 'Last N calls (slidingWindowSize). OPEN if failure/slow rate ≥ threshold after minimumNumberOfCalls.',
      },
      {
        name: 'TIME_BASED window',
        when: 'Bursty traffic where “last 10 seconds” matters more than last 10 calls.',
        how: 'Buckets over slidingWindowSize seconds. Sparse traffic still needs minimumNumberOfCalls.',
      },
      {
        name: 'Failure-rate trip',
        when: 'Bank 5xx / connection errors.',
        how: 'failureRateThreshold + recordExceptions (BankUnavailableException). Ignore 4xx / business / RL / BH.',
      },
      {
        name: 'Slow-call trip',
        when: 'Bank is up but p99 is 8s.',
        how: 'slowCallDurationThreshold + slowCallRateThreshold. Complements TimeLimiter / HTTP read timeout.',
      },
    ],
    uses: [
      'Per bank/rail: payment, visa, swift, ach — never one global CB',
      'Fail-fast when OPEN so Tomcat threads are not stuck',
      'Fallback returns PENDING, never fake CAPTURED',
    ],
    yaml: `resilience4j.circuitbreaker:
  instances:
    payment:
      slidingWindowType: COUNT_BASED   # or TIME_BASED
      slidingWindowSize: 10
      minimumNumberOfCalls: 5
      failureRateThreshold: 50
      slowCallRateThreshold: 80
      slowCallDurationThreshold: 2s
      waitDurationInOpenState: 5s
      permittedNumberOfCallsInHalfOpenState: 2
      recordExceptions:
        - com.vibhu.resilience.BankUnavailableException
      ignoreExceptions:
        - com.vibhu.resilience.BusinessException
        - io.github.resilience4j.ratelimiter.RequestNotPermitted
        - io.github.resilience4j.bulkhead.BulkheadFullException`,
    java: `@CircuitBreaker(name = "payment", fallbackMethod = "pendingFallback")
public PaymentResult charge(PayRequest request) {
  return bank.charge(request);
}

private PaymentResult pendingFallback(PayRequest request, Throwable t) {
  if (t instanceof BusinessException biz) throw biz;
  return PaymentResult.pending(request.idempotencyKey(), t.getClass().getSimpleName());
}

// States: CLOSED → OPEN → HALF_OPEN → CLOSED or OPEN
// GET /actuator/circuitbreakers`,
    mermaid: `sequenceDiagram
  autonumber
  participant C as Client
  participant CB as CircuitBreaker
  participant Bank

  Note over CB: CLOSED
  loop window fills with failures
    C->>CB: charge
    CB->>Bank: call
    Bank-->>CB: 503
  end
  CB->>CB: OPEN
  C->>CB: charge
  CB-->>C: CallNotPermittedException → fallback PENDING
  Note over CB: waitDuration
  CB->>CB: HALF_OPEN
  C->>CB: probe
  alt probe OK
    CB->>CB: CLOSED
  else probe fail
    CB->>CB: OPEN
  end`,
    together: 'CB sits inside Retry in Spring AOP. Each retry attempt is a CB call. Ignore RL/BH rejects so OPEN is about the bank, not yourself.',
    mistake: 'One CB for all dependencies. Or counting RequestNotPermitted as bank failure.',
    interview: 'CLOSED records a window; OPEN fails fast; HALF_OPEN probes. COUNT_BASED vs TIME_BASED is the window type.',
  },
  {
    id: 'retry',
    title: 'Retry',
    emoji: '🔁',
    analogy: 'Knock again — only if the door jammed, not if the house said no.',
    oneLiner: 'Repeat a failed call a bounded number of times when the error is transient and the operation is idempotent.',
    simple:
      'Retry catches configured exceptions, waits (backoff + jitter), and calls again. maxAttempts includes the first try. Do not retry business declines, 4xx, or money POSTs without an idempotency key.',
    types: [
      {
        name: 'Fixed wait',
        when: 'Tiny, uniform blips.',
        how: 'waitDuration only. Simple, can align retries across pods (thundering herd).',
      },
      {
        name: 'Exponential backoff',
        when: 'Bank 503 that may last hundreds of ms.',
        how: 'enableExponentialBackoff + multiplier. 50ms → 100ms → 200ms.',
      },
      {
        name: 'Randomized wait / jitter',
        when: 'Many pods retry together.',
        how: 'enableRandomizedWait. Spreads retries so you do not DDoS the recovering bank.',
      },
      {
        name: 'Exception predicates',
        when: 'Always.',
        how: 'retryExceptions: BankUnavailableException. ignoreExceptions: BusinessException.',
      },
    ],
    uses: [
      'Flaky bank 503 / connection reset',
      'Never retry “insufficient funds”',
      'Pair with IdempotencyStore so a retry cannot double-capture',
    ],
    yaml: `resilience4j.retry:
  instances:
    payment:
      maxAttempts: 3
      waitDuration: 50ms
      enableExponentialBackoff: true
      exponentialBackoffMultiplier: 2
      enableRandomizedWait: true
      randomizedWaitFactor: 0.5
      retryExceptions:
        - com.vibhu.resilience.BankUnavailableException
      ignoreExceptions:
        - com.vibhu.resilience.BusinessException`,
    java: `@Retry(name = "payment")
@CircuitBreaker(name = "payment", fallbackMethod = "pendingFallback")
public PaymentResult charge(PayRequest request) {
  return bank.charge(request);
}

// Lab: GET /api/payment/simulate?mode=FLAKY then POST /api/orders
// Attempt 1 fails → wait → attempt 2 succeeds`,
    mermaid: `sequenceDiagram
  autonumber
  participant Pay as PaymentGatewayClient
  participant R as Retry
  participant Bank

  Pay->>R: charge
  R->>Bank: attempt 1
  Bank-->>R: BankUnavailableException
  R->>R: backoff + jitter
  R->>Bank: attempt 2
  Bank-->>R: CAPTURED
  R-->>Pay: CAPTURED
  Note over R: BusinessException is not retried`,
    together: 'Retry is the outermost Spring aspect. It multiplies TimeLimiter and Bulkhead occupancy. Keep attempts tiny on money paths.',
    mistake: 'Retrying every Exception, including validation and “card declined”.',
    interview: 'Retry is for temporary faults + idempotency. Backoff + jitter. maxAttempts includes the first call.',
  },
  {
    id: 'rl',
    title: 'RateLimiter',
    emoji: '🎫',
    analogy: 'Ticket booth: only N customers enter per time window. Extra people wait or are turned away.',
    oneLiner: 'Limit how many calls start in a time period so you and the bank are not flooded.',
    simple:
      'Resilience4j RateLimiter refreshes a bucket of permits every limitRefreshPeriod. Each call needs one permit. If the bucket is empty, the thread waits up to timeoutDuration or fails immediately with RequestNotPermitted. This is PER JVM — 10 pods × 50/s = 500/s to the bank.',
    types: [
      {
        name: 'AtomicRateLimiter (default)',
        when: 'Almost always. Lock-free, high throughput.',
        how: 'Nanosecond cycle: every limitRefreshPeriod, limitForPeriod new permissions become available. This is what Spring Boot uses unless you override.',
      },
      {
        name: 'SemaphoreBasedRateLimiter',
        when: 'Rare; older / teaching demos.',
        how: 'Uses a semaphore refreshed on a timer. Same config knobs, more locking. Prefer Atomic.',
      },
      {
        name: 'Fail-fast (timeoutDuration = 0)',
        when: 'APIs that must not queue. Lab paymentApi.',
        how: 'No permit → RequestNotPermitted immediately. Client gets 429/fallback. No hidden latency.',
      },
      {
        name: 'Wait for permit (timeoutDuration > 0)',
        when: 'Batch jobs that can stall a bit.',
        how: 'Thread blocks until a refresh or timeout. Dangerous on Tomcat request threads.',
      },
      {
        name: 'Token-bucket style (what R4j is)',
        when: 'Smooth bursts inside one period.',
        how: 'You get limitForPeriod tokens each refresh. Unused tokens do not pile up across periods the way a classic bursty token bucket with max-burst would — think “replenish N every T”.',
      },
      {
        name: 'Not sliding-window / not leaky-bucket',
        when: 'Interview contrast.',
        how: 'Gateway/Envoy often use token bucket or leaky bucket globally. Redis GCRA / sliding log is distributed. R4j is local replenishing permits.',
      },
      {
        name: 'Per-instance vs distributed',
        when: 'Always size with replica count.',
        how: 'Need cluster-wide fairness? API Gateway, Envoy, Redis. App RL is the second line, not the stadium capacity.',
      },
      {
        name: 'Per-tenant RateLimiter',
        when: 'Noisy neighbor tenants.',
        how: 'Named instances or RateLimiterRegistry.rateLimiter(tenantId, config). Do not share one bucket for all customers.',
      },
    ],
    uses: [
      'Protect the bank from our own burst (flash sale, retry storm)',
      'Protect our JVM from inbound stampede (with gateway RL in front)',
      'Fairness: tenant A cannot eat tenant B budget if you key by tenant',
    ],
    yaml: `resilience4j.ratelimiter:
  instances:
    paymentApi:
      limitForPeriod: 50          # permits each refresh
      limitRefreshPeriod: 1s      # bucket refill interval
      timeoutDuration: 0s         # 0 = fail-fast, no queue
      subscribeForEvents: true
      eventConsumerBufferSize: 100
      writableStackTraceEnabled: false

# 3 pods × 50/s = 150/s worst-case to the bank
# For global 50/s, put the limit on API Gateway / Redis`,
    java: `@RateLimiter(name = "paymentApi")
public PaymentResult charge(PayRequest request) {
  return bank.charge(request);
}

// Programmatic (tenant key)
RateLimiter rl = registry.rateLimiter("tenant-" + tenantId, config);
RateLimiter.decorateSupplier(rl, () -> bank.charge(request)).get();

// On reject
// throw RequestNotPermitted — ignore this on CircuitBreaker
// GET /actuator/ratelimiters`,
    mermaid: `sequenceDiagram
  autonumber
  participant C1 as Call 1 to 50
  participant C51 as Call 51
  participant RL as AtomicRateLimiter
  participant Bank

  Note over RL: period T0 — 50 permits
  C1->>RL: acquire
  RL->>Bank: allowed
  C51->>RL: acquire
  alt timeoutDuration = 0
    RL-->>C51: RequestNotPermitted
  else timeoutDuration = 200ms
    RL->>RL: wait for next refresh
    Note over RL: period T1 — 50 new permits
    RL->>Bank: allowed or still timeout
  end`,
    together: 'RL is outside Bulkhead in Spring AOP. Rejected calls should NOT trip the CircuitBreaker (lab ignoreExceptions). Retry will also consume permits — that is why Retry is outer and attempts are small.',
    mistake: 'Thinking 50/s in YAML is cluster-wide. Or timeoutDuration=5s on a user-facing thread.',
    interview: 'R4j RateLimiter = local permit refresh every period. Atomic vs Semaphore implementation. timeoutDuration 0 = fail-fast. Multiply by pod count. Distributed RL lives at the gateway.',
  },
  {
    id: 'bh',
    title: 'Bulkhead',
    emoji: '🚢',
    analogy: 'Ship compartments: flood in notifications must not sink payments.',
    oneLiner: 'Cap how many calls run at the same time (and optionally on which threads) so one slow dependency cannot take every Tomcat thread.',
    simple:
      'RateLimiter is “how many start per second”. Bulkhead is “how many are in-flight right now”. A 20-concurrency bulkhead with 2s calls allows about 10 RPS, even if RateLimiter says 50/s. Two implementations: Semaphore (same thread) and ThreadPool (dedicated workers + queue).',
    types: [
      {
        name: 'Semaphore bulkhead (default, Type.SEMAPHORE)',
        when: 'Sync RestClient / WebClient.block / JDBC. Lab payment instance.',
        how: 'maxConcurrentCalls permits. Caller thread runs the work. maxWaitDuration=0 → BulkheadFullException immediately. Fair queue optional (fairCallHandlingEnabled).',
      },
      {
        name: 'ThreadPool bulkhead (Type.THREADPOOL)',
        when: 'Isolate a slow vendor from the request thread. Lab fraud instance. Pair with TimeLimiter.',
        how: 'coreThreadPoolSize / maxThreadPoolSize / queueCapacity / keepAliveDuration. Request submits to the pool. Queue full → BulkheadFullException. Does not occupy Tomcat while waiting on fraud.',
      },
      {
        name: 'Fail-fast vs wait',
        when: 'User-facing: fail-fast. Background: short wait maybe.',
        how: 'Semaphore maxWaitDuration. ThreadPool has no wait-for-thread beyond the queue; saturation = reject.',
      },
      {
        name: 'Fair semaphore',
        when: 'Avoid barging under load.',
        how: 'fairCallHandlingEnabled: true. Slightly slower, more predictable tail latency.',
      },
    ],
    uses: [
      'Isolate by dependency: payment vs fraud vs notify vs FX',
      'Isolate by tenant: noisy tenant cannot occupy the whole payment pool',
      'Isolate by operation: capture vs refund vs status-inquiry',
      'Protect the servlet pool: slow bank holds at most N threads',
      'Yes — use BOTH types in one app: semaphore for sync pay, threadpool for async fraud',
    ],
    yaml: `resilience4j.bulkhead:
  instances:
    payment:
      maxConcurrentCalls: 20
      maxWaitDuration: 0s
      fairCallHandlingEnabled: false

resilience4j.thread-pool-bulkhead:
  instances:
    fraud:
      coreThreadPoolSize: 2
      maxThreadPoolSize: 4
      queueCapacity: 8
      keepAliveDuration: 20ms`,
    java: `// Sync payment — same Tomcat thread, limited concurrency
@Bulkhead(name = "payment") // SEMAPHORE
public PaymentResult charge(PayRequest request) {
  return bank.charge(request);
}

// Async fraud — dedicated pool, does not steal payment threads
@Bulkhead(name = "fraud", type = Bulkhead.Type.THREADPOOL)
@TimeLimiter(name = "fraud")
public CompletableFuture<String> screen(String customerId) {
  return CompletableFuture.supplyAsync(() -> fraudApi.check(customerId));
}

// Size: maxConcurrent ≈ RPS × p99 seconds  (20 ≈ 10 rps × 2s)`,
    mermaid: `sequenceDiagram
  autonumber
  participant Pay as Payment Tomcat
  participant Sem as Semaphore BH payment
  participant Pool as ThreadPool BH fraud
  participant Bank
  participant Fraud

  Pay->>Sem: acquire 1 of 20
  Sem->>Bank: charge on same thread
  Bank-->>Sem: done
  Sem-->>Pay: release

  Pay->>Pool: submit screen
  alt worker + queue available
    Pool->>Fraud: on fraud-pool thread
    Fraud-->>Pay: CLEAR future
  else queue full
    Pool-->>Pay: BulkheadFullException
  end
  Note over Pay,Fraud: Slow fraud cannot take all 200 Tomcat threads`,
    together: 'Bulkhead is innermost (closest to the method) in Spring AOP. Retry waiting while holding a semaphore slot is dangerous — keep retries short. ThreadPool BH + TimeLimiter is the usual async pair.',
    mistake: 'One bulkhead named “default” around everything. Or queueCapacity=10_000 (you stored the flood instead of isolating it).',
    interview: 'Semaphore = cap in-flight on caller thread. ThreadPool = own workers + bounded queue. RL = starts per period. BH = concurrent now. You can (and should) use both types on different dependencies.',
  },
  {
    id: 'tl',
    title: 'TimeLimiter',
    emoji: '⏱️',
    analogy: 'Meeting hard stop: if the bank is still talking after 2s, you leave.',
    oneLiner: 'Bound how long you wait on a Future / reactive call. It does not replace HTTP connect/read timeouts.',
    simple:
      'TimeLimiter wraps CompletableFuture (or similar). If the future is not done in timeoutDuration, you get a timeout and optionally cancel. Sync charge() in the lab is NOT wrapped — only chargeAsync and fraud screen. Always still set RestClient connect/read timeouts.',
    types: [
      {
        name: 'timeoutDuration',
        when: 'Always.',
        how: 'Hard cap on waiting for the Future. Align with SLO: client 3s > TL 2s > read 1.5s > connect 200ms.',
      },
      {
        name: 'cancelRunningFuture true',
        when: 'Interruptible work (sleep, some HTTP clients).',
        how: 'Attempts Future.cancel(true). Blocking JDBC often ignores interrupt — you still occupy a thread.',
      },
      {
        name: 'cancelRunningFuture false',
        when: 'Work that must finish for correctness and you only want to stop waiting.',
        how: 'Caller unblocks; task may still run. Watch thread leaks.',
      },
    ],
    uses: [
      'Async payment chargeAsync',
      'ThreadPool bulkhead fraud screen',
      'Not a substitute for socket timeouts on sync RestClient',
    ],
    yaml: `resilience4j.timelimiter:
  instances:
    payment:
      timeoutDuration: 2s
      cancelRunningFuture: true
    fraud:
      timeoutDuration: 500ms
      cancelRunningFuture: true`,
    java: `@TimeLimiter(name = "payment")
@CircuitBreaker(name = "payment", fallbackMethod = "pendingAsyncFallback")
public CompletableFuture<PaymentResult> chargeAsync(PayRequest request) {
  return CompletableFuture.supplyAsync(() -> bank.charge(request));
}

// POST /api/orders/async + simulate?mode=SLOW → PENDING`,
    mermaid: `sequenceDiagram
  autonumber
  participant C as Client
  participant TL as TimeLimiter 2s
  participant Bank

  C->>TL: chargeAsync
  TL->>Bank: start
  alt bank < 2s
    Bank-->>C: CAPTURED
  else bank slow
    TL-->>C: TimeoutException → PENDING
    Note over Bank: cancelRunningFuture may interrupt
  end`,
    together: 'TimeLimiter sits between RateLimiter and Bulkhead in default AOP. Retry outside means 3 × 2s worst case — budget that. Pair THREADPOOL bulkhead with TimeLimiter.',
    mistake: 'Only TimeLimiter, no HTTP timeouts. Or sync method with @TimeLimiter (it will not apply).',
    interview: 'TimeLimiter bounds async wait. HTTP timeouts bound sockets. Nested budgets: outer must be larger, never smaller inside.',
  },
  {
    id: 'cache',
    title: 'Cache',
    emoji: '📦',
    analogy: 'Sticky note on the monitor: don’t ask the bank the FX rate 1000 times a second.',
    oneLiner: 'Reuse a previous answer for read-mostly data. Never treat cache as the ledger for captures.',
    simple:
      'Resilience4j Cache is a decorator over JCache (javax.cache): on miss it calls the supplier and stores the result; on hit it skips the bank. The lab uses the more common production pair: Spring Cache + Caffeine (@Cacheable). Same idea. Redis is for multi-pod shared reads.',
    types: [
      {
        name: 'Resilience4j Cache (JCache decorator)',
        when: 'You already have a JCache provider (Ehcache, Hazelcast, Caffeine-jcache).',
        how: 'Cache.decorateSupplier(jcache, () -> bank.fx()). Resilience4j does not store bytes itself — the provider does.',
      },
      {
        name: 'Spring Cache + Caffeine (this lab)',
        when: 'Local, per-pod, reference data. GET /api/fx.',
        how: '@Cacheable("fxRates") + spring.cache.caffeine spec maximumSize + expireAfterWrite.',
      },
      {
        name: 'Distributed cache (Redis)',
        when: 'Many pods must see the same FX / calendar.',
        how: 'Spring Redis cache manager or Lettuce. Still TTL. Not a source of truth for money.',
      },
      {
        name: 'Cache-aside (most common)',
        when: 'You control miss path.',
        how: 'App checks cache → miss → call bank → put. Lab FX is this pattern via @Cacheable.',
      },
      {
        name: 'Read-through',
        when: 'Cache loader knows how to fetch.',
        how: 'JCache CacheLoader. R4j decorator is similar: supplier runs on miss.',
      },
      {
        name: 'TTL / size eviction',
        when: 'Always bound staleness and memory.',
        how: 'expireAfterWrite=30s, maximumSize=1000. FX can be 30s stale; “account frozen” cannot.',
      },
    ],
    uses: [
      'FX rates, holiday calendars, BIN country, feature flags',
      'NOT payment capture, balances, “paid?”, authz decisions',
      'Stampede: lock/singleflight on miss or accept a small thundering herd',
    ],
    yaml: `spring:
  cache:
    type: caffeine
    caffeine:
      spec: maximumSize=1000,expireAfterWrite=30s

# Conceptual JCache + R4j (not required in this lab)
# Cache<String, BigDecimal> jcache = cachingProvider.getCache("fx");
# io.github.resilience4j.cache.Cache<String, BigDecimal> r4j =
#     io.github.resilience4j.cache.Cache.of(jcache);`,
    java: `@Service
public class FxRateService {
  @Cacheable("fxRates")
  public BigDecimal usdInr() {
    bankHits.incrementAndGet();
    return bankFx.fetch(); // miss only
  }
}

// GET /api/fx twice → bankHits stays 1 until TTL
// Do NOT @Cacheable charge() — captures are not cache data`,
    mermaid: `sequenceDiagram
  autonumber
  participant C as Client
  participant FX as FxRateService
  participant Cache as Caffeine
  participant Bank

  C->>FX: GET /api/fx
  FX->>Cache: lookup
  Cache-->>FX: miss
  FX->>Bank: fetch
  Bank-->>FX: 83.25
  FX->>Cache: store TTL 30s
  FX-->>C: rate bankHits=1
  C->>FX: GET /api/fx
  FX->>Cache: lookup
  Cache-->>FX: hit
  FX-->>C: rate bankHits still 1`,
    together: 'Cache is orthogonal to CB/Retry. Put it outside expensive calls (FX), never around capture. A CB on FX plus cache means OPEN still can serve stale-within-TTL if you fallback to cache.',
    mistake: 'Caching “payment status=CAPTURED” as truth. Or unbounded local maps.',
    interview: 'R4j Cache decorates JCache. Lab uses Spring+Caffeine. Types: local vs Redis, cache-aside vs read-through, TTL vs size. Never cache the ledger.',
  },
  {
    id: 'micrometer',
    title: 'Micrometer',
    emoji: '📊',
    analogy: 'Dashboard cameras on every compartment — you cannot tune what you cannot see.',
    oneLiner: 'Metrics for every module: state, rejects, retries, occupancy. Actuator + Prometheus.',
    simple:
      'Resilience4j publishes Micrometer binders. Spring Boot Actuator exposes /actuator/circuitbreakers, retries, ratelimiters, bulkheads, prometheus. Alert on OPEN, BH rejects, retry exhaustion — not on a single 503.',
    types: [
      {
        name: 'CircuitBreaker metrics',
        when: 'Always on money paths.',
        how: 'State, failure rate, slow call rate, not-permitted calls. GET /actuator/circuitbreakers.',
      },
      {
        name: 'Retry / RL / BH / TL',
        when: 'Always if the module is on.',
        how: 'Successful vs failed retries; available permissions; concurrent calls; timeouts.',
      },
      {
        name: 'Events',
        when: 'Debug a incident.',
        how: 'circuitbreakerevents, retryevents. Log reason class, never PAN.',
      },
    ],
    uses: [
      'SLO: percent PENDING vs CAPTURED',
      'Capacity: bulkhead rejected + RL not permitted',
      'Recovery: time spent OPEN',
    ],
    yaml: `management:
  endpoints:
    web:
      exposure:
        include: health,prometheus,metrics,circuitbreakers,retries,ratelimiters,bulkheads,timelimiters
  prometheus:
    metrics:
      export:
        enabled: true`,
    java: `// curl :8087/actuator/circuitbreakers
// curl :8087/actuator/prometheus | grep resilience4j
// Binders are auto-configured by resilience4j-micrometer + Boot actuator`,
    mermaid: `sequenceDiagram
  autonumber
  participant Pay as PaymentGatewayClient
  participant R4j as Modules
  participant Mic as Micrometer
  participant Prom as Prometheus

  Pay->>R4j: charge
  R4j->>Mic: increment calls / record state
  Prom->>Mic: scrape /actuator/prometheus
  Note over Prom: alert CB OPEN, BH full, RL denied`,
    together: 'Micrometer is not in the call onion — it observes the onion. Keep it on when you stack all modules.',
    mistake: 'No alerts, or alerting on every retry attempt.',
    interview: 'R4j + Micrometer gives per-instance metrics. Actuator names map 1:1 to YAML instance names.',
  },
  {
    id: 'all',
    title: 'All together',
    emoji: '🧩',
    analogy: 'You do not put every lock on every door. Payment door gets the full set; FX door gets a cache.',
    oneLiner: 'Yes — you can implement all modules in one app. You should not put all of them on every method.',
    simple:
      'The lab already stacks Retry + CircuitBreaker + RateLimiter + Semaphore Bulkhead on charge(). TimeLimiter + ThreadPool Bulkhead on fraud. Cache on FX. Micrometer watches all. Default Spring AOP order (not annotation order): Retry → CircuitBreaker → RateLimiter → TimeLimiter → Bulkhead → method.',
    types: [
      {
        name: 'Full money stack (sync)',
        when: 'POST /api/orders charge().',
        how: '@Retry @CircuitBreaker @RateLimiter @Bulkhead(SEMAPHORE). Fallback PENDING. Idempotency outside.',
      },
      {
        name: 'Async / isolation stack',
        when: 'Fraud, notifications.',
        how: '@Bulkhead(THREADPOOL) + @TimeLimiter. Optional CB. No money retry.',
      },
      {
        name: 'Read stack',
        when: 'FX, calendars.',
        how: 'Cache (+ optional CB). No Retry storm on a miss stampede without singleflight.',
      },
    ],
    uses: [
      'One Spring Boot app, many named instances',
      'Different YAML per dependency',
      'Ignore RL/BH exceptions on CB so the bank circuit stays honest',
    ],
    yaml: `# Same application.yml can declare ALL of these together — lab already does.
resilience4j:
  circuitbreaker.instances.payment: { ... }
  retry.instances.payment: { ... }
  ratelimiter.instances.paymentApi: { ... }
  bulkhead.instances.payment: { ... }          # semaphore
  thread-pool-bulkhead.instances.fraud: { ... }
  timelimiter.instances.payment: { ... }
  timelimiter.instances.fraud: { ... }`,
    java: `// PaymentGatewayClient.charge — four modules + fallback
@RateLimiter(name = "paymentApi")
@Bulkhead(name = "payment")
@CircuitBreaker(name = "payment", fallbackMethod = "pendingFallback")
@Retry(name = "payment")
public PaymentResult charge(PayRequest request) { return bank.charge(request); }

// FraudCheckClient — different modules
@Bulkhead(name = "fraud", type = Bulkhead.Type.THREADPOOL)
@TimeLimiter(name = "fraud")
public CompletableFuture<String> screen(String customerId) { ... }

// FxRateService — cache, not the money onion
@Cacheable("fxRates")
public BigDecimal usdInr() { ... }`,
    mermaid: `sequenceDiagram
  autonumber
  participant C as Client
  participant Idem as IdempotencyStore
  participant R as Retry
  participant CB as CircuitBreaker
  participant RL as RateLimiter
  participant BH as Semaphore BH
  participant Bank
  participant Fraud as ThreadPool BH + TL
  participant FX as Cache

  C->>Idem: POST /api/orders
  Idem->>Fraud: screen customer
  Idem->>R: charge
  R->>CB: attempt
  CB->>RL: permit?
  RL->>BH: in-flight slot?
  BH->>Bank: HTTP
  Bank-->>C: CAPTURED or PENDING
  Note over C,FX: FX reads use Cache — not this onion
  Note over R,BH: Spring order Retry then CB then RL then BH`,
    together: 'Yes: all modules in one production app. No: not all on one method. Money = admit+isolate+break+retry+truthful fallback. Fraud = isolate+time-box. FX = cache.',
    mistake: 'Copy-pasting the full annotation stack onto getters, caches, and Kafka listeners.',
    interview: 'I stack modules by failure mode. Same process can run semaphore BH, threadpool BH, RL, CB, Retry, TimeLimiter, Cache, Micrometer — each named instance owns one dependency.',
  },
];
