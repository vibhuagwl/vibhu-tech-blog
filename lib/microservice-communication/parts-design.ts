import type {CommSection} from './types';

export const DESIGN: CommSection[] = [
  {
    id: 'payment-architecture',
    title: 'Payment Platform — Sync vs Async Communication',
    what:
      'Payment flows combine synchronous authorization (user waits) with asynchronous settlement, reconciliation, and notification. Spring Boot 3 services use RestClient/Feign for sync PSP calls and Kafka for post-commit events.',
    why:
      'Money movement invariants require immediate yes/no on auth; batch settlement and ledger posting tolerate seconds of delay. Wrong sync/async split causes double charges, hung checkouts, or orphaned captures.',
    when:
      'Sync: card auth, 3DS step-up, balance check, fraud score under 300ms SLO. Async: settlement files, webhook fan-out, analytics, email receipts, dispute evidence assembly.',
    how:
      'Checkout API → Order (sync reserve) → Payment (sync auth via RestClient + idempotency key) → Kafka PaymentAuthorized → Settlement consumer (async capture) → Ledger (async append). Outbox pattern bridges DB commit and Kafka produce.',
    flow: `CHECKOUT (sync path — user waits)
  Browser → API Gateway → OrderSvc ─sync─► InventorySvc (reserve)
                              │
                              └─sync─► PaymentSvc ─RestClient─► PSP (auth)
                                         │ idempotency-key header
                                         └─outbox─► Kafka PaymentAuthorized

POST-COMMIT (async path — user already got 200)
  PaymentAuthorized → SettlementSvc (capture batch)
                    → LedgerSvc (append entry)
                    → NotificationSvc (email/SMS)
                    → FraudSvc (async enrich)
                    → Analytics (clickstream)`,
    failure:
      'Sync chain without timeout: PSP slow → thread pool exhausted → all checkouts fail. Retry auth without idempotency → double charge. Kafka-only auth → user sees success before PSP confirms.',
    tradeoff:
      'Sync auth adds latency tail (p99 PSP RTT) but gives truthful UX. Async settlement improves throughput and isolates PSP batch windows from user path.',
    security:
      'TLS to PSP; mTLS service-to-service in mesh; OAuth2 client credentials for PSP; propagate JWT correlationId only — never PAN in logs or Kafka headers.',
    observability:
      'RED on PaymentSvc: rate, errors (4xx/5xx/timeout), duration p99. Trace auth span with W3C traceparent; metric idempotency_replay_count; alert on outbox lag.',
    trap:
      '"Make payments async for scale" — user cannot wait for Kafka consumer to decide if card works.',
    interviewAnswer:
      'I sync only the authorization hold the user needs now — RestClient with tight timeout, Resilience4j CB, mandatory Idempotency-Key. Everything after commit is Kafka with outbox, idempotent consumers, and saga compensation for capture failures.',
    remember: [
      'Auth sync; settlement async',
      'Idempotency on every sync money call',
      'Outbox for DB + Kafka atomicity',
      'Never retry POST without dedup key',
      'PSP timeout ≠ decline — use inquiry endpoint',
    ],
    oneLiner: 'Sync auth for user truth; async settlement for scale — outbox bridges the seam.',
    tables: [
      {
        headers: ['Step', 'Pattern', 'Spring Boot 3', 'Why'],
        rows: [
          ['Reserve inventory', 'Sync REST', 'RestClient + CB', 'Prevent oversell before charge'],
          ['Authorize card', 'Sync REST', 'RestClient → PSP', 'User needs immediate answer'],
          ['Emit domain event', 'Async', 'Transactional outbox + Kafka', 'Decouple post-commit fan-out'],
          ['Capture/settle', 'Async', '@KafkaListener + idempotent DB', 'Batch-friendly PSP windows'],
          ['Send receipt', 'Async', 'Kafka → NotificationSvc', 'Retries OK with dedupe'],
        ],
      },
    ],
  },
  {
    id: 'ecommerce-architecture',
    title: 'E-Commerce — Catalog, Cart, Checkout Communication',
    what:
      'E-commerce mixes AP-tolerant reads (catalog, search) with CP-leaning writes (inventory reserve, payment). BFF aggregates for mobile; core services communicate via REST/gRPC sync in checkout and Kafka for order lifecycle.',
    why:
      'Browse must be fast and cacheable; checkout must be consistent. Chatty sync BFF chains explode latency; pure event-driven checkout confuses users waiting for order confirmation.',
    when:
      'Sync: add-to-cart validation, checkout place-order, inventory hold, payment auth. Async: search index update, recommendation refresh, warehouse pick list, shipment tracking webhooks.',
    how:
      'BFF calls Catalog (cache/CDN AP), Cart (Redis session), Checkout orchestrator (sync saga: reserve → pay → confirm). OrderPlaced event on Kafka drives fulfillment, email, analytics.',
    flow: `BROWSE (mostly sync read, AP cache OK)
  App → BFF → CatalogSvc (CDN/cache) — stale price OK until cart refresh

CHECKOUT (sync orchestration + async fulfillment)
  App → BFF → CheckoutOrchestrator
              ├─sync─► CartSvc (validate lines)
              ├─sync─► InventorySvc (hold TTL 15m)
              ├─sync─► PricingSvc (fresh quote)
              ├─sync─► PaymentSvc (auth)
              └─sync─► OrderSvc (persist CONFIRMED)
                    └─outbox─► Kafka OrderPlaced

FULFILLMENT (async)
  OrderPlaced → WarehouseSvc → ShipmentSvc → Tracking webhooks → Customer notify`,
    failure:
      'Sync chain across 6 services without bulkhead: one slow PricingSvc blocks all checkouts. Event-only order: user clicks Buy, gets "processing" with no order id.',
    tradeoff:
      'BFF aggregation cuts mobile round trips but concentrates failure. Kafka fulfillment decouples peak (Black Friday) from checkout latency.',
    security:
      'JWT from IdP at gateway; BFF forwards Authorization + trace headers; PII tokenized in events; scope cart:write vs order:read.',
    observability:
      'Checkout funnel trace (single traceId across sync chain); RED per dependency; Kafka consumer lag on fulfillment; business metric conversion_rate drop alerts.',
    trap:
      'Using Kafka for "Place Order" button response — user needs orderId synchronously.',
    interviewAnswer:
      'Catalog and search are cache-first sync reads with TTL staleness. Checkout is a sync orchestrated saga with timeouts per step, then OrderPlaced async for warehouse and notifications. I cap sync depth at 3 hops via BFF or orchestrator.',
    remember: [
      'Browse AP; checkout CP-leaning',
      'BFF reduces chattiness, adds blast radius',
      'Inventory hold before payment',
      'OrderPlaced async fan-out',
      'Compensate: release hold on payment fail',
    ],
    oneLiner: 'Fast AP browse; sync checkout saga; async fulfillment on Kafka.',
    tables: [
      {
        headers: ['Capability', 'Sync vs Async', 'Tooling'],
        rows: [
          ['Product search', 'Sync read (AP cache)', 'RestClient + Redis/CDN'],
          ['Cart merge', 'Sync', 'RestClient / session Redis'],
          ['Inventory hold', 'Sync', 'RestClient + row lock'],
          ['Payment', 'Sync auth', 'RestClient + idempotency'],
          ['Pick/pack/ship', 'Async', 'Kafka OrderPlaced'],
          ['Recommendations', 'Async', 'Kafka clickstream → ML'],
        ],
      },
    ],
  },
  {
    id: 'banking-architecture',
    title: 'Banking — Core Ledger, Transfers, and Compliance',
    what:
      'Banking platforms separate real-time payment rails (sync ISO 20022/FedNow APIs) from batch ACH/wire processing (async files). Microservices around a CP ledger use sync for balance inquiry and transfer initiation, Kafka for audit and AML pipelines.',
    why:
      'Regulators require traceable, ordered money movement. Sync transfer gives customer confirmation; async AML screening and settlement netting handle volume without blocking the branch teller UI.',
    when:
      'Sync: balance inquiry, transfer initiation, OTP step-up, limit check. Async: AML scoring, statement generation, interest accrual, regulatory reporting, cross-bank settlement batches.',
    how:
      'Channel API → AccountSvc (sync read primary DB) → TransferSvc (sync debit/credit in single TX) → Kafka TransferCompleted → AMLSvc, NotificationSvc, ReportingSvc.',
    flow: `REAL-TIME TRANSFER (sync core)
  Mobile → Gateway (mTLS) → TransferSvc
              ├─sync─► AccountSvc (debit, CP quorum read)
              ├─sync─► LimitSvc (daily cap)
              └─sync─► FraudSvc (rules <200ms or sync fallback decline)
              └─commit ledger TX
              └─outbox─► Kafka TransferCompleted

COMPLIANCE PIPELINE (async)
  TransferCompleted → AMLSvc (SAR queue if score high)
                    → AuditLog (immutable append)
                    → ReportingSvc (EOD batch)`,
    failure:
      'Async-only transfer: customer sees "pending" forever during outage. Sync AML in path: 5s model latency blocks all transfers. Shared ledger DB across services breaks bounded context.',
    tradeoff:
      'Sync ledger writes cost latency but meet regulatory immediacy. Async AML catches more signals without blocking happy path — with post-hoc freeze capability.',
    security:
      'mTLS everywhere; OAuth2 + step-up MFA; JWT with short TTL and audience restriction; no PII in Kafka keys; HSM for signing; audit every sync call.',
    observability:
      'RED on TransferSvc; trace transferId; metric ledger_commit_latency; alert on outbox depth; SIEM on auth anomalies.',
    trap:
      'Eventual consistency for account balance — regulators and customers expect read-your-writes after transfer.',
    interviewAnswer:
      'Ledger debit/credit is sync transactional in TransferSvc with read-after-write routing. AML and reporting are Kafka consumers with idempotent processing. I never async the customer-facing confirmation of a transfer.',
    remember: [
      'Ledger sync and CP',
      'AML async with post-hoc freeze',
      'Read-after-write on balance',
      'Audit trail on every event',
      'mTLS + short-lived JWT',
    ],
    oneLiner: 'Sync CP ledger for customer truth; async compliance and reporting pipelines.',
  },
  {
    id: 'trading-architecture',
    title: 'Trading — Low-Latency Sync and Market Data Fan-Out',
    what:
      'Trading systems prioritize sync gRPC/Fix for order entry and risk checks, with async Kafka for market data distribution, trade capture, and regulatory OMS/EMS separation.',
    why:
      'Order ack must be sub-millisecond to co-located matching engine; market data is firehose best delivered async to hundreds of subscribers.',
    when:
      'Sync: order submit, risk pre-trade check, position query hot path. Async: market data ticks, trade bust corrections, end-of-day P&L, regulatory CAT reporting.',
    how:
      'Order Gateway (gRPC) → RiskSvc (sync in-process or gRPC <1ms) → Exchange adapter (Fix/gRPC). Market data gateway publishes Kafka ticks; strategies consume async.',
    flow: `ORDER PATH (sync — microseconds matter)
  Algo → OrderGw ─gRPC─► RiskSvc (pre-trade limits)
              └─Fix/gRPC─► Exchange (ack/reject)

MARKET DATA (async fan-out)
  Exchange feed → MD Gateway → Kafka topic per symbol
                             → Strategy pods (consumer groups)
                             → Risk (position marks async)

POST-TRADE (async)
  Fill events → Kafka → OMS → Ledger → Reg reporting`,
    failure:
      'REST/JSON order path adds ms latency — misses SLA. Kafka for order submit adds jitter and ordering complexity. Retry storm on exchange 503 → duplicate orders without clientOrderId idempotency.',
    tradeoff:
      'gRPC/Fix sync path is operationally heavy but mandatory for HFT-ish tiers. Async market data trades perfect ordering for throughput — consumers track sequence gaps.',
    security:
      'mTLS + API keys; JWT for human channels only; segregated networks; signed orders; rate limits per strategy.',
    observability:
      'Latency histograms p50/p99/p999 on order path; RED on gateway; Kafka lag on MD consumers; gap detection on sequence numbers.',
    trap:
      'Suggesting Kafka for order entry because "Kafka is fast" — tail latency and consumer semantics wrong for exchange ack.',
    interviewAnswer:
      'Order entry and risk are sync gRPC with client-side timeout and idempotent clientOrderId. Market data is Kafka with partition per symbol. Post-trade is async. I separate hot path JVM tuning from async analytics tier.',
    remember: [
      'Orders sync gRPC/Fix',
      'Market data async Kafka',
      'clientOrderId idempotency',
      'Sequence gap detection on MD',
      'Never REST for hot path',
    ],
    oneLiner: 'Sync gRPC for orders; async Kafka for market data firehose.',
  },
  {
    id: 'antipattern-chatty-bff',
    title: 'Anti-Pattern — Chatty BFF / Sync Chain',
    what:
      'Mobile BFF sequentially calls 8+ microservices per screen — each hop adds RTT, serialization, and failure probability. Latency sums; errors multiply.',
    why:
      'Teams add services without aggregation discipline. Each service owner exposes REST; BFF authors chain calls naively.',
    when:
      'Smell: p99 page load = sum of dependency p99. Thread pool queues grow. One 503 blanked entire homepage.',
    how:
      'Fix: parallelize independent calls (WebClient flux), collapse read models (CQRS projection), GraphQL selective fetch, or domain-specific aggregator service. Cap sync depth at 3.',
    flow: `BAD:  BFF → A → B → C → D → E  (latency = Σ RTT)

GOOD: BFF ─┬─ parallel ─► A, B, C
           └─ sync ─────► D (needs A result only)
           projection read for dashboard`,
    failure:
      'Payment page 6 sequential calls × 80ms = 480ms before PSP even contacted. Cascading timeout when Inventory slow.',
    tradeoff:
      'Parallel WebClient reduces wall time but increases load on dependencies during spikes — need bulkhead per downstream.',
    security:
      'Each hop must re-validate auth — BFF forwarding JWT without audience check is a lateral movement risk.',
    observability:
      'Trace waterfall exposes serial segments; metric bff_fan_out_count; alert when sequential span depth > 4.',
    trap:
      'Adding cache everywhere instead of fixing chatty design — stale composite pages.',
    interviewAnswer:
      'I measure trace depth and parallelize independent fetches with WebClient and timeouts per call. For read-heavy dashboards I use materialized projections updated by Kafka, not live 10-call aggregation.',
    remember: ['Cap sync hops', 'Parallelize independent calls', 'Projections for dashboards', 'Trace waterfall reveals chains'],
    oneLiner: 'Serial microservice chains sum latency and failure — parallelize or project.',
  },
  {
    id: 'antipattern-no-timeout',
    title: 'Anti-Pattern — Missing or Infinite Timeout',
    what:
      'RestTemplate/Feign/WebClient/RestClient calls without connect/read timeout hang forever when downstream stalls — threads blocked, pool exhausted, health checks fail.',
    why:
      'Default configs or "internal service trusted" mindset. Spring Boot 3 RestClient requires explicit timeout on HttpClient.',
    when:
      'Symptom: thread dump shows thousands BLOCKED on socket read. CPU low, throughput zero, kube restarts pod.',
    how:
      'Set connect + response timeout on HttpClient: `HttpClient.newBuilder().connectTimeout(...).build()` wired to RestClient. Feign: `spring.cloud.openfeign.client.config.default.connectTimeout`. Match timeout < upstream gateway timeout.',
    flow: `REQUEST WITHOUT TIMEOUT
  Thread T1 ──wait forever──► slow PaymentSvc
  Thread T2..T200 all blocked → pool starved → 503 all routes`,
    failure:
      'One bad deploy on InventorySvc takes down OrderSvc, Gateway, and BFF — cascading failure.',
    tradeoff:
      'Short timeout increases false timeouts on cold starts — pair with retry ONLY on idempotent GET and jitter.',
    security:
      'Slowloris-style attacks exploit missing timeouts on edge — WAF + server timeouts mandatory.',
    observability:
      'Metric http_client_timeouts_total; trace cancelled spans; alert thread pool active == max.',
    trap:
      '"We use reactive WebClient so no timeout needed" — WebClient also needs responseTimeout.',
    interviewAnswer:
      'Every sync client gets connect + read timeout shorter than caller deadline. I chart timeout hierarchy: client 2s < BFF 3s < gateway 5s. RestClient on Java 21 HttpClient, not legacy RestTemplate defaults.',
    remember: ['Timeout every sync call', 'RestClient needs HttpClient timeouts', 'Timeout < caller deadline', 'Thread pool ≠ infinite capacity'],
    oneLiner: 'No timeout is a cascading failure guarantee — configure RestClient/Feign/WebClient explicitly.',
  },
  {
    id: 'antipattern-retry-storm',
    title: 'Anti-Pattern — Retry Storm / Retry on POST',
    what:
      'Clients, gateways, and intermediaries all retry failed requests — load multiplies 3–10× on recovering service, preventing recovery (metastable failure).',
    why:
      'Default retry policies stacked: Feign retry + Spring Retry + client SDK + kube proxy retry.',
    when:
      'Symptom: dependency flapping, 503 spike, recovery delayed hours. Duplicate orders/charges if POST retried without idempotency.',
    how:
      'Retry only idempotent ops; cap attempts (2–3); full jitter backoff; CB opens stop retries; 429 Retry-After honored; idempotency keys on POST; coordination via retry budget.',
    flow: `RETRY STORM
  1000 RPS fail → each retries 3x → 3000 RPS hammer → service never recovers
  + gateway retry + Feign retry = 9000 RPS effective`,
    failure:
      'Payment double capture; inventory double decrement; Kafka consumer duplicate side effects.',
    tradeoff:
      'Fewer retries increase user-visible errors — pair with graceful degradation and async reconciliation.',
    security:
      'Retry amplification is a DDoS vector — rate limit at edge; auth on retry budget per client.',
    observability:
      'Metric retry_attempts_total by downstream; CB state; compare client RPS vs server RPS ratio.',
    trap:
      'Resilience4j Retry on `@PostMapping` charge endpoint without idempotency store.',
    interviewAnswer:
      'I retry GET and idempotent PUT only, max 2 attempts with jitter, CB stops hammering. POST uses Idempotency-Key dedup table. One retry layer owns the policy — not Feign AND gateway AND client.',
    remember: ['One retry owner', 'Never blind POST retry', 'Jitter backoff', 'CB + retry interplay', 'Idempotency keys'],
    oneLiner: 'Stacked retries turn partial outage into total outage — cap, jitter, idempotency.',
  },
  {
    id: 'antipattern-shared-db',
    title: 'Anti-Pattern — Shared Database Between Services',
    what:
      'Multiple microservices read/write the same PostgreSQL schema — coupling via tables, breaking independent deploy and clear ownership.',
    why:
      'Expedient migration from monolith; "just one shared table" becomes dozens.',
    when:
      'Smell: schema migration requires 5 team approvals; services deadlock on row locks; unclear owner for column.',
    how:
      'Database-per-service; sync API or async events for cross-aggregate data; CQRS read models fed by Kafka; strangler extract one BC at a time.',
    flow: `SHARED DB (hidden sync coupling)
  OrderSvc ──┐
  PaymentSvc ├──► same orders table ◄── lock contention
  ShipSvc  ──┘

TARGET
  OrderSvc → orders DB ──Kafka OrderPaid──► ShipSvc → ship DB`,
    failure:
      'PaymentSvc migration locks orders table — OrderSvc down. No clear event boundary for integrators.',
    tradeoff:
      'Separate DBs add sync/eventual consistency complexity — correct trade for team autonomy.',
    security:
      'Shared DB credentials across services — blast radius on credential leak.',
    observability:
      'DB wait events by application user — multiple service names on one DB user signals anti-pattern.',
    trap:
      '"We use microservices but one Postgres" — distributed monolith.',
    interviewAnswer:
      'Shared database is the #1 microservices anti-pattern. I extract via events and APIs, accept eventual read models, and never join across services in SQL — join in BFF or analytics warehouse.',
    remember: ['DB per service', 'Events not FK across BC', 'CQRS for cross views', 'Strangler migration'],
    oneLiner: 'Shared database = distributed monolith with network overhead.',
  },
  {
    id: 'antipattern-kafka-everything',
    title: 'Anti-Pattern — Kafka for Everything',
    what:
      'Using Kafka request-reply for synchronous user flows — checkout waits on consumer, RPC-over-Kafka with correlation headers, ignoring simpler REST/gRPC.',
    why:
      'Kafka hype; team skill in only messaging; avoiding sync failure handling.',
    when:
      'Smell: request-reply timeout hacks; user waits on consumer lag; ordering issues on rebalances during checkout.',
    how:
      'Kafka for fan-out, audit, integration, async workflows. Sync REST/gRPC when caller needs answer now. Outbox for reliable emit after DB commit.',
    flow: `WRONG: User → API → Kafka request topic → wait poll reply (fragile)

RIGHT:  User → API ─sync─► PaymentSvc → 200 OK
                      └─async─► Kafka → downstream`,
    failure:
      'Consumer rebalance during request-reply loses in-flight replies. Lag spikes mean checkout timeouts.',
    tradeoff:
      'Kafka adds durability and decoupling but not lower latency for question-answer patterns.',
    security:
      'ACL per topic; no sensitive data in headers; schema validation on produce.',
    observability:
      'If user-facing flow depends on consumer lag metric — wrong architecture.',
    trap:
      '"We are event-driven so no sync calls" — event-driven ≠ sync-free.',
    interviewAnswer:
      'Kafka excels at log, fan-out, and async integration. User-facing query/ command with deadline is sync REST/gRPC. I use outbox to connect transactional write to event stream.',
    remember: ['Kafka not RPC by default', 'Request-reply is last resort', 'Outbox bridges sync write + async emit'],
    oneLiner: 'Kafka for streams and fan-out — not a substitute for sync user paths.',
  },
  {
    id: 'antipattern-cb-missing',
    title: 'Anti-Pattern — No Circuit Breaker on Sync Dependencies',
    what:
      'Calling failing downstream on every request — wasting threads, queue depth, and preventing graceful degradation.',
    why:
      'CB perceived as optional; Resilience4j not wired; only gateway has CB not service-to-service.',
    when:
      'Symptom: error rate 100% to FraudSvc yet OrderSvc still allocates 500 threads waiting.',
    how:
      'Resilience4j `@CircuitBreaker` + `@TimeLimiter` on RestClient calls; fallback to cached score or fail-closed for payments; half-open probe with limited calls.',
    flow: `WITHOUT CB: 500 threads × 5s timeout = 2500s thread-seconds/sec → collapse

WITH CB:    fail fast after threshold → threads free → degraded mode → half-open probe`,
    failure:
      'Metastable: slow dependency prevents callers from recovering even after dependency fixed.',
    tradeoff:
      'Fail-open fraud CB increases fraud loss; fail-closed reduces revenue — business chooses per path.',
    security:
      'CB fallback must not bypass auth or return cached private data to wrong user.',
    observability:
      'Metric resilience4j_circuitbreaker_state; alert OPEN > 1min; trace fallback path tag.',
    trap:
      'CB without timeout — calls still hang until CB slow-call threshold.',
    interviewAnswer:
      'Every sync dependency gets timeout + CB + bulkhead. Payment fraud fail-closed; recommendations fail-open. I dashboard CB state per dependency and test OPEN behavior in integration tests.',
    remember: ['CB + timeout together', 'Fallback is a product decision', 'Half-open probes', 'Test OPEN state'],
    oneLiner: 'Circuit breaker fails fast so one bad dependency does not drain the fleet.',
  },
  {
    id: 'capacity-littles-law',
    title: 'Capacity — Little\'s Law (Concurrency ≈ RPS × Latency)',
    what:
      'Little\'s Law: average concurrency L = throughput λ × average residence time W. For HTTP thread pools and connection pools, required capacity = RPS × latency(seconds).',
    why:
      'Interviewers test whether you size pools from math, not guesses. Undersized WebClient connection pool causes queueing that increases latency — vicious cycle.',
    when:
      'Sizing Tomcat threads, WebClient max connections, Feign pool, gRPC channels, DB pool before launch or scale events.',
    how:
      'Measure p99 latency W (seconds), peak RPS λ. Concurrency L = λ × W. Add 30% headroom. Example: 500 RPS × 0.2s p99 = 100 concurrent requests → pool ≥ 130.',
    flow: `LITTLE'S LAW
  L = λ × W

  Example checkout service:
    Peak λ = 800 RPS
    p99 W  = 250ms = 0.25s
    L = 800 × 0.25 = 200 in-flight
    Tomcat max threads ≥ 260 (headroom)
    WebClient pool per host ≥ concurrent outbound calls

  Pool queueing adds W → recalculate iteratively`,
    failure:
      '50-thread pool at 400 RPS × 200ms = 80 needed — OK at median, collapses at p99 when W→2s needs 800 threads.',
    tradeoff:
      'Oversized pools waste memory and hide slow dependencies — pair sizing with timeout and CB.',
    security:
      'Unbounded pool allows resource exhaustion DoS — always cap with rejection policy.',
    observability:
      'Graph concurrent requests vs pool active; alert when active/max > 0.85 sustained.',
    trap:
      'Sizing from average latency when p99 is 5× higher — use p99 or p999 for money paths.',
    interviewAnswer:
      'I size pools with Little\'s Law using peak RPS and p99 latency, plus headroom. For 1000 RPS and 300ms p99 I need ~300 concurrent threads minimum. I validate with load test and watch pool saturation metrics.',
    remember: ['L = λ × W', 'Use p99 not mean', 'Add headroom 30%', 'Recalculate when latency shifts', 'Outbound pools too'],
    oneLiner: 'Concurrency ≈ RPS × latency — size every pool from Little\'s Law.',
    tables: [
      {
        headers: ['Resource', 'Formula', 'Spring Boot 3 knob'],
        rows: [
          ['Tomcat threads', 'peak RPS × p99 sec', 'server.tomcat.threads.max'],
          ['WebClient connections', 'outbound RPS × p99 sec', 'HttpClient pool size'],
          ['HikariCP', 'DB query concurrency', 'spring.datasource.hikari.maximum-pool-size'],
          ['Kafka consumers', 'partitions × processing time', 'Topic partition count'],
        ],
      },
    ],
  },
  {
    id: 'cascading-failure',
    title: 'Cascading Failure — Metastable Failure Math',
    what:
      'When overloaded system receives retry amplified load, it cannot recover even after root cause fixed — metastable failure. Capacity margin and retry budget determine cliff edge.',
    why:
      'Microservices multiply failure domains; without bulkhead and fail-fast, one slow node drains fleet.',
    when:
      'Post-incident: "dependency recovered but we stayed down until we stopped retries/traffic."',
    how:
      'Model: effective load = client RPS × (1 + retry_rate). Recovery requires effective load < capacity × utilization target (e.g. 70%). Shed load: CB, 429, queue async, scale horizontally with partition awareness.',
    flow: `CASCADING TIMELINE
  T0: PaymentSvc slow (500ms → 5s)
  T1: OrderSvc threads saturate (Little: RPS×5s >> pool)
  T2: Clients retry 3× → 3× load
  T3: PaymentSvc never recovers (metastable)
  T4: Fix requires: open CB + shed load + scale + disable retries

  Recovery condition: λ_effective < μ_capacity × 0.7`,
    failure:
      'Autoscale adds pods but DB connection pool global limit still exhausted — scale hits second cliff.',
    tradeoff:
      'Aggressive fail-fast hurts UX briefly but enables recovery — better than hours outage.',
    security:
      'Load shed must be authenticated fair queuing — not drop premium tenants randomly without policy.',
    observability:
      'SLO error budget burn; thread pool saturation; retry ratio metric; metastable detector (recovery lag after dependency healthy).',
    trap:
      'Scaling consumers beyond Kafka partition count — zero gain, more rebalance pain.',
    interviewAnswer:
      'I explain cascading failure with retry multiplication and Little\'s Law. Mitigation stack: timeout, CB, bulkhead, retry budget, async buffer, rate limit. Recovery needs load shed even after root fix — I run game days proving this.',
    remember: ['Retries multiply load', 'Metastable needs shed load', 'Bulkhead isolates', 'Scale partitions not just pods'],
    oneLiner: 'Cascading failure = retry amplification exceeds capacity — shed load to recover.',
  },
  {
    id: 'security-tls-mtls-jwt',
    title: 'Security — TLS, mTLS, OAuth2 JWT Propagation',
    what:
      'Transport security (TLS), service identity (mTLS in mesh), and user context propagation (OAuth2 JWT) across sync REST/gRPC and async Kafka headers.',
    why:
      'Zero-trust: network location ≠ trust. JWT carries user claims; mTLS carries service identity — both needed for audit and authorization.',
    when:
      'TLS: all external and internal HTTP/gRPC. mTLS: service-to-service in K8s/Istio/Linkerd. JWT: user-initiated flows through gateway to downstream RestClient.',
    how:
      'Gateway validates JWT (Spring Security OAuth2 Resource Server). RestClient `defaultHeader(AUTHORIZATION, bearer)` or OAuth2AuthorizedClientManager for service calls. mTLS via mesh sidecar or Spring Boot 3 SSL bundles. Kafka: propagate trace + correlation, not raw JWT — use token exchange or signed internal context.',
    flow: `USER REQUEST
  Client ─TLS─► Gateway (validate JWT, strip dangerous claims)
              ─mTLS─► OrderSvc (RestClient + propagated bearer OR token exchange)
              ─mTLS─► PaymentSvc

  Kafka event: correlationId + tenantId header (not full JWT)
              consumer re-auth if needed via service account`,
    failure:
      'Forwarding user JWT service-to-service — token theft from logs, expired mid-chain, wrong audience. Plain HTTP inside VPC — insider threat reads PCI.',
    tradeoff:
      'Token exchange adds latency vs forward JWT — preferred for zero-trust and short internal token TTL.',
    security:
      'Spring Security 6 resource server; `spring.ssl.bundle` for mTLS; rotate certs; OAuth2 scopes per service; deny by default.',
    observability:
      'Audit log authz decisions; metric jwt_validation_failures; trace without logging token value.',
    trap:
      '"Internal network is trusted" — compliance and lateral movement say otherwise.',
    interviewAnswer:
      'Edge validates OAuth2 JWT; sync calls use mTLS plus either forwarded bearer with audience check or token exchange for service-specific token. Kafka carries correlation and tenant, not JWT — consumers use service account for sensitive actions.',
    remember: ['TLS everywhere', 'mTLS service identity', 'JWT audience matters', 'No JWT in Kafka logs', 'Token exchange > blind forward'],
    oneLiner: 'TLS for transport, mTLS for service identity, JWT for user context — propagate carefully.',
  },
  {
    id: 'observability-red-otel',
    title: 'Observability — RED Metrics + OpenTelemetry Tracing',
    what:
      'RED (Rate, Errors, Duration) per service endpoint; OpenTelemetry traces across sync RestClient/gRPC and async Kafka with W3C tracecontext propagation.',
    why:
      'Microservice debug requires correlated traces — logs alone cannot reconstruct 12-hop checkout failure.',
    when:
      'Every sync client/server instrumented; Kafka producers/consumers inject/extract trace headers; SLO dashboards on RED.',
    how:
      'Spring Boot 3: `micrometer-tracing-bridge-otel`, `@Observed` on service methods, RestClientCustomizer for propagation, Kafka interceptor for trace headers. Export to OTLP → Tempo/Jaeger. RED from Prometheus scrape.',
    flow: `TRACE SPAN TREE
  gateway POST /checkout
    ├─ order-service reserve
    │    └─ inventory-service HTTP
    ├─ payment-service auth
    │    └─ psp-client HTTP
    └─ kafka produce PaymentAuthorized
         └─ settlement-consumer (linked trace)`,
    failure:
      'Broken propagation — new traceId per hop, cannot debug. High-cardinality labels (userId on every metric) crash Prometheus.',
    tradeoff:
      '100% trace sampling expensive — tail-based sampling for errors and high latency.',
    security:
      'Scrub PII from span attributes; no PAN in baggage.',
    observability:
      'RED dashboard per service; SLO on error rate and p99; trace exemplars linking to metrics.',
    trap:
      'Logging traceId manually without OTel — inconsistent across async Kafka boundary.',
    interviewAnswer:
      'I standardize on OTel with W3C propagation through RestClient and Kafka headers. RED alerts on payment path; staff drills use trace waterfall to find which sync hop blew p99 budget.',
    remember: ['RED per endpoint', 'OTel W3C propagation', 'Kafka trace headers', 'Tail sampling', 'Low-cardinality metrics'],
    oneLiner: 'RED for health; OpenTelemetry for cross-service story — including Kafka.',
  },
  {
    id: 'versioning-contract-testing',
    title: 'Versioning & Contract Testing — Pact / Spring Cloud Contract',
    what:
      'API and event schema evolution with consumer-driven contracts (Pact) or producer-driven (Spring Cloud Contract) — catch breaking changes before deploy.',
    why:
      'Independent deploy breaks when PaymentSvc removes field OrderSvc still needs — production 500 at 2am.',
    when:
      'Every public REST endpoint and Kafka schema used by >1 team; semver on APIs; compatibility mode on Schema Registry.',
    how:
      'Pact: consumer tests define expected interaction → pact file → provider verification in CI. Spring Cloud Contract: producer defines contract in Groovy/YAML → stub for consumers. Kafka: Confluent Schema Registry BACKWARD/FULL transitivity; protobuf/avro preferred over JSON schema drift.',
    flow: `CONTRACT CI GATE
  Consumer PR → pact publish → Provider verify job
  Provider PR → contract tests + stub jar → Consumer compile

  BREAKING CHANGE
  detect in CI → bump major / dual-publish / expand-contract migration`,
    failure:
      'Integration tests only in monorepo — services deploy independently, drift undetected. "We version URL /v2" but both versions share breaking DTO.',
    tradeoff:
      'Contract maintenance cost vs outage cost — staff teams mandate contract check as deploy gate.',
    security:
      'Contract tests use synthetic data — no prod PII in pacts stored in broker.',
    observability:
      'Metric contract_verification_failures; block deploy on red pipeline.',
    trap:
      'Optional fields removed without major bump — consumers deserialize null and NPE.',
    interviewAnswer:
      'I use consumer-driven Pact for REST between teams and Schema Registry compatibility for Kafka. Spring Cloud Contract when producer owns API surface. Breaking change = major version + coexist window + metrics on old version traffic.',
    remember: ['Contract tests in CI', 'Schema Registry compatibility', 'Expand-contract migrate', 'Major = breaking'],
    oneLiner: 'Independent deploy requires contract tests — Pact, SCC, or Schema Registry gates.',
  },
  {
    id: 'api-problem-details',
    title: 'API Design — RFC 9457 Problem Details for Errors',
    what:
      'Standard error body `application/problem+json` with type, title, status, detail, instance — instead of ad-hoc `{ "error": "something" }` across microservices.',
    why:
      'Consistent errors let BFF map UX messages, clients retry correctly (503 vs 400), and observability aggregate by `type` URI.',
    when:
      'All sync REST APIs; gateway translates upstream problems without losing semantics.',
    how:
      'Spring Boot 3: `ProblemDetail.forStatusAndDetail()`, `@ControllerAdvice` returning ProblemDetail, custom `type` URI per domain error. Propagate `traceId` in extension field. Map Feign/WebClient errors to problem details at BFF.',
    flow: `HTTP 503 Problem Response
{
  "type": "https://api.example.com/problems/payment-timeout",
  "title": "Payment provider timeout",
  "status": 503,
  "detail": "PSP did not respond within 2s",
  "instance": "/orders/ord_123/pay",
  "traceId": "abc123",
  "retryable": true
}`,
    failure:
      'Each service returns different JSON — BFF cannot classify retryable errors. Stack traces leaked in body — security finding.',
    tradeoff:
      'Strict schema requires discipline — worth it for client SDK generation and support runbooks.',
    security:
      'Never expose internal exception messages or SQL in detail — map to safe external text.',
    observability:
      'Count errors by problem type URI; link instance to trace.',
    trap:
      'Returning 200 with `{ success: false }` — breaks HTTP semantics and caching.',
    interviewAnswer:
      'I standardize on RFC 9457 Problem Details across services. Spring ProblemDetail with typed URIs, traceId extension, and explicit retryable flag. BFF maps to user-friendly copy without hiding 503 vs 402 distinction.',
    remember: ['problem+json standard', 'type URI per error class', 'No stack in detail', 'traceId extension', 'Correct HTTP status'],
    oneLiner: 'Problem Details unify error shape across microservices — Spring ProblemDetail in Boot 3.',
  },
];
