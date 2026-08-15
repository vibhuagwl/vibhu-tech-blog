import type {CommSection} from './types';

/** Complete taxonomy ASCII — mechanism vs infrastructure. */
export const COMMUNICATION_TAXONOMY = `
MICROSERVICE COMMUNICATION — COMPLETE TAXONOMY
═══════════════════════════════════════════════

1. Synchronous Request/Response  (caller waits)
   ├── REST/HTTP (+ RestClient / WebClient / OpenFeign / RestTemplate*)
   ├── gRPC (unary)
   ├── GraphQL (often BFF → backends)
   └── RSocket (request-response)
       * RestTemplate = legacy

2. Asynchronous Messaging  (broker decouples)
   ├── Kafka (log / stream)
   ├── RabbitMQ (AMQP queues/exchanges)
   ├── AWS SQS (+ SNS fan-out)
   ├── Google Pub/Sub
   └── Azure Service Bus

3. Real-Time  (usually client ↔ edge; rarely service↔service)
   ├── WebSocket (bidirectional)
   ├── SSE (server → client stream)
   └── Long Polling (legacy / constrained clients)

4. Event-Driven
   ├── Domain events (same bounded context)
   ├── Integration events (across services)
   ├── CDC / Debezium (DB log → Kafka)
   └── Event streaming (Kafka/Pulsar)

5. Callback
   ├── Webhooks (HTTP callback to registered URL)
   └── Async callbacks (provider calls you later)

6. File / Object Storage
   ├── S3 / GCS / Azure Blob (+ event pointer)
   └── SFTP / file drop (banking/FinTech legacy)

7. Data-Based Integration  ⚠ usually ANTI-PATTERNS as "communication"
   ├── Shared database     → tight coupling (avoid)
   ├── Shared cache        → hidden contract (careful)
   └── CDC                 → valid *integration* pattern (not shared writes)

8. Infrastructure-Level  (NOT the application call mechanism)
   ├── API Gateway      (north-south)
   ├── Service Mesh     (east-west sidecar)
   ├── Kubernetes Service / DNS
   ├── Load Balancer
   └── Service Discovery registries

KEY DISTINCTION (say this in interviews):
  Gateway / discovery / LB / mesh wrap the call.
  The actual mechanism is still REST, gRPC, Kafka, webhook, etc.

  Client → Gateway → Discovery → LB → REST/gRPC → Service B
  Service A → Kafka → Service B
`;

export const INFRA_VS_MECHANISM = `
Application mechanism vs communication infrastructure
─────────────────────────────────────────────────────
MECHANISM (how data moves / contract):
  REST · gRPC · RSocket · Kafka · Rabbit · Webhook · SSE · Object store+event · CDC

INFRASTRUCTURE (how traffic is found, secured, balanced, observed):
  API Gateway · Service Mesh · K8s Service/DNS · LB · Eureka/Consul

Wrong answer: "We use Kubernetes to call the payment service."
Right answer: "We call payment over REST (RestClient); Kubernetes DNS + ClusterIP
              provide discovery and server-side load balancing."

Wrong answer: "We use Istio between services."
Right answer: "Services speak gRPC; Istio adds mTLS, retries, and telemetry
              around that gRPC — app still owns idempotency and domain timeouts."
`;

/** Additional / less-common mechanisms for maximum interview coverage. */
export const TAXONOMY_EXTRAS: CommSection[] = [
  {
    id: 'taxonomy-overview',
    title: 'Complete taxonomy · mechanism vs infrastructure',
    what:
      'Classify every A→B design into: sync RPC, async messaging, real-time push, event-driven, callback/webhook, file/object, data-based (usually anti-pattern), or infrastructure wrapping a mechanism.',
    why:
      'Interviewers fail candidates who list Feign and Kafka as peers of “Kubernetes” and “API Gateway.” Gateway/mesh/DNS are infrastructure around the real protocol.',
    when:
      'Open every Staff answer with the taxonomy branch, then pick one mechanism and name the infrastructure around it.',
    how:
      'Ask: (1) Does the caller wait? (2) Fan-out / replay needed? (3) Client vs service? (4) Large blob / batch? (5) Legacy file? Then choose branch 1–7. Layer gateway/mesh only for edge or east-west policy.',
    flow: COMMUNICATION_TAXONOMY.trim(),
    failure:
      'Treating mesh as a protocol. Treating shared DB as “async communication.” Using webhooks without idempotency as if they were Kafka.',
    tradeoff:
      'Taxonomy prevents protocol fashion — pick by deadline, fan-out, payload size, and ownership.',
    security:
      'Infrastructure (mTLS) ≠ application authz. Both required for zero-trust.',
    observability:
      'RED on the mechanism; mesh/gateway metrics are complementary, not substitutes.',
    trap:
      '“Our communication pattern is service mesh.” — mesh is infrastructure.',
    interviewAnswer:
      'I separate mechanism from infrastructure. Mechanism is REST, gRPC, Kafka, webhook, CDC, or object-store+event. Infrastructure is gateway, mesh, K8s DNS, and load balancers that discover, secure, and balance that mechanism. Shared DB/cache are anti-patterns when used as the communication contract.',
    remember: [
      'Mechanism ≠ infrastructure',
      'Gateway = north-south; mesh = east-west policy',
      'Shared DB/cache ≠ legitimate microservice bus',
      'Open with taxonomy branch in Staff answers',
    ],
    oneLiner: 'Taxonomy first: mechanism (REST/Kafka/…) then infrastructure (gateway/mesh/DNS).',
    tables: [
      {
        headers: ['Layer', 'Examples', 'Is it “how A calls B”?', 'Interview label'],
        rows: [
          ['Mechanism', 'REST, gRPC, Kafka, webhook', 'Yes', 'Application communication'],
          ['Infrastructure', 'Gateway, mesh, K8s Service', 'No — wraps mechanism', 'Traffic / policy plane'],
          ['Anti-pattern', 'Shared DB, shared Redis keys', 'Hidden coupling', 'Avoid as contract'],
          ['Integration', 'CDC, SFTP, S3+event', 'Yes (async/batch)', 'Integration patterns'],
        ],
      },
    ],
  },
  {
    id: 'rsocket',
    title: 'RSocket (reactive application protocol)',
    what:
      'Binary multiplexed protocol over TCP/WebSocket with four interaction models: request-response, request-stream, fire-and-forget, and channel — plus application-level backpressure. Spring supports RSocket with spring-boot-starter-rsocket.',
    why:
      'Modern Spring/reactive interviews ask for protocols that understand backpressure natively (unlike raw HTTP/1.1). Fits streaming pipelines and bi-directional flows without inventing custom framing.',
    when:
      'Reactive microservices already on WebFlux/Reactor needing streaming RPC with flow control. Edge cases: game/telemetry streams, internal streaming APIs. Not the default for CRUD CRUD teams on MVC.',
    how:
      'Define RSocketResponder methods (@MessageMapping). Client: RSocketRequester. Interaction models map to Mono/Flux. Transport: TCP or WebSocket. Combine with load balancing via client-side LB or mesh; still set timeouts/deadlines.',
    flow: `sequenceDiagram
  participant A as Service A (Requester)
  participant B as Service B (Responder)
  Note over A,B: TCP / WebSocket + RSocket framing
  A->>B: request-response
  B-->>A: single payload
  A->>B: request-stream
  B-->>A: Flux with backpressure
  A->>B: fire-and-forget
  A->>B: channel (bi-di Flux)`,
    failure:
      'Teams adopt RSocket without ops familiarity — hard to curl/debug. Mixing blocking JDBC on RSocket threads stalls responders. Forgetting cancellation/backpressure still OOMs.',
    tradeoff:
      'Pros: models + backpressure + multiplexing. Cons: niche hiring/ops; browsers need WebSocket transport; most enterprises standardize REST/gRPC/Kafka.',
    security:
      'TLS on transport; metadata for JWT; authorize per route. Do not treat fire-and-forget as durable — no broker.',
    observability:
      'Micrometer RSocket metrics; Reactor metrics; propagate tracing in metadata.',
    trap:
      '“RSocket replaces Kafka.” — RSocket is RPC/streaming between known peers; Kafka is durable fan-out/log.',
    interviewAnswer:
      'RSocket is a reactive application protocol with request-response, request-stream, fire-and-forget, and channel, plus backpressure. I use it when both sides are Reactor-native and need streaming flow control. For durable fan-out I still pick Kafka; for mundane CRUD I pick REST/gRPC.',
    remember: [
      'Four models + backpressure',
      'Not a message broker',
      'Spring Boot RSocket + RSocketRequester',
      'Ops familiarity is the real cost',
    ],
    oneLiner: 'RSocket — reactive RPC/streaming with backpressure; not a Kafka replacement.',
    tables: [
      {
        headers: ['Model', 'Shape', 'Use'],
        rows: [
          ['Request-Response', '1 → 1', 'Sync query/command'],
          ['Request-Stream', '1 → N', 'Feed with backpressure'],
          ['Fire-and-Forget', '1 → 0', 'Best-effort notify (no durability)'],
          ['Channel', 'N ↔ N', 'Bi-directional stream'],
        ],
      },
      {
        headers: ['vs', 'RSocket', 'gRPC', 'Kafka'],
        rows: [
          ['Backpressure', 'Native', 'Flow-control limited', 'Consumer lag'],
          ['Durability', 'No', 'No', 'Yes (log)'],
          ['Browser', 'WS transport', 'gRPC-Web', 'N/A'],
          ['Enterprise default', 'Niche', 'Common internal', 'Common async'],
        ],
      },
    ],
  },
  {
    id: 'webhooks',
    title: 'Webhooks / callback communication',
    what:
      'Service B (or an external provider) later invokes a pre-registered HTTPS URL on Service A when work completes — reverse of the original request. Classic for payments, KYC, shipping carriers.',
    why:
      'External processors cannot keep your HTTP connection open for minutes/hours. Callbacks deliver the outcome asynchronously without you polling forever.',
    when:
      'Payment capture confirmation, Stripe/Adyen events, partner status updates, long-running batch completion. Prefer Kafka internally; webhooks at trust boundaries.',
    how:
      'Register callback URL + secret. Provider POSTs signed payload (HMAC). Verify signature, enforce idempotency on event id, ack quickly (202), process via outbox/queue. Retry schedule is owned by provider — design for at-least-once.',
    flow: `sequenceDiagram
  participant A as Order Service
  participant P as Payment Provider
  A->>P: POST charge (sync)
  P-->>A: 202 accepted + paymentId
  Note over P: async processing
  P->>A: POST /webhooks/payments (HMAC)
  A->>A: verify + idempotent apply
  A-->>P: 200/202`,
    failure:
      'Unsigned webhooks → spoofing. Slow handler → provider retry storm. Missing idempotency → double state transitions. Firewall blocks provider IPs. Clock skew breaks signature windows.',
    tradeoff:
      'Pros: fits third parties; simple HTTP. Cons: you are the server now (availability SLO); retries; ordering not guaranteed.',
    security:
      'HMAC/signature verify; mTLS if enterprise; allowlist IPs; no secrets in query string; rotate webhook secrets; replay protection (timestamp + nonce/eventId).',
    observability:
      'Webhook receive rate, verify fail rate, processing lag, duplicate eventId rate, provider retry counts.',
    trap:
      'Treating webhook POST as exactly-once. Or doing heavy DB work inline before 200 — causes provider timeouts and more retries.',
    interviewAnswer:
      'Webhooks are async callbacks over HTTPS at trust boundaries. I verify signatures, ack fast, and apply idempotently by event id — often enqueue to Kafka for internal fan-out. Internally between our services I prefer Kafka over webhook meshes.',
    remember: [
      'HMAC + idempotent eventId',
      'Ack fast; process async',
      'At-least-once from provider',
      'Internal fan-out → Kafka after webhook',
    ],
    oneLiner: 'Webhooks — signed HTTPS callbacks; verify, ack fast, idempotent apply.',
    tables: [
      {
        headers: ['Concern', 'Webhook', 'Kafka internal'],
        rows: [
          ['Trust boundary', 'External/partners', 'Your fleet'],
          ['Delivery', 'Provider retries', 'Consumer groups + lag'],
          ['Ordering', 'Usually none', 'Per partition key'],
          ['Auth', 'HMAC/mTLS', 'ACL/mTLS/SASL'],
        ],
      },
    ],
  },
  {
    id: 'sse',
    title: 'SSE — Server-Sent Events',
    what:
      'HTTP response that stays open; server streams text/event-stream messages one way to the client. Spring: SseEmitter (MVC) or Flux<ServerSentEvent> (WebFlux).',
    why:
      'Simpler than WebSocket when you only need server→client push (notifications, progress, live scores). Works over plain HTTP, friendly to proxies that struggle with upgrades.',
    when:
      'One-way live updates to browsers/mobile. Prefer WebSocket when client must send frequently. Prefer Kafka between services.',
    how:
      'Client EventSource connects; server writes events with id/retry fields for reconnect. Authenticate via cookie/header (EventSource header limits → prefer cookie or fetch-based SSE). Scale with Redis/Kafka backplane per instance.',
    flow: `sequenceDiagram
  participant C as Browser
  participant S as Notification API
  C->>S: GET /events Accept text/event-stream
  loop push
    S-->>C: event: order.updated data: {...}
  end`,
    failure:
      'Proxy idle timeouts kill streams. Load balancers without sticky or shared bus drop reconnects. Browser connection limits (~6 per domain).',
    tradeoff:
      'Pros: simple one-way push over HTTP. Cons: uni-directional; weaker binary; reconnect semantics on you.',
    security:
      'HTTPS; auth on connect; do not put tokens in query strings if avoidable; CSRF considerations for cookie auth.',
    observability:
      'Active SSE connections; events/sec; reconnect rate; proxy 499/504 on long streams.',
    trap:
      'Using SSE between microservices instead of Kafka — wrong durability and fan-out model.',
    interviewAnswer:
      'SSE for one-way browser push over HTTP. WebSocket when bi-directional. Long polling only for legacy. Service-to-service real-time streams → gRPC/RSocket/Kafka, not SSE.',
    remember: ['One-way server→client', 'HTTP friendly', 'Reconnect + Last-Event-ID', 'Not inter-service bus'],
    oneLiner: 'SSE — one-way HTTP push to clients; not a service bus.',
  },
  {
    id: 'long-polling',
    title: 'Long polling',
    what:
      'Client issues HTTP request; server holds it open until an event arrives or a timeout elapses, then client immediately opens the next request. Legacy real-time pattern.',
    why:
      'Works where WebSocket/SSE are blocked by ancient proxies or clients. Still appears in system-design interviews and some partner APIs.',
    when:
      'Constrained networks, legacy mobile agents, or APIs that only offer long poll. Otherwise prefer SSE/WebSocket for clients and Kafka for services.',
    how:
      'Hold request on server with timeout (e.g. 25s < proxy timeout). On event, return payload; on timeout, return 204. Client loops. Cap concurrent held requests per user to protect thread/connection pools — or use async/NIO/virtual threads carefully.',
    flow: `sequenceDiagram
  participant C as Client
  participant S as API
  C->>S: GET /wait (hold)
  Note over S: wait up to 25s
  S-->>C: 200 event OR 204 empty
  C->>S: GET /wait (immediate next)`,
    failure:
      'Thread/connection exhaustion if each poll blocks a platform thread. Thundering herd when many clients wake together. Proxy shorter timeout than app → spurious empty responses.',
    tradeoff:
      'Pros: plain HTTP, firewall friendly. Cons: higher overhead than SSE/WS; easy to DoS yourself.',
    security:
      'Same as REST; rate-limit held connections; auth every poll.',
    observability:
      'Held request gauge; timeout empty ratio; p99 hold time vs proxy idle.',
    trap:
      'Building microservice fan-out with long poll between services — use a broker.',
    interviewAnswer:
      'Long polling is a legacy real-time compromise: hold HTTP until event or timeout. I mention it for constrained clients, then recommend SSE/WebSocket for UX and Kafka for service events. Size pools knowing each held call occupies a connection.',
    remember: ['Hold < proxy idle timeout', 'Client loops immediately', 'Protect connection pools', 'Prefer SSE/WS when possible'],
    oneLiner: 'Long polling — legacy hold-and-loop HTTP; prefer SSE/WebSocket.',
    tables: [
      {
        headers: ['Pattern', 'Direction', 'Connection', 'Best for', 'Avoid for'],
        rows: [
          ['REST', 'Req/resp', 'Short', 'CRUD/commands', 'High-freq push'],
          ['Long polling', 'Mostly pull', 'Held', 'Legacy realtime', 'Service↔service'],
          ['SSE', 'Server→client', 'Long HTTP', 'Notifications', 'Bi-di chat'],
          ['WebSocket', 'Bi-di', 'Long TCP', 'Chat/trading UI', 'Inter-service bus'],
        ],
      },
    ],
  },
  {
    id: 'unix-domain-sockets',
    title: 'Unix domain sockets / local IPC',
    what:
      'Process-to-process communication on the same host via filesystem socket paths (AF_UNIX) — no TCP/IP. Used by local proxies (Envoy admin), databases on localhost, sidecar↔app sometimes.',
    why:
      'Interview contrast: once services are distributed across hosts/pods, UDS cannot reach them. Explains why microservices standardize on network protocols.',
    when:
      'Same-machine sidecar, local DB, or high-performance co-located helpers. Never as the primary inter-microservice contract in Kubernetes (pods move hosts).',
    how:
      'Bind/listen on /var/run/app.sock; client connects to path. Permissions via filesystem mode/user. In containers, share volume for the socket path.',
    flow: `flowchart LR
  App[App process] -->|UDS /var/run/x.sock| Side[Local sidecar]
  App -.->|cannot| Remote[Other node pod]
  style Remote fill:#f8d7da`,
    failure:
      'Socket file permissions; stale sockets after crash; invisible across nodes — “works on my pod” until reschedule.',
    tradeoff:
      'Pros: lower overhead, no TCP stack, OS credential passing possible. Cons: host-local only; ops awkward in K8s vs localhost TCP to sidecar.',
    security:
      'Filesystem ACLs; never expose UDS on shared volumes broadly; prefer abstract namespace where supported.',
    observability:
      'Local only — still need app metrics; network dashboards will not show UDS.',
    trap:
      'Proposing UDS between microservices in a multi-node cluster.',
    interviewAnswer:
      'Unix domain sockets are same-host IPC. Great for local sidecars or local DB; inappropriate as the microservice communication mechanism once processes are distributed — then use REST/gRPC/Kafka over the network, with mesh/DNS as infrastructure.',
    remember: ['Same host only', 'Not multi-node microservices', 'Sidecar/local helper use case', 'Distributed → network protocols'],
    oneLiner: 'UDS — local IPC only; distributed services need network protocols.',
  },
  {
    id: 'cdc-debezium',
    title: 'CDC / Debezium (DB log → Kafka)',
    what:
      'Change Data Capture reads the database transaction log (WAL/binlog) and emits row-level change events to Kafka — Service A does not explicitly publish. Debezium is the common Kafka Connect source.',
    why:
      'Captures every committed change including legacy apps that cannot emit domain events. Enables read models, search indexes, and cross-service integration without dual-write from application code.',
    when:
      'Brownfield systems, search/cache projection, data lake, integrating a service that must not miss updates. Prefer explicit domain events + outbox when you own the write path and need rich business meaning.',
    how:
      'Debezium connector on Postgres/MySQL → Kafka topics per table (or route to domain topics). Downstream consumers translate CDC to integration events. Still need idempotent consumers and schema evolution strategy.',
    flow: `flowchart TD
  A[Service A] -->|SQL commit| DB[(Database)]
  DB -->|WAL/binlog| CDC[Debezium / CDC]
  CDC --> K[(Kafka)]
  K --> B[Service B / projections]
  Note1[A did not call B and did not publish intentionally]`,
    failure:
      'CDC floods topics with noisy table churn. Coupling consumers to physical schema (column rename breaks). Snapshot storms. Privilege to read binlog is sensitive. Exactly-once still needs consumer idempotency.',
    tradeoff:
      'Pros: no app dual-write; catches all commits. Cons: schema-level events ≠ domain language; infra heavy; harder to filter business intent.',
    security:
      'Lock down connector credentials; encrypt topics; scrub PII columns; audit who can read CDC streams.',
    observability:
      'Connector lag vs DB LSN; snapshot progress; topic produce rate; consumer lag on projections.',
    trap:
      'Equating CDC with “Service A published OrderPlaced.” CDC says row changed — you must map to business events or accept data-level coupling.',
    interviewAnswer:
      'CDC/Debezium streams DB commits into Kafka without the app publishing. Different from outbox/domain events: you get completeness for legacy writes, but events are table-shaped. When I own the service I prefer outbox domain events; CDC for brownfield or projections that must not miss a row.',
    remember: [
      'WAL → Kafka, not app publish',
      'Schema events ≠ domain events',
      'Great for brownfield / projections',
      'Prefer outbox when you own writes',
    ],
    oneLiner: 'CDC — DB log to Kafka; complete but schema-coupled vs domain outbox.',
    tables: [
      {
        headers: ['Pattern', 'Who emits?', 'Semantics', 'Best for'],
        rows: [
          ['Domain event + outbox', 'Application', 'Business intent', 'Greenfield services'],
          ['CDC/Debezium', 'DB log connector', 'Row change', 'Legacy / projections'],
          ['Direct Kafka publish', 'Application', 'Risk dual-write', 'Avoid without outbox'],
        ],
      },
    ],
  },
  {
    id: 'batch-sftp',
    title: 'Batch / scheduled / SFTP file integration',
    what:
      'Systems exchange files on a schedule (SFTP/FTPS drop, shared object prefix, or DB extract job) instead of online request/response — still common in banking, cards, payroll, and clearing houses.',
    why:
      'Counterparties mandate file-based clearing; huge nightly volumes fit batch windows; online APIs may not exist. Interviews for FinTech expect you to name this without calling it “bad Kafka.”',
    when:
      'Settlement files, ACH/NACHA, card clearing, partner catalogs, regulatory extracts. Not for user-facing checkout latency.',
    how:
      'Producer writes file (PGP encrypt) to SFTP/Blob; control file + checksum; scheduler on consumer picks up, validates, loads idempotently (file id + row hash), acknowledges via rename/move. Alert on SLA miss. Optionally notify via Kafka after land.',
    flow: `flowchart TD
  A[Service A / Bank job] -->|PGP file| SFTP[(SFTP / Blob)]
  SFTP -->|scheduled pull| B[Service B loader]
  B --> DB[(B database)]
  B -->|optional| K[Kafka FileProcessed]`,
    failure:
      'Late files break settlement SLAs. Partial uploads without checksum. Duplicate file reprocessing. SFTP credential sprawl. No observability until morning.',
    tradeoff:
      'Pros: fits partner contracts; huge volume. Cons: high latency; operational toil; weak real-time reaction.',
    security:
      'PGP/AES; rotate SFTP keys; IP allowlists; virus scan; least-privilege directories; audit downloads.',
    observability:
      'File arrival SLA, row error rate, checksum fail, job duration, lag vs cutoff time.',
    trap:
      'Replacing a mandated clearing file with REST overnight without partner agreement — business impossible.',
    interviewAnswer:
      'Batch/SFTP is a first-class integration for banking rails: encrypted file drop, checksum, idempotent load, SLA monitoring. I wrap it with object storage when possible and emit an internal Kafka event after successful load — but I do not pretend online REST replaces clearing files.',
    remember: [
      'Checksum + idempotent file id',
      'Encrypt (PGP) + rotate keys',
      'SLA clocks ≠ REST timeouts',
      'Optional Kafka after successful land',
    ],
    oneLiner: 'Batch/SFTP — FinTech file rails; encrypt, checksum, idempotent load.',
    tables: [
      {
        headers: ['Integration', 'Latency', 'Contract', 'Typical domain'],
        rows: [
          ['REST/gRPC', 'ms–s', 'OpenAPI/proto', 'Online UX'],
          ['Kafka', 'ms–min', 'Schema Registry', 'Internal events'],
          ['S3 + event', 's–min', 'Object + pointer', 'Large payloads'],
          ['SFTP batch', 'min–hours', 'File spec + SLA', 'Clearing / partners'],
        ],
      },
    ],
  },
];
