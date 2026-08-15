import type {StoryBeat} from './types';

/** Memorable Mermaid interview stories — sync vs async, resilience, and production paths. */
export const MSC_STORIES: StoryBeat[] = [
  {
    id: 'sync-vs-async',
    title: 'Sync vs async mental model',
    badge: 'THE mental model',
    hook: 'Open every microservice communication answer with this fork before naming a protocol.',
    mermaid: `flowchart TD
  Q{Need immediate answer<br/>for this request?}
  Q -->|yes| Sync[Synchronous call chain]
  Q -->|no| Async[Async message / event]
  Sync --> REST[REST / gRPC / Feign]
  Sync --> Risk[Coupled latency + availability]
  Async --> Kafka[Kafka / Rabbit / SQS]
  Async --> Win[Decouple + fan-out + buffer]
  style Risk fill:#f8d7da
  style Win fill:#d4edda`,
    say:
      'Synchronous communication means the caller blocks until the callee responds — you inherit its latency, errors, and availability. Asynchronous means publish-and-continue: the producer hands work to a broker and moves on; consumers process at their own pace. Interview rule: user-facing paths that need an immediate answer → sync with tight timeouts and resilience. Side effects, notifications, analytics, fan-out → async. Never default to sync chains across four services for a checkout button.',
    memory: 'Immediate answer → sync + T·R·I·C·K·S. Side effect / fan-out → async broker.',
  },
  {
    id: 'sync-full-path',
    title: 'Sync call full path: discovery → LB → TLS → HTTP',
    badge: 'Production path',
    hook: 'Draw every hop — interviewers count layers you skip.',
    mermaid: `sequenceDiagram
  participant A as Service A
  participant D as Discovery / DNS
  participant LB as Load Balancer
  participant B as Service B pod
  A->>D: resolve payment-service
  D-->>A: instance list or ClusterIP
  A->>LB: HTTPS POST /payments
  Note over A,LB: TLS handshake + mTLS optional
  LB->>B: forward to healthy pod
  B-->>LB: 200 JSON
  LB-->>A: response`,
    say:
      'A RestClient call is never “just HTTP.” Service A resolves payment-service via Kubernetes DNS, Eureka, or Consul. A client-side or cloud load balancer picks a healthy target. TLS terminates at ingress, sidecar, or pod. The HTTP request hits Spring MVC on a specific pod. Staff follow-up: connection pooling reuses TCP/TLS sessions; each new pod IP needs pool warmup. Trace context must propagate across every hop.',
    memory: 'Resolve → pick instance → TLS → HTTP → trace every hop.',
  },
  {
    id: 'timeout-cascade',
    title: 'Timeout cascade / thread pool exhaustion',
    badge: 'Failure mode',
    hook: 'The outage where every service is “up” but nothing responds.',
    mermaid: `sequenceDiagram
  participant U as User
  participant G as Gateway
  participant O as Order svc
  participant P as Payment svc
  U->>G: checkout
  G->>O: 30s timeout
  O->>P: 30s timeout — Payment slow/locked
  Note over O: Tomcat threads blocked waiting
  U->>G: retry storm
  G->>O: more blocked threads
  Note over O: pool exhausted — 503 to everyone`,
    say:
      'When Payment stalls, Order threads block until their read timeout — often 30s by default. Gateway threads block on Order. Retries multiply blocked threads. Soon the JVM thread pool is full and Order rejects healthy traffic with 503. Fix: aggressive client timeouts shorter than server timeouts, bulkheads isolating checkout from admin, async payment handoff, and shed load at the edge. Golden rule: client timeout < server timeout < gateway timeout.',
    memory: 'Slow leaf + long timeout + retries = thread pool death spiral.',
  },
  {
    id: 'retry-storm',
    title: 'Retry storm',
    badge: 'Resilience trap',
    hook: 'Retries are good — until they aren’t.',
    mermaid: `flowchart TD
  A[Client retries x3] --> B[Overloaded service]
  B --> C[More failures]
  C --> D[More retries from all clients]
  D --> E[Amplified load — retry storm]
  style E fill:#f8d7da
  Note1[Only retry idempotent ops + 429/503 + jitter]`,
    say:
      'A transient blip triggers retries across thousands of clients. Each retry hits an already struggling service, turning a partial failure into total meltdown. Safe retries: idempotent operations only (GET, PUT with idempotency key), retry only 429/503 with exponential backoff and jitter, cap max attempts, respect Retry-After. Never retry POST payment without idempotency key. Pair retries with circuit breakers so you stop hammering a dying dependency.',
    memory: 'Retry = idempotent + backoff + jitter + circuit breaker cap.',
  },
  {
    id: 'circuit-breaker',
    title: 'Circuit breaker states',
    badge: 'Resilience',
    hook: 'Draw CLOSED → OPEN → HALF_OPEN — staff expect all three.',
    mermaid: `stateDiagram-v2
  [*] --> CLOSED
  CLOSED --> OPEN: failure rate > threshold
  OPEN --> HALF_OPEN: wait duration elapsed
  HALF_OPEN --> CLOSED: probe succeeds
  HALF_OPEN --> OPEN: probe fails
  note right of OPEN: fail fast — no calls to dependency
  note right of HALF_OPEN: limited probe traffic`,
    say:
      'Resilience4j CircuitBreaker tracks failures in a sliding window. CLOSED: calls pass through. When failure rate exceeds threshold, OPEN: fail fast without calling the dependency — return fallback or cached response. After waitDurationInOpenState, HALF_OPEN: allow probe calls. Success closes the circuit; failure reopens. Interview gold: circuit breaker protects the caller, not the callee. Combine with bulkhead so one bad dependency cannot exhaust all threads.',
    memory: 'CLOSED pass → OPEN fail-fast → HALF_OPEN probe → repeat.',
  },
  {
    id: 'bulkhead',
    title: 'Bulkhead pools',
    badge: 'Isolation',
    hook: 'One bad dependency should not sink the whole ship.',
    mermaid: `flowchart LR
  subgraph app [Order Service JVM]
    P1[Checkout pool<br/>max 20 threads]
    P2[Admin pool<br/>max 5 threads]
    P3[Reporting pool<br/>max 3 threads]
  end
  P1 --> Pay[Payment API]
  P2 --> Cat[Catalog API]
  P3 --> Ana[Analytics API]
  Pay -.->|slow| P1
  Note[Payment slow only exhausts checkout pool]`,
    say:
      'Bulkhead pattern isolates resources per dependency or use case — separate thread pools, semaphores, or connection pool limits. If Payment stalls, only the checkout bulkhead fills; admin and reporting keep working. In Spring Boot 3, configure Resilience4j Bulkhead per RestClient bean or use virtual threads with per-dependency semaphores. Staff trap: one giant RestClient pool means one slow API blocks everything.',
    memory: 'Separate pools per dependency — slow Payment ≠ dead Order admin.',
  },
  {
    id: 'feign-proxy',
    title: 'Feign dynamic proxy path',
    badge: 'Spring Cloud',
    hook: 'Feign is an interface — the runtime story is proxy + encoder + interceptor.',
    mermaid: `sequenceDiagram
  participant App as OrderService
  participant Proxy as PaymentClient$$Feign
  participant Enc as Encoder/Decoder
  participant LB as LoadBalancer
  participant Pay as Payment pod
  App->>Proxy: createPayment(dto)
  Proxy->>Proxy: RequestInterceptor add headers/trace
  Proxy->>Enc: encode JSON body
  Proxy->>LB: resolve payment-service
  LB->>Pay: HTTP POST
  Pay-->>Enc: JSON response
  Enc-->>App: PaymentResponse`,
    say:
      '@FeignClient interface becomes a JDK dynamic proxy at startup. Method call → Feign builds RequestTemplate → RequestInterceptors add auth/trace → Encoder serializes body → Client (often LoadBalancerFeignClient) executes HTTP → Decoder maps response. Spring Cloud LoadBalancer picks instance. ErrorDecoder maps 4xx/5xx to exceptions. Interview: Feign is declarative HTTP — not RPC magic. For Boot 3 prefer spring-cloud-openfeign with HttpClient 5 connection pooling.',
    memory: 'Interface → Feign proxy → interceptors → LB → HTTP.',
  },
  {
    id: 'webclient-block',
    title: 'WebClient event loop + .block() trap',
    badge: 'Reactive trap',
    hook: 'WebClient is non-blocking — .block() on the request thread kills the point.',
    mermaid: `flowchart TD
  subgraph good [Correct — reactive chain]
    WC1[WebClient] --> Mono[Mono flatMap]
    Mono --> Netty[Netty event loop]
    Netty --> R1[Non-blocking I/O]
  end
  subgraph bad [Trap — block on Tomcat thread]
    WC2[WebClient] --> Block[.block on servlet thread]
    Block --> Wait[Thread blocked anyway]
    Block --> Starve[Event loop + servlet pool both suffer]
  end
  style bad fill:#f8d7da`,
    say:
      'WebClient runs on Reactor Netty — few event-loop threads handle many concurrent connections via non-blocking I/O. Calling .block() on a Tomcat servlet thread ties up that thread while waiting, giving you the worst of both worlds: reactive stack complexity with blocking semantics. Use WebClient end-to-end in WebFlux controllers, or use RestClient for sync Boot MVC. If you must bridge, use bounded elastic scheduler — but staff will ask why you did not pick RestClient.',
    memory: 'WebClient + .block() on MVC thread = fake async, real blocking.',
  },
  {
    id: 'kafka-fanout',
    title: 'Kafka fan-out OrderCreated',
    badge: 'Async pattern',
    hook: 'One event, many consumers — draw the topic, not point-to-point.',
    mermaid: `flowchart LR
  O[Order Service] -->|produce| T[(orders topic)]
  T --> I[Inventory consumer group]
  T --> N[Notification consumer group]
  T --> A[Analytics consumer group]
  T --> F[Fraud consumer group]
  style T fill:#fff3cd`,
    say:
      'Order service publishes OrderCreated to Kafka and returns — no waiting for Inventory, Email, or Analytics. Each consumer group gets its own offset cursor; adding a new consumer group does not require Order to change. Partition key = orderId keeps per-order ordering. Interview: Kafka is log-based fan-out, not a queue that deletes on read. At-least-once delivery means consumers must be idempotent. Outbox pattern ensures DB commit and event publish are atomic.',
    memory: 'Produce once → topic → N consumer groups, each independent offset.',
  },
  {
    id: 'sync-chain-availability',
    title: 'Sync chain A→B→C→D availability math',
    badge: 'Architecture',
    hook: 'Multiply availabilities — the number that kills microservices.',
    mermaid: `flowchart LR
  A[Service A<br/>99.9%] --> B[Service B<br/>99.9%]
  B --> C[Service C<br/>99.9%]
  C --> D[Service D<br/>99.9%]
  M[Chain availability<br/>99.9%^4 ≈ 99.6%<br/>~3.5h downtime/mo]`,
    say:
      'Four serial sync calls at 99.9% each yield 99.6% end-to-end — roughly 3.5 hours downtime per month for one user journey. Deep chains also add latencies. Mitigations: parallelize independent calls (CompletableFuture / WebClient zip), cache read-heavy steps, collapse B+C into one service when bounded context allows, move non-critical path async. Staff question: “Your checkout calls 7 services synchronously — what is your availability?” Do the math on the whiteboard.',
    memory: 'Serial sync: multiply availability, add latency. Parallelize or async.',
  },
  {
    id: 'k8s-service-pods',
    title: 'K8s Service → pods + readiness',
    badge: 'Discovery',
    hook: 'ClusterIP is not magic — kube-proxy routes only to ready endpoints.',
    mermaid: `flowchart TD
  Client[Pod A RestClient] --> DNS[payment-service.default.svc]
  DNS --> SVC[K8s Service ClusterIP]
  SVC --> EP[Endpoints / EndpointSlice]
  EP --> R{readinessProbe pass?}
  R -->|yes| P1[Pod 1 Ready]
  R -->|yes| P2[Pod 2 Ready]
  R -->|no| P3[Pod 3 Not Ready — excluded]
  style P3 fill:#f8d7da`,
    say:
      'In Kubernetes, payment-service DNS resolves to a ClusterIP Service. Endpoints controller maintains EndpointSlice listing pod IPs that pass readinessProbe. kube-proxy or CNI dataplane load-balances traffic only to ready pods. A pod that fails readiness is removed from rotation while still running — useful during slow startup or dependency loss. Liveness is different: failed liveness restarts the container. Interview: never confuse “pod running” with “receiving traffic.”',
    memory: 'DNS → Service → Endpoints → only Ready pods get traffic.',
  },
  {
    id: 'tricks-old',
    title: 'TRICKS-OLD framework mnemonic',
    badge: 'Cheat sheet',
    hook: 'Close every sync-call design answer with this checklist.',
    mermaid: `flowchart TD
  T[Timeout] --> R[Retry idempotent only]
  R --> I[Idempotency keys]
  I --> C[Circuit breaker]
  C --> K[Kafka when async fits]
  K --> S[Security mTLS/JWT]
  S --> O[Observability trace/log/metric]
  O --> F[Failure fallback/degrade]
  F --> L[Load balancing]
  L --> D[Discovery registry/DNS]
  style T fill:#e8f4fc
  style D fill:#d4edda`,
    say:
      'TRICKS-OLD is the production checklist for every outbound sync call: Timeout (client < server), Retry (idempotent + backoff), Idempotency (keys on writes), Circuit breaker (fail fast), Kafka (prefer async when you can), Security (mTLS, OAuth2 bearer), Observability (W3C traceparent, structured logs, RED metrics), Failure handling (fallback, graceful degrade), Load balancing (round-robin, least-conn, zone-aware), Discovery (K8s DNS, Eureka, Consul). Say it aloud in interviews — interviewers remember mnemonics.',
    memory: 'TRICKS-OLD: Timeout Retry Idempotency Circuit Kafka Security Observability Failure LB Discovery.',
  },
  {
    id: 'taxonomy-mechanism-infra',
    title: 'Mechanism vs infrastructure',
    badge: 'Taxonomy',
    hook: 'Gateway is not how you call B — REST/gRPC/Kafka is.',
    mermaid: `flowchart TB
  subgraph infra [Infrastructure — wraps the call]
    GW[API Gateway]
    DNS[K8s DNS / Discovery]
    LB[Load Balancer / Mesh]
  end
  subgraph mech [Mechanism — actual communication]
    REST[REST / gRPC / RSocket]
    K[Kafka / Rabbit / SQS]
    WH[Webhook]
  end
  Client --> GW --> DNS --> LB --> REST --> B[Service B]
  A[Service A] --> K --> B2[Service B]
  P[Provider] --> WH --> A
  style infra fill:#e8f4fd
  style mech fill:#d4edda`,
    say:
      'Staff distinction: API Gateway, service discovery, load balancers, and service mesh are communication infrastructure. The application mechanism is still REST, gRPC, Kafka, webhook, CDC, or object-store plus event. Wrong: “we use Kubernetes to communicate.” Right: “we call payment with RestClient over HTTPS; Kubernetes DNS and ClusterIP provide discovery and server-side load balancing.”',
    memory: 'Mechanism = protocol/contract. Infra = find, balance, secure, observe.',
  },
  {
    id: 'realtime-compare',
    title: 'REST vs long poll vs SSE vs WebSocket',
    badge: 'Real-time',
    hook: 'Client push interviews expect this four-way compare.',
    mermaid: `flowchart LR
  REST[REST short req/resp] --> LP[Long polling hold]
  LP --> SSE[SSE one-way stream]
  SSE --> WS[WebSocket bi-di]
  WS --> Note[Services still use Kafka/gRPC]`,
    say:
      'REST for commands and queries. Long polling when WebSocket/SSE are blocked — hold HTTP until event or timeout, then loop. SSE for one-way server push over HTTP. WebSocket for bidirectional chat/trading UI. Between microservices: Kafka or gRPC streaming — do not build a WebSocket mesh.',
    memory: 'Clients: REST / long-poll / SSE / WS. Services: Kafka or gRPC stream.',
  },
  {
    id: 'webhook-callback',
    title: 'Webhook callback path',
    badge: 'Callback',
    hook: 'Payment providers finish later — they call you.',
    mermaid: `sequenceDiagram
  participant O as Order
  participant P as PSP
  O->>P: charge
  P-->>O: 202 accepted
  P->>O: webhook signed POST
  O->>O: verify HMAC + idempotent
  O-->>P: 202
  O->>K: Kafka PaymentSettled`,
    say:
      'Webhooks reverse the call: the provider invokes your HTTPS endpoint. Verify signature, ack fast, apply idempotently by event id, then fan out internally on Kafka. Never treat provider delivery as exactly-once.',
    memory: 'Webhook: verify → ack fast → idempotent → internal Kafka.',
  },
  {
    id: 'cdc-vs-outbox',
    title: 'CDC vs domain outbox',
    badge: 'Event-driven',
    hook: 'Both reach Kafka — different who emits and what it means.',
    mermaid: `flowchart TD
  subgraph outbox [Owned write path]
    App1[Service A] -->|same TX| DB1[(DB + outbox)]
    DB1 --> Relay[Relay]
    Relay --> K1[Kafka domain event]
  end
  subgraph cdc [Brownfield / projections]
    App2[Service A] --> DB2[(DB)]
    DB2 -->|WAL| CDC[Debezium CDC]
    CDC --> K2[Kafka row-change topics]
  end`,
    say:
      'Outbox: application writes business row + outbox in one transaction; relay publishes domain events with intent. CDC: connector reads WAL and emits table changes even if the app never published. Prefer outbox when you own the service; CDC for legacy completeness and projections — map schema events to business language carefully.',
    memory: 'Outbox = intent. CDC = row changed. Both need idempotent consumers.',
  },
];

/** Pocket memory cards — flash before the whiteboard. */
export const MEMORY_STRIP: {title: string; line: string}[] = [
  {title: 'Sync vs async', line: 'Answer now → sync. Side effect → broker'},
  {title: 'Full path', line: 'DNS → LB → TLS → HTTP → trace'},
  {title: 'Timeouts', line: 'Client < server < gateway'},
  {title: 'Retries', line: 'Idempotent + jitter + cap'},
  {title: 'Circuit breaker', line: 'CLOSED → OPEN → HALF_OPEN'},
  {title: 'Bulkhead', line: 'Pool per dependency'},
  {title: 'Feign', line: 'Interface → proxy → LB → HTTP'},
  {title: 'WebClient trap', line: 'No .block() on MVC threads'},
  {title: 'Kafka fan-out', line: 'Topic → N consumer groups'},
  {title: 'Availability', line: 'Serial chain = multiply %'},
  {title: 'K8s ready', line: 'Service → Endpoints → Ready pods'},
  {title: 'TRICKS-OLD', line: 'Every sync call checklist'},
];

/** 7-step whiteboard path — "A calls B in production." */
export const WHITEBOARD_BEATS: StoryBeat[] = [
  {
    id: 'wb-1',
    title: '1. Caller intent — sync or async?',
    badge: 'Whiteboard',
    hook: 'Draw the decision diamond first.',
    mermaid: `flowchart TD
  A[Service A needs data/action from B] --> Q{Immediate response<br/>required?}
  Q -->|yes| S[Sync HTTP/gRPC]
  Q -->|no| K[Publish event to broker]`,
    say:
      'Start with the business requirement. Checkout payment authorization needs a sync answer. “Send welcome email” does not. Wrong modality is the root of most distributed system pain.',
    memory: 'Modality first — sync only when the user waits.',
  },
  {
    id: 'wb-2',
    title: '2. Discovery — how A finds B',
    badge: 'Whiteboard',
    hook: 'Write the hostname A actually resolves.',
    mermaid: `flowchart LR
  A[Service A] --> DNS[payment-service.ns.svc.cluster.local]
  DNS --> EP[EndpointSlice / Eureka cache]
  EP --> IPs[10.0.1.5:8080, 10.0.1.6:8080]`,
    say:
      'In K8s: DNS → ClusterIP Service → EndpointSlice of ready pod IPs. In Spring Cloud: Eureka/Consul fetch + local cache. Hard-coded URLs are for local dev only. Mention cache TTL and stale instance risk.',
    memory: 'Discovery = DNS or registry → list of healthy instances.',
  },
  {
    id: 'wb-3',
    title: '3. Client stack — RestClient / Feign / WebClient',
    badge: 'Whiteboard',
    hook: 'Name the Spring Boot 3 client and connection pool.',
    mermaid: `flowchart TD
  Bean[@FeignClient or RestClient bean] --> Pool[HttpClient 5 connection pool]
  Pool --> TLS[TLS / mTLS]
  TLS --> Req[HTTP request built]`,
    say:
      'Boot 3 MVC: RestClient (sync) or @FeignClient (declarative). WebClient for reactive stacks. All should share configured connect/read timeouts, connection pool limits, and optional Resilience4j decorators. One bean per downstream service with its own bulkhead.',
    memory: 'One client bean per downstream + pool + timeouts.',
  },
  {
    id: 'wb-4',
    title: '4. Load balance + pick instance',
    badge: 'Whiteboard',
    hook: 'Draw pick-one from the healthy set.',
    mermaid: `flowchart LR
  Inst[Instance list] --> LB[Round-robin / random / zone-aware]
  LB --> Target[10.0.1.5:8080]`,
    say:
      'Client-side: Spring Cloud LoadBalancer, Ribbon legacy. Server-side: K8s kube-proxy, cloud ALB/NLB, service mesh sidecar. Zone-aware routing reduces cross-AZ latency and cost. Mention sticky sessions only when stateful — prefer stateless services.',
    memory: 'Pick one healthy instance — client or mesh LB.',
  },
  {
    id: 'wb-5',
    title: '5. Resilience envelope — timeout, retry, CB',
    badge: 'Whiteboard',
    hook: 'Wrap the call — TRICKS on the board.',
    mermaid: `flowchart TD
  Call[outbound call] --> T[Timeout 2s]
  T --> R[Retry max 2 idempotent]
  R --> CB[CircuitBreaker]
  CB --> HTTP[HTTP to B]`,
    say:
      'Resilience4j or Spring Cloud CircuitBreaker wraps the call. Timeouts prevent thread hoarding. Retries only on safe operations with jitter. Circuit breaker fails fast when B is unhealthy. Draw this as an onion around the HTTP arrow.',
    memory: 'Timeout → retry → circuit breaker → then HTTP.',
  },
  {
    id: 'wb-6',
    title: '6. Observability propagation',
    badge: 'Whiteboard',
    hook: 'Trace context must cross the wire.',
    mermaid: `sequenceDiagram
  participant A as Service A
  participant B as Service B
  A->>B: traceparent + baggage headers
  A->>B: Authorization Bearer JWT
  Note over A,B: Micrometer tracing + structured log correlationId`,
    say:
      'Propagate W3C traceparent (Micrometer Tracing / OpenTelemetry). Add correlation ID in MDC. Emit metrics: client timer with outcome tag. Log one line per outbound call with duration and status. Without this, “A called B” is invisible in prod.',
    memory: 'traceparent + JWT + timer metric + correlation log.',
  },
  {
    id: 'wb-7',
    title: '7. B handles request — readiness + response',
    badge: 'Whiteboard',
    hook: 'Close the loop on the callee side.',
    mermaid: `flowchart TD
  Hit[HTTP hits pod] --> Ready{readinessProbe OK?}
  Ready -->|in rotation| MVC[Spring MVC controller]
  MVC --> Biz[Service layer]
  Biz --> Resp[200 / 4xx / 5xx]
  Ready -->|not ready| Skip[Excluded from Service endpoints]`,
    say:
      'Traffic lands on a ready pod. B validates auth, executes business logic, returns response. A maps status to success/retry/fallback. Close with: “If B is down, circuit opens, A degrades gracefully — checkout queues payment retry via Kafka instead of blocking 30s.”',
    memory: 'Ready pod → handle → status → caller decides retry/fallback.',
  },
  {
    id: 'wb-8',
    title: '8. Land the 60-second answer',
    badge: 'Whiteboard',
    hook: 'Tie back to TRICKS-OLD.',
    mermaid: `flowchart LR
  Intent[Intent] --> Disc[Discovery]
  Disc --> Client[Client + pool]
  Client --> Res[TRICKS envelope]
  Res --> Obs[Trace + metrics]
  Obs --> Target[Service B pod]`,
    say:
      'Land: “A resolves B via K8s DNS, picks a ready pod through the load balancer, calls through a pooled RestClient with 2s timeout and circuit breaker, propagates trace context, and handles failure with fallback or async handoff. Every sync hop needs TRICKS-OLD.”',
    memory: 'Discovery → client → resilience → observe → handle failure.',
  },
];
