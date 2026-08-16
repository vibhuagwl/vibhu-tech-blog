import type {CommSection} from './types';

/**
 * Production / staff-interview layer: problem → decision → implementation → failure → trade-off.
 * Complements existing parts-* with FinTech-first framing without replacing taxonomy depth.
 */
export const PRODUCTION_INTERVIEW: CommSection[] = [
  {
    id: 'why-services-communicate',
    title: 'Why microservices need communication',
    problem:
      'Once you split a monolith into independently deployable services with separate databases, a business use case spans process boundaries. Money movement, onboarding, and settlement cannot live in one local transaction anymore — services must talk over the network.',
    what:
      'Microservice communication is how Payment, Account, Risk, Ledger, and Notification coordinate a business outcome across network hops, failure domains, and ownership boundaries — not how two classes call each other in one JVM.',
    why:
      'Independent deployability and team ownership create remote coupling. Without deliberate sync vs async choices, you get chatty REST chains, cascading outages, or accidental shared-database “integration.”',
    when:
      'Always, as soon as more than one service owns state for a customer journey. Design communication when you draw the bounded contexts — not after the first outage.',
    whenNot:
      'Do not invent remote calls inside a single deployable. If two “services” always deploy together and share a DB, you have a distributed monolith — fix boundaries before picking Kafka vs REST.',
    how:
      '1) Name the business interaction (validate balance, authorize payment, post ledger, notify). 2) Ask if the caller needs an immediate answer. 3) Choose REST/gRPC (sync) or Kafka/webhook (async). 4) Apply TRICKS-OLD (timeout, retry, idempotency, CB, bulkhead, security, observability). 5) Prove failure modes in chaos tests.',
    flow: `Monolith (one TX):
  Payment + Account + Ledger in one DB commit

Microservices (no distributed ACID):
  Payment Service ──REST──► Account Service   (need answer now)
  Payment Service ──Kafka─► Ledger / Notify   (fan-out after commit)

Staff question answered:
  "How do services communicate?" → "Depends on whether the caller needs
   an immediate business decision or can process after the fact."`,
    failure:
      'Treating communication as “just HTTP” ignores partial failure: Account succeeds, Ledger never gets the event, Notification retries forever. Without outbox/idempotency/saga, money and messaging diverge.',
    tradeoff:
      'More services → more communication surface → more failure modes. The benefit is independent scale and deploy; the cost is operational discipline.',
    pros: 'Team autonomy, independent scale, clear ownership of Account vs Ledger.',
    cons: 'Network latency, partial failure, eventual consistency, harder debugging.',
    badDesign: `Payment writes Account DB + Ledger DB directly
  (shared schema as “communication”)`,
    goodDesign: `Payment owns payment state
  → sync REST to Account for validate/hold
  → outbox → Kafka for Ledger + Notification`,
    security: 'Every hop authenticates (JWT/mTLS). Never trust “internal VPC = secure.”',
    observability: 'One correlationId / traceId across Payment → Account → Kafka → Ledger.',
    trap: 'Drawing boxes without deciding sync vs async per edge — that is architecture theater.',
    interviewAnswer:
      'I start from the business interaction, not the protocol. After we split databases, every cross-service step is a reliability problem: do we need an immediate answer (REST/gRPC with timeout, CB, idempotency) or can we fan out after commit (Kafka + outbox + idempotent consumers)? Shared DB is not a communication mechanism — it is coupling.',
    remember: [
      'Network boundary = failure boundary',
      'Ask “immediate answer?” before naming Kafka/REST',
      'Shared DB is not microservice communication',
      'Design edges when drawing bounded contexts',
    ],
    oneLiner: 'Services talk because state and deployables split — choose sync vs async per business edge.',
  },
  {
    id: 'sync-vs-async-framework',
    title: 'Synchronous vs asynchronous — decision framework',
    problem:
      'Teams pick Kafka because it is “modern” or REST because it is “simple,” then discover checkout hangs on five sync hops or users see “paid” before risk finishes.',
    what:
      'Sync: caller waits for a response on the same request (REST, gRPC, RSocket request/response). Async: caller publishes work/events and continues; consumers process independently (Kafka, queues, webhooks).',
    why:
      'Sync preserves user-facing truth and strong checks. Async preserves availability, fan-out, and independent scaling. Mixing them wrong creates either cascading latency or lying UX.',
    when:
      'Sync when a human/API client waits, or a money/auth invariant must hold now (balance check, card auth, fraud hard-stop). Async when work can complete after commit (ledger post, email, reporting, settlement file).',
    whenNot:
      'Do not use async for “did the card authorize?” Do not use sync fan-out to five services for “notify + report + index.”',
    how:
      'Decision tree: (1) Caller waiting? (2) Business invariant immediate? (3) Fan-out? (4) Replay needed? (5) Can tolerate eventual consistency? Encode the answer in ADRs per edge.',
    flow: `Does the caller need an immediate business answer?
        |
        +-- YES --> Synchronous (REST / gRPC)
        |             + timeouts, CB, bulkhead, idempotency
        |             Example: Payment → Account validate
        |
        +-- NO --> Asynchronous (Kafka / webhook)
                      + outbox, idempotent consumer, DLQ
                      Example: payment-created → Ledger, Notify

Advanced factors (still decide explicitly):
  Availability  Coupling  Latency  Throughput
  Consistency   Failure isolation  UX  Regulatory audit`,
    failure:
      'Sync chain of Account→Risk→Ledger→Notify: one slow hop fails the whole payment. Async-only auth: user gets 202 while fraud later declines — support nightmare.',
    tradeoff:
      'Sync: simpler mental model, higher coupling and cascade risk. Async: better isolation and scale, eventual consistency and harder end-to-end debugging.',
    pros: 'Clear rule of thumb interviewers expect; forces product conversation about UX vs consistency.',
    cons: 'Real systems are hybrid — the tree is a start, not a religion.',
    badDesign: `Client waits while Payment synchronously calls
  Account + Risk + Ledger + Notify + Reporting`,
    goodDesign: `Client waits only for Payment auth decision
  (Account + maybe Risk sync)
  Then Kafka fan-out for Ledger/Notify/Reporting`,
    security: 'Sync paths carry user JWT carefully; async events carry correlation + least privilege payloads.',
    observability: 'Sync: RED + trace spans. Async: consumer lag, DLQ depth, end-to-end business SLIs.',
    trap: '“We are event-driven” while still blocking the HTTP thread on Kafka request-reply for checkout.',
    interviewAnswer:
      'I do not choose REST or Kafka by preference. If the caller needs an immediate answer — balance check, auth, hard fraud stop — I use sync REST or gRPC with tight timeouts and Resilience4j. If the work is fan-out, replayable, or can be eventually consistent — ledger, notification, reporting — I publish after commit via outbox to Kafka. Production platforms are hybrid: sync for the decision, async for the side effects.',
    remember: [
      'Waiting caller → sync',
      'Fan-out / replay → async',
      'Hybrid is normal in FinTech',
      'Event-driven ≠ always Kafka',
    ],
    oneLiner: 'Immediate answer → sync; after-commit fan-out → async; production is usually both.',
    tables: [
      {
        headers: ['Factor', 'Favor sync', 'Favor async'],
        rows: [
          ['UX', 'User waits for yes/no', 'User already got confirmation'],
          ['Coupling', 'Accept temporal coupling', 'Need deploy isolation'],
          ['Fan-out', '1–2 dependencies', 'Many subscribers'],
          ['Consistency', 'Must be correct now', 'Eventual OK with compensation'],
          ['Failure', 'Fail the request', 'Isolate blast radius'],
          ['Scale', 'Bounded QPS', 'Burst / backpressure'],
        ],
      },
    ],
  },
  {
    id: 'rest-production-fintech',
    title: 'REST in production — Payment → Account validate',
    problem:
      'Payment Service must know whether an account can fund a transfer before accepting the payment. That is a request/response question — not an event stream.',
    what:
      'Synchronous HTTP/JSON with verbs, status codes, timeouts, pooling, retries (only when safe), circuit breaker, bulkhead, idempotency, authn/z, versioning, rate limits, and RED/OTel observability.',
    why:
      'Account validation needs an immediate allow/deny. Kafka would introduce lag and eventual consistency into a decision that must finish inside the checkout SLO.',
    when:
      'Public APIs, simple internal CRUD, immediate validation, third-party HTTP integrations, anything curl-debuggable across teams.',
    whenNot:
      'Do not REST-call five post-commit side effects. Do not use REST as a bulk file transfer. Do not sync-call reporting on the payment hot path.',
    how:
      'OpenAPI contract. @RestController + Bean Validation + ProblemDetail. Client: RestClient/Feign with connect/read timeouts, pool per dependency, Resilience4j CB+bulkhead, Idempotency-Key on POST, OAuth2 client credentials or mTLS, /api/v1 versioning, gateway rate limits.',
    flow: `Payment Service
      |
      | POST /accounts/{id}/validate
      | Idempotency-Key: pay-9f3a
      | Authorization: Bearer …
      | traceparent: …
      v
Account Service
      |
      | check status, limits, holds
      v
200 {"eligible":true,"holdId":"…"}
  or 422 {"eligible":false,"reason":"INSUFFICIENT_FUNDS"}

Why not Kafka here?
  Caller needs allow/deny in the same HTTP request.
  Eventual “maybe” is not a valid payment UX.`,
    failure:
      'Account down → timeout → CB opens → Payment fails closed or queues for manual review (product decision). Lost 200 with retry without idempotency → duplicate holds.',
    tradeoff:
      'Pros: simple, immediate, universal. Cons: temporal coupling; Account outage hits Payment availability; chatty designs amplify latency.',
    pros: 'Debuggable, cacheable GETs, gateway-friendly, clear status semantics.',
    cons: 'Cascade risk; JSON overhead; no built-in fan-out/replay.',
    badDesign: `Payment → Account REST
Payment → Risk REST
Payment → Ledger REST
Payment → Notify REST
Payment → Reporting REST
(all on the request thread)`,
    goodDesign: `Payment → Account REST (validate)
Payment → Risk REST/gRPC (hard stop, tight SLO)
Payment commits + outbox
     → Kafka → Ledger, Notify, Reporting`,
    security: 'TLS; JWT/mTLS; authorize accountId ownership; never log full account numbers.',
    observability: 'http.client.requests by dependency; p99; error class; CB state; idempotency replay count.',
    trap: 'Retrying POST /validate/hold without Idempotency-Key after timeout.',
    interviewAnswer:
      'For account eligibility I use REST because Payment needs an immediate answer. I set connect 500ms / read 2s, one RestClient bean for Account, circuit breaker + bulkhead, and idempotency on any hold-creating POST. I will not replace this with Kafka — lag and eventual consistency break checkout truth. Side effects after accept go async.',
    remember: [
      'REST for immediate validate/auth',
      'Timeouts + CB + bulkhead mandatory',
      'Idempotency-Key on money POSTs',
      'Do not sync fan-out side effects',
    ],
    oneLiner: 'REST when the caller needs allow/deny now — never for post-commit fan-out.',
    tables: [
      {
        headers: ['Concern', 'Production choice'],
        rows: [
          ['Timeout', 'Client < server; fail fast'],
          ['Retry', 'Only idempotent / with key'],
          ['CB', 'Per dependency'],
          ['Bulkhead', 'Isolate Account pool from Risk'],
          ['Versioning', '/v1 + contract tests'],
          ['Auth', 'mTLS or client-credentials JWT'],
        ],
      },
    ],
  },
  {
    id: 'kafka-production-fintech',
    title: 'Kafka in production — payment-created fan-out',
    problem:
      'After Payment accepts a payment, Ledger, Notification, Fraud enrich, and Reporting all need to react. Five synchronous REST calls couple availability and latency of unrelated systems.',
    what:
      'Durable pub/sub log: producers append to partitions; consumer groups process independently with offsets, retention, replay, and DLQ. At-least-once delivery is the default contract — business idempotency is required.',
    why:
      'Fan-out, backpressure, replay for new consumers, and failure isolation. Ledger downtime should not block Notification forever on the Payment request thread.',
    when:
      'Domain events after commit, high throughput streams, multiple subscribers, audit/replay, decoupling deploy schedules.',
    whenNot:
      'Simple CRUD. Immediate validation. Request/response over Kafka for checkout. Assuming “exactly-once business processing” from broker settings alone.',
    how:
      'Transactional outbox in Payment DB → publisher → topic payment.events.v1 keyed by paymentId. Consumers: Ledger, Notify, Fraud, Reporting — each group, idempotent upsert, retry then DLQ, lag alerts. acks=all, idempotent producer, RF=3.',
    flow: `Payment Service
      |
      | commit payment + outbox row
      v
 payment-created (Kafka)
      |
      +----> Ledger Service      (post entry)
      |
      +----> Notification Service
      |
      +----> Fraud Service        (async enrich)
      |
      +----> Reporting Service

Why better than five REST calls?
  Payment returns 201 after local commit.
  Consumers scale independently.
  Replay for new Reporting service.
  Ledger outage ≠ Payment outage.`,
    failure:
      'Consumer crash after process before offset commit → redelivery → must be idempotent. Poison message → DLQ + alert. Hot key paymentId skew. Lag → scale partitions/consumers or fix slow handler.',
    tradeoff:
      'Pros: decoupling, replay, throughput. Cons: eventual consistency, ops cost, ordering only per key/partition, harder “did step X finish?” queries.',
    pros: 'Excellent fan-out, backpressure, independent scaling, audit log retention.',
    cons: 'Not request/response; dual-write needs outbox; exactly-once ≠ business exactly-once.',
    badDesign: `Payment HTTP thread:
  for (svc : [Ledger, Notify, Fraud, Report])
      rest.post(svc)`,
    goodDesign: `Payment: sync decide → commit + outbox
Kafka: parallel consumers with idempotency + DLQ`,
    security: 'SASL/mTLS; ACLs per principal; encrypt PII fields; no PAN in payloads.',
    observability: 'producer error rate, consumer lag per group, DLQ depth, process time, rebalance rate.',
    trap: 'Claiming Kafka gives exactly-once payments without idempotent consumers and careful producer config.',
    interviewAnswer:
      'After payment accept I publish payment-created via transactional outbox. Ledger, Notify, Fraud, and Reporting each consume in their own group with idempotent handlers and DLQ. That beats five sync REST calls for availability and scale. I still use REST for the Account validate that must answer inside the request. Kafka is at-least-once — duplicates are expected; business keys make processing safe.',
    remember: [
      'Outbox to avoid dual-write',
      'At-least-once → idempotent consumers',
      'Ordering per partition key',
      'Lag + DLQ are first-class SLIs',
    ],
    oneLiner: 'Kafka for after-commit fan-out and replay — not for allow/deny on the hot path.',
    tables: [
      {
        headers: ['Kafka concept', 'Interview meaning'],
        rows: [
          ['Topic', 'Named stream of events'],
          ['Partition', 'Ordered log + parallelism unit'],
          ['Consumer group', 'Competing consumers; one offset log'],
          ['Offset', 'Progress cursor — commit after side effect carefully'],
          ['Lag', 'How far behind realtime'],
          ['DLQ', 'Poison / exhausted retries'],
          ['Replay', 'Reset offsets / new group'],
        ],
      },
    ],
  },
  {
    id: 'rest-vs-kafka-matrix',
    title: 'REST vs Kafka — practical decision matrix',
    problem:
      'Interviewers ask “REST or Kafka?” expecting a framework, not a brand preference.',
    what:
      'Side-by-side decision table plus reasoning for FinTech edges.',
    why:
      'Wrong choice either cascades outages (over-sync) or creates lying UX / hard consistency bugs (over-async).',
    when: 'Every new service edge — document the choice in an ADR.',
    whenNot: 'Do not force one technology for all edges of the payment journey.',
    how:
      'Fill the matrix per interaction: immediate response? fan-out? replay? ordering scope? consistency need?',
    flow: `Requirement              REST              Kafka
Immediate response       Yes               No (without request-reply hack)
Loose coupling           Low               High
Async processing         No                Yes
Fan-out                  Limited           Excellent
Replay                   No                Yes
Ordering                 Per request       Per partition key
Backpressure             Limited           Strong (lag)
Simple CRUD              Excellent         Overkill
Checkout auth            Prefer            Avoid
Ledger / notify          Avoid on hot path Prefer`,
    failure:
      'Kafka request-reply for checkout adds broker dependency to UX path. REST for analytics fan-out creates brittle midnight batch storms.',
    tradeoff: 'Neither wins globally — optimize per edge for UX, consistency, and blast radius.',
    pros: 'Shared vocabulary for architecture reviews.',
    cons: 'Tables without reasoning become cargo cult.',
    badDesign: 'One slide: “We standardized on Kafka for everything.”',
    goodDesign: 'Per-edge ADR: validate=REST, payment-created=Kafka, fraud hard-stop=gRPC.',
    security: 'Both need auth; event payloads need field-level care.',
    observability: 'Compare SLO: sync p99 vs async end-to-end completion SLI.',
    trap: 'Using the matrix to ban REST in “modern” architectures.',
    interviewAnswer:
      'REST when I need an immediate response and simple CRUD. Kafka when I need fan-out, replay, and failure isolation after commit. For payments: REST/gRPC to decide, Kafka to broadcast. I never say one is universally better — I name the edge and the failure mode.',
    remember: [
      'Matrix per edge, not per company',
      'Immediate → REST/gRPC',
      'Fan-out/replay → Kafka',
      'Hybrid payment platforms',
    ],
    oneLiner: 'REST for answers now; Kafka for fan-out later — decide per edge.',
    tables: [
      {
        headers: ['Requirement', 'REST', 'Kafka'],
        rows: [
          ['Immediate response', 'Yes', 'No'],
          ['Loose coupling', 'Low', 'High'],
          ['Async processing', 'No', 'Yes'],
          ['Fan-out', 'Limited', 'Excellent'],
          ['Replay', 'No', 'Yes'],
          ['Ordering', 'Request based', 'Partition based'],
          ['Backpressure', 'Limited', 'Strong'],
          ['Simple CRUD', 'Excellent', 'Overkill'],
        ],
      },
    ],
  },
  {
    id: 'rest-vs-kafka-scenario',
    title: 'REST vs Kafka — payment submit scenario',
    problem:
      'Customer submits a payment. Two architectures are proposed in design review. You must pick and defend.',
    what:
      'Approach A: sync REST chain. Approach B: sync decide + Kafka fan-out. Staff answer compares latency, availability, coupling, consistency, scale.',
    why:
      'This is the classic whiteboard that separates textbook definitions from production judgment.',
    when: 'System design interviews and real payment platform ADRs.',
    whenNot: 'Do not pretend Approach B needs zero sync calls — Account validate still sync.',
    how:
      'Draw both. Quantify failure propagation. Choose hybrid: A for critical checks only, B for side effects.',
    flow: `Approach A — all sync
Payment → Account REST → Risk REST → Ledger REST → Notify REST
  Latency: sum of hops
  Availability: product of dependencies
  Failure: one timeout fails payment
  Coupling: deploy/order tightly coupled
  Scale: slowest service caps throughput

Approach B — hybrid (preferred for most FinTech)
Payment → Account REST (validate)
       → Risk gRPC/REST (optional hard stop)
       → commit + outbox
       → Kafka payment-created
            → Ledger / Notify / Reporting
  Latency (user): only sync hops
  Availability: Payment up even if Notify down
  Consistency: eventual for Ledger
  Replay: yes for new consumers
  New problem: eventual consistency + idempotency + lag ops`,
    failure:
      'A: Risk slow → all payments fail. B: Ledger lag → balances stale until caught up — must expose payment status API.',
    tradeoff:
      'B wins isolation and scale but requires status model + idempotency + outbox. A is easier to reason about for tiny systems and fails hard under dependency blips.',
    pros: 'Teaches honest trade-offs — Kafka introduces new problems.',
    cons: 'Over-selling B without status/read models.',
    badDesign: 'Approach A for Notify and Reporting on the hot path.',
    goodDesign: 'Approach B with explicit payment status resource for clients polling/webhooks.',
    security: 'Same auth on sync; event ACLs on async.',
    observability: 'Trace sync path; lag dashboards for B.',
    trap: 'Saying B is always better — for a two-service internal tool, A may be fine.',
    interviewAnswer:
      'I reject pure Approach A for production payments because notification and reporting outages should not fail money acceptance. I keep Account (and maybe Risk) synchronous, then fan out on Kafka after commit. I accept eventual ledger visibility and invest in idempotent consumers, outbox, payment status APIs, and lag alerts. For a tiny admin tool, a short REST chain can be acceptable.',
    remember: [
      'Compare blast radius, not hype',
      'Hybrid beats pure A or pure B',
      'Kafka adds consistency/ops cost',
      'Expose payment status for eventual steps',
    ],
    oneLiner: 'Sync the decision; async the side effects — and admit Kafka’s new failure modes.',
  },
  {
    id: 'hybrid-architecture',
    title: 'Hybrid communication — what production actually looks like',
    problem:
      'Binary debates (REST vs Kafka) hide the real pattern: gateways and sync APIs in front, events behind the accept boundary.',
    what:
      'Client → API Gateway → Payment API (REST) → Payment Service uses REST/gRPC for dependencies that must answer, Kafka for post-commit processing.',
    why:
      'Matches UX (immediate payment id/status) and operations (decoupled consumers) without forcing reactive everything.',
    when: 'Almost every serious FinTech platform.',
    whenNot: 'Single service CRUD apps — hybrid is overkill.',
    how:
      'North-south: REST via gateway. East-west sync: RestClient/Feign/gRPC with resilience. East-west async: outbox → Kafka. Webhooks for PSP callbacks.',
    flow: `Client
  |
  v
API Gateway   (auth, TLS, rate limit, routing)
  |
  v
Payment Service
  |
  | REST/gRPC (sync)
  v
Account / Risk
  |
  | Kafka (async)
  v
Ledger + Notification + Reporting

Staff line:
  "We use both — intentionally, on different edges."`,
    failure:
      'Gateway stuffed with business orchestration. Or Kafka request-reply replacing sync Account calls.',
    tradeoff: 'Two operational stacks (HTTP + broker) — justified by clearer failure domains.',
    pros: 'Best of both; clear UX; scalable side effects.',
    cons: 'Team must understand both models; status/read models required.',
    badDesign: 'Everything sync OR everything Kafka request-reply.',
    goodDesign: 'Sync decide + async disseminate + status API.',
    security: 'Gateway edge auth; mTLS east-west; Kafka ACLs.',
    observability: 'End-to-end trace across HTTP and messaging instrumentation.',
    trap: 'Calling the platform “event-driven” while 90% of critical path is sync — be precise.',
    interviewAnswer:
      'Production payment platforms I have built are hybrid. The client talks REST through a gateway. Payment calls Account synchronously for eligibility. After accept we publish events for ledger and notify. That is not indecision — it is matching communication style to whether the caller needs an answer now.',
    remember: [
      'Hybrid is the default at scale',
      'Gateway ≠ business logic',
      'Sync edge + async edge',
      'Name both in interviews',
    ],
    oneLiner: 'Real systems use REST and Kafka on purpose — different edges, different jobs.',
  },
  {
    id: 'failure-playbook',
    title: 'Failure playbook — seven scenarios staff must nail',
    problem:
      'Interviewers probe partial failure. Definitions of REST/Kafka without failure stories fail the bar.',
    what:
      'Concrete scenarios: downstream down, timeout, lost response, Kafka crash before offset commit, duplicate process, consumer lag, slow dependency cascade.',
    why:
      'Distributed systems fail partially. Design is how you behave when they do.',
    when: 'Design reviews, incident drills, interviews.',
    whenNot: 'Do not memorize scripts without tying to your actual timeouts/CB config.',
    how:
      'For each mechanism document: detect, mitigate, permanent fix. Pair retry with idempotency. Pair timeout with CB. Pair lag with scaling/backpressure.',
    flow: `1) Downstream unavailable
   REST: fail fast / CB open / fallback policy
   Kafka: producer retry; consumer pauses; alert lag

2) Network timeout
   Ambiguous outcome → inquire / idempotent retry

3) Success but response lost
   Client retries → server must dedupe by Idempotency-Key

4) Kafka processed, offset not committed, crash
   Redelivery → idempotent handler required

5) Message processed twice
   Upsert by business key; conditional writes

6) Consumer slow / lag
   Metrics → add partitions/instances OR fix handler / DLQ poison

7) Dependency extremely slow
   Timeout → CB → bulkhead → protect Payment thread pool`,
    failure: 'Blind retries without idempotency create double postings — worse than the original timeout.',
    tradeoff: 'Fail-closed vs fail-open is a product/risk decision (fraud vs availability).',
    pros: 'Shared language for on-call and interviews.',
    cons: 'Playbooks rot without game days.',
    badDesign: 'Retry POST payment 5 times on timeout with no key.',
    goodDesign: 'Timeout + inquire PSP/Account by idempotency key; never blind re-POST.',
    security: 'Do not disable auth on “retry paths.”',
    observability: 'Timeout rate, CB state, duplicate key hits, lag, DLQ.',
    trap: 'Equating HTTP 500 with “safe to retry.”',
    interviewAnswer:
      'On timeout I assume the request may have succeeded. For payments I retry only with the same Idempotency-Key or I call an inquiry API. Circuit breakers stop hammering a sick Account service; bulkheads stop that sickness from eating Payment’s threads. On Kafka, at-least-once means my consumer must be idempotent; lag is an SLO I page on; poison messages go to DLQ after bounded retries.',
    remember: [
      'Timeout ⇒ ambiguous',
      'Retry ⇒ needs idempotency',
      'CB stops cascades',
      'Kafka redelivery is normal',
    ],
    oneLiner: 'Partial failure is the design — timeout, idempotent retry, CB, DLQ, lag.',
    tables: [
      {
        headers: ['Scenario', 'Risk', 'Control'],
        rows: [
          ['Downstream down', 'Cascade', 'CB + fallback policy'],
          ['Timeout', 'Duplicate side effect', 'Idempotency / inquire'],
          ['Lost response', 'Client re-POST', 'Idempotency-Key'],
          ['Offset after process', 'Redelivery', 'Idempotent consumer'],
          ['Double process', 'Double post', 'Business key upsert'],
          ['Lag', 'Stale ledger', 'Scale / fix / alert'],
          ['Slow dep', 'Thread exhaustion', 'Timeout + bulkhead'],
        ],
      },
    ],
  },
  {
    id: 'retry-idempotency-deep',
    title: 'Retry + idempotency — never one without the other',
    problem:
      'Payment times out calling Bank/Account. The write may have succeeded. Blind retry creates duplicate transactions.',
    what:
      'Retries re-attempt a failed or ambiguous call. Idempotency makes duplicates safe by recognizing the same business intent (Idempotency-Key / natural key).',
    why:
      'Networks are unreliable. Retries improve availability only if duplicates do not corrupt money.',
    when:
      'Transient 503/429; connection resets; after CB half-open probes — always with keys on money-moving POSTs.',
    whenNot:
      'Do not retry non-idempotent POSTs. Do not retry 400 validation errors. Do not infinite retry without budget/jitter.',
    how:
      'Client sends Idempotency-Key. Server stores key→response/resource. Retries return the first result. Combine with exponential backoff + jitter + max attempts. Kafka: idempotent producer + consumer dedupe table.',
    flow: `Payment Service
      |
      | POST /bank/payments
      | Idempotency-Key: 7c2e…
      v
Bank Service
      |
      | timeout (maybe succeeded)
      X

Safe retry:
  POST same Idempotency-Key → returns original payment id

Unsafe retry:
  POST payment
  POST payment
  POST payment  → triple capture`,
    failure: 'Key not stored atomically with side effect → gaps. Key TTL too short → duplicates after expiry.',
    tradeoff: 'Idempotency store adds state and storage — mandatory for money.',
    pros: 'Safe availability under flaky networks.',
    cons: 'Requires careful key scope (user, amount, destination) and TTL policy.',
    badDesign: 'Feign Retryer on PaymentClient with no idempotency.',
    goodDesign: 'Resilience4j retry only for GET/idempotent; POST requires key; PSP inquiry on ambiguity.',
    security: 'Keys must not be guessable across tenants; authorize key ownership.',
    observability: 'idempotency_hit_total vs miss; duplicate suppressed metric is a health signal.',
    trap: '“We have Kafka EOS” as excuse to skip consumer idempotency for ledger posts.',
    interviewAnswer:
      'Blind retry is dangerous because timeout is not the same as failure. In payments I always pair retries with Idempotency-Key (or PSP inquiry). The server persists the key with the payment row so a re-POST returns the original result. I use jittered backoff and a retry budget so I do not DDoS a recovering dependency.',
    remember: [
      'Timeout ≠ failure',
      'Retry + idempotency together',
      'Backoff + jitter + budget',
      'Money POSTs always keyed',
    ],
    oneLiner: 'Never retry money without idempotency — timeout may already have charged.',
  },
  {
    id: 'timeout-circuit-breaker',
    title: 'Timeout vs circuit breaker — different jobs',
    problem:
      'Teams set retries but leave infinite waits, or open circuits without understanding half-open.',
    what:
      'Timeout: stop waiting on one call. Circuit breaker: stop sending traffic to a sick dependency for a cool-down, then probe.',
    why:
      'Timeouts protect threads. Circuit breakers protect the platform from retry storms and give dependents time to recover.',
    when:
      'Every sync dependency gets a timeout. CB when error/latency rate crosses threshold for that dependency.',
    whenNot:
      'CB is not a substitute for a missing timeout. Timeout is not a substitute for bulkhead isolation.',
    how:
      'Resilience4j: TimeLimiter/configured HTTP timeouts + CircuitBreaker per downstream + Bulkhead/semaphore or pool. States CLOSED → OPEN → HALF_OPEN.',
    flow: `CLOSED — traffic flows
   |
 failures / slow calls
   v
OPEN — fail fast, no calls
   |
 wait (open duration)
   v
HALF_OPEN — limited probes
   |
 success → CLOSED
 failure → OPEN

Production: Account CB open → Payment fails fast
  instead of tying up every Tomcat/VT thread.`,
    failure: 'Shared CB across all downstreams — one bad API opens breaker for healthy ones.',
    tradeoff: 'Fail fast reduces cascade but increases user-visible errors unless fallback exists.',
    pros: 'Stops cascading latency collapse.',
    cons: 'Mis-tuned CB flapping; needs metrics and alert on open state.',
    badDesign: 'One global CB; no per-host timeout.',
    goodDesign: 'Per-dependency timeout + CB + bulkhead; alert on open.',
    security: 'Fail-fast still returns sanitized errors — no stack traces.',
    observability: 'CB state gauge, slow call rate, timeout rate.',
    trap: 'Using mesh retries AND app retries AND no CB — amplification.',
    interviewAnswer:
      'Timeouts bound how long I wait. Circuit breakers bound whether I call at all when Account is sick. They are complementary: without timeouts my threads die; without CB I keep hammering. I configure them per dependency, watch the open state, and avoid stacking mesh + app retries without a budget.',
    remember: [
      'Timeout = stop waiting',
      'CB = stop calling',
      'Per dependency',
      'HALF_OPEN probes',
    ],
    oneLiner: 'Timeout protects threads; circuit breaker protects the dependency and the fleet.',
  },
  {
    id: 'saga-payments',
    title: 'Distributed transaction problem → Saga',
    problem:
      'Account hold SUCCESS, Ledger SUCCESS, Notification FAILURE — should we rollback money? Classic 2PC across microservices is usually the wrong answer.',
    what:
      'Sagas coordinate multi-service workflows with local transactions + compensating actions (choreography via events or orchestration via a coordinator).',
    why:
      'ACID does not span service databases without a distributed TX coordinator that couples availability. Payments need eventual consistency with explicit compensations.',
    when:
      'Multi-step business flows: reserve funds → capture → receipt; order → inventory → ship.',
    whenNot:
      'Single-service local TX. Do not saga what should be one aggregate.',
    how:
      'Orchestration: PaymentOrchestrator calls Account hold, then Ledger, on failure compensate release hold. Choreography: events PaymentHeld → LedgerPosted → Notify; compensations on failure topics. Prefer orchestration for money clarity.',
    flow: `Dangerous mental model (fake distributed ACID):
Payment → Account + Ledger + Notify in one “TX”

Reality:
Account = SUCCESS
Ledger = SUCCESS
Notify = FAILURE
  → Do NOT magically rollback card capture
  → Retry notify / DLQ / manual ops
  → Money path uses compensations if a later step fails
     (e.g. release hold if capture fails)

Saga (orchestration sketch):
  Hold Account → Post Ledger → Capture
  On capture fail → compensate Ledger + release Hold`,
    failure: 'Missing compensations; compensations that are not idempotent; orchestrator as SPOF without care.',
    tradeoff: 'Saga complexity vs distributed locking/2PC fragility.',
    pros: 'Explicit business recovery paths.',
    cons: 'Harder than local TX; needs status model and ops runbooks.',
    badDesign: 'XA/2PC across Account and Ledger DBs for every payment.',
    goodDesign: 'Local TX + saga compensations + idempotent steps + payment state machine.',
    security: 'Compensate APIs must be authorized and audited.',
    observability: 'Saga step metrics; stuck-in-state alerts.',
    trap: 'Calling Kafka consumers a “saga” without compensations or state.',
    interviewAnswer:
      'I do not run ACID across Payment, Account, and Ledger. Each service commits locally. Long flows use a saga: either an orchestrator or event choreography with compensations. If notify fails after money moves, I retry notification — I do not unwind the ledger because email failed. If capture fails after hold, I compensate the hold. Every step is idempotent.',
    remember: [
      'No easy distributed ACID',
      'Saga = local TX + compensate',
      'Notify failure ≠ money rollback',
      'Idempotent compensations',
    ],
    oneLiner: 'Across services use sagas and compensations — not wishful 2PC.',
  },
  {
    id: 'payment-case-study-complete',
    title: 'Case study — payment processing platform communication',
    problem:
      'Design communication for high-volume payments: low latency auth, HA, fraud, ledger, notify, audit, reporting, retries, duplicate protection, recovery.',
    what:
      'End-to-end architecture combining gateway, sync REST/gRPC, Kafka fan-out, outbox, idempotency, saga-ish capture, DLQ, lag monitoring.',
    why:
      'This is the staff-level “put it all together” answer.',
    when: 'Capstone of the article / system design interview.',
    whenNot: 'Do not copy wholesale into a three-service startup without ops maturity.',
    how:
      'See flow. Justify each edge. List failure controls. Define SLIs.',
    flow: `                 ┌──────────────┐
                 │    Client    │
                 └──────┬───────┘
                        |
                        v
                 ┌──────────────┐
                 │ API Gateway  │  TLS, JWT, rate limit, routing
                 └──────┬───────┘
                        |
                        v
                 ┌──────────────┐
                 │Payment Service│
                 └───┬──────┬───┘
                     |      |
                 REST/gRPC  outbox→Kafka
                     |      |
                     v      v
               Account     payment-created
               (+ Risk)         |
                                +--> Ledger (idempotent)
                                +--> Notification
                                +--> Fraud enrich
                                +--> Reporting / Audit

Why REST/gRPC: eligibility + hard fraud stop need immediate answers.
Why Kafka: fan-out, HA isolation, replay, scale consumers.
Duplicates: Idempotency-Key on accept; consumer dedupe by paymentId.
Retry: jittered; inquire on ambiguous PSP; DLQ after N.
Offsets: commit after side effect / use transactional inbox pattern.
Ordering: key=paymentId (or accountId for per-account ledger order).
Consistency: payment status API reflects ACCEPTED vs LEDGER_POSTED.
Saga: capture/settle compensations if needed.
Monitor: RED, CB, lag, DLQ, idempotency hits, auth p99.`,
    failure:
      'Account CB open → fail closed or defer (product). Ledger lag → status stays ACCEPTED. Poison notify → DLQ + ops. Duplicate client submit → same payment id returned.',
    tradeoff:
      'Operational complexity of hybrid + events is the price of HA and scale. Pure sync is simpler and more fragile.',
    pros: 'Interview-complete story covering almost every mechanism.',
    cons: 'Must still tune numbers from real SLOs — no fake latency claims.',
    badDesign: 'Sync all five; or Kafka-only auth.',
    goodDesign: 'Hybrid diagram above with status + idempotency + DLQ.',
    security: 'PCI scope isolation; tokenize PAN; mTLS; Kafka ACLs; vault secrets.',
    observability: 'Business SLI: payments accepted; ledger posted within N seconds; notify success.',
    trap: 'Drawing the diagram without mentioning idempotency and lag.',
    interviewAnswer:
      'I put an API gateway in front for TLS, auth, and rate limits — not business rules. Payment Service validates Account over REST and may call Risk over gRPC if we need low-latency binary scoring. On accept I write the payment and an outbox row, then publish payment-created. Ledger, Notify, Fraud, and Reporting consume independently with idempotent handlers and DLQs. Clients read payment status for eventual steps. Timeouts, CB, bulkheads protect the sync path; lag alerts protect the async path. Duplicates are handled with Idempotency-Key and business-key upserts — I never claim the broker alone makes payments exactly-once.',
    remember: [
      'Gateway edge only',
      'Sync decide / async fan-out',
      'Outbox + idempotency + DLQ',
      'Status API for eventual steps',
      'Page on lag and CB open',
    ],
    oneLiner: 'Payment platform: sync auth edges, Kafka after accept, idempotency everywhere money moves.',
    tables: [
      {
        headers: ['Edge', 'Mechanism', 'Why'],
        rows: [
          ['Client → Payment', 'REST via gateway', 'Public API, auth, rate limit'],
          ['Payment → Account', 'REST', 'Immediate eligibility'],
          ['Payment → Risk', 'gRPC or REST', 'Tight SLO scoring'],
          ['Payment → Ledger/Notify/Report', 'Kafka', 'Fan-out + isolation'],
          ['PSP callbacks', 'Webhooks', 'External async truth'],
        ],
      },
    ],
  },
  {
    id: 'bad-vs-good-designs',
    title: 'Bad design vs better design (with new problems)',
    problem:
      'Candidates say “use Kafka” as if it erases trade-offs. Staff answers show both sides.',
    what:
      'Paired anti-pattern and improved pattern for payment communication — plus what Kafka newly costs.',
    why:
      'Architecture is trade-off selection under constraints.',
    when: 'Design reviews and interviews.',
    whenNot: 'Do not shame small systems that correctly use short REST chains.',
    how: 'Always state: better for what metric? What new failure appears?',
    flow: `Bad — sync fan-out on request thread
Payment
  +--> Account REST
  +--> Risk REST
  +--> Ledger REST
  +--> Notification REST
  +--> Reporting REST
Problems: latency sum, availability product, cascade, coupling

Better — sync decide + async fan-out
Payment
  +--> Account (and maybe Risk) sync
  v
Kafka
  +--> Ledger
  +--> Notification
  +--> Reporting
Wins: isolation, scale, replay
New problems: eventual consistency, lag, idempotency, outbox, status UX`,
    failure: '“Better” without outbox still dual-writes and loses events.',
    tradeoff: 'Complexity moves from runtime cascade to messaging ops.',
    pros: 'Forces nuanced speech interviewers reward.',
    cons: 'None if done honestly.',
    badDesign: 'Five sync REST calls on payment submit.',
    goodDesign: 'Two sync + Kafka fan-out + status + idempotency.',
    security: 'Same — do not weaken auth on the “better” path.',
    observability: 'Must add lag/DLQ when adopting Kafka.',
    trap: 'Calling the better diagram universally best for every company.',
    interviewAnswer:
      'The sync fan-out design fails when Notify is down — payments stop. The Kafka design isolates that failure but introduces eventual consistency and consumer lag I must operate. I choose the second for production payments and I invent the new problems on purpose: outbox, idempotent consumers, DLQ, and a payment status model.',
    remember: [
      'Always name new problems',
      'Better ≠ universally best',
      'Isolation vs consistency',
      'Operate what you introduce',
    ],
    oneLiner: 'Improve blast radius deliberately — and own Kafka’s new failure modes.',
  },
  {
    id: 'observability-security-perf',
    title: 'Observability, security, performance across hops',
    problem:
      'Communication without telemetry and security is unverifiable; “faster” claims without context are empty.',
    what:
      'Correlation/trace IDs across REST and Kafka; mTLS/JWT/OAuth2; performance levers for REST, Kafka, gRPC — trade-offs, not slogans.',
    why:
      'You cannot operate what you cannot see; you cannot trust open east-west traffic.',
    when: 'From day one of a service edge.',
    whenNot: 'Do not bolt on tracing only after a Sev-1.',
    how:
      'W3C traceparent on HTTP; propagate through Kafka headers; RED metrics; lag; DLQ. Security: TLS everywhere, mTLS or JWT between services, Kafka SASL/ACLs, secrets in vault. Perf: pools/HTTP2/compression; Kafka batching/partitions; gRPC protobuf — measure with SLOs.',
    flow: `Request
  |
Correlation ID / Trace ID
  |
Payment (REST span)
  |
Account (child span)
  |
Kafka (produce span + header)
  |
Ledger (consume span)

Monitor: latency, error rate, saturation,
         CB state, consumer lag, DLQ depth,
         idempotency hits, auth failures`,
    failure: 'Missing trace on Kafka hop → blind spots. Debug logs with PAN → PCI incident.',
    tradeoff: 'High cardinality metrics can overwhelm backends — name carefully.',
    pros: 'Turns communication into operable contracts.',
    cons: 'Instrumentation cost; privacy constraints on payloads.',
    badDesign: 'Feign FULL logging of payment bodies in prod.',
    goodDesign: 'Structured logs with paymentId only + OTel traces + redaction.',
    security: 'OAuth2/JWT at edge; mTLS east-west; rotate keys; least privilege ACLs.',
    observability: 'Golden signals + business SLIs (ledger posted within SLA).',
    trap: 'Claiming gRPC is “10x faster” without payload/SLO context.',
    interviewAnswer:
      'I propagate trace and correlation IDs across HTTP and Kafka so one payment is one story. I monitor RED for sync deps, consumer lag and DLQ for async, and circuit breaker state. Security is TLS plus service identity — JWT or mTLS — and Kafka ACLs. Performance comes from pooling, batching, and binary protocols where justified — I tune to SLOs, I do not quote mythical speedups.',
    remember: [
      'Trace across Kafka too',
      'Lag is an SLI',
      'No PAN in logs',
      'Measure, do not mythologize speed',
    ],
    oneLiner: 'Trace every hop, secure every hop, tune to SLOs — not to blog benchmarks.',
  },
  {
    id: 'tech-cheat-sheet',
    title: 'Interview cheat sheet — technologies at a glance',
    problem: 'Need a pre-interview revision surface that is opinionated and short.',
    what: 'One-liners per technology: best for, avoid when, coupling, consistency, failure, scale.',
    why: 'Staff interviews reward crisp decision speech under time pressure.',
    when: 'Night before interview; architecture kickoffs.',
    whenNot: 'Do not recite without tying to the company’s constraints.',
    how: 'Memorize the one-liner; expand with a FinTech example.',
    flow: `REST — Best: public/simple sync. Avoid: fan-out side effects.
Feign — Best: declarative JVM HTTP. Avoid: hiding timeouts.
RestClient — Best: Boot 3 MVC sync. Avoid: no pool/timeout config.
WebClient — Best: non-blocking/reactive stacks. Avoid: MVC cargo-cult.
gRPC — Best: internal low-latency contracts. Avoid: public browser APIs.
Kafka — Best: async fan-out/replay. Avoid: checkout allow/deny.
Gateway — Best: edge auth/rate limit. Avoid: business orchestration.
Saga — Best: multi-service money flows. Avoid: single DB problems.`,
    failure: 'Cheat sheets without failure stories become trivia.',
    tradeoff: 'Brevity vs nuance — use as spine, not script.',
    pros: 'Fast recall.',
    cons: 'Can sound canned if not personalized.',
    badDesign: 'Technology shopping list with no when-not.',
    goodDesign: 'This sheet + one payment story.',
    security: 'Mention mTLS/JWT in every sync answer.',
    observability: 'Mention RED + lag in every async answer.',
    trap: 'Saying “exactly-once” casually.',
    interviewAnswer:
      'My cheat sheet is decision-shaped: REST for immediate answers, gRPC for tight internal RPC, Kafka for post-commit fan-out, gateway at the edge only, saga when money spans services, and always timeouts, idempotency, and observability. I explain why not just what.',
    remember: [
      'Best for / avoid when',
      'One FinTech example each',
      'Failure handling clause',
      'Hybrid platforms',
    ],
    oneLiner: 'Revise decisions, not definitions — best for, avoid when, failure mode.',
    tables: [
      {
        headers: ['Technology', 'Best for', 'Avoid when', 'Interview one-liner'],
        rows: [
          ['REST', 'Public API, validate, CRUD', 'Post-commit fan-out', 'Immediate answer over HTTP'],
          ['OpenFeign', 'Declarative JVM clients', 'Hidden retries/timeouts', 'Interface-shaped HTTP with explicit resilience'],
          ['RestClient', 'Boot 3 sync MVC', 'Reactive-only shops', 'Modern blocking client with pools'],
          ['WebClient', 'Non-blocking I/O stacks', 'Simple MVC call', 'Reactive when concurrency model needs it'],
          ['gRPC', 'Internal RPC, streaming', 'Browser public API', 'HTTP/2 + protobuf for internal speed/contracts'],
          ['Kafka', 'Fan-out, replay, throughput', 'Allow/deny in request', 'Async decouple after commit'],
          ['Gateway', 'Auth, TLS, rate limit', 'Domain logic', 'Edge policy, not orchestrator'],
          ['Saga', 'Multi-service money', 'Single service TX', 'Local TX + compensations'],
        ],
      },
    ],
  },
];

/** Concise tech cheat rows for hub table rendering */
export const TECH_CHEAT_DETAILED: {
  technology: string;
  bestFor: string;
  avoidWhen: string;
  communication: string;
  latency: string;
  coupling: string;
  consistency: string;
  failureHandling: string;
  scaling: string;
  keyTradeoff: string;
  oneLiner: string;
}[] = [
  {
    technology: 'REST/HTTP',
    bestFor: 'Public APIs, immediate validation, CRUD',
    avoidWhen: 'Large fan-out side effects on hot path',
    communication: 'Synchronous request/response',
    latency: 'Per-hop RTT; p99 dominated by dependency',
    coupling: 'Temporal coupling while waiting',
    consistency: 'Strong for that request’s response',
    failureHandling: 'Timeouts, CB, idempotent retry',
    scaling: 'Scale instances + pools; watch threads',
    keyTradeoff: 'Simplicity vs cascade risk',
    oneLiner: 'Default sync tool when someone waits for an answer.',
  },
  {
    technology: 'OpenFeign',
    bestFor: 'Declarative internal HTTP in Spring Cloud',
    avoidWhen: 'You cannot see/configure timeouts & retries',
    communication: 'Sync HTTP via generated client',
    latency: 'Same as REST + client overhead',
    coupling: 'Same as REST',
    consistency: 'Same as REST',
    failureHandling: 'Must wire Resilience4j explicitly',
    scaling: 'Same as REST clients',
    keyTradeoff: 'Ergonomics vs hidden magic',
    oneLiner: 'Convenient HTTP interfaces — never hide resilience config.',
  },
  {
    technology: 'RestClient',
    bestFor: 'Boot 3 MVC synchronous calls',
    avoidWhen: 'You need reactive composition end-to-end',
    communication: 'Blocking sync HTTP',
    latency: 'Bound with read timeouts',
    coupling: 'Temporal',
    consistency: 'Request scoped',
    failureHandling: 'onStatus + CB wrapper',
    scaling: 'Pools + virtual threads help; timeouts still required',
    keyTradeoff: 'Clarity vs blocking',
    oneLiner: 'Modern RestTemplate replacement for MVC.',
  },
  {
    technology: 'WebClient',
    bestFor: 'Non-blocking / reactive services',
    avoidWhen: 'Simple MVC apps without reactive skills',
    communication: 'Non-blocking HTTP',
    latency: 'Good under high concurrency if used correctly',
    coupling: 'Temporal (still sync semantically if you block)',
    consistency: 'Request scoped',
    failureHandling: 'Reactor retry/CB; easy to misuse',
    scaling: 'Event-loop concurrency; backpressure matters',
    keyTradeoff: 'Efficiency vs complexity',
    oneLiner: 'Use when your stack is reactive — do not cargo-cult it.',
  },
  {
    technology: 'gRPC',
    bestFor: 'Internal low-latency RPC, streaming',
    avoidWhen: 'Public browser clients without grpc-web strategy',
    communication: 'Sync or streaming over HTTP/2',
    latency: 'Often lower than JSON REST (binary + HTTP/2)',
    coupling: 'Strong schema coupling (protobuf)',
    consistency: 'Request scoped',
    failureHandling: 'Deadlines, status codes, CB',
    scaling: 'Connection reuse; multiplexed streams',
    keyTradeoff: 'Performance/contracts vs ecosystem friction',
    oneLiner: 'Internal RPC when contracts and latency matter.',
  },
  {
    technology: 'Kafka',
    bestFor: 'Async fan-out, replay, high throughput',
    avoidWhen: 'Immediate allow/deny UX',
    communication: 'Asynchronous events/commands',
    latency: 'End-to-end eventual; produce path can be fast',
    coupling: 'Loose temporal coupling',
    consistency: 'Eventual; at-least-once delivery',
    failureHandling: 'Retry, DLQ, idempotent consumers, lag alerts',
    scaling: 'Partitions + consumer groups',
    keyTradeoff: 'Isolation/scale vs consistency/ops complexity',
    oneLiner: 'Post-commit dissemination bus — not a checkout oracle.',
  },
  {
    technology: 'API Gateway',
    bestFor: 'Edge auth, TLS, routing, rate limits',
    avoidWhen: 'Hosting core domain orchestration',
    communication: 'North-south entry',
    latency: 'Adds hop — keep thin',
    coupling: 'Clients couple to gateway routes',
    consistency: 'N/A',
    failureHandling: 'Edge quotas, auth failures',
    scaling: 'Scale gateway fleet independently',
    keyTradeoff: 'Central policy vs god-gateway risk',
    oneLiner: 'Edge policy plane — keep business logic in services.',
  },
  {
    technology: 'Saga',
    bestFor: 'Multi-service money/order workflows',
    avoidWhen: 'Single-database local transactions suffice',
    communication: 'Orchestrated or choreographed steps',
    latency: 'Multi-step; user may see intermediate states',
    coupling: 'Workflow coupling',
    consistency: 'Eventual with compensations',
    failureHandling: 'Compensating transactions, retries, state machine',
    scaling: 'Scale steps independently',
    keyTradeoff: 'Correct recovery vs complexity',
    oneLiner: 'Local transactions plus compensations — not distributed ACID.',
  },
];
