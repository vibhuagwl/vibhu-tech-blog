import type {CommSection} from './types';

export const RESILIENCE: CommSection[] = [
  {
    id: 'timeout-connect',
    title: 'Connect Timeout',
    what:
      'Maximum wall-clock time to establish a TCP connection and complete TLS handshake to the upstream host. If the remote host is down, firewalled, or routing is broken, connect timeout fails fast instead of hanging on SYN retransmits.',
    why:
      'Default infinite connect wait holds threads and connection pool slots. Under dependency outage, unbounded connect blocks exhaust the fleet — classic cascading failure precursor.',
    when:
      'Every HttpClient, RestClient, WebClient, JDBC URL, gRPC channel, and Feign client. Typical production: 200ms–1s for same-AZ; 2–3s cross-region only when justified.',
    how:
      'Java 21 HttpClient: `HttpClient.newBuilder().connectTimeout(Duration.ofMillis(500))`. Boot 3 RestClient: builder `.requestFactory(ClientHttpRequestFactories.get(SimpleClientHttpRequestFactory.class, settings -> settings.setConnectTimeout(500)))`. Feign: `spring.cloud.openfeign.client.config.default.connectTimeout=500`. Separate from read timeout.',
    flow: `sequenceDiagram
  participant C as Client
  participant S as Server
  C->>S: SYN
  Note over C: connect timer 500ms
  alt no SYN-ACK
    C-->>C: ConnectTimeoutException
  else handshake ok
    C->>S: TLS + request`,
    failure:
      'Connect timeout too short during GC pause or cold start — false failures. Too long — thread pile-up during AZ failure. Confusing connect vs DNS timeout in logs.',
    tradeoff:
      'Short connect (200ms) frees capacity fast but increases false positives on noisy networks. Long connect masks dead dependencies.',
    security:
      'Failed connect should not leak internal host topology in client error messages. Log details server-side only.',
    observability:
      'Metric: `connect_timeout_count` by dependency. Trace span attribute `connect_ms`. Alert spike correlating with network or security group change.',
    trap:
      'Setting only `server.tomcat.connection-timeout` — that is inbound accept timeout, not outbound connect to dependencies.',
    interviewAnswer:
      'Connect timeout bounds TCP+TLS establishment. It is separate from read timeout which bounds idle wait after connected. I set connect around 500ms for same-AZ dependencies so dead hosts fail fast and release threads. Outbound connect is configured on the client, not Tomcat server timeout.',
    remember: [
      'Connect = TCP + TLS handshake only',
      'Typical same-AZ: 200ms–1s',
      'Independent of read/response timeout',
      'HttpClient.connectTimeout / RestClient factory',
    ],
    oneLiner: 'Max wait to establish TCP/TLS — fail fast when host is unreachable.',
  },
  {
    id: 'timeout-read-write-response',
    title: 'Read, Write & Response Timeouts',
    what:
      'Read timeout: max idle time waiting for response bytes after connection established. Write timeout: max time to send request body (slow client upload). Response timeout (HttpClient): end-to-end ceiling for entire exchange including connect + transfer.',
    why:
      'Connected but hung server (thread pool exhausted, lock contention) never sends bytes — without read timeout the client waits forever. Large uploads need write timeout to prevent slowloris-style slot exhaustion.',
    when:
      'Read: all HTTP clients — typical 2–5s for user-facing APIs. Write: file upload, bulk POST. Response/overall: outer budget for chained calls including retries.',
    how:
      'HttpClient: `.timeout(Duration.ofSeconds(3))` on HttpRequest = response timeout. RestClient Boot 3: read timeout on request factory. WebClient: `responseTimeout(Duration.ofSeconds(3))`. Reactor Netty: `ReadTimeoutHandler`, `WriteTimeoutHandler` in pipeline. gRPC: deadline on stub call.',
    flow: `sequenceDiagram
  participant C as Client
  participant S as Server
  C->>S: request sent (write timeout)
  Note over C,S: read timeout on idle
  alt server slow
    S-->>C: bytes after 10s
    C-->>C: read timeout at 3s
  end`,
    failure:
      'Read timeout on streaming response (SSE, large download) — need per-chunk idle timeout not total transfer. Response timeout shorter than connect+read sum — always fails. Retry without subtracting elapsed time.',
    tradeoff:
      'Aggressive read timeout improves tail under failure; increases false timeout rate on cold JVM or DB spike.',
    security:
      'Timeout errors return generic 504 to client; do not include upstream stack traces.',
    observability:
      'Separate metrics: read_timeout vs connect_timeout. Trace: `http.response.duration` vs `http.connect.duration`.',
    trap:
      'One `timeout(3s)` on HttpRequest is response timeout (entire call), not the same as socket read timeout in older Apache HttpClient APIs.',
    interviewAnswer:
      'Read timeout fires when no bytes arrive for N ms after connect — catches hung servers. Write timeout limits upload stall. Response timeout is the overall HttpClient ceiling for the full exchange. I set read based on dependency p99; response timeout must cover connect + read + small retry margin or exclude retries from same budget.',
    remember: [
      'Read = idle wait for response bytes',
      'Write = stall sending request body',
      'Response timeout = full exchange ceiling',
      'Streaming needs chunk idle not total time',
    ],
    oneLiner: 'Read waits for bytes; write limits upload stall; response caps entire exchange.',
  },
  {
    id: 'timeout-idle-propagation',
    title: 'Idle Timeout & Deadline Propagation',
    what:
      'Idle timeout closes connections with no traffic for N seconds (HTTP keep-alive pool hygiene, load balancer idle timeout). Deadline propagation forwards remaining overall budget downstream via gRPC deadline or `X-Deadline-Epoch-Ms` header so deep chains do not each use full local timeout.',
    why:
      'Without propagation, Service A (3s) calls B (3s) calls C (3s) — user sees 9s. ALB idle timeout 60s vs app 5s causes mysterious disconnect mid-request. Stale keep-alive to dead pod until idle fires.',
    when:
      'Any sync microservice chain >1 hop. gRPC mandatory deadlines. HTTP: propagate remaining ms on internal calls. Align ALB/Gateway/Envoy route timeout with app deadline.',
    how:
      'gRPC: `stub.withDeadlineAfter(remaining, SECONDS)`. HTTP header: set `X-Deadline-Epoch-Ms` at edge; each hop `min(localReadTimeout, remainingBudget)`. Resilience4j TimeLimiter: `timeoutDuration` with `cancelRunningFuture=true`. Boot 3 filter extracts header and sets RestClient timeout dynamically.',
    flow: `sequenceDiagram
  participant Edge as Gateway 5s budget
  participant A as Service A
  participant B as Service B
  Edge->>A: deadline epoch T
  A->>A: remaining = T - now = 4s
  A->>B: header remaining 4s
  B->>B: local timeout min(2s, 4s)`,
    failure:
      'Clock skew breaks epoch headers — use monotonic budget ms from edge only. Missing propagation on one hop — budget exhausted silently downstream. Idle timeout < long poll duration.',
    tradeoff:
      'Propagation adds header contract coupling between teams. Without it, simpler code but unpredictable tail latency.',
    security:
      'Deadline header is not authentication — downstream still validates caller. Reject absurd future epochs (DoS).',
    observability:
      'Trace attribute `deadline_remaining_ms` at each hop. Alert when downstream starts with <100ms budget — misconfigured chain.',
    trap:
      'Each service using independent 30s timeout — user-facing SLO 2s impossible. Propagate or use async.',
    interviewAnswer:
      'Deadline propagation subtracts elapsed time at each hop so the chain shares one user-facing budget. gRPC deadlines are native; HTTP uses epoch-ms header. I align ingress timeout, mesh route timeout, and app TimeLimiter to the same root budget. Idle timeout on LB and connection pool prevents holding dead TCP sessions.',
    remember: [
      'Propagate remaining budget — not full timeout per hop',
      'gRPC deadline native; HTTP epoch-ms header',
      'Align ALB/Gateway/Envoy with app deadline',
      'Idle timeout cleans stale keep-alive',
    ],
    oneLiner: 'Share one end-to-end deadline across hops; idle timeout cleans dead connections.',
  },
  {
    id: 'retry-exponential-backoff-jitter',
    title: 'Retry with Exponential Backoff & Jitter',
    what:
      'Re-attempt failed operations for transient errors (connection reset, 503, timeout) with increasing delay between attempts: base × 2^attempt, plus random jitter to desynchronize retries across clients.',
    why:
      'Brief blips (pod restart, LB glitch) succeed on retry. Exponential backoff gives recovering dependency time to breathe. Jitter prevents synchronized retry waves after shared outage.',
    when:
      'Idempotent reads, safe writes with idempotency keys, Kafka consumer retry topics. Never blind retry on 400/409 or non-idempotent POST without key.',
    how:
      'Resilience4j Boot 3: `resilience4j.retry.instances.payment.maxAttempts=3`, `waitDuration=200ms`, `enableExponentialBackoff=true`, `exponentialBackoffMultiplier=2`, random jitter via `IntervalFunction.ofExponentialRandomBackoff`. Manual Java 21: `Thread.sleep(base * 2^i + random(0, jitter))`. Only retry classified exceptions.',
    flow: `stateDiagram-v2
  [*] --> Attempt1
  Attempt1 --> Success
  Attempt1 --> Wait1: transient fail
  Wait1 --> Attempt2
  Attempt2 --> Success
  Attempt2 --> Wait2: fail
  Wait2 --> Attempt3
  Attempt3 --> Fail: exhausted`,
    failure:
      'Retry on 500 from business validation — amplifies load. No maxAttempts — infinite loop. Fixed backoff without jitter — thundering herd on recovery.',
    tradeoff:
      'More attempts improve perceived availability on transient errors; multiply load and tail latency on persistent failure.',
    security:
      'Do not retry auth failures (401/403) — credential stuffing amplification. Rate limit retry-generating clients at gateway.',
    observability:
      'Metrics: `retry_calls_total`, `retry_success_after_retry`. Log attempt number and exception class, not sensitive payload.',
    trap:
      'Spring @Retryable on `@Transactional` write — retry after partial commit causes duplicate if not idempotent.',
    interviewAnswer:
      'I retry only transient failures with bounded maxAttempts, exponential backoff, and jitter. Resilience4j IntervalFunction.ofExponentialRandomBackoff is standard in Boot 3. Retries on writes require idempotency keys. I classify exceptions explicitly — never retry business 4xx.',
    remember: [
      'Exponential: base × 2^attempt + jitter',
      'maxAttempts includes first try or not — check config',
      'Retry transient: timeout, 503, connect reset',
      'Writes need idempotency key before retry',
    ],
    oneLiner: 'Bounded retries with exponential backoff and jitter — only on transient, idempotent ops.',
  },
  {
    id: 'retry-budget-storm',
    title: 'Retry Budget & Retry Storm',
    what:
      'Retry budget caps total retry attempts as a fraction of successful requests (e.g. 10% retry tokens per second) so retries cannot dominate traffic during outages. Retry storm: many clients × many attempts × deep chains multiply load on already-failing dependency.',
    why:
      'Payment DB slow → every service retries 3x → DB gets 3x QPS → complete meltdown. Budget preserves capacity for successful paths and signals systemic failure when budget exhausted.',
    when:
      'Large fleets calling shared dependencies (payment gateway, identity). Istio `maxRetries` + app budget. Google SRE retry budget practice at org scale.',
    how:
      'Resilience4j: limit `maxAttempts` to 2–3 globally. Custom `RetryBudget` token bucket: allow retries only when `retry_tokens > 0`, refill proportional to success rate. Envoy: `retry_budget.percent=20` in mesh config. Circuit breaker opens when retries dominate — stop adding load.',
    flow: `flowchart TB
  subgraph Storm
    C1[1000 clients] -->|3 retries| D[Dependency]
    C2[1000 clients] -->|3 retries| D
  end
  D -->|overloaded| More503
  More503 --> MoreRetries`,
    failure:
      'Budget too tight — legitimate transient failures become user errors. No budget — storm during regional outage. Per-client retry without global view — budget per instance still sums badly.',
    tradeoff:
      'Budget sacrifices individual request success during crisis to protect system survival.',
    security:
      'Attackers triggering 503 to exhaust peer retry budget — pair with rate limiting and auth.',
    observability:
      'Dashboard: retry QPS vs success QPS ratio. Alert retry_ratio > 0.3 for 5 min. Trace retry count per root request — flag >2 as misconfiguration.',
    trap:
      'Mesh retries × app retries × client mobile retries = 27 attempts — always coordinate layers.',
    interviewAnswer:
      'A retry storm multiplies traffic to a sick dependency until it never recovers. I cap maxAttempts low (2-3), use jitter, implement retry budget as fraction of success traffic, and open circuit breaker when failures persist. Critical rule: one layer owns retries — never mesh + Resilience4j + client SDK all retrying.',
    remember: [
      'clients × attempts × hops = storm multiplier',
      'Retry budget = % of success traffic',
      'Open CB when retries cannot help',
      'Single layer owns retry policy',
    ],
    oneLiner: 'Cap retry traffic with budgets — storms multiply load on failing dependencies.',
  },
  {
    id: 'circuit-breaker-states',
    title: 'Resilience4j Circuit Breaker States',
    what:
      'Circuit breaker tracks failure rate in sliding window. CLOSED: normal calls pass. OPEN: fail fast without calling dependency. HALF_OPEN: probe limited calls to test recovery. Transitions based on `failureRateThreshold`, `slowCallRateThreshold`, `waitDurationInOpenState`.',
    why:
      'Calling a timing-out payment service 1000 times/sec wastes threads and deepens outage. Fail fast + fallback preserves capacity and gives dependency recovery time.',
    when:
      'Every external dependency with measurable failure modes. Resilience4j `@CircuitBreaker` on RestClient/Feign calls. Pair with TimeLimiter — slow calls count toward open threshold.',
    how:
      'Boot 3: `resilience4j.circuitbreaker.instances.payment.failure-rate-threshold=50`, `sliding-window-size=10`, `wait-duration-in-open-state=30s`, `permitted-number-of-calls-in-half-open-state=5`. Annotate: `@CircuitBreaker(name="payment", fallbackMethod="paymentFallback")`. Monitor `CircuitBreaker.Metrics`.',
    flow: `stateDiagram-v2
  CLOSED --> OPEN: failure rate > threshold
  OPEN --> HALF_OPEN: wait duration elapsed
  HALF_OPEN --> CLOSED: probes succeed
  HALF_OPEN --> OPEN: probes fail`,
    failure:
      'Window too small — flapping OPEN on two errors. No half-open probes — stuck OPEN until manual reset. Fallback throws — CB open + fallback exception = worse UX. Ignoring slow calls — only 5xx counted while latency kills SLO.',
    tradeoff:
      'Aggressive CB protects fleet; causes false fail-fast during brief spikes. Tuning requires production failure rate data.',
    security:
      'OPEN state response should not reveal dependency internal state. Fallback data must respect same auth as primary.',
    observability:
      'Metrics: `resilience4j.circuitbreaker.state`, failure rate, slow call rate. Alert OPEN > 1 min for tier-1 deps. Trace tag `circuit_breaker=open`.',
    trap:
      'Calling CB-protected method from within same service without `@CircuitBreaker` annotation on the right bean — self-invocation bypasses proxy.',
    interviewAnswer:
      'Resilience4j circuit breaker has CLOSED, OPEN, and HALF_OPEN. When failure rate in sliding window exceeds threshold, it opens and fail-fasts for waitDuration, then half-open allows probe calls. I tune window size and slow call threshold from production metrics. CB is per-dependency call path — different from mesh outlier detection which is per-host.',
    remember: [
      'CLOSED → OPEN → HALF_OPEN → CLOSED',
      'Slow calls can trip CB via slowCallRateThreshold',
      'Half-open probes test recovery',
      'Fail-fast preserves thread pool capacity',
    ],
    oneLiner: 'CLOSED/OPEN/HALF_OPEN — fail fast when failure rate exceeds sliding window threshold.',
    tables: [
      {
        headers: ['State', 'Behavior', 'Typical trigger'],
        rows: [
          ['CLOSED', 'All calls pass to dependency', 'Normal operation'],
          ['OPEN', 'Fail fast, no dependency call', 'failureRate > 50% in window'],
          ['HALF_OPEN', 'Limited probe calls allowed', 'waitDurationInOpenState elapsed'],
        ],
      },
    ],
  },
  {
    id: 'bulkhead-isolation',
    title: 'Bulkhead Isolation',
    what:
      'Limits concurrent calls to a dependency (thread pool or semaphore) so one slow dependency cannot exhaust the entire application thread budget. Named bulkheads isolate payment, inventory, and notification paths.',
    why:
      'Without bulkhead, 500 threads blocked on slow credit bureau starve order reads on same Tomcat pool — unrelated features fail together.',
    when:
      'Mixed criticality on shared runtime (Tomcat threads). Resilience4j `@Bulkhead` or `@ThreadPoolBulkhead`. Reactive: separate WebClient connection pools per host.',
    how:
      'Resilience4j: `resilience4j.bulkhead.instances.creditBureau.max-concurrent-calls=10`, `max-wait-duration=0` (fail immediately when full). `@Bulkhead(name="creditBureau")` on bureau client. ThreadPoolBulkhead for CPU-bound isolation. Do not bulkhead size = total threads.',
    flow: `flowchart TB
  subgraph App threads 200
  BH1[Bulkhead payment 20]
  BH2[Bulkhead bureau 10]
  BH3[Bulkhead notify 15]
  end
  BH1 --> Pay
  BH2 --> Bureau
  BH3 --> Email`,
    failure:
      'max-wait-duration too long — threads still pile up waiting for bulkhead slot. One bulkhead for everything — no isolation benefit. Pool too small — false rejections under legitimate peak.',
    tradeoff:
      'Bulkhead caps blast radius; undersized pools cause artificial rejection under load.',
    security:
      'Bulkhead rejection (503) same as overload — do not leak which dependency is saturated.',
    observability:
      'Metrics: `bulkhead_available_concurrent_calls`, `bulkhead_max_allowed`. Alert sustained zero available for critical bulkhead.',
    trap:
      'Bulkhead on @Async thread pool without sizing `@Async` pool — isolation on wrong layer.',
    interviewAnswer:
      'Bulkhead limits concurrent calls per dependency so one slow external API cannot consume all threads. Resilience4j semaphore bulkhead rejects immediately when full; thread pool bulkhead queues with cap. I size from expected concurrent p99 latency × target QPS for that dependency only.',
    remember: [
      'Semaphore vs thread pool bulkhead',
      'max-wait-duration=0 for fail-fast',
      'Size per dependency not global',
      'Prevents slow dep starving others',
    ],
    oneLiner: 'Cap concurrent calls per dependency — slow API cannot exhaust all threads.',
  },
  {
    id: 'fallback-dangers',
    title: 'Fallback Dangers & Safe Degradation',
    what:
      'Fallback executes alternate logic when CB is OPEN, timeout fires, or bulkhead rejects: return cached value, default response, or queue for async. Dangerous fallbacks lie about state, skip auth, or mask data corruption.',
    why:
      'Fallback improves UX during partial outage — show stale catalog instead of blank page. Wrong fallback charges wrong price or shows another user\'s cached data — worse than hard failure.',
    when:
      'Read paths with stale tolerance (product catalog, recommendations). Avoid fallback on financial authorize unless explicit degraded mode with business sign-off.',
    how:
      'Resilience4j: `@CircuitBreaker(fallbackMethod="getProductFallback")` — fallback receives original args + exception. Cache fallback: Caffeine with TTL + tenant key. Never fallback that returns success for failed payment. Log every fallback invocation with metric `fallback_invoked`.',
    flow: `sequenceDiagram
  participant S as Service
  participant P as Payment API
  participant C as Cache
  S->>P: charge
  P-->>S: timeout
  S->>C: fallback read stale balance?
  Note over S: WRONG for debit
  S-->>S: return 503 + retry guidance`,
    failure:
      'Fallback cache cross-tenant leak — missing tenantId in key. Fallback masks persistent bug — CB keeps closing while data wrong. Exception swallowed in fallback — silent data loss.',
    tradeoff:
      'Stale read fallback trades consistency for availability — explicit product decision required.',
    security:
      'Fallback cache must use same auth context. Never bypass authorization in fallback path. PII in cached fallback encrypted.',
    observability:
      'Metric: `fallback_rate` by dependency and method. Alert fallback >5% — primary path unhealthy, not "working as designed."',
    trap:
      'Interview answer "always implement fallback" — wrong for money movement. Correct: fail closed with clear error.',
    interviewAnswer:
      'Fallback is valuable for read-heavy stale-tolerant paths but dangerous for writes and payments. I fail closed on charge/capture — return 503 with idempotency key guidance. For catalog reads, stale cache fallback with TTL is fine. Every fallback is logged and metered — high fallback rate is an incident, not success.',
    remember: [
      'Fail closed for payments and auth',
      'Cache fallback needs tenant-scoped keys',
      'High fallback rate = primary unhealthy',
      'fallbackMethod must not swallow errors silently',
    ],
    oneLiner: 'Fallback helps reads with stale tolerance — fail closed on money and auth.',
  },
  {
    id: 'idempotency-keys',
    title: 'Idempotency Keys',
    what:
      'Client sends unique key (UUID) on mutating requests; server stores key → result mapping and returns cached outcome on duplicate delivery instead of re-executing. Enables safe retries after timeout.',
    why:
      'Client timeout does not mean server failed — retry without idempotency double-charges. Kafka at-least-once delivery requires same dedupe at consumer.',
    when:
      'POST payment, order create, transfer. Stripe `Idempotency-Key` header pattern. DB unique constraint on `idempotency_key` column.',
    how:
      'Boot 3 filter: read `Idempotency-Key` header → `INSERT INTO idempotency_keys (key, status, response_hash) ON CONFLICT` or Redis `SET key NX EX 86400`. Process only if new key. Return stored response body on replay. TTL 24h minimum for client retry window.',
    flow: `sequenceDiagram
  participant C as Client
  participant S as Server
  participant DB as DB
  C->>S: POST /pay Idempotency-Key: abc
  S->>DB: insert key abc PENDING
  S->>S: process payment
  S->>DB: key abc COMPLETED + response
  C->>S: retry same key abc
  S->>DB: find abc COMPLETED
  S-->>C: same response 200`,
    failure:
      'Key only in memory — lost on restart, duplicate charge. No TTL — table infinite growth. Different body same key — must reject 422. Race: two parallel requests same key — need DB unique constraint or distributed lock.',
    tradeoff:
      'Storage and lookup latency vs correctness under retry. Redis fast but need persistence for audit.',
    security:
      'Key scoped to authenticated user — cannot replay another user\'s key. Do not accept client-chosen keys without auth binding.',
    observability:
      'Metrics: `idempotency_replay_total`, `idempotency_conflict`. Audit log all keys for financial APIs.',
    trap:
      'Idempotency key on read GET — unnecessary. Key without transactional insert — race allows double process.',
    interviewAnswer:
      'Idempotency keys let clients safely retry mutating calls after timeout. Server stores key with response on first success; duplicates return same outcome without re-execution. I use DB unique constraint on (user_id, idempotency_key) inside the same transaction as business write. Essential companion to retry and at-least-once messaging.',
    remember: [
      'Timeout ≠ failure — retry needs key',
      'DB unique constraint prevents double process',
      'Return same response body on replay',
      'Bind key to authenticated principal',
    ],
    oneLiner: 'Unique client key ensures duplicate requests replay cached outcome — safe retries.',
  },
  {
    id: 'distributed-tx-2pc',
    title: 'Distributed Transactions & 2PC Limits',
    what:
      'Distributed transaction coordinates commit/rollback across multiple databases or services — classic two-phase commit (2PC): prepare all participants, then commit if all prepared. XA JDBC transactions are 2PC in Java.',
    why:
      'Business wants atomicity: money debited and order created together across services. 2PC provides strong atomicity in theory.',
    when:
      'Rarely in microservices at scale — single database transaction preferred. XA only in legacy enterprise integrations. Interview topic to explain why sagas replaced 2PC.',
    how:
      'Java XA: Atomikos + multiple `DataSource` — high latency, locks held. Spring `@Transactional` does NOT span microservices. Modern alternative: saga + outbox. Never 2PC across Kafka and Postgres.',
    flow: `sequenceDiagram
  participant C as Coordinator
  participant A as Service A DB
  participant B as Service B DB
  C->>A: prepare
  C->>B: prepare
  A-->>C: prepared
  B-->>C: prepared
  C->>A: commit
  C->>B: commit`,
    failure:
      'Coordinator crash after prepare — participants blocked until recovery. Partial prepare timeout — heuristic rollback errors. Cross-region 2PC — latency and partition intolerance. Locks on hot rows — throughput collapse.',
    tradeoff:
      '2PC: strong consistency, poor availability under partition and scale. Saga: eventual consistency, better availability.',
    security:
      'XA credentials across DBs expand blast radius — prefer per-service DB credentials.',
    observability:
      'XA in-doubt transaction count on DB. Alert prepared transactions older than 60s.',
    trap:
      'Suggesting 2PC for order + Kafka publish — Kafka is not XA participant. Use outbox.',
    interviewAnswer:
      'Two-phase commit coordinates atomic commit across participants but blocks on coordinator failure and hates partitions — CP not AP. In microservices I avoid cross-service 2PC. I use per-service local transactions plus saga or outbox for cross-boundary consistency. XA within one service on one DB is fine; XA across microservices is an anti-pattern at scale.',
    remember: [
      '2PC = prepare all then commit all',
      'Blocks on coordinator failure',
      'Not across Kafka + DB',
      'Saga/outbox replace cross-service 2PC',
    ],
    oneLiner: '2PC gives atomicity but blocks on failure — avoid across microservices.',
  },
  {
    id: 'saga-pattern',
    title: 'Saga — Choreography & Orchestration',
    what:
      'Saga breaks distributed transaction into local transactions with compensating actions. Choreography: services react to events (order created → payment charged → shipping reserved). Orchestration: central coordinator sends commands and tracks state machine.',
    why:
      'Long-running business flows (travel booking) cannot hold 2PC locks. Sagas accept temporary inconsistency with defined compensation paths.',
    when:
      'Multi-step workflows across services without single DB. Payment + inventory + notification. Camunda/Zeebe for orchestration; Kafka events for choreography.',
    how:
      'Choreography Boot 3: order service publishes `OrderCreated` → payment `@KafkaListener` charges → publishes `PaymentCompleted` or `PaymentFailed` → order compensates. Orchestration: Zeebe BPMN process `charge-payment` service task with retry. Each step idempotent; compensating transaction reverses prior step.',
    flow: `sequenceDiagram
  participant O as Order
  participant P as Payment
  participant I as Inventory
  O->>P: OrderCreated event
  P->>I: PaymentCompleted
  I->>O: InventoryReserved
  Note over P: fail path
  P->>O: PaymentFailed
  O->>O: cancel order compensate`,
    failure:
      'Missing compensation — orphaned reservation. Duplicate events without inbox — double charge. Orchestrator SPOF without HA. Cyclic choreography — hard to trace.',
    tradeoff:
      'Choreography: decoupled, harder to debug. Orchestration: visible state machine, central dependency.',
    security:
      'Saga events carry auth context or correlation id — consumers validate tenant before acting.',
    observability:
      'Saga instance id in every event header. Dashboard: in-progress sagas age > SLA. Distributed trace links all steps.',
    trap:
      'Compensation is not always possible — physical shipment cannot be "un-shipped" — design forward recovery.',
    interviewAnswer:
      'Sagas use local transactions plus compensating transactions instead of 2PC. Choreography uses events; orchestration uses a coordinator like Camunda. Each step must be idempotent; failures trigger compensate or retry policies. I prefer orchestration for complex flows needing visibility; choreography for simple event chains.',
    remember: [
      'Local TX per step + compensate on fail',
      'Choreography = events; orchestration = coordinator',
      'Every step idempotent',
      'Compensation not always possible — design for it',
    ],
    oneLiner: 'Local transactions with compensating steps — choreography via events or orchestration via coordinator.',
  },
  {
    id: 'transactional-outbox',
    title: 'Transactional Outbox Pattern',
    what:
      'Business row and outbound message recorded in same database transaction in an outbox table; separate relay process publishes to Kafka and marks rows published. Atomic write without dual-write to DB and broker.',
    why:
      'Order saved but Kafka publish fails → downstream never ships. Kafka OK but DB rolls back → ghost message. Outbox makes DB the single commit point.',
    when:
      'Every event emit from domain service with Postgres/MySQL. Debezium CDC or polling relay. Pairs with inbox on consumer.',
    how:
      'Boot 3 `@Transactional` save Order + OutboxEvent same TX. Relay `@Scheduled` poll `WHERE published_at IS NULL LIMIT 100 FOR UPDATE SKIP LOCKED` → `kafkaTemplate.send` → update published_at. Producer `acks=all`, idempotent producer enabled.',
    flow: `flowchart LR
  TX[@Transactional] --> OrderRow
  TX --> OutboxRow
  Relay[Polling relay] --> Kafka
  OutboxRow --> Relay`,
    failure:
      'Relay crash after publish before mark — duplicate event (consumer idempotent). No index on unpublished — relay slow. Large payload in outbox row — bloats DB.',
    tradeoff:
      'Latency + relay ops vs correctness. Debezium lower latency than poll but more infra.',
    security:
      'Outbox payload encrypted for PII fields. Relay uses dedicated Kafka credentials.',
    observability:
      'Metric: `outbox_unpublished_count`, relay lag seconds. Alert unpublished > 1000 for 5 min.',
    trap:
      'Publishing Kafka inside `@Transactional` without outbox — not atomic with DB rollback.',
    interviewAnswer:
      'Transactional outbox writes the domain change and outbox row in one DB transaction. A relay publishes to Kafka asynchronously. This avoids dual-write inconsistency. Consumers still need idempotency because relay may republish. Debezium CDC is lower latency than polling relay.',
    remember: [
      'Same DB TX: domain row + outbox row',
      'Relay poll or Debezium CDC',
      'Consumer idempotent — relay duplicates possible',
      'Never Kafka publish inside TX without outbox',
    ],
    oneLiner: 'Atomic DB commit for business data and outbox; async relay publishes to Kafka.',
  },
  {
    id: 'sync-chain-problem',
    title: 'The Sync Call Chain Problem',
    what:
      'Deep synchronous HTTP chains (A→B→C→D) multiply latency, failure probability, and retry load. Each hop adds p99; availability compounds: if each service is 99.9%, four-hop chain is ~99.6%.',
    why:
      'Developers compose sync calls for simplicity — works in dev with 1ms mocks. Production p99 200ms × 5 hops = 1s+ user latency; one slow leaf stalls entire tree threads.',
    when:
      'Recognize during design review for any user-facing path >2 sync hops. Payment auth sometimes unavoidable sync; notifications should never be sync in critical path.',
    how:
      'Break chain: return 202 Accepted + poll/WebSocket for long ops. Parallel fan-out with `CompletableFuture.allOf` when independent. Async boundary: publish command event, respond immediately. GraphQL BFF parallelizes but does not remove downstream slowness.',
    flow: `flowchart TB
  Bad[A 200ms] --> B[B 200ms] --> C[C 200ms] --> D[D 200ms]
  Good[A] -->|async event| N[Notify]
  A -->|parallel| B2[B]
  A -->|parallel| C2[C]`,
    failure:
      'Parallel calls without timeout on each branch — still blocked by slowest. Async without correlation id — client cannot track. Sync chain hidden in nested service calls — no one sees 6 hops.',
    tradeoff:
      'Sync: simple mental model, poor tail latency. Async: complexity, better resilience and scale.',
    security:
      'Async callbacks need signed tokens — do not expose internal job ids without auth.',
    observability:
      'Service graph depth metric. Trace critical path analysis — flag chains depth >3. SLO budget per hop.',
    trap:
      'BFF aggregating 10 sync calls — looks like one API but worst of all worlds latency.',
    interviewAnswer:
      'Sync chains multiply latency and failure rates. Four 99.9% services in series yield 99.6% effective availability. I limit critical user paths to two sync hops, use parallel fetch where independent, and move notifications and analytics async via Kafka. Deadline propagation caps total wall clock but does not remove structural chain problem.',
    remember: [
      'Latency sums; availability multiplies down',
      'p99 × hops = user-visible tail',
      '202 + event beats deep sync chain',
      'BFF parallel helps but slow leaf still wins',
    ],
    oneLiner: 'Deep sync chains sum latency and compound failure — break with async and parallel.',
  },
  {
    id: 'connection-pooling-http2',
    title: 'Connection Pooling — HTTP/1.1 vs HTTP/2',
    what:
      'Connection pool reuses TCP/TLS sessions to avoid per-request handshake cost. HTTP/1.1: typically one in-flight request per connection (or limited pipelining). HTTP/2: multiplexes many streams on one connection — fewer sockets, shared congestion control.',
    why:
      'New connection per request: 1–3 RTT TLS overhead dominates small API calls. Pool exhaustion blocks threads waiting for free connection. Wrong pool sizing masks as "mystery latency."',
    when:
      'HttpClient 5 / Java 11+ HttpClient pool default. Apache HttpClient connection manager. WebClient Reactor Netty pool per remote host. gRPC always HTTP/2 multiplex.',
    how:
      'Java 21 HttpClient shares pool internally — tune via system properties or custom. Apache: `PoolingHttpClientConnectionManager` maxTotal=200, defaultMaxPerRoute=50. WebClient: `ConnectionProvider.builder("payment").maxConnections(50)`. HTTP/2 to same host: lower maxConnections because multiplexing. Align idle timeout with LB idle timeout.',
    flow: `flowchart LR
  subgraph HTTP1.1
    T1[Thread1] --> C1[Conn1]
    T2[Thread2] --> C2[Conn2]
  end
  subgraph HTTP2
    T3[Threads] --> MC[One conn]
    MC --> S1[stream1]
    MC --> S2[stream2]
  end`,
    failure:
      'Pool max per route too low — threads block on `connectionRequestTimeout`. Stale connection in pool to dead pod until validation or idle evict. HTTP/2 single connection hotspot on one server. Pool larger than downstream accept rate — SYN flood on dependency.',
    tradeoff:
      'HTTP/2 fewer connections, head-of-line blocking on TCP level (HTTP/3 QUIC fixes). HTTP/1.1 more connections, simpler LB per-connection distribution.',
    security:
      'TLS session reuse in pool — ensure session tickets rotated. mTLS certs in pool factory.',
    observability:
      'Metrics: pool leased/pending/available connections. Alert pending > 10 sustained. Trace connect vs wait-for-connection time.',
    trap:
      '200 threads each needing connection with maxPerRoute=2 — 198 threads blocked. Size pool from concurrency model.',
    interviewAnswer:
      'Connection pooling avoids repeated TLS handshakes. HTTP/1.1 typically needs more connections per host for concurrency; HTTP/2 multiplexes streams on one connection so maxConnections per route can be lower. I align pool idle timeout with ALB idle timeout and size maxPerRoute from expected concurrent calls to that dependency.',
    remember: [
      'HTTP/2 multiplex — fewer physical connections',
      'Pool exhaustion blocks threads',
      'Align idle timeout with LB',
      'maxPerRoute from concurrent call volume',
    ],
    oneLiner: 'Reuse TCP/TLS via pools; HTTP/2 multiplexes streams on fewer connections.',
  },
  {
    id: 'dns-ttl-stale-cache',
    title: 'DNS TTL & Stale Cache',
    what:
      'DNS resolvers cache A/AAAA records for TTL seconds defined by authoritative server. JVM, HttpClient, and OS resolver cache independently. After pod death or blue/green, clients may call stale IP until TTL expires.',
    why:
      'Interacts with discovery staleness — Eureka cache + DNS TTL + connection pool sticky connections compound to minutes of calls to dead instances after deploy.',
    when:
      'Debugging post-deploy 503 spikes. K8s CoreDNS default TTL 30s. Java security TTL `networkaddress.cache.ttl`. Feign/HttpClient connection reuse.',
    how:
      'Tune K8s CoreDNS `cache` plugin TTL. Java: `-Dnetworkaddress.cache.ttl=10` (careful with external DNS load). Force connection pool eviction on refresh. Prefer platform discovery (EndpointSlice) over long-TTL external DNS for internal services. Spring Cloud LoadBalancer `cacheExpiry` for Eureka.',
    flow: `sequenceDiagram
  participant Pod as New deploy
  participant EP as EndpointSlice
  participant DNS as CoreDNS
  participant C as Client cache
  Pod->>EP: old IP removed 1s
  EP->>DNS: update 2s
  DNS->>C: TTL 30s stale IP
  C->>C: calls dead IP until TTL`,
    failure:
      'TTL=0 on everything — DNS QPS storm to CoreDNS. Ignoring JVM DNS cache — OS updated but JVM stale 30s default. Keep-alive to stale IP until idle — TTL fix insufficient alone.',
    tradeoff:
      'Low TTL: fresher endpoints, higher DNS load and lookup latency. High TTL: stable cache, slow failover.',
    security:
      'DNS poisoning risk — use cluster DNS only inside mesh; restrict egress DNS.',
    observability:
      'CoreDNS QPS, NXDOMAIN rate. Client logs resolved IPs on connection failure — correlate with deploy time.',
    trap:
      'Fixed DNS issue but pool still has TCP to dead pod — must evict connections too.',
    interviewAnswer:
      'DNS TTL means clients cache IPs for seconds to minutes after EndpointSlice updates. JVM has separate DNS cache from OS. After deploy, I expect brief errors until TTL and connection pools refresh. I tune TTL vs DNS load, evict pool connections on failure, and use readiness-gated endpoints to minimize stale IP issuance.',
    remember: [
      'TTL staleness stacks with registry cache',
      'JVM networkaddress.cache.ttl separate from OS',
      'Evict pool connections on connect failure',
      'CoreDNS TTL vs QPS trade-off',
    ],
    oneLiner: 'DNS and JVM cache stale IPs after deploy — TTL, pool eviction, and readiness matter.',
  },
];
