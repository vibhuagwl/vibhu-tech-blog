import type {PatternCard} from './types';

/** Part 3 — Communication patterns (REST, gRPC, Kafka, EDA). */
export const COMMUNICATION_PATTERNS: PatternCard[] = [
  {
    id: 'sync-rest',
    part: 3,
    name: 'Synchronous REST',
    frequency: 'Frequently used',
    definition:
      'Request/response over HTTP with JSON — client blocks until response. Best for browser-facing APIs, CRUD queries, and operations needing immediate confirmation.',
    problem:
      'Checkout UI must know if payment was accepted before showing confirmation. Fire-and-forget async cannot answer in the same user session.',
    realWorld:
      'Spring @RestController on Order and Payment services; mobile app POST /orders via API Gateway with JWT.',
    whyExists:
      'Simplest integration model; ubiquitous tooling (OpenAPI, curl, Postman); works through corporate proxies and browsers.',
    ascii: `
Client ──POST /orders──► API Gateway ──► Order Service
                              │              │
                              │              └── 201 Created + orderId
                              └── JWT validate + rate limit
`,
    flow: 'Client sends HTTP request → gateway auth → service validates → DB write (optionally outbox) → sync response with status + body.',
    components: [
      {name: 'RestController', responsibility: 'HTTP mapping, validation, ProblemDetail errors'},
      {name: 'WebClient/RestTemplate', responsibility: 'Outbound sync calls with timeout + resilience'},
      {name: 'API Gateway', responsibility: 'TLS, JWT, routing, correlation ID'},
    ],
    javaCode: `@RestController
@RequestMapping("/api/orders")
public class OrderController {
  private final OrderService orders;

  @PostMapping
  public ResponseEntity<OrderResponse> create(
      @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
      @Valid @RequestBody CreateOrderRequest req) {
    Order order = orders.create(req, idempotencyKey);
    return ResponseEntity.status(HttpStatus.CREATED).body(OrderResponse.from(order));
  }
}`,
    springCode: `@Bean
WebClient paymentClient(WebClient.Builder builder) {
  return builder.baseUrl("http://payment-service:8082")
      .clientConnector(new ReactorClientHttpConnector(
          HttpClient.create().responseTimeout(Duration.ofSeconds(3))))
      .build();
}`,
    config: `spring.mvc.problemdetails.enabled=true
server.tomcat.threads.max=200`,
    restApi: `POST /api/orders
Authorization: Bearer <jwt>
Idempotency-Key: abc-123
{"customerId":"cust-1","amountCents":9900}`,
    unitTest: `@Test void createOrder_returns201() {
  var svc = mock(OrderService.class);
  when(svc.create(any(), eq("abc-123"))).thenReturn(Order.pending("ord-1"));
  var ctrl = new OrderController(svc);
  var res = ctrl.create("abc-123", new CreateOrderRequest("cust-1", 9900L));
  assertEquals(201, res.getStatusCode().value());
}`,
    edgeCases: ['Long polling not REST — use WebSocket or SSE', 'Large payloads — use claim check pattern'],
    failureScenarios: ['Downstream timeout → 504 Gateway Timeout', 'Validation error → 400 ProblemDetail'],
    retry: 'Client may retry GET; POST only with Idempotency-Key',
    idempotency: 'Idempotency-Key header + UNIQUE constraint on payments/orders',
    timeout: 'Connect 1s, read 3s per hop; propagate X-Deadline-Ms header',
    observability: 'Log correlationId; metric http.server.requests per route',
    security: 'JWT at gateway; @PreAuthorize on service; no secrets in URL',
    performance: 'Connection pool per downstream; avoid chatty N+1 REST chains',
    scalability: 'Stateless pods scale horizontally; sticky sessions rarely needed',
    production: 'OpenAPI contract; consumer-driven contract tests (Pact)',
    mistakes: ['No timeout on WebClient', 'Retry POST without idempotency', '10-hop sync chains'],
    antiPatterns: ['Synchronous chain across 5 services for checkout'],
    alternatives: ['gRPC internal', 'Async Kafka for side effects'],
    tradeoffs: 'Pros: simple, debuggable. Cons: latency sums, coupling, no natural backpressure.',
    interviewQs: ['REST vs gRPC when?', 'How propagate deadline across REST hops?'],
    trickyQs: ['REST retry on 503 — safe for POST?'],
    seniorFollowUps: ['Design checkout with max 2 sync hops + async settlement'],
  },
  {
    id: 'grpc-internal-rpc',
    part: 3,
    name: 'gRPC (Internal RPC)',
    frequency: 'Occasionally used',
    definition:
      'Binary HTTP/2 RPC with Protocol Buffers — low latency, streaming, strong typing. Preferred for service-to-service calls inside the cluster.',
    problem:
      'Payment service calls Fraud service 50k times/sec — JSON REST parsing and HTTP/1.1 head-of-line blocking add CPU and latency.',
    realWorld:
      'Google internal services, Uber, Netflix inter-service gRPC; Spring gRPC starter with protobuf contracts in shared module.',
    whyExists:
      'Efficient wire format, bidirectional streaming, built-in deadline propagation, code generation from .proto.',
    ascii: `
Order Service ──gRPC──► Payment Service
     │    PaymentRequest      │
     │    (protobuf)          │
     │◄─── PaymentResponse ───┘
     deadline: 2s (Context)
`,
    flow: 'Generate stubs from .proto → server implements service → client stub with ManagedChannel → deadline on Context → status codes map to business errors.',
    components: [
      {name: 'Proto contract', responsibility: 'Versioned API in shared artifact'},
      {name: 'gRPC server', responsibility: '@GrpcService implementation'},
      {name: 'gRPC client', responsibility: 'Channel + stub with deadline interceptor'},
    ],
    javaCode: `// payment.proto: service PaymentService { rpc Authorize(PaymentRequest) returns (PaymentResponse); }
@GrpcService
public class PaymentGrpcService extends PaymentServiceGrpc.PaymentServiceImplBase {
  @Override
  public void authorize(PaymentRequest req, StreamObserver<PaymentResponse> observer) {
    try {
      var result = payments.authorize(req.getOrderId(), req.getAmountCents());
      observer.onNext(PaymentResponse.newBuilder().setStatus(result.name()).build());
      observer.onCompleted();
    } catch (Exception ex) {
      observer.onError(Status.INTERNAL.withDescription(ex.getMessage()).asRuntimeException());
    }
  }
}`,
    springCode: `@Bean
ManagedChannel paymentChannel() {
  return ManagedChannelBuilder.forAddress("payment-svc", 9090)
      .usePlaintext() // mTLS in prod via mesh
      .build();
}`,
    config: `grpc.server.port=9090
grpc.client.payment-service.address=static://payment-svc:9090
grpc.client.payment-service.negotiation-type=plaintext`,
    unitTest: `@Test void authorize_deadlineExceeded() {
  var stub = PaymentServiceGrpc.newBlockingStub(channel)
      .withDeadlineAfter(1, TimeUnit.MILLISECONDS);
  assertThrows(StatusRuntimeException.class, () -> stub.authorize(request));
}`,
    edgeCases: ['Browser cannot call gRPC directly — gateway translates REST→gRPC', 'Proto breaking change needs versioning'],
    failureScenarios: ['DEADLINE_EXCEEDED → caller fast-fails', 'UNAVAILABLE → retry with backoff if idempotent'],
    retry: 'Retry only idempotent RPCs; respect gRPC status (UNAVAILABLE vs INVALID_ARGUMENT)',
    idempotency: 'Business idempotency key in PaymentRequest message',
    timeout: 'Context.withDeadlineAfter on every stub call',
    observability: 'OpenTelemetry gRPC instrumentation; grpc.server.call.duration',
    security: 'mTLS between services; JWT metadata in Authorization header',
    performance: 'HTTP/2 multiplexing; binary protobuf ~5x smaller than JSON',
    scalability: 'Connection pooling; avoid blocking stub on reactive event loop',
    production: 'Proto backward compatibility (add fields, don\'t renumber); grpc-health-probe',
    mistakes: ['Blocking gRPC on WebFlux thread', 'No deadline', 'Sharing proto without semver'],
    antiPatterns: ['gRPC to browser', 'gRPC without health checks'],
    alternatives: ['REST for simplicity', 'Kafka for async decoupling'],
    tradeoffs: 'Pros: fast, typed, streaming. Cons: ops complexity, not browser-friendly, tooling curve.',
    interviewQs: ['REST vs gRPC vs Kafka?', 'How handle proto schema evolution?'],
    trickyQs: ['gRPC load balancing — client-side or service mesh?'],
    seniorFollowUps: ['Design fraud check: sync gRPC vs async Kafka scoring'],
  },
  {
    id: 'async-messaging-kafka',
    part: 3,
    name: 'Asynchronous Messaging (Kafka)',
    frequency: 'Frequently used',
    definition:
      'Producers publish events/commands to Kafka topics; consumers process independently. Decouples services in time and failure domains.',
    problem:
      'Order service should not block on email/SMS/analytics. Payment settlement can take seconds — checkout must not wait.',
    realWorld:
      'OrderCreated → Kafka → Payment, Inventory, Notification, Analytics consumers in parallel.',
    whyExists:
      'Buffering, replay, horizontal scale via partitions, natural fit for event-driven sagas and outbox.',
    ascii: `
Order Service ──publish──► payments-v1 (Kafka)
                                │
              ┌─────────────────┼─────────────────┐
              ▼                 ▼                 ▼
        Payment Svc      Settlement Svc    Notification Svc
        (consumer grp)   (consumer grp)    (consumer grp)
`,
    flow: 'Domain event in outbox → relay to Kafka → consumer groups scale independently → manual ack after idempotent processing.',
    components: [
      {name: 'Producer', responsibility: 'Publish with key=orderId, acks=all, idempotence'},
      {name: 'Topic', responsibility: 'Durable log partitioned by business key'},
      {name: 'Consumer group', responsibility: 'Competing consumers; one consumer per partition max'},
    ],
    javaCode: `@Service
public class OrderEventPublisher {
  private final KafkaTemplate<String, String> kafka;

  public void publishOrderCreated(OrderCreatedEvent evt) {
    ProducerRecord<String, String> rec = new ProducerRecord<>("payments-v1", evt.orderId(), Json.write(evt));
    rec.headers().add("eventType", "OrderCreated".getBytes(StandardCharsets.UTF_8));
    kafka.send(rec);
  }
}`,
    springCode: `@KafkaListener(topics = "payments-v1", groupId = "payment-service")
public void onPaymentEvent(ConsumerRecord<String, String> rec, Acknowledgment ack) {
  // idempotent handler
  ack.acknowledge();
}`,
    config: `spring.kafka.producer.acks=all
spring.kafka.producer.properties.enable.idempotence=true
spring.kafka.consumer.enable-auto-commit=false`,
    kafkaCode: `Topic: payments-v1, partitions=12, key=orderId
Consumer groups: payment-service, settlement-workers, notification-service`,
    unitTest: `@Test void publish_usesOrderIdAsKey() {
  verify(kafka).send(argThat(r -> "ord-1".equals(r.key())));
}`,
    edgeCases: ['Ordering only per partition key', 'Consumer lag under load'],
    failureScenarios: ['Broker down → outbox buffers until recovery', 'Poison message → DLT'],
    retry: '@RetryableTopic or DefaultErrorHandler with backoff',
    idempotency: 'processed_events table; business idempotency key in payload',
    timeout: 'max.poll.interval.ms > handler duration',
    observability: 'Consumer lag metric; trace propagation via headers',
    security: 'SASL_SSL + ACL per service user',
    performance: 'Batch consume; compression zstd',
    scalability: 'Add partitions + consumers in group',
    production: 'Outbox for atomic DB+publish; DLT + replay runbook',
    mistakes: ['auto-commit=true', 'No idempotent consumer', 'Shared consumer group across services'],
    antiPatterns: ['Kafka as database', 'Sync request-reply over Kafka for simple CRUD'],
    alternatives: ['REST for query path', 'SQS for simpler ops'],
    tradeoffs: 'Pros: decouple, scale, replay. Cons: eventual consistency, operational complexity.',
    interviewQs: ['When Kafka vs REST?', 'At-least-once — how achieve effective exactly-once?'],
    trickyQs: ['Two consumers same group — why not both get same message?'],
    seniorFollowUps: ['Design payment platform event topology'],
    deepLabHref: '/kafka-interview',
  },
  {
    id: 'event-driven-architecture',
    part: 3,
    name: 'Event-Driven Architecture (EDA)',
    frequency: 'Frequently used',
    definition:
      'Services react to domain events instead of synchronous orchestration. State changes propagate as immutable facts (OrderCreated, PaymentCaptured).',
    problem:
      'Adding Analytics to checkout requires modifying Order service to call a new HTTP endpoint — violates Open/Closed.',
    realWorld:
      'Amazon event bus, Netflix Keystone, payment platforms publishing PaymentAuthorized for fraud, ledger, notification.',
    whyExists:
      'Loose coupling — new consumers subscribe without producer changes; natural audit trail; fits saga choreography.',
    ascii: `
         OrderCreated ──► Payment Service
              │
              ├──► Inventory Service
              ├──► Notification Service
              └──► Analytics Service (added later — no Order code change)
`,
    flow: 'Aggregate commits → outbox event → Kafka → N independent consumers react → each owns its consistency boundary.',
    components: [
      {name: 'Domain event', responsibility: 'Past-tense fact: PaymentCaptured'},
      {name: 'Event bus', responsibility: 'Kafka topics with schema registry'},
      {name: 'Event handler', responsibility: 'Idempotent consumer updating local state'},
    ],
    javaCode: `public sealed interface PaymentEvent permits PaymentAuthorized, PaymentFailed {
  String paymentId();
  String orderId();
  String correlationId();
}
public record PaymentAuthorized(String paymentId, String orderId, String correlationId, long amountCents) implements PaymentEvent {}`,
    kafkaCode: `Topics by aggregate: order.events.v1, payment.events.v1
Schema: Avro + Schema Registry BACKWARD compatibility`,
    unitTest: `@Test void newConsumer_doesNotRequireProducerChange() {
  // AnalyticsConsumer subscribes to order.events.v1 — OrderService unchanged
  assertTrue(subscribersOf("order.events.v1").contains("analytics-service"));
}`,
    edgeCases: ['Event ordering across aggregates — use saga correlationId', 'Schema evolution'],
    failureScenarios: ['Consumer down → lag accumulates; no data loss with retention'],
    retry: 'Per-consumer retry/DLT',
    idempotency: 'Mandatory on every handler',
    timeout: 'Saga timeout job for stuck flows',
    observability: 'Event catalog; trace per correlationId',
    security: 'ACL per consumer principal',
    performance: 'Partition by business key',
    scalability: 'Independent consumer group scaling',
    production: 'Schema registry; event versioning policy',
    mistakes: ['Events as commands without clear ownership', 'Chatty event chains'],
    antiPatterns: ['Event-driven everything for simple CRUD'],
    alternatives: ['Sync for read path', 'Orchestration for strict workflows'],
    tradeoffs: 'Pros: extensibility, decoupling. Cons: debugging harder, eventual consistency.',
    interviewQs: ['EDA vs Event Sourcing?', 'Command vs event on Kafka?'],
    trickyQs: ['How debug stuck saga in choreography?'],
    seniorFollowUps: ['Draw event storm scenario and mitigation'],
  },
  {
    id: 'pub-sub',
    part: 3,
    name: 'Publish / Subscribe',
    frequency: 'Frequently used',
    definition:
      'Publisher sends message to topic; all subscriber consumer groups receive a copy. One publish → many independent consumers.',
    problem:
      'PaymentCaptured must update Ledger, send receipt email, and trigger fraud review — one HTTP call cannot fan out cleanly.',
    realWorld:
      'Kafka topic with multiple consumer groups; AWS SNS→SQS fan-out; Redis Pub/Sub for cache invalidation (ephemeral).',
    whyExists:
      'Decouple producers from unknown number of subscribers; add subscribers without redeploying producer.',
    ascii: `
Payment Service ──publish──► payment.events.v1
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
              group:ledger    group:notify    group:fraud
              (all get msg)   (all get msg)   (all get msg)
`,
    flow: 'Producer publish → topic stores → each consumer group tracks own offset → parallel processing.',
    components: [
      {name: 'Topic', responsibility: 'Durable pub/sub log'},
      {name: 'Consumer group', responsibility: 'Independent subscription cursor'},
      {name: 'Publisher', responsibility: 'Fire-and-forget after outbox commit'},
    ],
    javaCode: `kafka.send("payment.events.v1", paymentId, payload);
// Three consumer groups each receive the message independently`,
    kafkaCode: `Consumer group A: ledger-service
Consumer group B: notification-service
Consumer group C: fraud-service
Same topic, independent offsets`,
    unitTest: `@Test void threeGroups_eachReceiveMessage() {
  publishOnce();
  assertConsumed("ledger-service", 1);
  assertConsumed("notification-service", 1);
}`,
    edgeCases: ['Redis Pub/Sub — no persistence; miss if offline'],
    failureScenarios: ['One slow consumer group lags without blocking others'],
    retry: 'Per-group DLT',
    idempotency: 'Per consumer group inbox',
    timeout: 'N/A at pub/sub layer',
    observability: 'Lag per consumer group metric',
    security: 'ACL READ per group principal',
    performance: 'Partition count limits parallel consumers per group',
    scalability: 'Scale each group independently',
    production: 'Kafka for durable pub/sub; Redis for ephemeral invalidation',
    mistakes: ['Same group ID on different services — load sharing not fan-out'],
    antiPatterns: ['Using Kafka as RPC without request-reply pattern'],
    alternatives: ['HTTP webhook fan-out (brittle)'],
    tradeoffs: 'Pros: simple fan-out. Cons: no single aggregated response.',
    interviewQs: ['Pub/sub vs competing consumers?', 'Same group vs different groups?'],
    trickyQs: ['Why two services must NOT share consumer group?'],
    seniorFollowUps: ['Design fan-out with ordering per paymentId'],
  },
  {
    id: 'request-reply-kafka',
    part: 3,
    name: 'Request / Reply (Kafka)',
    frequency: 'Specialized',
    definition:
      'Client publishes request to topic, waits on reply topic correlated by requestId. Simulates RPC over async messaging.',
    problem:
      'Fraud scoring needs async ML pipeline but Order service needs approve/deny before confirming checkout.',
    realWorld:
      'Kafka request-reply with temporary reply topic or correlationId header; prefer gRPC for true sync needs.',
    whyExists:
      'When async infrastructure is mandatory but caller needs response — rare; often a smell to use gRPC instead.',
    ascii: `
Order ──request──► fraud.requests ──► Fraud Service
  ▲                                        │
  └── reply (correlationId) ◄── fraud.replies
`,
    flow: 'Send request with correlationId → consumer processes → publish reply with same correlationId → caller correlates from reply topic or in-memory queue.',
    components: [
      {name: 'Request producer', responsibility: 'Publishes with replyTo header'},
      {name: 'Reply consumer', responsibility: 'Temporary listener on reply topic'},
      {name: 'Service handler', responsibility: 'Processes and publishes reply'},
    ],
    javaCode: `String correlationId = UUID.randomUUID().toString();
ProducerRecord<String, String> req = new ProducerRecord<>("fraud.requests", correlationId, payload);
req.headers().add("replyTo", "fraud.replies");
kafka.send(req);
// Blocking wait on correlationId (use with strict timeout)`,
    kafkaCode: `replyTo header + correlationId
Prefer: spring-kafka ReplyingKafkaTemplate`,
    unitTest: `@Test void reply_matchesCorrelationId() {
  assertEquals(requestCorrelationId, reply.headers().lastHeader("correlationId").value());
}`,
    edgeCases: ['Reply never arrives — timeout mandatory', 'Duplicate reply — idempotent correlation'],
    failureScenarios: ['Consumer slow → request timeout → cancel order'],
    retry: 'Retry request only if idempotent',
    idempotency: 'Same correlationId dedupe',
    timeout: 'Strict overall deadline (e.g. 5s) on waiting thread',
    observability: 'Track request-reply latency histogram',
    security: 'Encrypt sensitive payload fields',
    performance: 'Blocking wait ties up thread — prefer async gRPC',
    scalability: 'Poor at high QPS — bottleneck on reply correlation',
    production: 'Use sparingly; gRPC or REST for sync paths',
    mistakes: ['Unbounded wait on reply', 'No timeout'],
    antiPatterns: ['Request-reply Kafka for every internal call'],
    alternatives: ['gRPC sync', 'Webhook callback', 'Polling status API'],
    tradeoffs: 'Pros: works over messaging infra. Cons: complex, blocking, hard to debug.',
    interviewQs: ['Kafka request-reply vs gRPC?', 'How implement timeout?'],
    trickyQs: ['Why not use Kafka as general RPC?'],
    seniorFollowUps: ['Refactor request-reply chain to async saga'],
  },
  {
    id: 'event-notification',
    part: 3,
    name: 'Event Notification',
    frequency: 'Frequently used',
    definition:
      'Lightweight event carries minimal data (entity id + type); consumer calls back or loads from API if more data needed.',
    problem:
      'Large OrderCreated payload on every analytics consumer duplicates data and couples schemas.',
    realWorld:
      'OrderCreated {orderId} → Analytics fetches order details via API if needed.',
    whyExists:
      'Small messages, loose schema coupling; consumers choose how much data to load.',
    ascii: `
OrderCreated { orderId: "ord-1" } ──► Analytics
                                           │
                                           └── GET /orders/ord-1 (if needed)
`,
    flow: 'Publish thin notification → consumer receives id → optional REST fetch for details → process.',
    components: [
      {name: 'Notification event', responsibility: 'Id + type only'},
      {name: 'Consumer', responsibility: 'Optional enrichment via API'},
    ],
    javaCode: `public record OrderCreatedNotification(String orderId, Instant occurredAt) {}
kafka.send("order.notifications.v1", orderId, Json.write(new OrderCreatedNotification(orderId, Instant.now())));`,
    kafkaCode: `Small payload <1KB; schema evolves independently of Order aggregate`,
    unitTest: `@Test void notificationPayload_under1kb() {
  assertTrue(Json.write(notification).length() < 1024);
}`,
    edgeCases: ['API unavailable during consume — retry or DLQ'],
    failureScenarios: ['Chatty callback storm if every consumer fetches'],
    retry: 'Retry fetch with CB',
    idempotency: 'Dedupe on orderId + eventType',
    timeout: 'Fetch timeout 2s',
    observability: 'Metric notification.enrichment.fetch.count',
    security: 'Service account for internal fetch',
    performance: 'Risk of N+1 API calls — prefer ECST for hot paths',
    scalability: 'Notification scales; fetch path may not',
    production: 'Use for low-frequency events; ECST for high-volume',
    mistakes: ['Notification triggers 50 REST calls per event'],
    antiPatterns: ['Notification with full aggregate snapshot'],
    alternatives: ['Event-Carried State Transfer'],
    tradeoffs: 'Pros: small messages, loose coupling. Cons: extra latency on fetch.',
    interviewQs: ['Notification vs ECST?'],
    trickyQs: ['Consumer fetch fails — event lost?'],
    seniorFollowUps: ['When switch notification to ECST'],
  },
  {
    id: 'event-carried-state-transfer',
    part: 3,
    name: 'Event-Carried State Transfer (ECST)',
    frequency: 'Frequently used',
    definition:
      'Event carries all data consumers need — no callback. Consumer updates local read model from event payload alone.',
    problem:
      'Analytics needs order line items but calling Order API on every event adds latency and couples availability.',
    realWorld:
      'OrderCreatedEvent includes customerId, lines, amount — Analytics writes directly to local projection table.',
    whyExists:
      'Eliminates chatty callbacks; enables offline consumers; fits CQRS projections.',
    ascii: `
OrderCreated { orderId, customerId, lines[], amountCents }
        │
        └──► Analytics: INSERT INTO order_facts ...
             (no REST call to Order service)
`,
    flow: 'Rich event published → consumer idempotently upserts local table → serves reads from projection.',
    components: [
      {name: 'Rich domain event', responsibility: 'Complete data for consumer use case'},
      {name: 'Projection handler', responsibility: 'Upsert read model'},
    ],
    javaCode: `public record OrderCreatedEvent(
    String orderId, String customerId, List<LineItem> lines, long amountCents, String correlationId) {}

@KafkaListener(topics = "order.events.v1", groupId = "analytics")
public void project(ConsumerRecord<String, String> rec) {
  OrderCreatedEvent evt = Json.read(rec.value(), OrderCreatedEvent.class);
  analyticsRepo.upsertOrderFact(evt);
}`,
    dbCode: `CREATE TABLE order_facts (order_id PK, customer_id, amount_cents, lines_json, updated_at);`,
    unitTest: `@Test void projection_noRestCall() {
  handler.on(record(orderCreatedJson));
  verify(orderApi, never()).fetch(any());
}`,
    edgeCases: ['Payload size limits — use claim check for large attachments'],
    failureScenarios: ['Schema change breaks consumers — use schema registry'],
    retry: 'Idempotent upsert',
    idempotency: 'PK on order_id',
    timeout: 'Handler must finish within max.poll.interval.ms',
    observability: 'Projection lag metric',
    security: 'PII in payload — encrypt sensitive fields',
    performance: 'Larger messages; zstd compression',
    scalability: 'Consumer scales with partitions',
    production: 'Version events; additive schema changes only',
    mistakes: ['Kitchen-sink event with 50 fields nobody needs'],
    antiPatterns: ['ECST with cross-aggregate joins in payload'],
    alternatives: ['Event notification + fetch', 'CDC from source DB'],
    tradeoffs: 'Pros: no callback, fast consumer. Cons: larger events, schema coupling.',
    interviewQs: ['ECST vs notification?', 'Payload too large — what pattern?'],
    trickyQs: ['PII in ECST event — compliance issue?'],
    seniorFollowUps: ['Design order analytics projection schema'],
  },
  {
    id: 'domain-events',
    part: 3,
    name: 'Domain Events',
    frequency: 'Frequently used',
    definition:
      'Immutable facts about something that happened in the domain — past tense (OrderPlaced, PaymentCaptured). Distinct from commands (PlaceOrder).',
    problem:
      'Teams publish commands on Kafka causing double-execution ambiguity — was this an intent or a fact?',
    realWorld:
      'PaymentCaptured event after ledger commit; consumers never re-execute capture, they react to fact.',
    whyExists:
      'Clear semantics for event-driven integration; audit trail; saga and ES foundations.',
    ascii: `
Command: PlaceOrder (intent)     → Order Service executes
Event:   OrderPlaced (fact)       → Kafka → downstream reacts
Event:   PaymentCaptured (fact)   → Kafka → settlement reacts
`,
    flow: 'Aggregate validates command → state change → emit domain event(s) → outbox → Kafka.',
    components: [
      {name: 'Aggregate', responsibility: 'Enforces invariants; emits events'},
      {name: 'Domain event', responsibility: 'Past-tense, immutable record'},
      {name: 'Outbox', responsibility: 'Reliable publish after commit'},
    ],
    javaCode: `public final class Payment {
  public PaymentCaptured capture(Money amount) {
    if (status != Status.AUTHORIZED) throw new IllegalStateException("not authorized");
    this.status = Status.CAPTURED;
    return new PaymentCaptured(id, orderId, amount.cents(), Instant.now());
  }
}`,
    kafkaCode: `Topic naming: payment.events.v1
Event types: PaymentAuthorized, PaymentCaptured, PaymentRefunded`,
    unitTest: `@Test void capture_emitsPastTenseEvent() {
  var evt = payment.capture(Money.ofCents(100));
  assertTrue(evt.getClass().getSimpleName().startsWith("Payment"));
}`,
    edgeCases: ['Event vs command on same topic — use subject/type header'],
    failureScenarios: ['Duplicate event delivery — idempotent projection'],
    retry: 'Consumer retry',
    idempotency: 'Event id in processed_events',
    timeout: 'N/A',
    observability: 'Log eventType + aggregateId',
    security: 'Sign events or mTLS on bus',
    performance: 'Small focused events preferred',
    scalability: 'Partition by aggregateId',
    production: 'Event catalog documented per team',
    mistakes: ['Publishing before DB commit', 'Command naming as past tense incorrectly'],
    antiPatterns: ['Anemic events with no domain meaning'],
    alternatives: ['Integration events (external contract) vs domain events (internal)'],
    tradeoffs: 'Pros: clear semantics, audit. Cons: schema governance needed.',
    interviewQs: ['Command vs event?', 'Domain event vs integration event?'],
    trickyQs: ['Can consumer send command back on same topic?'],
    seniorFollowUps: ['Design payment domain event taxonomy'],
  },
];

/** Additional idempotency patterns (Part 8 supplements). */
export const IDEMPOTENCY_PATTERNS: PatternCard[] = [
  {
    id: 'api-idempotency-key',
    part: 8,
    name: 'API Idempotency Key',
    frequency: 'Frequently used',
    definition:
      'Client sends Idempotency-Key header on POST; server stores result keyed by (client, key) — duplicate requests return same response without re-executing.',
    problem:
      'Mobile client retries POST /payments on timeout — without idempotency, customer charged twice.',
    realWorld:
      'Stripe Idempotency-Key, PayPal, most payment APIs; Spring filter or @Idempotent annotation.',
    whyExists:
      'Network retries are inevitable; business operations like payments must be safe under at-least-once delivery.',
    ascii: `
POST /payments  Idempotency-Key: abc-123  → Payment created (201)
POST /payments  Idempotency-Key: abc-123  → Same response (201, no double charge)
POST /payments  Idempotency-Key: abc-123  → (5th retry) still one payment
`,
    flow: 'Receive request → lookup (tenant, idempotencyKey) → if exists return cached response → else execute in TX → store response → return.',
    components: [
      {name: 'Idempotency store', responsibility: 'UNIQUE(client_id, idempotency_key) → response hash'},
      {name: 'Filter/Interceptor', responsibility: 'Extract header before controller'},
      {name: 'TTL job', responsibility: 'Purge keys after 24-72h'},
    ],
    javaCode: `@Service
public class IdempotentPaymentService {
  private final PaymentRepository payments;
  private final IdempotencyRepository idempotency;

  @Transactional
  public PaymentResult charge(ChargeRequest req, String idempotencyKey) {
    return idempotency.find(req.clientId(), idempotencyKey)
        .map(stored -> Json.read(stored.responseJson(), PaymentResult.class))
        .orElseGet(() -> {
          PaymentResult result = payments.charge(req);
          idempotency.save(new IdempotencyRecord(req.clientId(), idempotencyKey, Json.write(result), Instant.now()));
          return result;
        });
  }
}`,
    dbCode: `CREATE TABLE idempotency_keys (
  client_id        VARCHAR(64) NOT NULL,
  idempotency_key  VARCHAR(128) NOT NULL,
  response_json    JSONB NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (client_id, idempotency_key)
);`,
    restApi: `POST /api/payments
Idempotency-Key: abc-123
Authorization: Bearer <token>
{"orderId":"ord-1","amountCents":9900}`,
    unitTest: `@Test void duplicateKey_singleCharge() {
  svc.charge(req, "abc-123");
  svc.charge(req, "abc-123");
  verify(payments, times(1)).charge(req);
}`,
    edgeCases: ['In-flight duplicate — use DB UNIQUE + retry on conflict', 'Different body same key — return 422'],
    failureScenarios: ['Crash after charge before idempotency save — client retries, may double charge without TX'],
    retry: 'Client retries safe with same key',
    idempotency: 'This IS the pattern',
    timeout: 'N/A',
    observability: 'Metric idempotency.cache_hit',
    security: 'Scope key per client/API key',
    performance: 'Index on PK; Redis optional for hot path',
    scalability: 'Partition idempotency table by client_id',
    production: 'Store in same TX as business write; TTL cleanup',
    mistakes: ['Idempotency store outside payment TX', 'No TTL — table grows forever'],
    antiPatterns: ['Relying on client to never retry'],
    alternatives: ['Natural key UNIQUE (orderId)', 'Distributed lock'],
    tradeoffs: 'Pros: safe retries. Cons: storage, TTL policy, in-flight race handling.',
    interviewQs: ['Where store idempotency key — gateway or service?', 'Same key different payload?'],
    trickyQs: ['Charge succeeded, response lost, client retries — safe?'],
    seniorFollowUps: ['Design idempotency for async Kafka consumer'],
  },
  {
    id: 'kafka-idempotent-producer',
    part: 8,
    name: 'Kafka Idempotent Producer',
    frequency: 'Frequently used',
    definition:
      'enable.idempotence=true assigns producer PID + sequence numbers — broker deduplicates retries within session, preventing duplicate messages on producer retry.',
    problem:
      'Producer retry after timeout may write same payment event twice — downstream double-charges.',
    realWorld:
      'Spring Kafka acks=all + enable.idempotence=true on all payment producers.',
    whyExists:
      'Producer retries are automatic; without idempotence, at-least-once becomes duplicate messages.',
    ascii: `
Producer send seq=1 → broker ACK lost → producer retry seq=1
Broker dedupes → only ONE message in log
`,
    flow: 'Init producer with idempotence → each partition sequence tracked → retry safe within transactional session.',
    components: [
      {name: 'Idempotent producer', responsibility: 'PID + sequence per partition'},
      {name: 'Broker', responsibility: 'Dedup within producer epoch'},
    ],
    javaCode: `// Spring Boot — automatic with:
// spring.kafka.producer.acks=all
// spring.kafka.producer.properties.enable.idempotence=true
// spring.kafka.producer.properties.max.in.flight.requests.per.connection=5`,
    config: `spring.kafka.producer.acks=all
spring.kafka.producer.properties.enable.idempotence=true
spring.kafka.producer.properties.max.in.flight.requests.per.connection=5
spring.kafka.producer.retries=2147483647`,
    kafkaCode: `enable.idempotence=true implies acks=all, retries>0, max.in.flight<=5
Does NOT dedupe across producer restarts — consumer idempotency still required`,
    unitTest: `@Test void idempotentProducer_configPresent() {
  assertTrue(producerConfig.get("enable.idempotence").equals("true"));
}`,
    edgeCases: ['New producer instance — new PID, consumer must still dedupe'],
    failureScenarios: ['Broker upgrade resets epoch — rare duplicate window'],
    retry: 'Producer retries automatically',
    idempotency: 'Producer-level only; consumer inbox still needed',
    timeout: 'delivery.timeout.ms bounds total retry time',
    observability: 'Metric record-send-rate; broker dedupe is transparent',
    security: 'ACL IdempotentWrite on topic',
    performance: 'Small overhead for sequence tracking',
    scalability: 'Per-partition sequence — no cross-partition ordering',
    production: 'Always enable on payment/order producers',
    mistakes: ['Idempotent producer but non-idempotent consumer'],
    antiPatterns: ['enable.idempotence=false with retries>0'],
    alternatives: ['Transactional producer (EOS with consume-transform-produce)'],
    tradeoffs: 'Pros: no dup on producer retry. Cons: not cross-session; not consumer-side.',
    interviewQs: ['Idempotent producer vs consumer dedupe?', 'max.in.flight=5 why?'],
    trickyQs: ['Producer restart — duplicates possible?'],
    seniorFollowUps: ['EOS with read_committed consumer'],
    deepLabHref: '/kafka-producer',
  },
  {
    id: 'deduplication-table',
    part: 8,
    name: 'Deduplication Table (Consumer)',
    frequency: 'Frequently used',
    definition:
      'Consumer stores processed message id (topic-partition-offset or business key) in UNIQUE table before side effect — duplicate delivery skipped.',
    problem:
      'Kafka at-least-once delivery + consumer crash after processing but before commit → message redelivered → double payment.',
    realWorld:
      'processed_events, inbox_messages tables in Payment and Settlement services.',
    whyExists:
      'End-to-end exactly-once is impossible across DB+Kafka; dedupe table gives effectively-once processing.',
    ascii: `
Message delivered → check dedupe table → if exists SKIP
                 → else INSERT dedupe + business logic + commit offset
`,
    flow: 'Begin TX → insert dedupe key → apply side effect → commit TX → ack Kafka offset.',
    components: [
      {name: 'Dedupe table', responsibility: 'UNIQUE(message_id) or (service, aggregate, event_type)'},
      {name: 'Handler', responsibility: 'Business logic inside same TX as dedupe insert'},
    ],
    javaCode: `@Transactional
public void handle(ConsumerRecord<String, String> rec) {
  String messageId = rec.topic() + "-" + rec.partition() + "-" + rec.offset();
  if (dedupe.exists(messageId)) return;
  dedupe.insert(messageId);
  payments.applyEvent(Json.read(rec.value(), PaymentEvent.class));
}`,
    dbCode: `CREATE TABLE processed_messages (
  message_id   VARCHAR(256) PRIMARY KEY,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_processed_at ON processed_messages(processed_at);`,
    unitTest: `@Test void duplicateDelivery_processedOnce() {
  handler.handle(rec);
  handler.handle(rec);
  verify(payments, times(1)).applyEvent(any());
}`,
    edgeCases: ['Replay from earlier offset — use business key not offset for replay safety'],
    failureScenarios: ['Dedupe table full — partition + retention job'],
    retry: 'Safe — dedupe catches redelivery',
    idempotency: 'Core mechanism',
    timeout: 'TX must finish before max.poll.interval.ms',
    observability: 'Metric consumer.dedupe.skip.count',
    security: 'N/A',
    performance: 'Index PK; batch cleanup old rows',
    scalability: 'Table grows — TTL purge job',
    production: 'Prefer business key (paymentId+eventType) over offset for replays',
    mistakes: ['Dedupe insert outside business TX', 'Only offset-based key on replay'],
    antiPatterns: ['Assuming Kafka exactly-once without consumer dedupe'],
    alternatives: ['Inbox pattern (formal)', 'Natural key UNIQUE on business table'],
    tradeoffs: 'Pros: simple, reliable. Cons: table growth, replay semantics.',
    interviewQs: ['Dedupe table vs inbox?', 'Offset vs business key for dedupe?'],
    trickyQs: ['Replay topic from beginning — offset dedupe wrong?'],
    seniorFollowUps: ['Combine outbox + inbox + dedupe in payment flow'],
    deepLabHref: '/kafka-dlq',
  },
];
