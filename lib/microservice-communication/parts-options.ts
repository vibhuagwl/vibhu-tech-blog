import type {CommSection} from './types';

/** All communication options — sync, async, and shared-state anti-patterns. */
export const OPTIONS: CommSection[] = [
  // ── Sync: protocol & style ──────────────────────────────────────────────
  {
    id: 'rest-http',
    title: 'REST over HTTP/JSON',
    what:
      'Resource-oriented synchronous communication using HTTP verbs (GET, POST, PUT, PATCH, DELETE), JSON payloads, and standard status codes. Spring Boot 3 exposes REST via @RestController; clients use RestClient, WebClient, or Feign.',
    why:
      'Universal interoperability — any language, any cloud, debuggable with curl. Mature tooling for auth (OAuth2), caching (ETag), versioning (/api/v1), and API gateways. Lowest team friction for CRUD microservices.',
    when:
      'Default choice for synchronous service-to-service and public APIs. Read-heavy CRUD, command/query with immediate response, third-party integrations, mobile and web frontends.',
    how:
      'Define OpenAPI contract. Server: @RestController + DTO validation + ProblemDetail errors (RFC 7807). Client: RestClient with connect/read timeouts, connection pool, Resilience4j decorators. Propagate traceparent and Authorization headers.',
    flow: `sequenceDiagram
  participant C as Order Service
  participant LB as Load Balancer
  participant P as Payment Service
  C->>LB: POST /api/v1/payments JSON
  LB->>P: forward to ready pod
  P->>P: validate + process
  P-->>C: 201 Created + Location header`,
    failure:
      'Timeouts cascade thread pools. Ambiguous 500s trigger unsafe retries on POST. Version drift breaks clients. Over-fetching with chatty REST (N+1 HTTP calls). No built-in streaming for large payloads.',
    tradeoff:
      'Pros: simple, cacheable GETs, human-readable, gateway-friendly. Cons: higher latency than gRPC binary, no strict contract enforcement without OpenAPI discipline, JSON serialization cost.',
    security:
      'HTTPS everywhere. OAuth2 client credentials or JWT bearer for service-to-service. mTLS in mesh. Input validation on every endpoint. Rate limiting at gateway. Never log full PAN/PII.',
    observability:
      'Micrometer http.client.requests timer. Trace propagation via W3C traceparent. Structured logs with correlationId, downstream status, duration. RED metrics per endpoint.',
    trap:
      'Staff trap: treating REST as “free” — every call is a network hop with failure modes. Another trap: POST without idempotency key on retries.',
    interviewAnswer:
      'REST is my default sync protocol: HTTP verbs map to resource operations, JSON for interoperability, status codes for semantics. In Boot 3 I use RestClient with pooled connections, 2s read timeout, Resilience4j circuit breaker, and OpenTelemetry propagation. I choose gRPC only when latency or strict contracts justify the ops cost.',
    remember: [
      'GET idempotent, POST needs idempotency key for retries',
      'Client timeout < server timeout',
      'OpenAPI as contract between teams',
      'ProblemDetail for consistent errors',
    ],
    oneLiner: 'REST/JSON — universal sync default; pair with timeouts and idempotency.',
    tables: [
      {
        headers: ['Verb', 'Safe', 'Idempotent', 'Typical use'],
        rows: [
          ['GET', 'Yes', 'Yes', 'Read, cacheable'],
          ['POST', 'No', 'No*', 'Create — *with idempotency key yes'],
          ['PUT', 'No', 'Yes', 'Full replace'],
          ['PATCH', 'No', 'No', 'Partial update'],
          ['DELETE', 'No', 'Yes', 'Remove'],
        ],
      },
      {
        headers: ['Status', 'Meaning', 'Retry?'],
        rows: [
          ['200/201', 'Success', 'No'],
          ['400', 'Client error', 'No — fix request'],
          ['401/403', 'Auth', 'No — refresh token'],
          ['404', 'Not found', 'No'],
          ['409', 'Conflict', 'Maybe after fix'],
          ['429', 'Rate limited', 'Yes with Retry-After'],
          ['500/502/503', 'Server/transient', 'Yes if idempotent'],
        ],
      },
    ],
  },
  {
    id: 'restclient',
    title: 'RestClient (Spring 6 / Boot 3 sync)',
    what:
      'Modern synchronous HTTP client in Spring Framework 6, replacing RestTemplate. Fluent API built on java.net.http.HttpClient (or Apache HttpClient 5). Blocking I/O on the calling thread — natural fit for Spring MVC.',
    why:
      'First-class Boot 3 sync client with clean builder API, request/response spec pattern, and integration with HttpClient 5 connection pooling. No reactive dependency for MVC apps.',
    when:
      'Spring MVC / servlet apps needing sync outbound HTTP. Replacing RestTemplate in new code. Simple imperative call chains without reactive complexity.',
    how:
      '@Bean RestClient.Builder → customize baseUrl, default headers, message converters → build per-service client. Attach ClientHttpRequestInterceptor for auth/trace. Wrap with Resilience4j CircuitBreaker.decorateSupplier.',
    flow: `flowchart LR
  Svc[OrderService] --> RC[RestClient]
  RC --> Pool[HttpClient 5 pool]
  Pool --> TLS[TLS handshake reuse]
  TLS --> HTTP[HTTP request]
  HTTP --> Dec[Jackson decode]`,
    failure:
      'Blocks servlet thread on slow responses — thread pool exhaustion. Default timeouts too high. Sharing one RestClient across unrelated services loses per-dependency bulkhead isolation.',
    tradeoff:
      'Pros: simple, MVC-native, modern API. Cons: blocking — poor fit for high fan-out on few threads unless using virtual threads (Java 21).',
    security:
      'Configure SSL context for mTLS. Default headers for Bearer token. Do not disable hostname verification.',
    observability:
      'RestClient.Builder.requestInterceptor for trace injection. Micrometer Observation on RestClient (Boot 3.2+). Log status + duration per call.',
    trap:
      'Using RestClient from @Async without virtual threads still blocks a pool thread. Staff ask: RestClient vs WebClient — MVC gets RestClient.',
    interviewAnswer:
      'RestClient is Boot 3’s sync HTTP client on HttpClient 5. I configure per-downstream beans with connect/read timeouts, connection pool max totals, and Resilience4j. On Java 21 with virtual threads, blocking RestClient is cheap — but I still set aggressive timeouts.',
    remember: ['Boot 3 sync default', 'HttpClient 5 pooling', 'One bean per downstream', 'Virtual threads ≠ skip timeouts'],
    oneLiner: 'RestClient — Boot 3 blocking HTTP; pair with pools, timeouts, resilience.',
    tables: [
      {
        headers: ['Client', 'Stack', 'Blocking', 'Boot 3 recommendation'],
        rows: [
          ['RestClient', 'HttpClient 5 / JDK', 'Yes', 'Default for MVC'],
          ['WebClient', 'Reactor Netty', 'No*', 'WebFlux / streaming'],
          ['OpenFeign', 'HTTP client behind proxy', 'Yes', 'Declarative interfaces'],
          ['RestTemplate', 'Apache / JDK', 'Yes', 'Legacy — migrate'],
        ],
      },
    ],
  },
  {
    id: 'webclient',
    title: 'WebClient (reactive HTTP)',
    what:
      'Non-blocking reactive HTTP client in Spring WebFlux, built on Reactor Netty. Returns Mono<T>/Flux<T> for composable async pipelines without blocking threads per request.',
    why:
      'Handle thousands of concurrent outbound calls with few event-loop threads. Natural for streaming, SSE, backpressure, and parallel aggregation (zip/merge).',
    when:
      'WebFlux applications. Fan-out to many services in parallel on one request. Streaming large responses. Gateway/BFF aggregating multiple backends.',
    how:
      'WebClient.builder().baseUrl().defaultHeader().build(). Use retrieve().bodyToMono() chained with flatMap. Configure Reactor Netty connection provider (max connections, idle timeout). Never .block() on servlet threads.',
    flow: `flowchart TD
  WC[WebClient] --> EL[Netty event loop]
  EL --> C1[Conn 1 non-blocking]
  EL --> C2[Conn 2 non-blocking]
  EL --> CN[Conn N non-blocking]
  C1 --> R[Mono/Flux pipeline]`,
    failure:
      '.block() on Tomcat thread defeats purpose. Debugging stack traces harder. Mixed blocking JDBC in reactive chain blocks event loop (blockhound). Connection pool misconfiguration causes silent queuing.',
    tradeoff:
      'Pros: scalability, composition, streaming. Cons: complexity, team skill gap, harder testing, blocking drivers need boundedElastic.',
    security:
      'Same TLS and OAuth as RestClient. filter() for token refresh on 401. Careful with redirect following leaking tokens.',
    observability:
      'Reactor context for trace propagation. log() operator for debug. Micrometer reactive metrics. Watch reactor.netty pool metrics.',
    trap:
      'Classic trap: WebClient in @RestController MVC service with .block() — use RestClient instead. Staff: “When would you not use WebClient?” → servlet MVC with simple calls.',
    interviewAnswer:
      'WebClient is non-blocking on Reactor Netty — ideal for WebFlux and parallel fan-out. I configure connection provider limits and use reactive operators end-to-end. In MVC apps I use RestClient; WebClient only when the stack is already reactive.',
    remember: ['No .block() on servlet threads', 'Connection provider limits', 'WebFlux stack only', 'zip for parallel calls'],
    oneLiner: 'WebClient — reactive HTTP; never block the event loop.',
    tables: [
      {
        headers: ['Scenario', 'WebClient', 'RestClient'],
        rows: [
          ['Spring MVC controller', 'Avoid (.block trap)', 'Preferred'],
          ['WebFlux controller', 'Preferred', 'Blocks event loop'],
          ['Parallel 5 downstream calls', 'zip() — few threads', '5 blocked threads'],
          ['Server-sent events', 'Native Flux', 'Awkward'],
        ],
      },
    ],
  },
  {
    id: 'openfeign',
    title: 'OpenFeign (declarative REST)',
    what:
      'Spring Cloud OpenFeign turns a Java interface with Spring MVC annotations into an HTTP client via JDK dynamic proxy. Integrates with LoadBalancer, circuit breakers, and request interceptors.',
    why:
      'DRY client code — no manual URL building. Interface mirrors server controller. Easy mock in tests. Familiar to Spring Cloud teams.',
    when:
      'Multiple sync REST integrations with stable contracts. Teams already on Spring Cloud. Prefer interface-driven clients over manual RestClient calls.',
    how:
      '@EnableFeignClients + @FeignClient(name = "payment-service", path = "/api/v1"). Configure feign.client.config with connectTimeout, readTimeout. Add RequestInterceptor for auth. Fallback class for circuit open.',
    flow: `sequenceDiagram
  participant O as OrderService
  participant F as PaymentClient proxy
  participant LB as LoadBalancerFeignClient
  participant P as Payment pod
  O->>F: createPayment(dto)
  F->>LB: encode + route
  LB->>P: HTTP POST
  P-->>F: response
  F-->>O: PaymentResponse`,
    failure:
      'Interface drift from server without contract tests. Default timeouts too generous. ErrorDecoder misconfiguration swallows errors. Large interfaces become god-clients.',
    tradeoff:
      'Pros: concise, testable, LB integration. Cons: magic proxy layer, harder to debug than explicit RestClient, HTTP/1.1 only unless configured.',
    security:
      'RequestInterceptor adds OAuth2AuthorizedClientManager token. Propagate security context carefully — no token logging.',
    observability:
      'Feign Micrometer capability. Custom Logger.Level.BASIC for dev. FullRequest/Response logging only in non-prod.',
    trap:
      'Feign is not RPC — still HTTP with all network failure modes. Staff: compare Feign vs gRPC — Feign is REST convenience, not binary protocol.',
    interviewAnswer:
      'OpenFeign gives declarative HTTP clients — interface + annotations become a LoadBalancer-aware proxy. I set per-client timeouts, Resilience4j circuit breaker via spring-cloud-circuitbreaker, and contract tests with WireMock. New greenfield MVC code might use RestClient, but Feign scales well in Cloud shops.',
    remember: ['Interface = HTTP proxy', 'Per-client timeout config', 'Contract tests mandatory', 'Fallback for circuit open'],
    oneLiner: 'Feign — declarative REST proxy with LB and resilience hooks.',
    tables: [
      {
        headers: ['Aspect', 'OpenFeign', 'RestClient'],
        rows: [
          ['API style', 'Interface annotations', 'Fluent builder'],
          ['Load balancing', 'Built-in Spring Cloud', 'Manual or @LoadBalanced RestClient'],
          ['Learning curve', 'Low for Spring devs', 'Low'],
          ['Debugging', 'Proxy indirection', 'Explicit calls'],
        ],
      },
    ],
  },
  {
    id: 'grpc',
    title: 'gRPC (HTTP/2 + Protobuf)',
    what:
      'High-performance RPC framework using Protocol Buffers for binary serialization and HTTP/2 for multiplexed connections. Strongly typed .proto contracts with code generation for Java, Go, etc.',
    why:
      'Lower latency and smaller payloads than JSON REST. Bi-directional streaming. Strict schema evolution with field numbers. First-class in polyglot and high-throughput internal meshes.',
    when:
      'Internal service-to-service with strict contracts and performance needs. Streaming RPC (market data, logs). Polyglot stacks. NOT default for browser-facing APIs without grpc-web gateway.',
    how:
      'Define .proto → protobuf-maven-plugin generates stubs. Server: @GrpcService extends generated base. Client: ManagedChannel with keepAlive, deadline per call. Spring Boot 3: spring-grpc or grpc-spring-boot-starter. mTLS between services.',
    flow: `sequenceDiagram
  participant C as Order gRPC client
  participant S as Payment gRPC server
  C->>S: HTTP/2 multiplexed channel
  C->>S: CreatePayment(proto bytes)
  S-->>C: PaymentResponse proto`,
    failure:
      'Protobuf breaking changes without discipline. Load balancer must support HTTP/2 (not all L7 LB default). Debugging harder than curl. Browser incompatibility without gateway.',
    tradeoff:
      'Pros: speed, contracts, streaming, multiplexing. Cons: ops complexity, tooling, not human-readable, gateway needed for REST clients.',
    security:
      'mTLS between services. JWT in metadata. Channel credentials. Deadline (timeout) per RPC mandatory.',
    observability:
      'OpenTelemetry gRPC instrumentation. grpc-status codes in metrics. Per-method histograms.',
    trap:
      '“gRPC is faster so use it everywhere” — wrong for public APIs and small teams. Staff: REST for edge, gRPC for internal hot paths.',
    interviewAnswer:
      'gRPC gives binary Protobuf over HTTP/2 with generated stubs and per-call deadlines. I use it for latency-sensitive internal calls like fraud scoring. Public APIs stay REST behind an API gateway; I enforce proto backward compatibility and mTLS.',
    remember: ['Proto backward compat', 'Deadline = timeout', 'HTTP/2 LB required', 'Internal not browser'],
    oneLiner: 'gRPC — fast typed RPC; internal hot paths, not public REST replacement.',
    tables: [
      {
        headers: ['Dimension', 'REST/JSON', 'gRPC/Protobuf'],
        rows: [
          ['Payload size', 'Larger text', 'Compact binary'],
          ['Latency', 'Higher serialize cost', 'Lower'],
          ['Browser', 'Native', 'Needs grpc-web'],
          ['Contract', 'OpenAPI optional', 'Proto required'],
          ['Streaming', 'SSE/chunked', 'Native bidirectional'],
          ['Debug', 'curl', 'grpcurl'],
        ],
      },
    ],
  },
  {
    id: 'graphql',
    title: 'GraphQL (BFF / flexible query)',
    what:
      'Query language and runtime letting clients request exactly the fields they need in one round trip. Typically exposed by a BFF or API gateway, aggregating multiple downstream REST/gRPC services.',
    why:
      'Eliminates over-fetching and under-fetching for mobile and varied clients. Single endpoint, evolving schema without versioning explosion.',
    when:
      'Multiple client types (web, iOS, Android) with different data shapes. BFF aggregating microservices. NOT ideal as every internal service protocol — use at the edge.',
    how:
      'Spring GraphQL or DGS framework. Schema .graphqls defines types. @QueryMapping resolvers call RestClient/WebClient to backends. DataLoader batches N+1 fetches. Persisted queries in production.',
    flow: `flowchart TD
  Mobile[Mobile app] --> GQL[GraphQL BFF]
  GQL --> O[Order REST]
  GQL --> U[User REST]
  GQL --> P[Product REST]
  Note[One query — batched fetches]`,
    failure:
      'N+1 resolver problem without DataLoader. Complex queries cause DoS (depth/complexity limits required). Caching harder than REST GET. Authorization at field level is subtle.',
    tradeoff:
      'Pros: client flexibility, fewer round trips. Cons: server complexity, perf footguns, caching, not for service-to-service default.',
    security:
      'Disable introspection in prod. Query depth/complexity limits. Field-level auth. Rate limit expensive queries.',
    observability:
      'Trace per resolver. Log query name (not full payload in prod). Metrics on resolver latency.',
    trap:
      'Using GraphQL between microservices internally — usually wrong. GraphQL is a client-facing aggregation layer, not a service mesh protocol.',
    interviewAnswer:
      'GraphQL sits at the BFF layer for flexible client queries. Internally I still use REST or gRPC; resolvers aggregate with DataLoader to avoid N+1. I enforce query complexity limits and field auth.',
    remember: ['BFF layer not internal mesh', 'DataLoader for N+1', 'Complexity limits', 'No introspection in prod'],
    oneLiner: 'GraphQL — client-facing BFF; not internal service protocol.',
    tables: [
      {
        headers: ['Use GraphQL when', 'Avoid GraphQL when'],
        rows: [
          ['Many client shapes', 'Simple CRUD internal calls'],
          ['BFF aggregation', 'Service-to-service sync'],
          ['Mobile bandwidth matters', 'Strong HTTP caching needs'],
        ],
      },
    ],
  },
  {
    id: 'raw-http',
    title: 'Raw HTTP (java.net.http / Apache HttpClient)',
    what:
      'Direct use of JDK HttpClient (Java 11+) or Apache HttpClient 5 without Spring abstractions. Manual request building, header management, and response parsing.',
    why:
      'Zero framework dependency in libraries, CLI tools, or minimal services. Full control over connection manager, HTTP/2 settings, and redirect policy.',
    when:
      'Standalone utilities, custom agents, framework-free modules, or when Spring overhead is unwanted. Usually wrapped by RestClient in Boot apps.',
    how:
      'HttpClient.newBuilder().connectTimeout().build(). HttpRequest.newBuilder().uri().header().POST(BodyPublishers.ofString(json)).send() or sendAsync(). Pool via connection pool config on Apache client.',
    flow: `flowchart LR
  Code[Your code] --> HC[JDK HttpClient]
  HC --> TCP[TCP + TLS]
  TCP --> Parse[Manual JSON parse]`,
    failure:
      'No auto message converters. Easy to leak connections without try-with-resources. Reinventing timeouts, retries, tracing. No LoadBalancer integration out of box.',
    tradeoff:
      'Pros: control, no deps. Cons: boilerplate, no Spring observability integration, easy to misconfigure.',
    security:
      'Manual SSLContext setup. Certificate pinning if needed. Validate redirects.',
    observability:
      'Manual trace header injection. Wrap with Micrometer if needed.',
    trap:
      'Choosing raw HTTP in a Spring Boot service “for performance” — RestClient uses the same HttpClient underneath with less risk.',
    interviewAnswer:
      'In Boot services I use RestClient, which wraps HttpClient 5. Raw HttpClient is for non-Spring modules where I need explicit control — I still add timeouts, pooling, and trace headers manually.',
    remember: ['RestClient wraps this', 'Pool + timeout mandatory', 'Rare in Boot services'],
    oneLiner: 'Raw HTTP — escape hatch; RestClient preferred in Boot.',
    tables: [
      {
        headers: ['Layer', 'When to use'],
        rows: [
          ['RestClient', 'Boot 3 services — default'],
          ['JDK HttpClient direct', 'Libraries, scripts'],
          ['Apache HttpClient 5', 'Advanced pool tuning behind RestClient'],
        ],
      },
    ],
  },
  {
    id: 'websocket',
    title: 'WebSocket (bidirectional persistent)',
    what:
      'Full-duplex persistent TCP connection upgraded from HTTP. Server can push messages to clients without polling. Spring: @EnableWebSocket / STOMP over WebSocket / WebFlux WebSocketHandler.',
    why:
      'Real-time updates — chat, live dashboards, trading ticks, collaborative editing. Lower overhead than HTTP polling for high-frequency server push.',
    when:
      'True real-time bidirectional needs. Not for standard service-to-service request/response — use REST or gRPC. Often client-to-server; service mesh rarely uses WebSocket between services.',
    how:
      'Spring WebSocket endpoint or STOMP broker relay (RabbitMQ). Authenticate at handshake (JWT query param or cookie). Heartbeat/ping for connection health. Scale with Redis pub/sub or dedicated broker for cross-instance broadcast.',
    flow: `sequenceDiagram
  participant C as Browser
  participant GW as Gateway
  participant S as Chat Service
  C->>GW: HTTP Upgrade WebSocket
  GW->>S: sticky session or pub/sub bridge
  S-->>C: push message frames`,
    failure:
      'Sticky sessions complicate K8s scaling. Connection count limits per pod. Proxies with short idle timeout drop connections. No built-in message durability — need broker for offline users.',
    tradeoff:
      'Pros: real-time, efficient push. Cons: stateful connections, scaling complexity, not REST tooling compatible.',
    security:
      'WSS (TLS). Auth at handshake. Origin validation. Message-level auth. Rate limit messages.',
    observability:
      'Active connection gauge. Message throughput. Connection duration histogram.',
    trap:
      'Using WebSocket between microservices instead of Kafka or gRPC streaming — almost always wrong. WebSocket is primarily client-facing.',
    interviewAnswer:
      'WebSocket for real-time client push like live order status. Between services I use Kafka or gRPC streaming. WebSocket scaling needs pub/sub backplane and sticky sessions or shared broker.',
    remember: ['Client-facing real-time', 'Not inter-service default', 'Stateful — scaling hard', 'WSS + auth at handshake'],
    oneLiner: 'WebSocket — real-time client push; services use Kafka/gRPC stream.',
    tables: [
      {
        headers: ['Pattern', 'Latency', 'Direction', 'Best for'],
        rows: [
          ['REST polling', 'High', 'Client pull', 'Simple, low frequency'],
          ['SSE', 'Low', 'Server push', 'One-way feeds'],
          ['WebSocket', 'Lowest', 'Bidirectional', 'Chat, gaming, trading'],
          ['Kafka', 'Seconds OK', 'Async', 'Service events'],
        ],
      },
    ],
  },
  // ── Async: brokers & events ───────────────────────────────────────────────
  {
    id: 'kafka',
    title: 'Apache Kafka (log-based streaming)',
    what:
      'Distributed commit log with topics, partitions, consumer groups, and replay. Producers append records; consumers track offsets independently. Spring: spring-kafka with KafkaTemplate and @KafkaListener.',
    why:
      'Durable high-throughput fan-out. Decouples producers from consumers. Replay for new services. Event sourcing and CDC pipelines. Buffer during spikes.',
    when:
      'Event notification, audit trail, analytics pipeline, CQRS read models, inter-service async integration at scale. OrderCreated → inventory, email, fraud.',
    how:
      'KafkaTemplate.send(topic, key, value) with idempotent producer. @KafkaListener with concurrency = partition count. Outbox pattern: DB transaction + outbox table → Debezium or polling publisher. Schema Registry for Avro.',
    flow: `flowchart LR
  P[Producer] --> T[(topic/partitions)]
  T --> G1[consumer group A]
  T --> G2[consumer group B]
  G1 --> H1[Handler 1]
  G2 --> H2[Handler 2]`,
    failure:
      'Rebalancing storms on deploy. Poison messages without DLQ. Ordering only per partition key. At-least-once duplicates without idempotent consumers.',
    tradeoff:
      'Pros: scale, durability, replay, fan-out. Cons: ops complexity, not for request/response, eventual consistency.',
    security:
      'SASL/SCRAM or mTLS. ACLs per topic. Encrypt at rest. No PII in topic names.',
    observability:
      'Consumer lag metric (critical alert). Broker metrics. Micrometer kafka listener timers. Trace propagation in headers.',
    trap:
      'Using Kafka as a queue with one consumer deleting messages — wrong mental model. Kafka is a log; multiple groups read independently.',
    interviewAnswer:
      'Kafka for async fan-out and durable events. I use partition keys for ordering, idempotent consumers, DLQ for poison pills, and outbox for exactly-once publish with DB commit. Consumer lag is my primary health metric.',
    remember: ['Log not queue', 'Partition key = ordering', 'Idempotent consumers', 'Outbox for DB + event'],
    oneLiner: 'Kafka — durable log for fan-out, replay, and async decoupling.',
    tables: [
      {
        headers: ['Delivery', 'Semantics', 'Requirement'],
        rows: [
          ['At-most-once', 'May lose', 'Fire and forget'],
          ['At-least-once', 'May duplicate', 'Idempotent consumer'],
          ['Exactly-once', 'Transactional', 'Kafka transactions + idempotent producer'],
        ],
      },
      {
        headers: ['vs Rabbit', 'Kafka', 'RabbitMQ'],
        rows: [
          ['Model', 'Log / replay', 'Queue / routing'],
          ['Throughput', 'Very high', 'High'],
          ['Ordering', 'Per partition', 'Per queue'],
          ['Retention', 'Configurable log', 'Until ack'],
          ['Fan-out', 'Consumer groups', 'Exchanges'],
        ],
      },
    ],
  },
  {
    id: 'rabbitmq',
    title: 'RabbitMQ (AMQP message broker)',
    what:
      'Traditional message broker with exchanges (direct, topic, fanout, headers), queues, bindings, and acknowledgments. Spring: spring-amqp with RabbitTemplate and @RabbitListener.',
    why:
      'Flexible routing, per-message TTL, dead-letter exchanges, priority queues. Mature task-queue semantics. Lower ops footprint than Kafka for moderate volume.',
    when:
      'Task queues, work distribution, RPC-over-Rabbit (reply-to), complex routing rules, moderate throughput eventing, STOMP WebSocket backplane.',
    how:
      'Declare exchange + queue + binding. RabbitTemplate.convertAndSend(exchange, routingKey, msg). @RabbitListener with manual ack after processing. DLX for failed messages. Publisher confirms for reliability.',
    flow: `flowchart LR
  Pub[Publisher] --> Ex[Exchange topic]
  Ex --> Q1[queue inventory]
  Ex --> Q2[queue notify]
  Q1 --> C1[Consumer ack]
  Q2 --> C2[Consumer ack]`,
    failure:
      'Unacked messages pile up if consumer slow. Memory alarm when disk free low. Poison message without DLX loops forever.',
    tradeoff:
      'Pros: routing flexibility, mature, good for task queues. Cons: not a replay log, lower throughput than Kafka for analytics pipelines.',
    security:
      'TLS, user/vhost ACLs. Password rotation.',
    observability:
      'Queue depth metrics. Unacked count. Publisher confirm failures.',
    trap:
      'Choosing Rabbit for event sourcing replay — use Kafka. Rabbit messages disappear after ack; no long-term log by default.',
    interviewAnswer:
      'RabbitMQ for task queues and flexible routing — order fulfillment workers, delayed retries via TTL+DLX. Kafka when I need replay, high throughput fan-out, or stream processing. Spring AMQP with manual ack and publisher confirms.',
    remember: ['Ack after process', 'DLX for poison', 'Not a replay log', 'Exchange routing patterns'],
    oneLiner: 'RabbitMQ — flexible routing and task queues; not a replay log.',
    tables: [
      {
        headers: ['Exchange type', 'Routes by'],
        rows: [
          ['direct', 'Exact routing key'],
          ['topic', 'Pattern match'],
          ['fanout', 'All bound queues'],
          ['headers', 'Header attributes'],
        ],
      },
    ],
  },
  {
    id: 'aws-sqs-sns',
    title: 'AWS SQS / SNS (managed queue & pub/sub)',
    what:
      'SNS: fan-out pub/sub to SQS queues, Lambda, HTTP endpoints. SQS: managed durable queue with visibility timeout, long polling, FIFO option. Spring Cloud AWS or AWS SDK v2.',
    why:
      'Zero broker ops on AWS. Pay per use. Native integration with Lambda, ECS, EventBridge. FIFO queues for ordering with deduplication.',
    when:
      'AWS-native microservices. Decouple Lambda from ECS. Cross-account eventing. Standard queue for throughput; FIFO for strict order + dedup.',
    how:
      'SNS topic → SQS subscriptions. @SqsListener or polling with DeleteMessage after process. Visibility timeout > max processing time. DLQ on queue redrive policy.',
    flow: `flowchart LR
  Svc[ECS Service] --> SNS[SNS Topic]
  SNS --> SQS1[SQS Standard]
  SNS --> SQS2[SQS FIFO]
  SQS1 --> L[Lambda / ECS consumer]`,
    failure:
      'Visibility timeout too short → duplicate processing. FIFO throughput limits (300 msg/s). SNS HTTP subscription retries can storm endpoints.',
    tradeoff:
      'Pros: managed, cheap at scale, AWS integration. Cons: vendor lock-in, latency higher than self-hosted Kafka, limited replay.',
    security:
      'IAM policies least privilege. Encryption with KMS. VPC endpoints for private access.',
    observability:
      'CloudWatch ApproximateNumberOfMessagesVisible. DLQ depth alarm. X-Ray tracing.',
    trap:
      'Assuming exactly-once — SQS is at-least-once; consumers must be idempotent. FIFO helps dedup but is not a transaction.',
    interviewAnswer:
      'On AWS I use SNS fan-out to SQS queues per consumer. Visibility timeout matches processing time, DLQ for poison messages, idempotent handlers. FIFO when order and dedup matter within a message group.',
    remember: ['At-least-once', 'Visibility timeout tuning', 'DLQ redrive', 'FIFO for order/dedup'],
    oneLiner: 'SQS/SNS — managed AWS async; idempotent consumers required.',
    tables: [
      {
        headers: ['Queue type', 'Throughput', 'Ordering', 'Dedup'],
        rows: [
          ['SQS Standard', 'Unlimited', 'Best effort', 'No'],
          ['SQS FIFO', '300/s per group', 'Per group', 'Yes'],
        ],
      },
    ],
  },
  {
    id: 'gcp-pubsub',
    title: 'Google Cloud Pub/Sub',
    what:
      'Managed messaging with topics, subscriptions (push or pull), message retention, ordering keys, and dead-letter topics. At-least-once delivery with ack deadline extension.',
    why:
      'Serverless scale on GCP. Push subscriptions to Cloud Run/Functions HTTP endpoints. Global availability. No partition management like Kafka.',
    when:
      'GCP-native eventing. Cloud Run microservices. Analytics ingestion. Cross-project event bus.',
    how:
      'Publisher.publish(topic, data, orderingKey). Pull subscriber with ack() after process or push endpoint with 200 response. Extend ack deadline for long tasks. Dead-letter topic on max delivery attempts.',
    flow: `flowchart LR
  Pub[Publisher] --> T[Topic]
  T --> Sub1[Pull subscription]
  T --> Sub2[Push to Cloud Run]`,
    failure:
      'Ack deadline exceeded → redelivery. Push endpoint down → retry backlog. Ordering key hotspot limits throughput.',
    tradeoff:
      'Pros: fully managed, push model, global. Cons: GCP lock-in, less stream processing ecosystem than Kafka.',
    security:
      'IAM, VPC-SC, CMEK encryption.',
    observability:
      'Undelivered messages metric. Oldest unacked age. Cloud Trace.',
    trap:
      'Push subscription without idempotency — retries duplicate work. Always idempotent handlers or dedup store.',
    interviewAnswer:
      'Pub/Sub for GCP async with pull or push subscriptions. I set ack deadline above p99 processing time, dead-letter topics, and idempotent consumers. Ordering keys only when strictly needed — they limit parallelism.',
    remember: ['Ack deadline tuning', 'Push = HTTP idempotency', 'DL topic', 'Ordering key = hotspot risk'],
    oneLiner: 'Pub/Sub — GCP managed events; ack deadline and idempotency critical.',
    tables: [
      {
        headers: ['Delivery', 'Pull', 'Push'],
        rows: [
          ['Consumer', 'Your code polls', 'HTTP POST to endpoint'],
          ['Scaling', 'Client-controlled', 'Endpoint must scale'],
          ['Use when', 'Batch workers', 'Cloud Run / Functions'],
        ],
      },
    ],
  },
  {
    id: 'azure-service-bus',
    title: 'Azure Service Bus',
    what:
      'Managed messaging with queues (point-to-point) and topics/subscriptions (pub/sub). Supports sessions for FIFO, duplicate detection, scheduled messages, and dead-letter queues.',
    why:
      'Enterprise Azure integration. Sessions give ordered processing per sessionId. Built-in duplicate detection window.',
    when:
      'Azure-native microservices on AKS or App Service. Enterprise messaging with transactions (in limited scenarios).',
    how:
      'Azure SDK or Spring Cloud Azure. ServiceBusProcessorClient with auto-complete disabled — complete after success. Session receiver for ordered processing per customerId.',
    flow: `flowchart LR
  P[Producer] --> Topic[Service Bus Topic]
  Topic --> Sub1[Subscription A]
  Topic --> Sub2[Subscription B]`,
    failure:
      'Lock lost on processing timeout → duplicate. Session stuck if consumer dies mid-session. Throttling under burst.',
    tradeoff:
      'Pros: sessions, duplicate detection, Azure AD auth. Cons: Azure lock-in, pricing at high volume.',
    security:
      'Azure AD RBAC. Managed identity. TLS 1.2+.',
    observability:
      'Active messages count. DLQ monitoring. Application Insights.',
    trap:
      'Sessions serialize all messages for a sessionId — great for order per customer, deadly if one bad message blocks the session.',
    interviewAnswer:
      'Service Bus topics for Azure pub/sub. Sessions when I need FIFO per customer, duplicate detection for at-least-once safety, DLQ for failures. Complete message only after successful processing.',
    remember: ['Sessions = FIFO per id', 'Complete after success', 'DLQ monitor', 'Duplicate detection window'],
    oneLiner: 'Service Bus — Azure pub/sub with sessions and duplicate detection.',
    tables: [
      {
        headers: ['Feature', 'Queue', 'Topic'],
        rows: [
          ['Pattern', 'Point-to-point', 'Pub/sub'],
          ['Consumers', 'One', 'Many subscriptions'],
          ['Sessions', 'Optional', 'Optional'],
        ],
      },
    ],
  },
  {
    id: 'spring-cloud-stream',
    title: 'Spring Cloud Stream (binder abstraction)',
    what:
      'Programming model abstracting message brokers via binders (Kafka, Rabbit, Solace, etc.). Define StreamBridge or functional beans Consumer/Supplier/Function — binder translates to broker-specific config.',
    why:
      'Swap Kafka ↔ Rabbit without rewriting business logic. Consistent @EnableBinding successor (functional style in 3.x). Cloud Stream conventions for cloud-native apps.',
    when:
      'Multi-cloud or broker-agnostic codebase. Teams standardizing on Spring messaging patterns. Library modules that should not hardcode Kafka APIs.',
    how:
      'spring.cloud.stream.bindings.process-in-0.destination=orders. Function bean Consumer<OrderEvent>. Binder config in application.yml. Kafka binder for prod, Rabbit for local dev.',
    flow: `flowchart LR
  App[Spring Boot app] --> SCS[Cloud Stream]
  SCS --> KB[Kafka binder]
  SCS --> RB[Rabbit binder]
  KB --> K[(Kafka)]
  RB --> R[(Rabbit)]`,
    failure:
      'Lowest-common-denominator features — advanced Kafka semantics hidden. Binder version mismatches. Debugging indirection.',
    tradeoff:
      'Pros: portability, Spring idioms. Cons: abstraction leak, less control than native Kafka client.',
    security:
      'Binder-specific TLS/SASL config in yaml.',
    observability:
      'Binder metrics via Actuator. Trace propagation via spring-cloud-sleuth/micrometer.',
    trap:
      'Choosing Cloud Stream to avoid learning Kafka — you still need broker expertise; abstraction does not remove ops.',
    interviewAnswer:
      'Spring Cloud Stream when I want broker portability — functional Consumer/Supplier beans with Kafka binder in prod. For advanced Kafka transactions I drop to KafkaTemplate directly.',
    remember: ['Binder = pluggable', 'Functional beans in 3.x', 'Advanced features need native client'],
    oneLiner: 'Cloud Stream — broker abstraction; Kafka binder most common in prod.',
    tables: [
      {
        headers: ['Binder', 'Typical environment'],
        rows: [
          ['kafka', 'Production high throughput'],
          ['rabbit', 'Local dev / task queues'],
          ['solace', 'Enterprise messaging'],
        ],
      },
    ],
  },
  {
    id: 'domain-events',
    title: 'Domain events & transactional outbox',
    what:
      'Pattern: service publishes domain events (OrderCreated, PaymentCaptured) representing business facts. Transactional outbox writes event to same DB transaction as aggregate, then relay publishes to broker.',
    why:
      'Avoid dual-write problem (DB commit + message publish). Consumers stay decoupled. Event schema evolves with domain language.',
    when:
      'Any async integration after state change. Saga choreography. CQRS projections. Replacing sync “call and hope” after local commit.',
    how:
      'INSERT order + INSERT outbox in one @Transactional. Outbox relay (Debezium CDC, polling publisher, or Axon) reads outbox → Kafka. Consumers idempotent on eventId.',
    flow: `sequenceDiagram
  participant S as Order Service
  participant DB as Database
  participant R as Outbox Relay
  participant K as Kafka
  S->>DB: TX: save order + outbox row
  R->>DB: poll unpublished outbox
  R->>K: publish OrderCreated
  R->>DB: mark published`,
    failure:
      'Relay lag causes consumer delay. Duplicate publish on relay retry without published flag. Schema breaking changes break consumers.',
    tradeoff:
      'Pros: reliable publish, clean domain model. Cons: eventual consistency, relay component to operate.',
    security:
      'Sign events or use encrypted topics for sensitive payloads. Minimize PII in events — use references.',
    observability:
      'Outbox lag metric. Events published counter. End-to-end trace from command to consumer.',
    trap:
      'Publishing to Kafka inside @Transactional without outbox — message sent but TX rolls back, or vice versa.',
    interviewAnswer:
      'Domain events with transactional outbox: same DB transaction for aggregate and outbox row, relay publishes to Kafka. Consumers idempotent on eventId. This fixes the dual-write problem staff always ask about.',
    remember: ['Outbox = same TX', 'Idempotent on eventId', 'No Kafka in @Transactional directly', 'Schema evolution discipline'],
    oneLiner: 'Domain events + outbox — reliable async after DB commit.',
    tables: [
      {
        headers: ['Approach', 'Consistency', 'Complexity'],
        rows: [
          ['Fire-and-forget Kafka', 'Risky dual-write', 'Low'],
          ['Transactional outbox', 'Strong local + eventual', 'Medium'],
          ['Kafka transactions', 'EOS in Kafka', 'High'],
          ['Change Data Capture', 'DB log → broker', 'Medium-high'],
        ],
      },
    ],
  },
  // ── Shared state (anti-patterns & cautions) ─────────────────────────────
  {
    id: 'shared-database',
    title: 'Shared database (anti-pattern)',
    what:
      'Multiple microservices read/write the same relational database schema — shared tables, direct SQL across bounded contexts. Sometimes called distributed monolith data layer.',
    why:
      'Teams avoid it because it creates the tightest coupling: schema changes break multiple deployables, no independent scaling, unclear ownership, and transactions that silently span “services” via JOINs.',
    when:
      'Never as intentional architecture. Acceptable only as temporary migration stepping stone with strict views and deprecation plan. Interview answer: “We inherited it; here is how I would extract.”',
    how:
      'If stuck: enforce DB views per service, no cross-schema writes, read-only replicas for queries, strangler fig to split schemas. Long-term: database-per-service with APIs or events.',
    flow: `flowchart TD
  S1[Order Service] --> DB[(Shared DB)]
  S2[Inventory Service] --> DB
  S3[Payment Service] --> DB
  DB --> Pain[Schema coupling<br/>Deploy lockstep<br/>No team ownership]
  style Pain fill:#f8d7da`,
    failure:
      'Migration deadlock — nobody can change a column. Performance contention. Security boundary collapse — one SQL injection sees all data. Hidden distributed transactions.',
    tradeoff:
      'Pros: short-term simplicity, JOINs work. Cons: kills microservice benefits — independent deploy, scale, team autonomy.',
    security:
      'Blast radius: compromise of one service exposes all tables. Row-level security rarely enough.',
    observability:
      'Cannot attribute DB load to a single service owner. Slow queries affect everyone.',
    trap:
      'Staff scenario: “Three services share Postgres — what breaks first?” Answer: schema evolution and deployment coupling.',
    interviewAnswer:
      'Shared database is an anti-pattern — it couples services at the data layer. I prefer database-per-service with sync API for queries and async events for propagation. If legacy shared DB, I use views and a strangler migration plan.',
    remember: ['Database per service', 'Shared DB = distributed monolith', 'Strangler to extract', 'Events over cross-DB JOINs'],
    oneLiner: 'Shared DB — anti-pattern; database-per-service + events.',
    tables: [
      {
        headers: ['Pattern', 'Coupling', 'Deploy independence'],
        rows: [
          ['Shared database', 'Tight', 'No'],
          ['Database per service', 'Loose', 'Yes'],
          ['Shared read replica', 'Medium', 'Partial'],
          ['API composition', 'Contract', 'Yes'],
        ],
      },
    ],
  },
  {
    id: 'shared-cache',
    title: 'Shared cache (use carefully)',
    what:
      'Multiple services read/write the same Redis/Memcached cluster as a communication mechanism — caching another service’s data or using Redis pub/sub as a message bus substitute.',
    why:
      'Caches are for performance, not source of truth. Shared cache as integration creates implicit contract on key format, TTL semantics, and invalidation — fragile and untyped.',
    when:
      'OK: each service owns its cache namespace; CDN/Redis in front of own DB. Careful: read-through cache of own data. Risky: Service B writes keys Service A reads. Avoid: Redis as primary event bus instead of Kafka.',
    how:
      'Namespace keys: order-svc:{id}. Cache-aside in owning service only. Invalidation via domain events (Kafka) not direct key deletion from other services. Redis pub/sub only for ephemeral notifications with loss acceptable.',
    flow: `flowchart TD
  subgraph good [OK — own cache]
    A[Order Service] --> RA[(Redis namespace order:)]
    A --> DBA[(Order DB)]
  end
  subgraph risky [Risky — shared keys]
    B[Inventory] --> RC[(shared keys)]
    C[Catalog] --> RC
  end
  style risky fill:#fff3cd`,
    failure:
      'Stale cache across services — B invalidates wrong key format. Thundering herd on TTL expiry. Redis down takes multiple services with it. Pub/sub messages lost if subscriber offline.',
    tradeoff:
      'Pros: fast reads when used correctly per service. Cons: shared key contract is hidden API; pub/sub not durable.',
    security:
      'ACL per service user in Redis 6+. No sensitive data in shared keys without encryption.',
    observability:
      'Hit ratio per namespace. Eviction rate. Not a replacement for service metrics.',
    trap:
      '“We use Redis pub/sub between services” — staff will ask what happens on disconnect. Answer: messages lost; use Kafka.',
    interviewAnswer:
      'Cache is not a communication contract. Each service caches its own data with cache-aside. Cross-service updates go through APIs or Kafka events for invalidation — never Service A writing Service B’s Redis keys.',
    remember: ['Cache-aside in owner service', 'Kafka for invalidation events', 'Redis pub/sub not durable', 'Namespace keys per service'],
    oneLiner: 'Shared cache — performance layer only; not inter-service contract.',
    tables: [
      {
        headers: ['Use Redis for', 'Do NOT use Redis for'],
        rows: [
          ['Per-service cache-aside', 'Cross-service source of truth'],
          ['Rate limiting / locks', 'Durable event log'],
          ['Session store (own svc)', 'Replacing Kafka fan-out'],
          ['Ephemeral pub/sub notify', 'Guaranteed delivery'],
        ],
      },
      {
        headers: ['Sync REST', 'Async Kafka', 'Shared cache'],
        rows: [
          ['Coupling', 'Request-time', 'Temporal', 'Hidden/schema-less'],
          ['Contract', 'OpenAPI', 'Schema Registry', 'Key convention'],
          ['Failure', 'Timeout/CB', 'Lag/retry', 'Stale/loss'],
          ['When', 'Immediate read', 'Fan-out/events', 'Local perf only'],
        ],
      },
    ],
  },
];
