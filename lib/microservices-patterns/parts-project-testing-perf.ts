/** Part 22 — Production lab architecture, Part 23 — Testing, Part 24 — Performance */

export const PRODUCTION_PROJECT = {
  title: 'spring-microservices-patterns-lab — Order Platform',
  ascii: `
                                    ┌─────────────────────────────────────┐
                                    │         Clients (Web / Mobile)        │
                                    └──────────────────┬──────────────────┘
                                                       │ HTTPS + JWT
                                    ┌──────────────────▼──────────────────┐
                                    │     Spring Cloud Gateway (8080)     │
                                    │  auth · RL · CB · retry · timeout   │
                                    │  correlation-id · request logging   │
                                    └──────────────────┬──────────────────┘
           ┌───────────────────────────┬───────────────┼───────────────┬───────────────────────────┐
           │                           │               │               │                           │
    ┌──────▼──────┐             ┌──────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐             ┌──────▼──────┐
    │   Order     │             │  Payment    │ │  Customer   │ │ Inventory   │             │Notification │
    │  Service    │             │  Service    │ │  Service    │ │  Service    │             │  Service    │
    │  :8081      │             │  :8082      │ │  :8083      │ │  :8084      │             │  :8085      │
    └──────┬──────┘             └──────┬──────┘ └──────┬──────┘ └──────┬──────┘             └──────┬──────┘
           │                           │               │               │                           │
           │    PostgreSQL (per svc)   │               │               │                           │
           │    outbox + inbox tables  │               │               │                           │
           └───────────────────────────┴───────────────┴───────────────┴───────────────────────────┘
                                                       │
                              ┌────────────────────────▼────────────────────────┐
                              │              Apache Kafka Cluster               │
                              │  order.events · payment.events · inventory.events│
                              │  notification.commands · *-dlt retry topics      │
                              └────────────────────────┬────────────────────────┘
                                                       │
                              ┌────────────────────────▼────────────────────────┐
                              │   Redis (cache · idempotency · rate-limit state)  │
                              └─────────────────────────────────────────────────┘

    Eureka / K8s DNS discovery · Resilience4j · OTel → Prometheus/Grafana · structured JSON logs
`,
  description: `The **spring-microservices-patterns-lab** is a runnable reference platform that wires every resilience and messaging pattern from this curriculum into one checkout flow.

**Gateway layer:** Spring Cloud Gateway terminates TLS, validates JWT (OAuth2 resource server), applies per-route rate limits (Redis-backed token bucket), injects \`X-Correlation-Id\`, and forwards to downstream services discovered via Eureka (or K8s service names in cloud deploy).

**Resilience stack (Resilience4j):** Each outbound \`WebClient\` call is wrapped with **timeout** (connect + response), **retry** (only on idempotent verbs / safe operations with jittered exponential backoff), **circuit breaker** (sliding window failure rate), and **bulkhead** (semaphore isolation per dependency). Fallbacks return degraded responses or enqueue async work — never block the gateway thread pool.

**Saga (choreography):** \`POST /orders\` creates a local order row + **outbox** event \`OrderCreated\`. Payment, Inventory, and Notification services consume via **inbox** dedupe (\`processed_events\` UNIQUE on consumer+key+eventType). Failures publish compensating events; exhausted retries land in **DLQ** (\`-dlt\` topics) with replay tooling.

**Data patterns:** Database-per-service (PostgreSQL schemas). **Outbox** relay (Debezium or polling publisher) guarantees at-least-once publish after commit. **Inbox** + business **idempotency keys** on \`POST /payments\` prevent duplicate charges on redelivery.

**Caching:** Redis caches customer profile reads (TTL + stampede lock). Inventory hot-SKU counts use write-through with event invalidation.

**Observability:** OpenTelemetry auto-instrumentation exports traces to OTLP; Micrometer metrics (\`resilience4j.circuitbreaker\`, Kafka lag, pool saturation) scrape to Prometheus. Structured JSON logs include \`correlationId\`, \`traceId\`, \`spanId\`, and \`orderId\` for cross-service grep.

**Security:** mTLS between services in mesh mode; secrets from Vault; no PII in Kafka payloads (IDs only).`,
  services: [
    {name: 'order-service', port: 8081, db: 'orders_db', patterns: ['outbox', 'saga-start', 'idempotency']},
    {name: 'payment-service', port: 8082, db: 'payments_db', patterns: ['inbox', 'idempotency', 'DLQ']},
    {name: 'customer-service', port: 8083, db: 'customers_db', patterns: ['cache-aside', 'read-model']},
    {name: 'inventory-service', port: 8084, db: 'inventory_db', patterns: ['optimistic-lock', 'saga-participant']},
    {name: 'notification-service', port: 8085, db: 'notifications_db', patterns: ['inbox', 'async-consumer']},
    {name: 'api-gateway', port: 8080, patterns: ['auth', 'RL', 'CB', 'retry', 'timeout', 'bulkhead', 'aggregation']},
  ],
  kafkaTopics: [
    'order.events.v1',
    'payment.events.v1',
    'inventory.events.v1',
    'notification.commands.v1',
    'order.events.v1-dlt',
    'payment.events.v1-dlt',
  ],
  runbook: [
    'docker compose up -d postgres redis kafka zookeeper',
    'Start Eureka (optional) or use K8s DNS',
    'Boot each service with spring.profiles.active=local',
    'Gateway: POST /vibhu-tech-blog/api/orders with Authorization: Bearer <token>',
    'Observe saga in Kafka UI; break payment-service to see CB open + DLQ flow',
  ],
};

export const TESTING_STRATEGY = {
  overview: `Test pyramid for microservices: **many fast unit tests**, **focused integration tests** with Testcontainers, **few contract tests** (Pact/WireMock), and **targeted failure/concurrency tests** for money paths. Never rely solely on end-to-end tests — they are slow, flaky, and poor at pinpointing regressions.`,
  layers: [
    {
      name: 'Unit (JUnit 5 + Mockito)',
      scope: 'Pure domain logic, idempotency key validation, saga state transitions, mappers — no Spring context.',
      example: `package com.vibhu.order.domain;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;

import static org.junit.jupiter.api.Assertions.*;

class IdempotencyKeyValidatorTest {

  @ParameterizedTest
  @NullAndEmptySource
  void rejectsBlankKeys(String key) {
    assertThrows(IllegalArgumentException.class, () -> IdempotencyKeyValidator.require(key));
  }

  @Test
  void acceptsUuidV4() {
    assertDoesNotThrow(() -> IdempotencyKeyValidator.require("550e8400-e29b-41d4-a716-446655440000"));
  }
}`,
    },
    {
      name: 'Slice / WebMvcTest',
      scope: 'Controller + security + validation with mocked services.',
      example: `@WebMvcTest(OrderController.class)
@Import(SecurityTestConfig.class)
class OrderControllerTest {

  @Autowired MockMvc mvc;
  @MockBean OrderService orders;

  @Test
  void createOrderReturns201WithIdempotencyKey() throws Exception {
    when(orders.create(any())).thenReturn(new OrderResponse("ord-1", "PENDING"));
    mvc.perform(post("/api/orders")
            .header("Idempotency-Key", "key-abc")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\\"customerId\\":\\"c1\\",\\"sku\\":\\"SKU-1\\",\\"qty\\":2}"))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.orderId").value("ord-1"));
  }
}`,
    },
    {
      name: 'Integration — DB (Testcontainers PostgreSQL)',
      scope: 'Repository + transaction boundaries, outbox insert in same TX, optimistic locking.',
      example: `@DataJpaTest
@Testcontainers
@AutoConfigureTestDatabase(replace = Replace.NONE)
class OutboxRepositoryIT {

  @Container
  static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

  @DynamicPropertySource
  static void props(DynamicPropertyRegistry r) {
    r.add("spring.datasource.url", postgres::getJdbcUrl);
    r.add("spring.datasource.username", postgres::getUsername);
    r.add("spring.datasource.password", postgres::getPassword);
  }

  @Autowired OutboxRepository outbox;
  @Autowired TestEntityManager em;

  @Test
  @Transactional
  void orderAndOutboxCommitTogether() {
    Order order = new Order("ord-99", "PENDING");
    em.persist(order);
    outbox.enqueue("order.events.v1", "ord-99", "{\\"type\\":\\"OrderCreated\\"}");
    em.flush();
    assertEquals(1, outbox.countByPublishedFalse());
  }
}`,
    },
    {
      name: 'Integration — Kafka (Testcontainers)',
      scope: 'Producer/consumer wiring, header propagation, manual ack, DLT routing.',
      example: `@SpringBootTest
@Testcontainers
class PaymentSagaKafkaIT {

  @Container
  static KafkaContainer kafka = new KafkaContainer(DockerImageName.parse("confluentinc/cp-kafka:7.6.0"));

  @DynamicPropertySource
  static void kafkaProps(DynamicPropertyRegistry r) {
    r.add("spring.kafka.bootstrap-servers", kafka::getBootstrapServers);
  }

  @Autowired KafkaTemplate<String, String> template;
  @Autowired ProcessedEventRepository processed;

  @Test
  void duplicateOrderCreatedIsIdempotent() throws Exception {
    String payload = "{\\"orderId\\":\\"o1\\",\\"amountCents\\":1000,\\"correlationId\\":\\"c1\\"}";
    template.send("order.events.v1", "o1", payload);
    template.send("order.events.v1", "o1", payload);
    await().atMost(Duration.ofSeconds(10)).until(() -> processed.count() == 1);
  }
}`,
    },
    {
      name: 'Integration — Redis (Testcontainers)',
      scope: 'Cache TTL, distributed lock lease, rate-limit bucket state.',
      example: `@SpringBootTest
@Testcontainers
class CustomerCacheIT {

  @Container
  static GenericContainer<?> redis = new GenericContainer<>("redis:7-alpine").withExposedPorts(6379);

  @DynamicPropertySource
  static void redisProps(DynamicPropertyRegistry r) {
    r.add("spring.data.redis.host", redis::getHost);
    r.add("spring.data.redis.port", () -> redis.getMappedPort(6379));
  }

  @Autowired CustomerCache cache;

  @Test
  void cacheMissThenHit() {
    cache.put("c1", new CustomerDto("c1", "Ada"));
    assertTrue(cache.get("c1").isPresent());
    assertEquals("Ada", cache.get("c1").orElseThrow().name());
  }
}`,
    },
    {
      name: 'Contract — WireMock (downstream stub)',
      scope: 'Stub Payment/Inventory HTTP APIs; verify gateway aggregation calls correct paths.',
      example: `@SpringBootTest(webEnvironment = RANDOM_PORT)
class GatewayAggregationWireMockIT {

  @RegisterExtension
  static WireMockExtension payment = WireMockExtension.newInstance()
      .options(wireMockConfig().dynamicPort()).build();

  @Autowired TestRestTemplate rest;

  @Test
  void checkoutAggregatesPaymentStatus() {
    payment.stubFor(get(urlEqualTo("/payments/p1/status"))
        .willReturn(okJson("{\\"status\\":\\"CAPTURED\\"}")));
    // point gateway route to payment.baseUrl() via @DynamicPropertySource
    var body = rest.getForObject("/api/checkout/p1", CheckoutView.class);
    assertEquals("CAPTURED", body.paymentStatus());
  }
}`,
    },
    {
      name: 'Failure / resilience tests',
      scope: 'Simulate slow/500 responses; assert CB opens, retries capped, timeout fires.',
      example: `@Test
void circuitBreakerOpensAfterFailures() {
  stubFor(get("/inventory/sku-1").willReturn(status(503)));
  assertThrows(CallNotPermittedException.class, () -> {
    for (int i = 0; i < 10; i++) inventoryClient.getStock("sku-1");
  });
  verify(exactly(5), getRequestedFor(urlEqualTo("/inventory/sku-1"))); // retry cap
}`,
    },
    {
      name: 'Concurrency tests',
      scope: 'Parallel idempotent creates, optimistic lock conflicts, outbox single-publish.',
      example: `@Test
void parallelIdempotentCreatesSingleRow() throws Exception {
  ExecutorService pool = Executors.newFixedThreadPool(8);
  CountDownLatch start = new CountDownLatch(1);
  List<Future<?>> futures = new ArrayList<>();
  for (int i = 0; i < 8; i++) {
    futures.add(pool.submit(() -> {
      start.await();
      return orderApi.create("key-same", sampleRequest());
    }));
  }
  start.countDown();
  Set<String> ids = futures.stream().map(this::unwrap).collect(toSet());
  assertEquals(1, ids.size());
}`,
    },
  ],
  ci: [
    'Unit + slice on every PR (< 2 min)',
    'Testcontainers IT on main + nightly (Docker required)',
    'Contract tests published on provider API change',
    'Chaos/failure suite weekly in staging',
  ],
  antiPatterns: [
    'Only E2E through full docker-compose for every PR',
    'Shared test database without isolation',
    'Sleep-based Kafka assertions instead of Awaitility',
    'Mocking Kafka in integration tests that claim to test messaging',
  ],
};

/** Rows: [pattern, bottleneck@100rps, bottleneck@1k, bottleneck@10k, bottleneck@100k, mitigation] */
export const PERFORMANCE_ROWS: string[][] = [
  ['API Gateway (sync)', 'JWT verify CPU', 'connection pool', 'thread exhaustion', 'TLS + aggregation latency', 'cache JWKS · async auth · limit fan-out'],
  ['Client-side discovery', 'registry poll', 'stale cache', 'thundering herd on refresh', 'metadata payload size', 'long-lived connections · zone-aware'],
  ['Round-robin LB', 'none significant', 'uneven if slow instance', 'keep-alive reuse', 'SYN flood / FD limits', 'health checks · least-conn'],
  ['Consistent hash', 'ring lookup O(log n)', 'hot key on one shard', 'rebalance on churn', 'virtual node memory', 'bounded-load hashing · hot key split'],
  ['Timeout only', 'misconfigured ∞ timeout', 'thread pile-up', 'cascade latency', 'total outage', 'deadline propagation · bulkhead'],
  ['Retry (blind)', 'duplicate safe ops OK', 'retry amplification 3×', 'retry storm 10×+', 'dependency meltdown', 'jitter · CB · idempotency'],
  ['Circuit breaker', 'window too small noise', 'half-open stampede', 'state per instance', 'coordination gap', 'shared health signal · slow half-open'],
  ['Bulkhead', 'pool too small false reject', 'queue depth', 'thread pool tuning', 'many dependencies × pools', 'semaphore limits · adaptive pools'],
  ['Saga choreography', 'Kafka produce latency', 'consumer lag', 'compensation backlog', 'topic partition count', 'partition by orderId · DLQ'],
  ['Saga orchestration', 'orchestrator DB writes', 'single coordinator hotspot', 'state table growth', 'orchestrator SPOF', 'shard orchestrator · event log'],
  ['Outbox relay', 'poll interval delay', 'relay DB contention', 'outbox table bloat', 'relay lag SLO miss', 'Debezium CDC · index published_at'],
  ['Inbox dedupe', 'UNIQUE index insert', 'processed_events size', 'vacuum / partition', 'cross-region dedupe', 'partition by month · TTL archive'],
  ['CQRS read model', 'projection lag OK', 'read replica lag', 'hot read query', 'rebuild time hours', 'snapshot · cache · parallel rebuild'],
  ['Event sourcing', 'append throughput', 'snapshot frequency', 'replay hours', 'storage cost TB+', 'snapshots every N events · archival'],
  ['Redis cache-aside', 'miss latency', 'stampede on expiry', 'hot key single shard', 'cluster cross-slot', 'probabilistic early expiry · local L1'],
  ['Distributed lock', 'Redis RTT', 'lock contention', 'fence token gaps', 'split-brain without Redlock debate', 'short lease · fencing token'],
  ['2PC / XA', 'lock hold time', 'coordinator blocking', 'not viable', 'not viable', 'use saga instead'],
  ['gRPC streaming', 'HTTP/2 stream count', 'flow control stalls', 'LB incompatibility', 'connection pinning', 'proxyless mesh · dedicated LB'],
  ['Service mesh (sidecar)', '+1–3ms p99', 'CPU on data plane', 'memory per pod', 'control plane blast radius', 'eBPF / ambient mesh · selective injection'],
  ['JWT validation', 'crypto per request', 'JWKS fetch', 'no caching at edge', 'key rotation storm', 'local JWKS cache · mTLS internal'],
  ['PostgreSQL per service', 'connection count', 'pool saturation', 'disk IOPS', 'shard planning', 'PgBouncer · read replicas · partitioning'],
  ['Kafka producer', 'batch linger tradeoff', 'partition skew', 'broker disk', 'cross-AZ replication cost', 'idempotent producer · RF tuning'],
  ['Kafka consumer', 'poll loop', 'max.poll.interval', 'rebalance storm', 'consumer group lag', 'static membership · cooperative rebalance'],
  ['Observability (OTel)', 'span export batch', 'sampling required', 'collector bottleneck', 'storage cost', 'tail sampling · RED metrics only'],
  ['Log aggregation', 'JSON serialization', 'log volume GB/day', 'index cost', 'hot partition in ES', 'sample debug · structured fields only'],
];

export const PERF_NOTES = `
## Time complexity
- **Gateway aggregation:** O(n) downstream calls where n = fan-out services. At 100k RPS with 5-way fan-out, downstream sees 500k RPS — budget accordingly.
- **Consistent hash / rendezvous:** O(log v) or O(n) lookup; negligible vs network RTT until millions of backends.
- **Saga compensation:** O(steps) sequential compensations; worst-case 2× normal path latency.

## Space complexity
- **Outbox table:** grows until relay publishes; size ∝ write TPS × relay lag. Index on \`(published, created_at)\`.
- **Inbox / processed_events:** one row per handled event; partition or TTL archive mandatory at 10k+ TPS.
- **Circuit breaker windows:** O(window size) per dependency per instance — bounded ring buffers in Resilience4j.

## Network
- **Chatty services:** 10 internal HTTP hops × 2ms LAN = 20ms minimum before business logic — prefer event-driven or BFF aggregation.
- **Cross-AZ traffic:** billed on cloud; keep saga participants AZ-local when possible; Kafka RF=3 implies cross-broker replication.
- **Payload size:** 50KB JSON × 10k RPS = 500MB/s ingress — compress, field filtering, pagination.

## Database
- **N+1 across services:** not fixable with JOIN — use CQRS read model, GraphQL BFF, or materialized view fed by events.
- **Connection pools:** default Hikari 10 × 50 pods = 500 connections; Postgres max_connections often 100–300 — use PgBouncer.
- **Hot row:** inventory SKU counter — optimistic lock retries explode; use sharded counter or reservation table.

## Threads / memory
- **Tomcat default 200 threads:** at 1k RPS × 100ms latency needs ~100 concurrent threads per instance; scale pods or reduce blocking.
- **Virtual threads (Java 21):** help blocking I/O density but do not fix downstream overload — still need bulkhead + timeout.
- **Heap:** caching large DTO graphs per request — prefer streaming and bounded caches.

## Production checklist @ 10k RPS
1. p99 end-to-end SLO defined per user journey (not per service).
2. Load test with realistic payload sizes and cache cold start.
3. Chaos: kill one AZ, slow payment 5s, Kafka broker bounce.
4. Dashboards: RED per service + saga lag + outbox depth + CB state.
5. Runbooks: DLQ replay, cache flush, feature flag to disable non-critical consumers.
`;
