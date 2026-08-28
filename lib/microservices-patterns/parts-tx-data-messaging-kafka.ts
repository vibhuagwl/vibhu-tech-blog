import type {PatternCard} from './types';

const CORR = 'correlationId propagated via Kafka headers and MDC';

export const TRANSACTION_PATTERNS: PatternCard[] = [
  {
    id: 'saga-choreography',
    part: 6,
    name: 'Saga — Choreography',
    frequency: 'Frequently used',
    definition:
      'Each service listens for domain events and publishes the next step locally — no central coordinator. Failures trigger compensating events published to Kafka.',
    problem:
      'Order creation spans Payment, Inventory, and Shipping with separate databases. A single ACID transaction is impossible; partial success must be undone.',
    realWorld:
      'E-commerce order pipelines (Amazon checkout micro-steps), food delivery (order→payment→kitchen→driver), BNPL approval chains.',
    whyExists:
      'Choreography avoids a central orchestrator bottleneck and keeps each team owning their reaction to events — fits event-driven org structure.',
    ascii: `
OrderSvc          PaymentSvc        InventorySvc       ShippingSvc
   │ publish           │                 │                  │
   │ OrderCreated      │                 │                  │
   ├──────────────────▶│                 │                  │
   │                   │ PaymentReserved │                  │
   │                   ├────────────────▶│                  │
   │                   │                 │ StockReserved    │
   │                   │                 ├─────────────────▶│
   │                   │                 │                  │ ShipmentBooked
   │  (failure)        │ PaymentFailed   │                  │
   │◀──────────────────┤ compensate      │                  │
   │ OrderCancelled    │                 │ StockReleased    │
`,
    flow: 'OrderCreated → PaymentReserved → StockReserved → ShipmentBooked. Any failure publishes compensating event; consumers use correlationId + idempotency keys.',
    components: [
      {name: 'Order Service', responsibility: 'Creates order, listens for PaymentFailed to cancel'},
      {name: 'Payment Service', responsibility: 'Reserves funds on OrderCreated; compensates on StockFailed'},
      {name: 'Inventory Service', responsibility: 'Reserves stock; releases on PaymentFailed'},
      {name: 'Shipping Service', responsibility: 'Books carrier; compensates on downstream failure'},
      {name: 'DLQ Handler', responsibility: 'Routes poison messages after retry exhaustion'},
    ],
    javaCode: `
// Order Service — producer (Java 21)
public record OrderCreatedEvent(String orderId, String customerId, long amountCents, String correlationId) {}

public final class OrderEventProducer {
  private final KafkaTemplate<String, String> kafka;
  public OrderEventProducer(KafkaTemplate<String, String> kafka) { this.kafka = kafka; }

  public void publishOrderCreated(OrderCreatedEvent evt) {
    ProducerRecord<String, String> rec = new ProducerRecord<>("order.events.v1", evt.orderId(),
        Json.write(evt));
    rec.headers().add("correlationId", evt.correlationId().getBytes(StandardCharsets.UTF_8));
    rec.headers().add("eventType", "OrderCreated".getBytes(StandardCharsets.UTF_8));
    kafka.send(rec);
  }
}

// Payment Service — consumer + compensating producer
@Component
public class PaymentOrderListener {
  private final PaymentService payments;
  private final ProcessedEventStore processed;
  private final KafkaTemplate<String, String> kafka;

  @KafkaListener(topics = "order.events.v1", groupId = "payment-saga")
  public void onOrderCreated(ConsumerRecord<String, String> rec, Acknowledgment ack) {
    String correlationId = header(rec, "correlationId");
    OrderCreatedEvent evt = Json.read(rec.value(), OrderCreatedEvent.class);
    if (processed.alreadyHandled("payment", evt.orderId(), "OrderCreated")) {
      ack.acknowledge();
      return;
    }
    try {
      payments.reserve(evt.orderId(), evt.amountCents());
      publish("payment.events.v1", evt.orderId(), new PaymentReservedEvent(evt.orderId(), correlationId));
      processed.mark("payment", evt.orderId(), "OrderCreated");
      ack.acknowledge();
    } catch (TransientPaymentException ex) {
      throw ex; // container retry → retry topic
    } catch (PermanentPaymentException ex) {
      publish("payment.events.v1", evt.orderId(), new PaymentFailedEvent(evt.orderId(), correlationId, ex.getMessage()));
      processed.mark("payment", evt.orderId(), "OrderCreated");
      ack.acknowledge();
    }
  }

  private void publish(String topic, String key, Object evt) {
  ProducerRecord<String, String> rec = new ProducerRecord<>(topic, key, Json.write(evt));
  rec.headers().add("correlationId", evt.correlationId().getBytes(StandardCharsets.UTF_8));
  kafka.send(rec);
  }
}`,
    springCode: `
@Configuration
@EnableKafka
public class SagaKafkaConfig {
  @Bean
  ConcurrentKafkaListenerContainerFactory<String, String> kafkaListenerContainerFactory(
      ConsumerFactory<String, String> cf, DefaultErrorHandler errorHandler) {
    var factory = new ConcurrentKafkaListenerContainerFactory<String, String>();
    factory.setConsumerFactory(cf);
    factory.getContainerProperties().setAckMode(ContainerProperties.AckMode.MANUAL);
    factory.setCommonErrorHandler(errorHandler);
    return factory;
  }

  @Bean
  DefaultErrorHandler sagaErrorHandler(KafkaTemplate<String, String> template) {
    var recoverer = new DeadLetterPublishingRecoverer(template,
        (rec, ex) -> new TopicPartition(rec.topic() + "-dlt", rec.partition()));
    var handler = new DefaultErrorHandler(recoverer, new FixedBackOff(1000L, 3));
    handler.addNotRetryableExceptions(PermanentPaymentException.class);
    return handler;
  }
}`,
    config: `
spring.kafka.producer.acks=all
spring.kafka.producer.properties.enable.idempotence=true
spring.kafka.consumer.enable-auto-commit=false
spring.kafka.consumer.isolation-level=read_committed
spring.kafka.consumer.properties.max.poll.interval.ms=300000`,
    kafkaCode: `
Topics: order.events.v1, payment.events.v1, inventory.events.v1, shipping.events.v1
Each has -retry-1, -retry-2, -dlt suffix topics
Partition key = orderId (ordering per saga instance)
Headers: correlationId, eventType, idempotencyKey`,
    dbCode: `
CREATE TABLE processed_events (
  service_name   VARCHAR(64) NOT NULL,
  aggregate_id   VARCHAR(128) NOT NULL,
  event_type     VARCHAR(128) NOT NULL,
  processed_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (service_name, aggregate_id, event_type)
);`,
    unitTest: `
@Test
void orderCreated_idempotent_skipSecondDelivery() {
  var store = new InMemoryProcessedEventStore();
  var payments = mock(PaymentService.class);
  var kafka = mock(KafkaTemplate.class);
  var listener = new PaymentOrderListener(payments, store, kafka);
  var rec = record("order-1", orderCreatedJson("order-1", "corr-1"));
  listener.onOrderCreated(rec, noopAck());
  listener.onOrderCreated(rec, noopAck());
  verify(payments, times(1)).reserve("order-1", 9900L);
}`,
    integrationTest: `
@SpringBootTest
@Testcontainers
class SagaChoreographyIT {
  @Container static KafkaContainer kafka = new KafkaContainer(DockerImageName.parse("confluentinc/cp-kafka:7.6.0"));
  @Test void fullHappyPath() { /* publish OrderCreated, await ShipmentBooked */ }
}`,
    failureTest: `
@Test void paymentPermanentFailure_publishesPaymentFailed() {
  when(payments.reserve(any(), anyLong())).thenThrow(new PermanentPaymentException("card declined"));
  listener.onOrderCreated(rec, ack);
  verify(kafka).send(argThat(r -> r.topic().equals("payment.events.v1")));
}`,
    concurrencyTest: `
@Test void parallelOrders_differentKeys_noCrossContamination() {
  ExecutorService pool = Executors.newFixedThreadPool(8);
  List<Future<?>> futures = new ArrayList<>();
  for (int i = 0; i < 50; i++) {
    futures.add(pool.submit(() -> listener.onOrderCreated(record("o-" + i, json), ack)));
  }
  for (Future<?> f : futures) f.get(10, TimeUnit.SECONDS);
}`,
    edgeCases: [
      'Duplicate OrderCreated — idempotency table prevents double reserve',
      'Out-of-order events — design compensations to be safe if StockReserved arrives before PaymentReserved',
      'Compensation while forward step in flight — use saga state or version checks',
      'DLQ message missing correlationId — reject replay until header restored',
    ],
    failureScenarios: [
      'Payment reserved but publish PaymentReserved fails — reconciliation job compares DB vs Kafka',
      'Consumer crash after process before ack — at-least-once redelivery',
      'Compensation event lost — timeout saga monitor publishes compensating command',
    ],
    retry: 'Spring DefaultErrorHandler FixedBackOff 1s × 3 → retry topics → DLT. Transient DB/Kafka errors retry; card declined goes to compensation immediately.',
    idempotency: 'processed_events PK (service, aggregateId, eventType). Producer enable.idempotence=true for broker dedup within producer session.',
    timeout: 'max.poll.interval.ms=300000; saga watchdog cron marks stale orders (>15 min) and publishes compensating events.',
    observability: CORR + ' structured logs per step; Grafana dashboard: saga completion rate, stuck count, DLT volume by eventType.',
    security: 'ACL per topic; encrypt amountCents only in PCI zone; never log full PAN.',
    performance: 'One partition per orderId keeps saga messages ordered; async ack after DB commit.',
    scalability: 'Each service scales consumer group independently; bottleneck is usually Payment DB writes.',
    production: 'Nightly reconciliation: orders PAID without shipment after 24h → alert. DLQ replay tool requires correlationId match.',
    mistakes: [
      'No compensating events for Inventory after Payment succeeds',
      'Using sync REST chain instead of events — reintroduces coupling',
      'Global ordering on single partition — kills throughput',
    ],
    antiPatterns: ['Hidden orchestration via REST callbacks', 'Saga without idempotency', 'Infinite compensation loops'],
    alternatives: ['Saga orchestration', 'TCC for payment', '2PC (avoid)'],
    tradeoffs:
      'Pros: no central coordinator, teams own topics. Cons: hard to visualize flow, cyclic dependencies possible, debugging needs correlationId discipline.',
    interviewQs: [
      'How does choreography differ from orchestration?',
      'What triggers compensation in a choreographed saga?',
      'How do you ensure idempotency across services?',
    ],
    trickyQs: [
      'PaymentReserved published but DB commit failed — what happens?',
      'Can choreography handle a step that needs human approval?',
    ],
    seniorFollowUps: [
      'Design observability for a 6-step saga with partial compensations.',
      'How would you migrate choreography to orchestration without downtime?',
    ],
  },
  {
    id: 'saga-orchestration',
    part: 6,
    name: 'Saga — Orchestration',
    frequency: 'Frequently used',
    definition:
      'A dedicated orchestrator maintains saga state and issues commands to participants; tracks timeouts, retries, compensation, and restart recovery.',
    problem:
      'Choreography becomes a spaghetti of implicit dependencies; operations need a single place to inspect saga progress and enforce ordering.',
    realWorld:
      'Camunda/Zeebe workflows, Uber trip lifecycle, airline booking (seat+payment+insurance), enterprise order management with SLA dashboards.',
    whyExists:
      'Central state machine makes failure handling, timeouts, and human tasks explicit — easier for ops and compliance audit.',
    ascii: `
                    ┌──────────────────┐
                    │ Saga Orchestrator │
                    │  state machine    │
                    └────────┬─────────┘
           command           │ event
    ┌──────────┼──────────┬───┴───┬──────────┐
    ▼          ▼          ▼       ▼          ▼
 Payment   Inventory  Shipping  Timeout   Compensation
 Worker    Worker     Worker   Scheduler  Handler
`,
    flow: 'START → RESERVE_PAYMENT → RESERVE_STOCK → BOOK_SHIPMENT → COMPLETE. On failure → COMPENSATE_* states. Orchestrator persists state; restart reloads IN_PROGRESS sagas.',
    components: [
      {name: 'Orchestrator', responsibility: 'State machine, timeout scheduler, command dispatch'},
      {name: 'Participant Workers', responsibility: 'Execute commands, reply with success/failure events'},
      {name: 'Saga Store', responsibility: 'PostgreSQL saga_instances + saga_steps tables'},
      {name: 'Recovery Job', responsibility: 'On restart, resume sagas stuck IN_PROGRESS past timeout'},
    ],
    javaCode: `
public enum SagaState {
  STARTED, PAYMENT_RESERVED, STOCK_RESERVED, SHIPMENT_BOOKED, COMPLETED,
  COMPENSATING_PAYMENT, COMPENSATING_STOCK, FAILED, COMPENSATED
}

@Entity
@Table(name = "saga_instances")
public class SagaInstance {
  @Id String sagaId;
  String orderId;
  @Enumerated(EnumType.STRING) SagaState state;
  int version;
  Instant updatedAt;
  String correlationId;
  int retryCount;
}

@Service
@Transactional
public class SagaOrchestrator {
  private final SagaRepository repo;
  private final CommandPublisher commands;
  private final SagaTimeoutScheduler timeouts;

  public void start(String orderId, String correlationId) {
    var saga = new SagaInstance(UUID.randomUUID().toString(), orderId, SagaState.STARTED, 0,
        Instant.now(), correlationId, 0);
    repo.save(saga);
    commands.send(new ReservePaymentCommand(orderId, saga.getSagaId(), correlationId));
    timeouts.schedule(saga.getSagaId(), Duration.ofMinutes(5));
  }

  public void onPaymentReserved(PaymentReservedEvent evt) {
    SagaInstance saga = repo.findBySagaIdForUpdate(evt.sagaId());
    if (saga.getState() != SagaState.STARTED) return; // idempotent
    saga.setState(SagaState.PAYMENT_RESERVED);
    saga.setVersion(saga.getVersion() + 1);
    repo.save(saga);
    commands.send(new ReserveStockCommand(evt.orderId(), saga.getSagaId(), evt.correlationId()));
    timeouts.reschedule(saga.getSagaId(), Duration.ofMinutes(5));
  }

  public void onStockFailed(StockFailedEvent evt) {
    SagaInstance saga = repo.findBySagaIdForUpdate(evt.sagaId());
    saga.setState(SagaState.COMPENSATING_PAYMENT);
    commands.send(new ReleasePaymentCommand(evt.orderId(), saga.getSagaId(), evt.correlationId()));
  }

  public void onTimeout(String sagaId) {
    SagaInstance saga = repo.findBySagaIdForUpdate(sagaId);
    if (saga.getState() == SagaState.COMPLETED || saga.getState() == SagaState.COMPENSATED) return;
    if (saga.getRetryCount() < 3) {
      saga.setRetryCount(saga.getRetryCount() + 1);
      redispatchCurrentStep(saga);
    } else {
      enterCompensation(saga);
    }
  }

  @EventListener(ApplicationReadyEvent.class)
  public void recoverStuckSagas() {
    repo.findStuck(Instant.now().minus(Duration.ofMinutes(10)))
        .forEach(s -> onTimeout(s.getSagaId()));
  }
}`,
    springCode: `
@KafkaListener(topics = "saga.events.v1", groupId = "orchestrator")
public void onParticipantEvent(ConsumerRecord<String, String> rec, Acknowledgment ack) {
  ParticipantEvent evt = Json.read(rec.value(), ParticipantEvent.class);
  orchestrator.dispatch(evt);
  ack.acknowledge();
}`,
    config: `
saga.timeout.payment=PT5M
saga.timeout.stock=PT3M
saga.max-retries=3
spring.jpa.properties.hibernate.jdbc.lob.non_contextual_creation=true`,
    kafkaCode: `
saga.commands.v1 — orchestrator → workers (key=sagaId)
saga.events.v1 — workers → orchestrator (key=sagaId)
Ordering per sagaId via partition key`,
    dbCode: `
CREATE TABLE saga_instances (
  saga_id        VARCHAR(36) PRIMARY KEY,
  order_id       VARCHAR(128) NOT NULL,
  state          VARCHAR(32) NOT NULL,
  version        INT NOT NULL DEFAULT 0,
  correlation_id VARCHAR(64) NOT NULL,
  retry_count    INT NOT NULL DEFAULT 0,
  updated_at     TIMESTAMPTZ NOT NULL
);
CREATE INDEX idx_saga_stuck ON saga_instances (state, updated_at);`,
    unitTest: `
@Test
void paymentReserved_advancesToStockReserve() {
  var saga = orchestrator.start("ord-1", "corr-1");
  orchestrator.onPaymentReserved(new PaymentReservedEvent("ord-1", saga, "corr-1"));
  assertEquals(SagaState.PAYMENT_RESERVED, repo.findById(saga).get().getState());
  verify(commands).send(any(ReserveStockCommand.class));
}`,
    integrationTest: `@Test void timeoutTriggersRetryThenCompensation() { /* wire Testcontainers Kafka + DB */ }`,
    failureTest: `@Test void compensationFailure_marksFAILED() { /* ReleasePayment throws */ }`,
    concurrencyTest: `@Test void optimisticLock_onConcurrentEvents() { /* two events same saga */ }`,
    edgeCases: [
      'Duplicate PaymentReserved — state check prevents double advance',
      'Orchestrator crash mid-transition — recovery job redispatches',
      'Compensation failure — manual intervention queue',
      'Out-of-order event before state transition — ignored or dead-lettered',
    ],
    failureScenarios: [
      'Orchestrator DB unavailable — sagas stall; alert on stuck count',
      'Command published but orchestrator crashes before state update — reconciliation compares command log',
      'Compensation partial success — saga stays COMPENSATING until all steps ack',
    ],
    retry: 'Per-step retryCount in saga row; exponential backoff via timeout scheduler. Participant commands use Kafka retries separately.',
    idempotency: 'Orchestrator checks expected state before transition; participants use processed_events for commands.',
    timeout: 'Per-state timeouts (payment 5m, stock 3m); global saga TTL 24h → auto-compensate.',
    observability: 'Saga dashboard: state distribution, p95 duration per step, compensation rate. Trace orchestrator → command → event loop.',
    security: 'Orchestrator is admin-tier; RBAC on manual compensation API; audit log every state change.',
    performance: 'Orchestrator is single-writer per sagaId — shard orchestrator by orderId hash if needed.',
    scalability: 'Bottleneck is orchestrator DB; read replicas for dashboards; partition Kafka by sagaId.',
    production: 'Runbook: stuck COMPENSATING → ops API to force COMPENSATED after manual fix. Never delete saga rows — audit.',
    mistakes: [
      'No recovery on ApplicationReadyEvent',
      'Compensation without tracking which steps succeeded',
      'Orchestrator doing participant work inline',
    ],
    antiPatterns: ['God orchestrator with business logic', 'In-memory saga state only', 'Skipping version checks'],
    alternatives: ['Choreography', 'Workflow engine (Camunda)', 'TCC for payment only'],
    tradeoffs:
      'Pros: visible state, explicit timeouts, easier compliance. Cons: orchestrator is critical component, potential bottleneck, team must maintain central service.',
    interviewQs: [
      'How does orchestrator recover after crash?',
      'What happens if compensation fails?',
      'Orchestration vs choreography — when to pick each?',
    ],
    trickyQs: [
      'Event arrives for saga already COMPLETED — handle or DLQ?',
      'How to scale orchestrator past 10k sagas/min?',
    ],
    seniorFollowUps: [
      'Design saga versioning when adding a new mandatory step to live orders.',
      'Compare Camunda external tasks vs custom Kafka orchestrator.',
    ],
  },
  {
    id: 'two-phase-commit',
    part: 6,
    name: 'Two-Phase Commit (2PC)',
    frequency: 'Legacy',
    definition:
      'Coordinator sends PREPARE to all participants; if all vote YES, sends COMMIT; otherwise ROLLBACK. Classic distributed ACID attempt.',
    problem:
      'Business wants atomic commit across two databases (e.g. debit Account A, credit Account B) without manual reconciliation.',
    realWorld:
      'Legacy XA transactions in Java EE app servers, some bank core systems, JDBC XADataSource across two Oracle instances — increasingly replaced.',
    whyExists:
      '2PC was the first formal protocol for distributed atomicity before sagas and event-driven architectures matured.',
    ascii: `
Coordinator                    Participant A          Participant B
     │  PREPARE                      │                      │
     ├──────────────────────────────▶│                      │
     ├─────────────────────────────────────────────────────▶│
     │  YES / NO                     │ YES                  │ YES
     │◀──────────────────────────────┤                      │
     │◀─────────────────────────────────────────────────────┤
     │  COMMIT (if all YES)          │                      │
     ├──────────────────────────────▶│                      │
     ├─────────────────────────────────────────────────────▶│
`,
    flow: 'Phase 1 PREPARE: participants lock rows and vote. Phase 2 COMMIT or ROLLBACK: coordinator decision. In microservices this blocks resources and couples availability.',
    components: [
      {name: 'Transaction Coordinator', responsibility: 'Sends prepare/commit/rollback'},
      {name: 'Participant', responsibility: 'Local transaction + vote'},
      {name: 'Transaction Log', responsibility: 'Coordinator WAL for recovery'},
    ],
    javaCode: `
// Simplified educational 2PC — NOT for production microservices
public interface TwoPhaseParticipant {
  Vote prepare(String txId);
  void commit(String txId);
  void rollback(String txId);
}

public enum Vote { YES, NO }

public final class TwoPhaseCoordinator {
  private final List<TwoPhaseParticipant> participants;
  private final Map<String, Vote> log = new ConcurrentHashMap<>();

  public boolean execute(String txId) {
    List<Vote> votes = participants.stream()
        .map(p -> p.prepare(txId))
        .toList();
    if (votes.stream().allMatch(v -> v == Vote.YES)) {
      participants.forEach(p -> p.commit(txId));
      log.put(txId, Vote.YES);
      return true;
    }
    participants.forEach(p -> p.rollback(txId));
    log.put(txId, Vote.NO);
    return false;
  }
}

// Participant A — JDBC style
public class AccountParticipant implements TwoPhaseParticipant {
  private final DataSource ds;
  private final Map<String, Connection> prepared = new ConcurrentHashMap<>();

  public Vote prepare(String txId) {
    try {
      Connection c = ds.getConnection();
      c.setAutoCommit(false);
      // UPDATE accounts SET balance = balance - 100 WHERE id = 'A' AND balance >= 100
      prepared.put(txId, c);
      return Vote.YES;
    } catch (SQLException e) {
      return Vote.NO;
    }
  }

  public void commit(String txId) {
    Connection c = prepared.remove(txId);
    try { c.commit(); c.close(); } catch (SQLException e) { throw new IllegalStateException(e); }
  }

  public void rollback(String txId) {
    Connection c = prepared.remove(txId);
    try { c.rollback(); c.close(); } catch (SQLException e) { throw new IllegalStateException(e); }
  }
}`,
    springCode: `
// Spring + Atomikos XA (legacy) — avoid in new microservices
@Bean
public DataSource xaDataSource() {
  AtomikosDataSourceBean ds = new AtomikosDataSourceBean();
  ds.setUniqueResourceName("accountDb");
  ds.setXaDataSourceClassName("org.postgresql.xa.PGXADataSource");
  return ds;
}`,
    config: `xa-transaction-timeout=30s — blocks resources during prepare phase`,
    dbCode: `Participants hold row locks from PREPARE until COMMIT/ROLLBACK — blocks concurrent writers.`,
    unitTest: `
@Test void allYes_commits() {
  var coord = new TwoPhaseCoordinator(List.of(yesParticipant(), yesParticipant()));
  assertTrue(coord.execute("tx-1"));
}
@Test void oneNo_rollbacksAll() {
  var coord = new TwoPhaseCoordinator(List.of(yesParticipant(), noParticipant()));
  assertFalse(coord.execute("tx-2"));
}`,
    edgeCases: [
      'Coordinator crash after PREPARE — participants blocked until coordinator recovers',
      'Heuristic rollback — participant unsure of decision',
      'Network partition — split brain on commit decision',
    ],
    failureScenarios: [
      'One participant slow PREPARE — entire transaction waits',
      'Coordinator dies after COMMIT to A but before B — inconsistency until recovery',
    ],
    retry: '2PC has no safe automatic retry — coordinator recovery reads WAL.',
    idempotency: 'Commit/rollback must be idempotent on participant — check txId in local log.',
    timeout: 'Prepare timeout → vote NO → rollback all. Short timeouts (30s) to limit lock hold.',
    observability: 'Track blocked prepared transactions — alert if > 0 for 60s.',
    security: 'Coordinator is trust anchor — compromise means arbitrary commit/rollback.',
    performance: 'Lock hold during prepare kills throughput; not suitable for 1000s TPS microservices.',
    scalability: 'Coordinator and lock contention are hard ceilings — O(participants) round trips.',
    production: 'Modern teams avoid 2PC across services; use saga/outbox. XA only within single vendor appliance.',
    mistakes: [
      '2PC across 5 microservices over HTTP',
      'Long-running business logic inside prepare phase',
      'Ignoring coordinator HA requirements',
    ],
    antiPatterns: ['2PC over Kafka', '2PC between regions', 'Nested 2PC without timeout'],
    alternatives: ['Saga', 'TCC', 'Event sourcing + reconciliation'],
    tradeoffs:
      'Pros: strong atomicity illusion. Cons: blocking, coordinator SPOF, poor partition tolerance (CP over AP). Microservices avoid — prefer eventual consistency with compensation.',
    interviewQs: [
      'Why is 2PC avoided in microservices?',
      'What is the blocking problem in phase 1?',
      'Coordinator failure scenarios?',
    ],
    trickyQs: [
      'Can Kafka transactions replace 2PC across DB and Kafka?',
      'Difference between 2PC and 3PC?',
    ],
    seniorFollowUps: [
      'When is XA still justified in 2026?',
      'Design migration from XA monolith to saga without dual-write window.',
    ],
  },
  {
    id: 'try-confirm-cancel',
    part: 6,
    name: 'Try-Confirm-Cancel (TCC)',
    frequency: 'Occasionally used',
    definition:
      'Three-phase protocol: Try reserves resources, Confirm commits, Cancel releases. Each participant implements three explicit operations.',
    problem:
      'Payment authorization must hold funds (try) then capture (confirm) or release (cancel) without double-charge across Order and Payment services.',
    realWorld:
      'Alipay/WeChat pay two-phase user confirm, hotel booking holds, stock reservation before checkout confirm, BNPL pre-auth flows.',
    whyExists:
      'TCC exposes business-level reserve/commit semantics clearer than generic 2PC locks — better for payment domain language.',
    ascii: `
Client     OrderSvc          PaymentSvc
  │           │                  │
  │ checkout  │                  │
  ├──────────▶│ TryCreateOrder   │
  │           ├─────────────────▶│ TryReservePayment
  │           │                  │ (hold funds)
  │           │◀─────────────────┤ TRY_OK
  │           │ ConfirmOrder     │
  │           ├─────────────────▶│ ConfirmPayment
  │           │                  │ (capture)
  │  OR cancel│ CancelOrder      │
  │           ├─────────────────▶│ CancelPayment
  │           │                  │ (release hold)
`,
    flow: 'Try: create PENDING order + reserve payment. Confirm: mark CONFIRMED + capture. Cancel: mark CANCELLED + release hold. All ops idempotent by business id.',
    components: [
      {name: 'Order Service', responsibility: 'TryCreateOrder, ConfirmOrder, CancelOrder'},
      {name: 'Payment Service', responsibility: 'TryReserve, ConfirmCapture, CancelRelease'},
      {name: 'TCC Coordinator', responsibility: 'Lightweight coordinator or saga orchestrator driving three phases'},
    ],
    javaCode: `
public interface PaymentTccService {
  TryResult tryReserve(String orderId, long amountCents, String correlationId);
  void confirmCapture(String orderId, String correlationId);
  void cancelRelease(String orderId, String correlationId);
}

@Service
@Transactional
public class PaymentTccServiceImpl implements PaymentTccService {
  private final PaymentHoldRepository holds;

  public TryResult tryReserve(String orderId, long amountCents, String correlationId) {
    if (holds.existsByOrderId(orderId)) {
      return TryResult.ALREADY_TRIED;
    }
    String holdId = gateway.createHold(orderId, amountCents);
    holds.save(new PaymentHold(orderId, holdId, HoldStatus.TRIED, correlationId));
    return TryResult.SUCCESS;
  }

  public void confirmCapture(String orderId, String correlationId) {
    PaymentHold hold = holds.findByOrderIdForUpdate(orderId)
        .orElseThrow(() -> new IllegalStateException("no try"));
    if (hold.getStatus() == HoldStatus.CONFIRMED) return;
    gateway.capture(hold.getHoldId());
    hold.setStatus(HoldStatus.CONFIRMED);
  }

  public void cancelRelease(String orderId, String correlationId) {
    PaymentHold hold = holds.findByOrderIdForUpdate(orderId).orElse(null);
    if (hold == null) return;
    if (hold.getStatus() == HoldStatus.CANCELLED) return;
    if (hold.getStatus() == HoldStatus.CONFIRMED) {
      throw new IllegalStateException("cannot cancel confirmed");
    }
    gateway.release(hold.getHoldId());
    hold.setStatus(HoldStatus.CANCELLED);
  }
}

@Service
public class OrderTccCoordinator {
  public void checkout(String orderId, long amount, String correlationId) {
    var orderTry = orderService.tryCreate(orderId, amount, correlationId);
    if (orderTry != TryResult.SUCCESS) return;
    var payTry = paymentTcc.tryReserve(orderId, amount, correlationId);
    if (payTry != TryResult.SUCCESS) {
      orderService.cancelOrder(orderId, correlationId);
      return;
    }
    orderService.confirmOrder(orderId, correlationId);
    paymentTcc.confirmCapture(orderId, correlationId);
  }
}`,
    springCode: `@RestController
@RequestMapping("/orders")
public class CheckoutController {
  @PostMapping("/{id}/checkout")
  public ResponseEntity<Void> checkout(@PathVariable String id, @RequestBody CheckoutRequest req) {
    coordinator.checkout(id, req.amountCents(), req.correlationId());
    return ResponseEntity.accepted().build();
  }
}`,
    dbCode: `
CREATE TABLE payment_holds (
  order_id       VARCHAR(128) PRIMARY KEY,
  hold_id        VARCHAR(128) NOT NULL,
  status         VARCHAR(16) NOT NULL, -- TRIED, CONFIRMED, CANCELLED
  correlation_id VARCHAR(64) NOT NULL,
  amount_cents   BIGINT NOT NULL
);`,
    unitTest: `
@Test void tryThenConfirm_idempotent() {
  tcc.tryReserve("o1", 5000L, "c1");
  tcc.confirmCapture("o1", "c1");
  tcc.confirmCapture("o1", "c1"); // no double capture
  assertEquals(HoldStatus.CONFIRMED, holds.findByOrderId("o1").get().getStatus());
}`,
    integrationTest: `@Test void tryFails_orderCancelled() { /* payment gateway mock decline */ }`,
    failureTest: `@Test void confirmAfterCancel_throws() { /* illegal transition */ }`,
    concurrencyTest: `@Test void parallelTry_sameOrderId_oneWins() { /* DB unique constraint */ }`,
    edgeCases: [
      'Try succeeds, Confirm network timeout — retry confirm is safe',
      'Cancel after partial confirm — must refuse or refund path',
      'Hold expires at gateway before confirm — confirm fails → compensating cancel order',
    ],
    failureScenarios: [
      'Order Try OK, Payment Try fails — order cancel must run',
      'Payment Confirm OK, Order Confirm fails — reconciliation captures or refunds',
    ],
    retry: 'Confirm and Cancel are idempotent — retry freely. Try may return ALREADY_TRIED.',
    idempotency: 'orderId as idempotency key across all three phases; hold row tracks state.',
    timeout: 'Try hold TTL at gateway (typically 7 days auth); coordinator timeout 30s for sync checkout API.',
    observability: 'Metrics: try/confirm/cancel counts, stuck TRIED holds > 1h.',
    security: 'PCI: card data never in Order service — Payment owns gateway tokens.',
    performance: 'Sync checkout path — 3 round trips; async TCC via saga for throughput.',
    scalability: 'Payment gateway rate limits dominate; shard holds table by orderId.',
    production: 'Nightly job: TRIED holds older than 24h → auto cancelRelease.',
    mistakes: [
      'Missing cancel after failed try in another service',
      'Non-idempotent confirm at gateway adapter',
      'Using TCC for read-only operations',
    ],
    antiPatterns: ['TCC without state table', 'Confirm without checking Try status', '2PC underneath TCC'],
    alternatives: ['Saga choreography', 'Payment intent API (Stripe)', 'Outbox + event confirm'],
    tradeoffs:
      'Pros: precise payment semantics, idempotent phases. Cons: every service implements 3 methods, coordinator logic, harder than saga for non-payment steps.',
    interviewQs: [
      'TCC vs 2PC vs Saga?',
      'How is Try different from PREPARE?',
      'Idempotency in Confirm phase?',
    ],
    trickyQs: [
      'Payment confirmed but order DB down — what is the recovery story?',
      'Can TCC work with async messaging only?',
    ],
    seniorFollowUps: [
      'Map Stripe PaymentIntent states to TCC phases.',
      'Design TCC for multi-currency with FX hold.',
    ],
  },
  {
    id: 'compensating-transaction',
    part: 6,
    name: 'Compensating Transaction',
    frequency: 'Frequently used',
    definition:
      'Semantic undo of a completed step in a saga — NOT a database ROLLBACK across services. Each service publishes a compensating action (CancelOrder, RefundPayment) when a later step fails.',
    problem:
      'Payment succeeded but inventory reservation failed — you cannot ROLLBACK Payment\'s committed DB row from Order service. Need business-level undo.',
    realWorld:
      'OrderCreated → PaymentCaptured → Inventory FAILED → publish RefundPayment + CancelOrder events.',
    whyExists:
      'Distributed transactions have no shared transaction manager; compensation is the only safe undo in microservices.',
    ascii: `
Order Service          Payment Service
   │                        │
   │ OrderCreated           │
   ├───────────────────────►│ PaymentCaptured ✓
   │                        │
   │ Inventory FAILED       │
   │◀── PaymentFailed ──────┤ (compensating trigger)
   │                        │
   │ CancelOrder            │ RefundPayment
   │ (local TX)             │ (local TX)
   
NOTE: Saga does NOT rollback remote DB — each service runs its own compensating TX
`,
    flow: 'Forward step commits locally → later failure → compensating event → each service runs idempotent undo in its own DB.',
    components: [
      {name: 'Forward transaction', responsibility: 'Local commit in one service'},
      {name: 'Compensating transaction', responsibility: 'Semantic undo — refund, cancel, release stock'},
      {name: 'Saga log', responsibility: 'Track completed steps for compensation order'},
    ],
    javaCode: `@Service
public class OrderCompensationHandler {
  private final OrderRepository orders;

  @KafkaListener(topics = "payment.events.v1", groupId = "order-saga")
  @Transactional
  public void onPaymentFailed(ConsumerRecord<String, String> rec) {
    PaymentFailedEvent evt = Json.read(rec.value(), PaymentFailedEvent.class);
    Order order = orders.findById(evt.orderId()).orElseThrow();
    if (order.getStatus() == OrderStatus.CANCELLED) return; // idempotent compensate
    order.cancel("Payment failed: " + evt.reason());
    orders.save(order);
    // NO remote ROLLBACK — Payment service handles RefundPayment separately
  }
}`,
    kafkaCode: `PaymentFailed → triggers OrderCancelled + InventoryReleased compensations
Each compensation handler is idempotent`,
    dbCode: `UPDATE orders SET status='CANCELLED' WHERE order_id=? AND status <> 'CANCELLED'`,
    unitTest: `@Test void compensate_idempotent_secondPaymentFailedIgnored() {
  handler.onPaymentFailed(failedEvent("ord-1"));
  handler.onPaymentFailed(failedEvent("ord-1"));
  assertEquals(1, orders.countCancelled("ord-1"));
}`,
    edgeCases: ['Compensating a non-composable step (email sent) — use compensating notification or accept irreversibility'],
    failureScenarios: ['Compensation fails — manual reconciliation queue'],
    retry: 'Retry compensation with idempotency',
    idempotency: 'Compensation MUST be idempotent — PaymentFailed delivered twice',
    timeout: 'Saga timeout job triggers compensation if stuck in PENDING',
    observability: 'Log compensation with correlationId; alert on failed compensation',
    security: 'Only saga consumer can trigger compensation',
    performance: 'Compensation is async — user sees PENDING then FAILED',
    scalability: 'Each service compensates independently',
    production: 'Design compensations BEFORE forward steps in saga design',
    mistakes: ['Expecting XA rollback across HTTP', 'Non-idempotent refund'],
    antiPatterns: ['Distributed 2PC instead of compensation'],
    alternatives: ['Orchestrator drives compensate commands'],
    tradeoffs: 'Pros: works across services. Cons: complex; not all steps reversible.',
    interviewQs: ['Saga compensation vs DB rollback?', 'Payment captured — how compensate?'],
    trickyQs: ['Compensate after email sent — what pattern?'],
    seniorFollowUps: ['Draw choreography compensation flow for checkout'],
  },
];

export const DATA_PATTERNS: PatternCard[] = [
  {
    id: 'database-per-service',
    part: 7,
    name: 'Database per Service',
    frequency: 'Frequently used',
    definition:
      'Each microservice owns its private database schema or instance; no other service reads or writes it directly — only via API or events.',
    problem:
      'Shared tables create hidden coupling: one team’s migration breaks another service’s queries at deploy time.',
    realWorld:
      'Netflix, Uber domain boundaries — Order DB, User DB, Payment DB isolated; Shopify shard per shop patterns at logical level.',
    whyExists:
      'Enables independent deploy, scale, and technology choice per domain; aligns with Conway’s law and team autonomy.',
    ascii: `
┌─────────────┐   API/Event   ┌─────────────┐
│ Order Svc   │◀─────────────▶│ Payment Svc │
│  [Order DB] │               │ [Payment DB]│
└─────────────┘               └─────────────┘
       │ no direct SQL cross-access
`,
    flow: 'Service A writes only A_DB → publishes event → Service B consumes → writes B_DB. Schema changes are local.',
    components: [
      {name: 'Service', responsibility: 'Single writer to its database'},
      {name: 'Private DB', responsibility: 'Schema owned by one team'},
      {name: 'API / Events', responsibility: 'Controlled cross-boundary access'},
    ],
    javaCode: `
// Order service — only touches order_db
@Service
@Transactional("orderTransactionManager")
public class OrderService {
  private final OrderRepository orders;
  private final OrderEventPublisher events;

  public Order create(CreateOrderCommand cmd) {
    Order order = orders.save(new Order(cmd.customerId(), cmd.items(), OrderStatus.PENDING));
    events.publishOrderCreated(order);
    return order;
  }
}

// Payment service — NEVER injects OrderRepository
@Service
public class PaymentService {
  private final PaymentRepository payments;

  public void onOrderCreated(OrderCreatedEvent evt) {
    payments.save(Payment.fromEvent(evt)); // local schema only
  }
}`,
    springCode: `
@Configuration
public class OrderDataConfig {
  @Bean @ConfigurationProperties("spring.datasource.order")
  DataSource orderDataSource() { return DataSourceBuilder.create().build(); }

  @Bean
  LocalContainerEntityManagerFactoryBean orderEntityManager(DataSource orderDataSource) {
    var em = new LocalContainerEntityManagerFactoryBean();
    em.setDataSource(orderDataSource);
    em.setPackagesToScan("com.example.order.domain");
    return em;
  }
}`,
    dbCode: `
-- order_db.orders (owned by Order team)
CREATE TABLE orders (id UUID PRIMARY KEY, customer_id UUID, status VARCHAR(32), created_at TIMESTAMPTZ);
-- payment_db.payments (owned by Payment team) — different connection string`,
    unitTest: `
@Test void orderService_neverCallsPaymentRepo() {
  var svc = new OrderService(orderRepo, eventPublisher);
  svc.create(new CreateOrderCommand("cust-1", List.of()));
  verifyNoInteractions(paymentRepository);
}`,
    integrationTest: `@Test void schemaMigration_orderOnly() { /* Flyway on order_db */ }`,
    edgeCases: [
      'Reporting needs cross-domain data — use CQRS read model or data warehouse ETL',
      'Referential integrity across DBs — use saga + eventual consistency',
      'Duplicate customerId in two DBs — no FK across services',
    ],
    failureScenarios: ['Event lost after DB commit — outbox pattern required'],
    retry: 'Cross-service via messaging retries — not DB cross-writes.',
    idempotency: 'Consumers dedupe by event id when replicating foreign keys locally.',
    timeout: 'API calls between services 2-5s with circuit breaker.',
    observability: 'Per-service DB metrics; no shared connection pool blur.',
    security: 'DB credentials per service; network policy blocks cross-DB ports.',
    performance: 'No cross-joins — aggregate in application or read model.',
    scalability: 'Scale Order DB replicas independently from Payment DB.',
    production: 'Document data ownership matrix; reject PRs that add cross-DB queries.',
    mistakes: ['Reading another service’s table for convenience', 'Shared Flyway on one DB'],
    antiPatterns: ['Shared database antipattern', 'Distributed foreign keys'],
    alternatives: ['Shared DB (legacy)', 'Event sourcing per aggregate'],
    tradeoffs: 'Pros: autonomy, blast radius. Cons: no global queries without extra pipeline, duplicate data.',
    interviewQs: ['How do you query across services?', 'How handle transactions?'],
    trickyQs: ['Customer deleted in User svc but orders exist — design?'],
    seniorFollowUps: ['Split monolith DB to per-service with zero downtime.'],
  },
  {
    id: 'shared-database',
    part: 7,
    name: 'Shared Database (Anti-pattern)',
    frequency: 'Legacy',
    definition:
      'Multiple microservices read and write the same database schema — creates tight coupling disguised as microservices.',
    problem:
      'Team A deploys column rename; Team B’s service crashes. “Microservices” share fate like a monolith with network overhead.',
    realWorld:
      'Early SOA migrations that split apps but kept one Oracle instance; many enterprise “microservices” still on shared PostgreSQL.',
    whyExists:
      'Shortcut during migration from monolith — faster initially than building events and read models.',
    ascii: `
 OrderSvc ──┐
 PaymentSvc ┼──▶ ONE shared PostgreSQL (orders + payments + inventory tables)
 Inventory──┘
     coupling: any migration affects all three
`,
    flow: 'All services connect to same DB → schema conflicts → coordinated releases → defeats independent deploy.',
    components: [
      {name: 'Multiple Services', responsibility: 'Incorrectly share one schema'},
      {name: 'Shared DB', responsibility: 'Single coupling point and migration bottleneck'},
    ],
    javaCode: `
// BAD — Payment service directly updates orders table
@Service
public class BadPaymentService {
  private final JdbcTemplate sharedDb; // same URL as Order service

  public void markOrderPaid(String orderId) {
    sharedDb.update("UPDATE orders SET status = 'PAID' WHERE id = ?", orderId);
    sharedDb.update("INSERT INTO payments (order_id, amount) VALUES (?, ?)", orderId, 100);
  }
}

// GOOD — Payment updates only payments; emits event for Order to react
@Service
public class GoodPaymentService {
  private final PaymentRepository payments;
  private final ApplicationEventPublisher bus;

  public void capture(String orderId, long amount) {
    payments.save(new Payment(orderId, amount, PaymentStatus.CAPTURED));
    bus.publishEvent(new PaymentCapturedEvent(orderId, amount));
  }
}`,
    dbCode: `
-- Anti-pattern: orders table written by order-svc AND payment-svc AND admin scripts
-- Migration deadlock: payment-svc needs index; order-svc needs column type change same week`,
    unitTest: `
@Test void badDesign_twoServicesSameTable() {
  // Demonstrates coupling — both use same JdbcTemplate mock
  badPayment.markOrderPaid("o1");
  verify(sharedDb).update(contains("orders"), eq("o1"));
}`,
    edgeCases: [
      'Read-only sharing still couples schema evolution',
      'Views per service reduce write coupling but not migration risk',
    ],
    failureScenarios: [
      'Long migration lock blocks all services',
      'One service connection leak exhausts max_connections for everyone',
    ],
    retry: 'N/A — fix architecture.',
    idempotency: 'Multiple writers cause lost updates without row versioning.',
    timeout: 'Shared pool contention increases latency for all.',
    observability: 'Cannot attribute slow queries to owning team easily.',
    security: 'Over-broad DB credentials — every service has full schema access.',
    performance: 'Hot table contended by all services.',
    scalability: 'Cannot shard one domain without affecting others.',
    production: 'Refactor path: identify writer per table → assign ownership → API/events → deprecate cross-writes.',
    mistakes: ['Calling it microservices while sharing DB', 'Using DB triggers for cross-domain logic'],
    antiPatterns: ['This pattern itself', 'Shared cache as second shared DB'],
    alternatives: ['Database per service', 'Strangler fig migration'],
    tradeoffs: 'Pros: easy queries, ACID across tables. Cons: coupling, coordinated releases, false microservices.',
    interviewQs: ['Why is shared DB bad?', 'How to migrate away?'],
    trickyQs: ['Is read replica sharing OK?', 'Shared DB with separate schemas?'],
    seniorFollowUps: ['90-table monolith: decomposition order criteria.'],
  },
  {
    id: 'api-composition',
    part: 7,
    name: 'API Composition',
    frequency: 'Frequently used',
    definition:
      'A composer (BFF or API Gateway) calls multiple services and aggregates responses into one client-facing payload.',
    problem:
      'Mobile app needs order + payment status + shipment in one screen — naive client makes 3 sequential calls.',
    realWorld:
      'Netflix UI BFF, Amazon product page aggregating catalog+inventory+reviews, GraphQL gateway at Shopify.',
    whyExists:
      'Reduces client chattiness and hides internal service topology from frontends.',
    ascii: `
 Mobile App
     │
     ▼
 Order BFF (composer)
     ├──GET /orders/{id}──▶ Order Svc
     ├──GET /payments?order=──▶ Payment Svc
     └──GET /shipments?order=──▶ Shipping Svc
     │
     ▼
 aggregated JSON response
`,
    flow: 'Client → BFF → parallel HTTP calls → merge → optional caching → response. Errors: partial degrade or fail fast.',
    components: [
      {name: 'BFF / Composer', responsibility: 'Orchestrates calls, maps DTOs'},
      {name: 'Domain Services', responsibility: 'Return authoritative slices'},
      {name: 'Resilience Layer', responsibility: 'Timeout, CB, bulkhead per downstream'},
    ],
    javaCode: `
@RestController
@RequestMapping("/api/v1/orders")
public class OrderCompositionController {
  private final OrderClient orders;
  private final PaymentClient payments;
  private final ShippingClient shipping;

  @GetMapping("/{id}/detail")
  public OrderDetailView getDetail(@PathVariable String id) {
    CompletableFuture<OrderDto> orderFut = CompletableFuture.supplyAsync(() -> orders.get(id));
    CompletableFuture<PaymentDto> payFut = CompletableFuture.supplyAsync(() -> payments.byOrder(id));
    CompletableFuture<ShipmentDto> shipFut = CompletableFuture.supplyAsync(() -> shipping.byOrder(id));
    try {
      return OrderDetailView.merge(orderFut.get(2, TimeUnit.SECONDS),
          payFut.get(2, TimeUnit.SECONDS), shipFut.get(2, TimeUnit.SECONDS));
    } catch (TimeoutException e) {
      throw new ResponseStatusException(HttpStatus.GATEWAY_TIMEOUT, "downstream slow");
    }
  }
}`,
    springCode: `
@Bean
@LoadBalanced
RestClient.Builder restClientBuilder() { return RestClient.builder(); }

@CircuitBreaker(name = "payment", fallbackMethod = "paymentFallback")
public PaymentDto byOrder(String orderId) {
    return paymentRest.get().uri("/payments?order=" + orderId).retrieve().body(PaymentDto.class);
  }`,
    restApi: `GET /api/v1/orders/{id}/detail → { order, payment, shipment }`,
    unitTest: `
@Test void composition_mergesThreeServices() {
  when(orders.get("o1")).thenReturn(orderDto);
  when(payments.byOrder("o1")).thenReturn(payDto);
  var view = controller.getDetail("o1");
  assertEquals("PAID", view.payment().status());
}`,
    failureTest: `@Test void paymentTimeout_returns504() { /* slow mock */ }`,
    concurrencyTest: `@Test void parallelCalls_underBulkhead() { /* 100 concurrent */ }`,
    edgeCases: [
      'One downstream 404 — return partial with null section vs fail entire',
      'Inconsistent orderId across services — composer validates correlation',
      'Stale cache in one leg — mixed freshness in response',
    ],
    failureScenarios: ['Payment CB open — fallback shows payment unknown'],
    retry: 'Retry only idempotent GETs at composer with max 1 retry.',
    idempotency: 'GET composition is naturally idempotent.',
    timeout: 'Per-leg 2s; total 3s budget.',
    observability: 'Trace spans per downstream; metric composer.partial_response rate.',
    security: 'BFF validates JWT once; passes internal service token to backends.',
    performance: 'Parallel calls + connection pooling; cache hot order headers.',
    scalability: 'BFF scales horizontally; watch thread pool for CompletableFuture.',
    production: 'Circuit breaker dashboards per dependency; degrade UI copy for missing legs.',
    mistakes: ['Composer writes to multiple DBs', 'No timeout on parallel futures'],
    antiPatterns: ['God BFF with business rules', 'Sync chain of 10 services'],
    alternatives: ['CQRS read model', 'GraphQL', 'Client-side composition'],
    tradeoffs: 'Pros: simple, low latency for reads. Cons: coupling at read time, no single ACID view, BFF maintenance.',
    interviewQs: ['BFF vs API Gateway?', 'Partial failure handling?'],
    trickyQs: ['Composer vs CQRS read model for same screen?'],
    seniorFollowUps: ['Design caching strategy with different TTL per leg.'],
  },
  {
    id: 'cqrs',
    part: 7,
    name: 'CQRS (Command Query Responsibility Segregation)',
    frequency: 'Frequently used',
    definition:
      'Separate models for writes (commands) and reads (queries). Commands mutate via handlers; queries hit optimized read projections.',
    problem:
      'Normalized write schema optimized for integrity is terrible for dashboard queries needing denormalized aggregates.',
    realWorld:
      'Bank account write ledger + balance read cache, e-commerce order write + search/read Elasticsearch projection.',
    whyExists:
      'Independent scale and schema for read vs write paths; pairs naturally with event sourcing.',
    ascii: `
Commands ──▶ Command Handler ──▶ Write DB ──▶ Events ──▶ Projection ──▶ Read DB
                                                              │
Queries ─────────────────────────────────────────────────────▶│
`,
    flow: 'CreateOrderCommand → handler validates → write model → publish OrderCreated → projection updates order_summary_view → GetOrderQuery reads view.',
    components: [
      {name: 'Command', responsibility: 'Intent to change state (immutable DTO)'},
      {name: 'Command Handler', responsibility: 'Business rules + write persistence'},
      {name: 'Domain Event', responsibility: 'Notify read side of changes'},
      {name: 'Projection', responsibility: 'Build read-optimized documents'},
      {name: 'Query', responsibility: 'Read handler returns DTO from read store'},
    ],
    javaCode: `
// Command
public record CreateOrderCommand(String customerId, List<LineItem> items, String correlationId) {}

// Handler
@Service
@Transactional
public class CreateOrderHandler implements CommandHandler<CreateOrderCommand, String> {
  private final OrderWriteRepository writeRepo;
  private final ApplicationEventPublisher events;

  public String handle(CreateOrderCommand cmd) {
    OrderAggregate agg = OrderAggregate.create(cmd.customerId(), cmd.items());
    writeRepo.save(agg);
    events.publishEvent(new OrderCreatedEvent(agg.getId(), agg.getCustomerId(), cmd.correlationId()));
    return agg.getId();
  }
}

// Event → Projection
@Component
public class OrderSummaryProjection {
  @EventListener
  @Transactional("readTransactionManager")
  public void on(OrderCreatedEvent evt) {
    readRepo.upsert(new OrderSummaryView(evt.orderId(), evt.customerId(), "PENDING", Instant.now()));
  }
}

// Query
public record GetOrderQuery(String orderId) {}

@Service
public class GetOrderQueryHandler implements QueryHandler<GetOrderQuery, OrderSummaryView> {
  private final OrderReadRepository readRepo;

  public OrderSummaryView handle(GetOrderQuery q) {
    return readRepo.findById(q.orderId()).orElseThrow(() -> new NotFoundException(q.orderId()));
  }
}`,
    springCode: `
@RestController
public class OrderCqrsController {
  @PostMapping("/commands/orders") public String create(@RequestBody CreateOrderCommand cmd) {
    return createHandler.handle(cmd);
  }
  @GetMapping("/queries/orders/{id}") public OrderSummaryView get(@PathVariable String id) {
    return getHandler.handle(new GetOrderQuery(id));
  }
}`,
    dbCode: `
-- Write: orders + order_lines (normalized)
-- Read: order_summary_view (denormalized JSON or flat table)
CREATE TABLE order_summary_view (
  order_id UUID PRIMARY KEY,
  customer_id UUID,
  status VARCHAR(32),
  total_cents BIGINT,
  line_items_json JSONB,
  updated_at TIMESTAMPTZ
);`,
    kafkaCode: `order.events.v1 consumed by projection consumer group order-read-projector`,
    unitTest: `
@Test void commandThenQuery_eventualConsistency() {
  String id = createHandler.handle(new CreateOrderCommand("c1", items, "corr"));
  projection.on(new OrderCreatedEvent(id, "c1", "corr"));
  OrderSummaryView view = getHandler.handle(new GetOrderQuery(id));
  assertEquals("PENDING", view.status());
}`,
    integrationTest: `@Test void kafkaProjection_updatesReadModel() { /* Testcontainers */ }`,
    concurrencyTest: `@Test void concurrentCommands_uniqueIds() { /* parallel creates */ }`,
    edgeCases: [
      'Read your writes — route recent reads to write DB or sync wait',
      'Projection lag — UI shows stale status briefly',
      'Duplicate events — projection must upsert idempotently',
    ],
    failureScenarios: ['Projection consumer down — read model stale; alert lag'],
    retry: 'Projection consumer retries with idempotent upsert.',
    idempotency: 'Projection keyed by aggregate id; events carry eventId.',
    timeout: 'Command handler 5s; query 500ms from read replica.',
    observability: 'projection_lag_seconds metric; separate dashboards write vs read QPS.',
    security: 'Commands require write role; queries may be public read with field filtering.',
    performance: 'Read DB can be Elasticsearch/Redis; write stays PostgreSQL.',
    scalability: 'Scale read replicas and projection consumers independently.',
    production: 'Rebuild projection job from event log if read corruption detected.',
    mistakes: ['Same entity class for command and query', 'No lag monitoring'],
    antiPatterns: ['CQRS on CRUD with one table', 'Sync projection in request thread'],
    alternatives: ['Materialized view in DB', 'API composition'],
    tradeoffs: 'Pros: optimized read/write, scale independently. Cons: complexity, eventual consistency on reads.',
    interviewQs: ['When is CQRS worth it?', 'Eventual consistency UX?'],
    trickyQs: ['Strong consistency read after write without ES?'],
    seniorFollowUps: ['Version projections for schema change.'],
  },
  {
    id: 'event-sourcing',
    part: 7,
    name: 'Event Sourcing',
    frequency: 'Occasionally used',
    definition:
      'Store state changes as immutable events; current state is derived by replaying events. Supports snapshots, versioning, and audit.',
    problem:
      'Need complete audit trail, temporal queries (“balance at T”), and safe replay after bug fix without losing history.',
    realWorld:
      'Bank ledger, Uber trip event log, LMAX Disruptor architecture, some inventory systems at Walmart scale.',
    whyExists:
      'Events are the source of truth — enables replay, debugging, and multiple projections from one stream.',
    ascii: `
Events: [Created, ItemAdded, Paid, Shipped]
         replay ──▶ current OrderAggregate state
Snapshots: checkpoint at version 100 → replay only events 101+
`,
    flow: 'Command → generate events → append to event store → apply to aggregate → optional snapshot every N events → projection consumers.',
    components: [
      {name: 'Event Store', responsibility: 'Append-only log per aggregate'},
      {name: 'Aggregate', responsibility: 'apply(Event) mutates internal state'},
      {name: 'Snapshot Store', responsibility: 'Periodic state freeze for fast replay'},
      {name: 'Upcaster', responsibility: 'Schema evolution on old events'},
    ],
    javaCode: `
public class OrderAggregate {
  private String id;
  private OrderStatus status;
  private int version;
  private final List<DomainEvent> pending = new ArrayList<>();

  public static OrderAggregate create(String customerId) {
    OrderAggregate agg = new OrderAggregate();
    agg.raise(new OrderCreatedEvent(UUID.randomUUID().toString(), customerId));
    return agg;
  }

  public void apply(DomainEvent evt) {
    if (evt instanceof OrderCreatedEvent e) { this.id = e.orderId(); this.status = PENDING; }
    else if (evt instanceof OrderPaidEvent) { this.status = PAID; }
    this.version++;
  }

  public void pay() {
    if (status != PENDING) throw new IllegalStateException("not pending");
    raise(new OrderPaidEvent(id));
  }

  private void raise(DomainEvent evt) {
    apply(evt);
    pending.add(evt);
  }

  public List<DomainEvent> getPendingEvents() { return List.copyOf(pending); }
}

@Service
public class EventStoreService {
  public OrderAggregate load(String orderId) {
    Optional<OrderSnapshot> snap = snapshots.find(orderId);
    List<DomainEvent> events = eventRepo.findAfter(orderId, snap.map(OrderSnapshot::version).orElse(0));
    OrderAggregate agg = snap.map(OrderSnapshot::restore).orElseGet(OrderAggregate::new);
    events.forEach(agg::apply);
    return agg;
  }

  @Transactional
  public void save(OrderAggregate agg) {
    int expected = agg.getVersion() - agg.getPendingEvents().size();
    if (!eventRepo.append(agg.getId(), agg.getPendingEvents(), expected)) {
      throw new OptimisticConcurrencyException();
    }
    if (agg.getVersion() % 50 == 0) snapshots.save(OrderSnapshot.from(agg));
  }
}

// Schema evolution upcaster
public class OrderCreatedV1ToV2Upcaster implements EventUpcaster {
  public DomainEvent upcast(DomainEvent raw) {
    if (raw instanceof OrderCreatedV1 v1) return new OrderCreatedEvent(v1.orderId(), v1.customerId());
    return raw;
  }
}`,
    dbCode: `
CREATE TABLE domain_events (
  aggregate_id VARCHAR(128) NOT NULL,
  version      INT NOT NULL,
  event_type   VARCHAR(128) NOT NULL,
  payload      JSONB NOT NULL,
  event_id     UUID NOT NULL UNIQUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (aggregate_id, version)
);
CREATE TABLE aggregate_snapshots (
  aggregate_id VARCHAR(128) PRIMARY KEY,
  version INT NOT NULL,
  state_json JSONB NOT NULL
);`,
    unitTest: `
@Test void replay_rebuildsState() {
  eventRepo.append("o1", List.of(new OrderCreatedEvent("o1", "c1"), new OrderPaidEvent("o1")), 0);
  OrderAggregate agg = store.load("o1");
  assertEquals(PAID, agg.getStatus());
}
@Test void optimisticConcurrency_duplicateVersion() {
  assertThrows(OptimisticConcurrencyException.class, () -> store.save(conflictingAgg));
}`,
    integrationTest: `@Test void snapshot_reducesReplayCount() { /* 100 events */ }`,
    failureTest: `@Test void duplicateEventId_rejected() { /* unique event_id */ }`,
    concurrencyTest: `@Test void parallelPay_oneWins() { /* optimistic lock */ }`,
    edgeCases: [
      'Duplicate delivery of same eventId — unique constraint skips',
      'Schema evolution — upcast chain on read path',
      'Delete is new event OrderCancelled — never DELETE row',
      'Large aggregate — snapshot + incremental replay',
    ],
    failureScenarios: [
      'Bug in apply() — replay all aggregates after fix',
      'Snapshot corrupt — delete snapshot, full replay from event 0',
    ],
    retry: 'Optimistic concurrency → reload aggregate and retry command.',
    idempotency: 'event_id UUID unique; command idempotency key on business ops.',
    timeout: 'Load+replay budget 200ms with snapshots; full replay job offline.',
    observability: 'event_append_rate, replay_duration, snapshot_coverage ratio.',
    security: 'Encrypt sensitive fields in event payload; immutable audit immutability legal hold.',
    performance: 'Snapshots every 50-100 events; partition event store by aggregate type.',
    scalability: 'Hot aggregate serializes writes — shard by aggregate id.',
    production: 'Never UPDATE domain_events; compaction only via archival policy with legal approval.',
    mistakes: ['Using event sourcing for simple CRUD', 'No upcasting strategy'],
    antiPatterns: ['Mutable event log', 'Snapshot without version check'],
    alternatives: ['Audit table', 'CDC to warehouse', 'CQRS without full ES'],
    tradeoffs: 'Pros: audit, replay, temporal queries. Cons: complexity, storage growth, query needs projections.',
    interviewQs: ['How rebuild state?', 'Snapshots purpose?', 'Schema evolution?'],
    trickyQs: ['GDPR delete in immutable log?'],
    seniorFollowUps: ['Design event compaction with legal retention.'],
  },
  {
    id: 'materialized-view',
    part: 7,
    name: 'Materialized View',
    frequency: 'Frequently used',
    definition:
      'Precomputed query result stored physically — refreshed on schedule, on change (CDC), or incrementally from events.',
    problem:
      'Expensive JOIN across normalized tables runs on every dashboard load — 2s query at 500 QPS collapses DB.',
    realWorld:
      'PostgreSQL MATERIALIZED VIEW for reporting, Redis precomputed leaderboards, Elasticsearch product catalog index.',
    whyExists:
      'Trade storage for read latency — classic space/time for read-heavy aggregates.',
    ascii: `
Write path ──▶ base tables
                    │
         trigger / CDC / projection
                    ▼
            materialized_view (pre-joined, denormalized)
                    │
Read path ──────────┘ fast SELECT
`,
    flow: 'Base tables change → refresh job or incremental updater maintains view → readers query view only.',
    components: [
      {name: 'Base Tables', responsibility: 'Normalized source of truth'},
      {name: 'Refresh Mechanism', responsibility: 'CONCURRENTLY REFRESH or incremental upsert'},
      {name: 'Read API', responsibility: 'Queries view / index only'},
    ],
    javaCode: `
@Service
public class OrderDashboardMaterializer {
  private final JdbcTemplate jdbc;

  @Scheduled(fixedDelay = 30000)
  public void refreshFull() {
    jdbc.execute("REFRESH MATERIALIZED VIEW CONCURRENTLY order_dashboard_mv");
  }

  @EventListener
  public void onOrderChanged(OrderChangedEvent evt) {
  jdbc.update("""
      INSERT INTO order_dashboard_mv (order_id, customer_name, total, status, updated_at)
      SELECT o.id, c.name, o.total_cents, o.status, now()
      FROM orders o JOIN customers c ON c.id = o.customer_id
      WHERE o.id = ?
      ON CONFLICT (order_id) DO UPDATE SET total = EXCLUDED.total, status = EXCLUDED.status, updated_at = now()
      """, evt.orderId());
  }
}

@RestController
public class DashboardController {
  @GetMapping("/dashboard/orders")
  public List<OrderDashboardRow> list() {
    return jdbc.query("SELECT * FROM order_dashboard_mv ORDER BY updated_at DESC LIMIT 100", rowMapper);
  }
}`,
    dbCode: `
CREATE MATERIALIZED VIEW order_dashboard_mv AS
  SELECT o.id AS order_id, c.name AS customer_name, o.total_cents, o.status, o.updated_at
  FROM orders o JOIN customers c ON c.id = o.customer_id;
CREATE UNIQUE INDEX ON order_dashboard_mv (order_id);
-- REFRESH MATERIALIZED VIEW CONCURRENTLY requires unique index`,
    unitTest: `
@Test void incrementalUpsert_updatesRow() {
  materializer.onOrderChanged(new OrderChangedEvent("o1"));
  var rows = controller.list();
  assertTrue(rows.stream().anyMatch(r -> r.orderId().equals("o1")));
}`,
    edgeCases: [
      'Stale view during refresh — CONCURRENTLY allows reads',
      'Full refresh lock on non-concurrent refresh',
      'Incremental drift — periodic full refresh reconciles',
    ],
    failureScenarios: ['Refresh job fails — view stale; alert age of max(updated_at)'],
    retry: 'Scheduled refresh retries with backoff.',
    idempotency: 'Upsert ON CONFLICT for incremental path.',
    timeout: 'Full refresh off-peak; incremental < 100ms.',
    observability: 'mv_refresh_duration, row_count, staleness_seconds.',
    security: 'View may omit PII columns present in base tables.',
    performance: 'Index on filter columns; partition large MVs.',
    scalability: 'Move to dedicated read replica for MV storage.',
    production: 'Document staleness SLA (e.g. 30s) in API response headers.',
    mistakes: ['Querying base tables from dashboard anyway', 'Non-unique index with CONCURRENTLY'],
    antiPatterns: ['Manual copy table without refresh strategy'],
    alternatives: ['CQRS projection', 'ClickHouse OLAP', 'API composition'],
    tradeoffs: 'Pros: fast reads, SQL-native. Cons: staleness, refresh cost, storage duplication.',
    interviewQs: ['MV vs CQRS read model?', 'CONCURRENTLY requirements?'],
    trickyQs: ['Cross-database MV impossible — options?'],
    seniorFollowUps: ['Incremental MV via Debezium vs scheduled.'],
  },
];

export const MESSAGING_PATTERNS: PatternCard[] = [
  {
    id: 'transactional-outbox',
    part: 8,
    name: 'Transactional Outbox',
    frequency: 'Frequently used',
    definition:
      'Business row and outbound message recorded in same DB transaction; relay process publishes to Kafka asynchronously — atomic write without dual-write.',
    problem:
      'Order saved to DB but Kafka publish fails — downstream never ships. Or Kafka OK but DB rolls back — ghost message.',
    realWorld:
      'Stripe internal outbox, Uber dispatch events, most Spring microservices using outbox table + Debezium or polling relay.',
    whyExists:
      'Kafka and PostgreSQL cannot share one XA transaction reliably at scale — outbox makes DB the single commit point.',
    ascii: `
@Transactional
  INSERT orders
  INSERT outbox (same TX)
       │
       ▼
Relay (poll or Debezium CDC) ──▶ Kafka topic
`,
    flow: 'Service TX: domain row + outbox row → commit → relay reads unpublished → publish Kafka → mark published.',
    components: [
      {name: 'Outbox Table', responsibility: 'Stores pending messages in same DB'},
      {name: 'Domain Service', responsibility: 'Writes business + outbox atomically'},
      {name: 'Relay', responsibility: 'Polls or CDC streams outbox to Kafka'},
      {name: 'Kafka', responsibility: 'Downstream delivery'},
    ],
    javaCode: `
@Entity
@Table(name = "outbox_events")
public class OutboxEvent {
  @Id UUID id;
  String aggregateType;
  String aggregateId;
  String eventType;
  String payloadJson;
  Instant createdAt;
  Instant publishedAt;
}

@Service
public class OrderService {
  private final OrderRepository orders;
  private final OutboxRepository outbox;

  @Transactional
  public Order create(CreateOrderCommand cmd) {
    Order order = orders.save(Order.create(cmd));
    outbox.save(new OutboxEvent(
        UUID.randomUUID(), "Order", order.getId(), "OrderCreated",
        Json.write(new OrderCreatedPayload(order.getId(), cmd.customerId())), Instant.now(), null));
    return order;
  }
}

@Component
public class OutboxRelay {
  private final OutboxRepository outbox;
  private final KafkaTemplate<String, String> kafka;

  @Scheduled(fixedDelay = 500)
  @Transactional
  public void relay() {
    List<OutboxEvent> batch = outbox.findUnpublished(PageRequest.of(0, 100));
    for (OutboxEvent evt : batch) {
      kafka.send("order.events.v1", evt.getAggregateId(), evt.getPayloadJson());
      evt.setPublishedAt(Instant.now());
    }
  }
}`,
    springCode: `@EnableScheduling on relay; @Transactional outbox relay marks published in same poll cycle`,
    config: `
spring.kafka.producer.acks=all
outbox.relay.batch-size=100
outbox.relay.poll-ms=500`,
    kafkaCode: `
Topic order.events.v1 — key=aggregateId
Debezium alternative: connector on outbox_events WHERE published_at IS NULL → Kafka Connect`,
    dbCode: `
CREATE TABLE outbox_events (
  id             UUID PRIMARY KEY,
  aggregate_type VARCHAR(64) NOT NULL,
  aggregate_id   VARCHAR(128) NOT NULL,
  event_type     VARCHAR(128) NOT NULL,
  payload_json   JSONB NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at   TIMESTAMPTZ NULL
);
CREATE INDEX idx_outbox_unpublished ON outbox_events (created_at) WHERE published_at IS NULL;`,
    unitTest: `
@Test void createOrder_insertsOutboxSameTransaction() {
  Order order = orderService.create(cmd);
  assertEquals(1, outboxRepo.count());
  assertNotNull(orderRepo.findById(order.getId()));
}`,
    integrationTest: `@Test void relay_publishesToKafka() { /* Testcontainers */ }`,
    failureTest: `@Test void relayCrash_midBatch_republishesSafely() { /* idempotent consumers */ }`,
    edgeCases: [
      'Relay faster than consumers — OK, Kafka buffers',
      'Duplicate relay if crash before publishedAt update — consumers idempotent',
      'Large payload — consider S3 pointer in outbox row',
    ],
    failureScenarios: ['Relay down — outbox grows; alert unpublished count'],
    retry: 'Relay retries next poll; Kafka producer retries transient.',
    idempotency: 'Consumers use event id; relay may republish same payload.',
    timeout: 'Relay batch 100 every 500ms; lag SLA < 5s.',
    observability: 'outbox_unpublished_count, relay_lag_seconds.',
    security: 'Outbox payload encrypted at rest for PII fields.',
    performance: 'Index partial unpublished; Debezium lower latency than poll.',
    scalability: 'Multiple relay instances need SKIP LOCKED or partition by id hash.',
    production: 'Debezium note: exactly-once to Kafka requires careful connector config; consumers still at-least-once.',
    mistakes: ['Publishing Kafka inside @Transactional without outbox', 'No index on unpublished'],
    antiPatterns: ['Dual write DB + Kafka', 'Outbox without relay monitoring'],
    alternatives: ['Change Data Capture only', 'Saga command bus'],
    tradeoffs: 'Pros: reliable emit, simple mental model. Cons: extra table, relay ops, slight latency.',
    interviewQs: ['Why not publish directly in service?', 'Poll vs Debezium?'],
    trickyQs: ['Ordering guarantees with multiple relay instances?'],
    seniorFollowUps: ['Implement SKIP LOCKED relay at 10k events/s.'],
  },
  {
    id: 'inbox-pattern',
    part: 8,
    name: 'Inbox Pattern',
    frequency: 'Frequently used',
    definition:
      'Incoming message recorded in inbox table in same transaction as business processing — dedupes redeliveries and ties Kafka offset to DB state.',
    problem:
      'Consumer processes payment, crashes before commit offset — redelivery double-charges. Or process twice on parallel consumers.',
    realWorld:
      'Payment processors, idempotent order consumers at Klarna/Adyen integrations, inbox table per consumer service.',
    whyExists:
      'Pairs with outbox for exactly-once-ish semantics: inbox dedupe on consume side, outbox on produce side.',
    ascii: `
Kafka message ──▶ Consumer
                    │
         @Transactional
           INSERT inbox (message_id) — dedupe
           UPDATE business state
           COMMIT
         then ack offset
`,
    flow: 'Receive → begin TX → insert inbox if new messageId → process → commit TX → ack Kafka offset.',
    components: [
      {name: 'Inbox Table', responsibility: 'Tracks processed message IDs'},
      {name: 'Consumer', responsibility: 'Business logic inside TX with inbox insert'},
      {name: 'Idempotency Guard', responsibility: 'PK on message_id rejects duplicates'},
    ],
    javaCode: `
@Entity
@Table(name = "inbox_messages")
public class InboxMessage {
  @Id String messageId; // Kafka topic-partition-offset or business id
  String topic;
  int partition;
  long offset;
  Instant processedAt;
}

@Service
public class PaymentInboxConsumer {
  private final InboxRepository inbox;
  private final PaymentRepository payments;

  @KafkaListener(topics = "order.events.v1", groupId = "payment-inbox")
  @Transactional
  public void consume(ConsumerRecord<String, String> rec, Acknowledgment ack) {
    String messageId = rec.topic() + "-" + rec.partition() + "-" + rec.offset();
    if (inbox.existsById(messageId)) {
      ack.acknowledge();
      return;
    }
    OrderCreatedEvent evt = Json.read(rec.value(), OrderCreatedEvent.class);
    payments.save(Payment.from(evt));
    inbox.save(new InboxMessage(messageId, rec.topic(), rec.partition(), rec.offset(), Instant.now()));
    ack.acknowledge();
  }
}`,
    dbCode: `
CREATE TABLE inbox_messages (
  message_id   VARCHAR(256) PRIMARY KEY,
  topic        VARCHAR(128) NOT NULL,
  partition    INT NOT NULL,
  offset       BIGINT NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);`,
    kafkaCode: `Manual ack after inbox+payment commit; enable-auto-commit=false`,
    unitTest: `
@Test void duplicateMessage_skipped() {
  consumer.consume(rec("t0p0o1"), ack);
  consumer.consume(rec("t0p0o1"), ack);
  assertEquals(1, payments.count());
}`,
    integrationTest: `@Test void crashBeforeAck_redeliveryNoDup() { /* */ }`,
    edgeCases: [
      'Business idempotency key vs transport messageId — use both for safety',
      'Inbox growth — archival job for old message_ids',
      'Transactional listener with wrong ack timing',
    ],
    failureScenarios: ['DB commit OK, ack fails — redelivery skipped by inbox'],
    retry: 'Kafka redelivery until inbox insert succeeds.',
    idempotency: 'Inbox PK is the idempotency mechanism.',
    timeout: 'TX timeout must exceed max processing time.',
    observability: 'inbox_insert_rate, duplicate_skip_rate.',
    security: 'messageId does not contain payload secrets.',
    performance: 'Index only PK; batch inbox inserts for batch consumers.',
    scalability: 'Inbox table per service DB — scales with service shards.',
    production: 'Vacuum/archive inbox > 30 days unless audit required.',
    mistakes: ['Ack before DB commit', 'Using only offset without business key'],
    antiPatterns: ['Redis-only dedupe without DB TX'],
    alternatives: ['Idempotent consumer with unique constraint on business key'],
    tradeoffs: 'Pros: strong dedupe with business TX. Cons: inbox storage, TX spans DB+processing time.',
    interviewQs: ['Inbox vs processed_events?', 'Ack order?'],
    trickyQs: ['Kafka EOS vs inbox for external DB?'],
    seniorFollowUps: ['Combine inbox with outbox in one service TX boundary.'],
  },
  {
    id: 'outbox-plus-inbox-e2e',
    part: 8,
    name: 'Outbox + Inbox End-to-End',
    frequency: 'Frequently used',
    definition:
      'Producer uses outbox; consumer uses inbox — together they achieve reliable async integration with deduplicated processing.',
    problem:
      'Need reliable Order→Payment flow without 2PC: neither lost events nor duplicate side effects.',
    realWorld:
      'Inter-service payment triggers, inventory reservation chains, any Kafka-mediated saga step with DB on both ends.',
    whyExists:
      'Outbox solves producer reliability; inbox solves consumer dedupe — combined is the industry standard “practical exactly-once”.',
    ascii: `
Order Svc                    Payment Svc
 [orders]                    [payments]
 [outbox]──Kafka──▶ consumer [inbox]
     relay                      @Transactional process
`,
    flow: 'Order TX(outbox) → relay → Kafka → Payment TX(inbox+payment) → ack. End-to-end at-least-once with idempotent sides.',
    components: [
      {name: 'Producer Outbox', responsibility: 'Atomic with order create'},
      {name: 'Relay', responsibility: 'Kafka publish'},
      {name: 'Consumer Inbox', responsibility: 'Dedupe + payment write'},
    ],
    javaCode: `
// Producer side (Order) — outbox in create()
// Consumer side (Payment) — shown in inbox pattern

@Component
public class E2EIntegrationVerifier {
  public void verifyPipeline(String orderId) {
    assertTrue(outboxRepo.findByAggregateId(orderId).stream().allMatch(e -> e.getPublishedAt() != null));
    assertTrue(inboxRepo.existsByBusinessKey(orderId));
    assertTrue(paymentRepo.findByOrderId(orderId).isPresent());
  }
}`,
    springCode: `Both services: spring.kafka.consumer.enable-auto-commit=false, producer acks=all`,
    kafkaCode: `order.events.v1 single partition key=orderId for ordering per order`,
    dbCode: `Order DB: outbox_events | Payment DB: inbox_messages + payments`,
    unitTest: `
@Test void e2e_happyPath() {
  orderService.create(cmd);
  outboxRelay.relay();
  paymentConsumer.consume(buildRecord(), ack);
  verifier.verifyPipeline(cmd.orderId());
}`,
    integrationTest: `@Test void e2e_relayFailureThenRecovery() { /* */ }`,
    failureTest: `@Test void e2e_duplicateKafkaDelivery_noDoublePayment() { /* */ }`,
    concurrencyTest: `@Test void e2e_parallelOrders_isolated() { /* */ }`,
    edgeCases: [
      'Outbox republish + inbox dedupe — safe',
      'Consumer slow — outbox lag not consumer lag',
      'Schema change — consumer inbox still dedupes old format retries',
    ],
    failureScenarios: [
      'Payment down — outbox backlog grows on Order side',
      'Relay publishes poison — Payment inbox records once then DLQ',
    ],
    retry: 'Full pipeline retries at Kafka layer; inbox prevents duplicate effects.',
    idempotency: 'Outbox event UUID in payload; inbox messageId + business orderId unique.',
    timeout: 'End-to-end SLA = outbox relay lag + consumer processing + projection lag.',
    observability: 'Trace correlationId from outbox payload through Kafka to payment logs.',
    security: 'mTLS Kafka; encrypt payload in outbox JSONB.',
    performance: 'Partition by orderId; horizontal scale payment consumers.',
    scalability: 'Each side scales independently; monitor both outbox and inbox depth.',
    production: 'Dashboard: outbox_unpublished + consumer_lag + inbox_rate triangle.',
    mistakes: ['Only outbox without consumer inbox', 'Shared DB between services'],
    antiPatterns: ['Claim EOS without both sides'],
    alternatives: ['Kafka transactions (limited to Kafka sinks)', 'Saga orchestrator'],
    tradeoffs: 'Pros: production-proven, clear ownership. Cons: two patterns to operate, eventual consistency.',
    interviewQs: ['Draw outbox+inbox flow', 'Is this exactly-once?'],
    trickyQs: ['What if relay publishes twice before publishedAt?'],
    seniorFollowUps: ['SLA math for pipeline lag budgets.'],
  },
  {
    id: 'idempotent-consumer',
    part: 8,
    name: 'Idempotent Consumer',
    frequency: 'Frequently used',
    definition:
      'Consumer ensures duplicate messages produce the same effect once — via DB unique constraint and Redis fast-path dedupe cache.',
    problem:
      'At-least-once Kafka delivery guarantees duplicates on retry, rebalance, or producer retry.',
    realWorld:
      'Every payment and inventory microservice consuming Kafka; Stripe idempotency keys; Amazon SQS visibility timeout redeliveries.',
    whyExists:
      'Exactly-once end-to-end is impractical across DB boundaries — idempotent consumers make at-least-once safe.',
    ascii: `
Message (idempotencyKey=pay-123)
    │
    ├─ Redis SETNX idempotency:pay-123 (fast path)
    │
    └─ DB INSERT payments UNIQUE(idempotency_key)
           duplicate → skip or return existing
`,
    flow: 'Extract idempotencyKey from header → Redis check → DB insert with unique → process → set Redis TTL.',
    components: [
      {name: 'Redis Dedupe Cache', responsibility: 'Hot path duplicate detection'},
      {name: 'DB Unique Constraint', responsibility: 'Authoritative dedupe under Redis failure'},
      {name: 'Consumer Handler', responsibility: 'Business logic only after dedupe pass'},
    ],
    javaCode: `
@Service
public class IdempotentPaymentConsumer {
  private final StringRedisTemplate redis;
  private final PaymentRepository payments;

  @KafkaListener(topics = "payment.commands.v1", groupId = "payment-idempotent")
  @Transactional
  public void consume(ConsumerRecord<String, String> rec, Acknowledgment ack) {
    String key = header(rec, "idempotencyKey");
    String redisKey = "idem:" + key;
    Boolean first = redis.opsForValue().setIfAbsent(redisKey, "1", Duration.ofHours(24));
    if (Boolean.FALSE.equals(first) && payments.existsByIdempotencyKey(key)) {
      ack.acknowledge();
      return;
    }
    try {
      PaymentCommand cmd = Json.read(rec.value(), PaymentCommand.class);
      payments.save(new Payment(cmd.orderId(), cmd.amount(), key));
      ack.acknowledge();
    } catch (DataIntegrityViolationException dup) {
      ack.acknowledge(); // unique constraint — already processed
    }
  }
}`,
    redisCode: `
SET idem:{key} 1 NX EX 86400
-- On Redis failure: fall through to DB unique only (slower but safe)`,
    dbCode: `
CREATE TABLE payments (
  id UUID PRIMARY KEY,
  order_id VARCHAR(128) NOT NULL,
  amount_cents BIGINT NOT NULL,
  idempotency_key VARCHAR(128) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);`,
    kafkaCode: `Header idempotencyKey required; producer sets same key on retries`,
    unitTest: `
@Test void duplicateKey_dbUnique_skips() {
  consumer.consume(recordWithKey("k1"), ack);
  consumer.consume(recordWithKey("k1"), ack);
  assertEquals(1, payments.count());
}`,
    failureTest: `@Test void redisDown_dbStillDedupes() { /* redis throws */ }`,
    concurrencyTest: `@Test void parallelSameKey_oneWins() { /* 10 threads */ }`,
    edgeCases: [
      'Redis SETNX OK but DB fails — Redis key expires, retry may re-attempt OK',
      'Different payload same idempotency key — reject or return first result',
      'TTL shorter than Kafka retention — DB unique still protects',
    ],
    failureScenarios: ['Redis flush — DB unique saves the day'],
    retry: 'Safe to retry any number of times with same idempotency key.',
    idempotency: 'This pattern IS idempotency — dual layer Redis+DB.',
    timeout: 'Redis 5ms; DB insert 20ms budget.',
    observability: 'idempotent_skip_count, redis_miss_rate.',
    security: 'Idempotency keys are client-provided — validate format, rate limit.',
    performance: 'Redis removes hot duplicate load from DB.',
    scalability: 'Redis cluster; shard idempotency keys.',
    production: 'Return 200 with same body on duplicate for HTTP; ack Kafka on duplicate.',
    mistakes: ['Only Redis without DB unique', 'Random idempotency key per retry'],
    antiPatterns: ['Assuming Kafka EOS covers DB'],
    alternatives: ['Inbox pattern', 'Kafka idempotent producer only'],
    tradeoffs: 'Pros: simple, fast. Cons: key TTL management, storage for keys.',
    interviewQs: ['Redis vs DB dedupe?', 'Key generation rules?'],
    trickyQs: ['Process twice with different side effects same key?'],
    seniorFollowUps: ['Idempotency key scope per tenant.'],
  },
];

export const KAFKA_PATTERNS: PatternCard[] = [
  {
    id: 'event-notification',
    part: 9,
    name: 'Event Notification',
    frequency: 'Frequently used',
    definition:
      'Event carries minimal data (IDs and type only); consumers fetch full state via API when needed.',
    problem:
      'Large payloads on every change bloat Kafka and leak stale embedded state when consumers miss intermediate events.',
    realWorld:
      'OrderStatusChanged {orderId, status} → consumer calls GET /orders/{id}; GitHub webhook notification pattern.',
    whyExists:
      'Keeps events small, authoritative read from source service, simpler schema evolution on payload.',
    ascii: `
Producer: OrderStatusChanged { orderId, status }
Consumer: GET /orders/{id} ──▶ Order API ──▶ full order DTO
`,
    flow: 'Publish thin event → consumer receives → callback to origin API → process with fresh state.',
    components: [
      {name: 'Notification Producer', responsibility: 'Publishes id + delta hint'},
      {name: 'Consumer', responsibility: 'Fetches authoritative state'},
      {name: 'Origin API', responsibility: 'Source of truth for read'},
    ],
    javaCode: `
// Producer
public void publishStatusChanged(String orderId, String status) {
  var payload = Json.write(Map.of("orderId", orderId, "status", status, "eventType", "OrderStatusChanged"));
  ProducerRecord<String, String> rec = new ProducerRecord<>("order.notifications.v1", orderId, payload);
  kafka.send(rec);
}

// Consumer
@KafkaListener(topics = "order.notifications.v1", groupId = "shipping-notifier")
public void onNotification(ConsumerRecord<String, String> rec, Acknowledgment ack) {
  var evt = Json.read(rec.value(), NotificationEvent.class);
  OrderDto order = orderApiClient.getOrder(evt.orderId()); // authoritative fetch
  if ("SHIPPED".equals(evt.status())) {
    shippingService.scheduleDelivery(order);
  }
  ack.acknowledge();
}`,
    kafkaCode: `Small JSON < 1KB; key=orderId; headers: eventType`,
    unitTest: `@Test void consumer_fetchesApiOnNotification() { verify(orderApi).getOrder("o1"); }`,
    edgeCases: ['API down during consume — retry or DLQ', 'Stale notification — fetch returns current'],
    failureScenarios: ['Thundering herd on hot order — cache GET responses'],
    retry: 'Consumer retries API with CB; Kafka retries consumer.',
    idempotency: 'Schedule delivery idempotent by orderId.',
    timeout: 'API GET 2s; consumer max.poll.interval respected.',
    observability: 'notification_consume_rate, api_fetch_latency.',
    security: 'Consumer uses service account token for internal API.',
    performance: 'Extra HTTP hop; cache order snapshot briefly.',
    scalability: 'Scale consumers; API must handle fan-out read load.',
    production: 'Prefer notification when payload would exceed 4KB or changes often.',
    mistakes: ['Embedding full order in event anyway', 'No API auth on internal fetch'],
    antiPatterns: ['Chatty notification without cache'],
    alternatives: ['Event-carried state transfer', 'CQRS projection'],
    tradeoffs: 'Pros: small events, fresh reads. Cons: API dependency, latency, coupling at read time.',
    interviewQs: ['Notification vs ECST?', 'API failure handling?'],
    trickyQs: ['Notification storm on bulk update?'],
    seniorFollowUps: ['Cache coherency for notification consumers.'],
  },
  {
    id: 'event-carried-state-transfer',
    part: 9,
    name: 'Event-Carried State Transfer (ECST)',
    frequency: 'Frequently used',
    definition:
      'Event contains all data consumers need — no callback to producer API required.',
    problem:
      'High-throughput consumers cannot afford HTTP per message; need self-contained processing.',
    realWorld:
      'Product catalog updates to search index, user profile sync to edge cache, payment settled events with full settlement details.',
    whyExists:
      'Decouples consumers from producer availability at consume time; enables offline processing.',
    ascii: `
Producer: ProductUpdated { id, name, price, categories[], imageUrl, version }
Consumer: upsert search index directly — no API call
`,
    flow: 'Rich event published → consumer transforms → writes local store/index.',
    components: [
      {name: 'Producer', responsibility: 'Serializes full consumer-needed snapshot'},
      {name: 'Consumer', responsibility: 'Upserts local materialized copy'},
    ],
    javaCode: `
// Producer
public void publishProductUpdated(Product product) {
  var payload = Json.write(new ProductUpdatedEvent(
      product.getId(), product.getName(), product.getPriceCents(),
      product.getCategories(), product.getImageUrl(), product.getVersion()));
  kafka.send(new ProducerRecord<>("catalog.events.v1", product.getId(), payload));
}

// Consumer
@KafkaListener(topics = "catalog.events.v1", groupId = "search-indexer")
public void onProductUpdated(ConsumerRecord<String, String> rec, Acknowledgment ack) {
  ProductUpdatedEvent evt = Json.read(rec.value(), ProductUpdatedEvent.class);
  searchIndex.upsert(ProductDocument.from(evt));
  ack.acknowledge();
}`,
    kafkaCode: `Monitor message size — compress large ECST; Schema Registry for evolution`,
    unitTest: `@Test void ecst_upsertsIndexWithoutApi() { consumer.on(rec); verify(index).upsert(any()); }`,
    edgeCases: ['Stale version in event — consumer compares version field', 'Partial updates vs full snapshot'],
    failureScenarios: ['Large message rejected — max.message.bytes'],
    retry: 'Idempotent upsert by product id.',
    idempotency: 'Upsert by id + version check.',
    timeout: 'Processing bound by max.poll.interval.',
    observability: 'ecst_bytes_histogram, index_upsert_latency.',
    security: 'Do not include secrets in carried state.',
    performance: 'No HTTP — fastest consumer path; larger Kafka bandwidth.',
    scalability: 'Partition by product id; scale index writers.',
    production: 'Schema registry REQUIRED for field additions.',
    mistakes: ['Carrying unnecessary PII', 'No version field'],
    antiPatterns: ['ECST for rapidly mutating giant aggregates'],
    alternatives: ['Event notification', 'CDC'],
    tradeoffs: 'Pros: fast consumers, no runtime coupling. Cons: large messages, stale if schema drifts.',
    interviewQs: ['ECST vs notification?', 'Schema evolution?'],
    trickyQs: ['Delete events in ECST?'],
    seniorFollowUps: ['Compaction topic for ECST key-value.'],
  },
  {
    id: 'pub-sub',
    part: 9,
    name: 'Publish-Subscribe',
    frequency: 'Frequently used',
    definition:
      'Producer publishes to topic; multiple independent consumer groups each receive every message.',
    problem:
      'One order event must trigger shipping, analytics, and email without point-to-point fan-out wiring.',
    realWorld:
      'Kafka topics with N consumer groups; AWS SNS fan-out; any domain event bus pattern.',
    whyExists:
      'Decouples producers from number and type of subscribers; add consumer group without producer change.',
    ascii: `
Producer ──▶ topic orders.v1
                ├── group shipping (all messages)
                ├── group analytics (all messages)
                └── group email (all messages)
`,
    flow: 'Single publish → broker replicates to each consumer group independently.',
    components: [
      {name: 'Publisher', responsibility: 'Fire-and-forget to topic'},
      {name: 'Topic', responsibility: 'Durable log'},
      {name: 'Subscriber Groups', responsibility: 'Each group consumes full stream'},
    ],
    javaCode: `
// Producer
kafka.send(new ProducerRecord<>("orders.v1", orderId, Json.write(event)));

// Subscriber A — Shipping
@KafkaListener(topics = "orders.v1", groupId = "shipping")
public void shipping(ConsumerRecord<String, String> rec, Acknowledgment ack) {
  shippingService.handle(Json.read(rec.value(), OrderEvent.class));
  ack.acknowledge();
}

// Subscriber B — Analytics
@KafkaListener(topics = "orders.v1", groupId = "analytics")
public void analytics(ConsumerRecord<String, String> rec, Acknowledgment ack) {
  analyticsPipeline.record(Json.read(rec.value(), OrderEvent.class));
  ack.acknowledge();
}`,
    kafkaCode: `One topic many groups; groups do not compete with each other`,
    unitTest: `@Test void twoGroups_bothReceive() { /* embed Kafka */ }`,
    edgeCases: ['Slow analytics group does not block shipping — independent lag'],
    failureScenarios: ['One group stuck — others healthy'],
    retry: 'Per-group retry policy.',
    idempotency: 'Per consumer group idempotency store.',
    timeout: 'Independent max.poll per group.',
    observability: 'lag per consumer group metric.',
    security: 'ACL: each group principal read-only on topic.',
    performance: 'Broker serves multiple fetchers — disk bandwidth shared.',
    scalability: 'Add groups without producer change; scale each group consumers.',
    production: 'Document all consumer groups on topic — avoid orphan groups.',
    mistakes: ['Same groupId for different apps — they compete wrongly'],
    antiPatterns: ['Topic per consumer instead of groups'],
    alternatives: ['Direct HTTP fan-out', 'SNS'],
    tradeoffs: 'Pros: flexible subscribers. Cons: no per-subscriber filtering without headers.',
    interviewQs: ['Group vs topic for fan-out?'],
    trickyQs: ['Ordering across groups?'],
    seniorFollowUps: ['Governance for consumer group registration.'],
  },
  {
    id: 'competing-consumers',
    part: 9,
    name: 'Competing Consumers',
    frequency: 'Frequently used',
    definition:
      'Multiple consumer instances in the same group share partitions — each message processed by exactly one instance.',
    problem:
      'Single consumer cannot keep up with partition throughput — need horizontal scale of processing.',
    realWorld:
      '3 payment workers in group payment-processor sharing 12 partitions; K8s HPA on consumer lag.',
    whyExists:
      'Work-queue pattern at scale with Kafka partition assignment.',
    ascii: `
Partition P0 ──▶ Consumer A
Partition P1 ──▶ Consumer B
Partition P2 ──▶ Consumer C
(same group — compete for work)
`,
    flow: 'Rebalance assigns partitions → each consumer polls assigned partitions only.',
    components: [
      {name: 'Consumer Instances', responsibility: 'Same groupId — compete'},
      {name: 'Partitions', responsibility: 'Unit of parallelism'},
    ],
    javaCode: `
// Three instances same group — only configuration differs
@KafkaListener(topics = "payments.v1", groupId = "payment-processor", concurrency = "1")
public void process(ConsumerRecord<String, String> rec, Acknowledgment ack) {
  paymentProcessor.process(Json.read(rec.value(), PaymentEvent.class));
  ack.acknowledge();
}
// Deploy 3 pods with same groupId — Kafka assigns partitions across pods`,
    kafkaCode: `max consumers effective = partition count; extra consumers idle`,
    unitTest: `@Test void twoConsumers_splitPartitions() { /* assign mock */ }`,
    concurrencyTest: `@Test void competingConsumers_parallelPartitions() { /* */ }`,
    edgeCases: ['Rebalance during deploy — duplicate processing window — idempotency required'],
    failureScenarios: ['Consumer slow — its partitions lag while others fine'],
    retry: 'Standard consumer retry.',
    idempotency: 'Required due to rebalance redelivery.',
    timeout: 'max.poll.interval — slow instance kicked, partitions reassigned.',
    observability: 'records-consumed-rate per instance; partition assignment view.',
    security: 'Same ACL for all group members.',
    performance: 'Scale until consumers = partitions or CPU saturated.',
    scalability: 'Increase partitions to scale beyond current partition count.',
    production: 'Never exceed partitions with expecting more throughput.',
    mistakes: ['10 consumers on 3 partitions — 7 idle'],
    antiPatterns: ['Different groupIds expecting load share'],
    alternatives: ['Partitioned queue per shard'],
    tradeoffs: 'Pros: simple scale-out. Cons: rebalance pain, partition count ceiling.',
    interviewQs: ['Max parallelism?', 'Rebalance impact?'],
    trickyQs: ['Hot partition with competing consumers?'],
    seniorFollowUps: ['Static membership group.instance.id.'],
  },
  {
    id: 'consumer-groups',
    part: 9,
    name: 'Consumer Groups',
    frequency: 'Frequently used',
    definition:
      'Logical named set of consumers (group.id) coordinated by broker for partition assignment, offset commits, and rebalancing.',
    problem:
      'Without groups, every consumer would read all messages — no load sharing and offset chaos.',
    realWorld:
      'Every Kafka consumer microservice sets spring.kafka.consumer.group-id; ops dashboards per group lag.',
    whyExists:
      'Kafka’s core scaling and offset isolation mechanism.',
    ascii: `
Coordinator broker
    │
 group.id=orders-processor
    ├── member-1 (P0,P1)
    ├── member-2 (P2,P3)
    └── offsets in __consumer_offsets
`,
    flow: 'JoinGroup → SyncGroup → assign → consume → commit offsets to __consumer_offsets.',
    components: [
      {name: 'Group Coordinator', responsibility: 'Broker managing group'},
      {name: 'Group Members', responsibility: 'Consumers with same group.id'},
      {name: '__consumer_offsets', responsibility: 'Committed offset storage'},
    ],
    javaCode: `
// Producer unchanged
kafka.send(new ProducerRecord<>("orders.v1", key, value));

// Consumer with explicit group metadata
@KafkaListener(topics = "orders.v1", groupId = "orders-processor")
public void listen(ConsumerRecord<String, String> rec, Acknowledgment ack) {
  MDC.put("group", "orders-processor");
  MDC.put("partition", String.valueOf(rec.partition()));
  orderHandler.handle(rec);
  ack.acknowledge();
}`,
    config: `
spring.kafka.consumer.group-id=orders-processor
spring.kafka.consumer.group-instance-id=\${HOSTNAME}  # static membership optional`,
    kafkaCode: `__consumer_offsets compacted topic; generation id fences stale commits`,
    unitTest: `@Test void groupId_setOnConsumerFactory() { assertEquals("orders-processor", factory.getGroupId()); }`,
    edgeCases: ['New group no offset — auto.offset.reset', 'Generation id stale commit rejected'],
    failureScenarios: ['Coordinator move — brief rebalance'],
    retry: 'Offset commit retries built into client.',
    idempotency: 'Per-group processed store.',
    timeout: 'session.timeout.ms vs max.poll.interval.ms pair.',
    observability: 'Burrow/MSK lag exporter per group.',
    security: 'ACL group.id prefix restrictions.',
    performance: 'Fewer groups on topic — less coordinator work.',
    scalability: 'Thousands of groups supported; watch coordinator load.',
    production: 'Naming convention: {service}-{purpose}-{env}.',
    mistakes: ['Random groupId per instance — no load share, offset loss'],
    antiPatterns: ['One consumer per groupId per message'],
    alternatives: ['Assign without group for tools'],
    tradeoffs: 'Pros: built-in scale and offsets. Cons: rebalance, operational complexity.',
    interviewQs: ['__consumer_offsets purpose?', 'Static membership?'],
    trickyQs: ['Commit failed generation mismatch?'],
    seniorFollowUps: ['Consumer group protocol classic vs consumer.'],
  },
  {
    id: 'retry-topic',
    part: 9,
    name: 'Retry Topic',
    frequency: 'Frequently used',
    definition:
      'Failed messages republished to dedicated retry topics with backoff delay before re-attempt or DLT.',
    problem:
      'In-thread retry blocks partition processing and poisons throughput for transient DB blips.',
    realWorld:
      'Spring @RetryableTopic; orders.v1 → orders.v1-retry-1 (30s) → orders.v1-retry-2 (5m) → DLT.',
    whyExists:
      'Non-blocking retry preserves main topic consumption speed; delay via retry topic consumption schedule.',
    ascii: `
main topic ──fail──▶ retry-1 (delay) ──fail──▶ retry-2 ──fail──▶ DLT
`,
    flow: 'Main consumer fails transient → publish to retry-1 with header → retry consumer processes later.',
    components: [
      {name: 'Main Consumer', responsibility: 'Fast fail to retry topic'},
      {name: 'Retry Consumers', responsibility: 'Delayed reprocessing'},
      {name: 'Retry Topic Chain', responsibility: 'Increasing backoff'},
    ],
    javaCode: `
// Producer
kafka.send(new ProducerRecord<>("orders.v1", orderId, payload));

// Main consumer — throws on transient
@RetryableTopic(
    attempts = "4",
    backoff = @Backoff(delay = 1000, multiplier = 2),
    dltStrategy = DltStrategy.FAIL_ON_ERROR,
    include = {TransientException.class})
@KafkaListener(topics = "orders.v1", groupId = "order-processor")
public void process(ConsumerRecord<String, String> rec) {
  if (isTransientFailure()) throw new TransientException("db timeout");
  orderService.process(Json.read(rec.value(), OrderEvent.class));
}

// Retry topic consumer (Spring creates orders.v1-retry-0 etc. automatically)
// Same method handles retry topics via @RetryableTopic`,
    kafkaCode: `Retry topics: orders.v1-retry-0, orders.v1-retry-1, orders.v1-retry-2 — same partition count as main`,
    unitTest: `@Test void transientFailure_routesToRetryTopic() { /* expect publish to retry */ }`,
    failureTest: `@Test void exhaustedRetries_goesToDlt() { /* */ }`,
    deepLabHref: '/kafka-dlq',
    edgeCases: ['Retry storm — cap attempts', 'Same key preserves partition on retry topics'],
    failureScenarios: ['Retry topic consumer down — retry lag grows'],
    retry: 'This pattern IS retry — exponential backoff per topic tier.',
    idempotency: 'Handlers must be idempotent across retry attempts.',
    timeout: 'Backoff delay configured per retry tier.',
    observability: 'retry_topic_lag, attempts header on DLT messages.',
    security: 'Retry topics same ACL as main.',
    performance: 'Main topic unblocked — critical for throughput.',
    scalability: 'Scale retry consumers independently if needed.',
    production: 'Alert on retry-2 lag before DLT flood.',
    mistakes: ['Infinite in-thread retry', 'Retry without idempotency'],
    antiPatterns: ['Single retry topic no delay'],
    alternatives: ['External scheduler', 'Kafka delayed messages (tiered storage)'],
    tradeoffs: 'Pros: non-blocking, visibility per tier. Cons: topic proliferation, ops overhead.',
    interviewQs: ['Retry topic vs in-process?', 'Partition alignment?'],
    trickyQs: ['Ordering after retry delay?'],
    seniorFollowUps: ['Custom retry classifier implementation.'],
  },
  {
    id: 'dlq',
    part: 9,
    name: 'Dead Letter Queue (DLT)',
    frequency: 'Frequently used',
    definition:
      'Terminal topic for messages that cannot be processed after retries — preserved for ops inspection and replay.',
    problem:
      'Poison message blocks partition forever or data loss if silently skipped.',
    realWorld:
      'orders.v1-dlt with original headers + stack trace; PagerDuty on DLT rate spike.',
    whyExists:
      'Kafka has no broker DLQ — application pattern for operational safety.',
    ascii: `
main ──▶ consumer ──fail retries──▶ DLT topic ──▶ ops replay tool
`,
    flow: 'Failure classified permanent or retries exhausted → DeadLetterPublishingRecoverer → DLT → commit source offset.',
    components: [
      {name: 'DLT Producer', responsibility: 'Publish failed record + metadata headers'},
      {name: 'DLT Topic', responsibility: 'Storage for poison/failed messages'},
      {name: 'Replay Tool', responsibility: 'Republish to source with audit'},
    ],
    javaCode: `
// Producer
kafka.send(new ProducerRecord<>("orders.v1", key, value));

// Consumer with DLT recoverer
@Bean
DeadLetterPublishingRecoverer dltRecoverer(KafkaTemplate<String, String> template) {
  return new DeadLetterPublishingRecoverer(template,
      (rec, ex) -> new TopicPartition(rec.topic() + "-dlt", rec.partition()));
}

@Bean
DefaultErrorHandler errorHandler(DeadLetterPublishingRecoverer recoverer) {
  return new DefaultErrorHandler(recoverer, new FixedBackOff(1000L, 3));
}

@KafkaListener(topics = "orders.v1", groupId = "order-processor")
public void listen(ConsumerRecord<String, String> rec) {
  orderService.process(Json.read(rec.value(), OrderEvent.class)); // may throw → DLT
}`,
    kafkaCode: `DLT topic: orders.v1-dlt; headers: X-Original-Topic, X-Exception-Message, correlationId`,
    unitTest: `@Test void permanentError_publishedToDlt() { verify(template).send(argThat(t -> t.endsWith("-dlt"))); }`,
    failureTest: `@Test void dltPublishFails_offsetNotCommitted() { /* */ }`,
    deepLabHref: '/kafka-dlq',
    edgeCases: ['DLT also fails — alert critical', 'DLT retention longer than main'],
    failureScenarios: ['DLT flood from bad deploy — pause consumer, fix, replay'],
    retry: 'No retry from DLT automatically — manual replay job.',
    idempotency: 'Replay must use same idempotency keys.',
    timeout: 'DLT publish in error handler — keep fast.',
    observability: 'dlt_messages_rate, dashboard per original topic.',
    security: 'RBAC on replay API; audit actor.',
    performance: 'DLT off critical path after commit.',
    scalability: 'DLT partitions match source for ordering on replay.',
    production: 'Runbook: never delete DLT without export.',
    mistakes: ['No headers on DLT message', 'Infinite retry before DLT'],
    antiPatterns: ['Skip offset without DLT'],
    alternatives: ['Log and skip (data loss)'],
    tradeoffs: 'Pros: no partition stall, audit trail. Cons: manual replay ops.',
    interviewQs: ['Kafka built-in DLQ?', 'Offset after DLT?'],
    trickyQs: ['Transactional DLT publish?'],
    seniorFollowUps: ['DLT compaction vs delete policy.'],
  },
  {
    id: 'poison-message',
    part: 9,
    name: 'Poison Message',
    frequency: 'Frequently used',
    definition:
      'Message that always fails processing (bad schema, corrupt data) — must be detected and routed to DLT quickly.',
    problem:
      'One bad JSON blocks retry loop consuming 100% CPU and stalling partition for valid messages.',
    realWorld:
      'Null pointer on missing field after schema change; Avro union mismatch; stuck consumer on single offset.',
    whyExists:
      'At scale, poison messages are inevitable — classification prevents retry waste.',
    ascii: `
Message offset 42: invalid payload
  try → fail → retry → fail → classify POISON → DLT immediately (no 10 retries)
`,
    flow: 'Deserialize → validation → on PoisonMessageException skip retry → DLT → commit offset.',
    components: [
      {name: 'Classifier', responsibility: 'Poison vs transient vs unknown'},
      {name: 'Error Handler', responsibility: 'No retry for poison'},
      {name: 'DLT', responsibility: 'Quarantine poison'},
    ],
    javaCode: `
// Producer (accidentally bad payload)
kafka.send(new ProducerRecord<>("orders.v1", "o1", "{invalid json"));

// Consumer
@KafkaListener(topics = "orders.v1", groupId = "order-processor")
public void listen(ConsumerRecord<String, String> rec) {
  OrderEvent evt = Json.read(rec.value(), OrderEvent.class); // JsonParseException
  if (evt.orderId() == null) throw new PoisonMessageException("missing orderId");
  orderService.process(evt);
}

@Bean
DefaultErrorHandler poisonAwareHandler(DeadLetterPublishingRecoverer recoverer) {
  var handler = new DefaultErrorHandler(recoverer, new FixedBackOff(1000L, 3));
  handler.addNotRetryableExceptions(PoisonMessageException.class, JsonParseException.class);
  return handler;
}`,
    kafkaCode: `Header X-Poison-Reason on DLT; metric poison_classified_total`,
    unitTest: `@Test void poisonMessage_noRetry_goesToDlt() { verify(recoverer, times(1)); }`,
    failureTest: `@Test void jsonParseException_notRetryable() { /* */ }`,
    deepLabHref: '/kafka-dlq',
    edgeCases: ['Poison only in prod data — sample in staging', 'Batch poll one poison blocks batch'],
    failureScenarios: ['Classifier wrong — transient sent to DLT'],
    retry: 'Zero retries for poison class.',
    idempotency: 'DLT offset commit advances partition past poison.',
    timeout: 'Fast fail < 10ms for parse errors.',
    observability: 'poison_rate by exception type.',
    security: 'Poison payload may be attack — do not log full body.',
    performance: 'Immediate DLT — restore partition throughput.',
    scalability: 'One poison per partition still blocks until committed — batch isolation helps.',
    production: 'Schema validation at producer prevents most poison.',
    mistakes: ['Retry JsonParseException 100 times'],
    antiPatterns: ['Skip poison without DLT'],
    alternatives: ['Schema Registry strict mode'],
    tradeoffs: 'Pros: partition health. Cons: needs good exception taxonomy.',
    interviewQs: ['Poison vs transient?', 'Detect at producer?'],
    trickyQs: ['Poison in compacted topic?'],
    seniorFollowUps: ['ErrorHandlingDeserializer chain.'],
  },
  {
    id: 'replay',
    part: 9,
    name: 'Replay',
    frequency: 'Occasionally used',
    definition:
      'Re-consume historical messages from a topic or DLT — for bug fix reprocessing, new consumer bootstrap, or disaster recovery.',
    problem:
      'Bug fixed in consumer v2 — need reprocess last 24h without republishing from source systems.',
    realWorld:
      'Replay DLT after fix; new search indexer reads topic from beginning; offset reset for new group.',
    whyExists:
      'Kafka retention enables time-travel reprocessing — core advantage over transient queues.',
    ascii: `
seekToBeginning OR new group auto.offset.reset=earliest
       OR DLT replay producer ──▶ source topic
`,
    flow: 'Ops triggers replay job → consumer seeks offset / new group / DLT republish → idempotent handlers.',
    components: [
      {name: 'Replay Job', responsibility: 'Controlled republish or seek'},
      {name: 'Idempotent Consumer', responsibility: 'Safe duplicate processing'},
      {name: 'Audit Log', responsibility: 'Who replayed what range'},
    ],
    javaCode: `
// Producer — republish from DLT to source
public void replayFromDlt(ConsumerRecord<String, String> dltRec) {
  String targetTopic = header(dltRec, "X-Original-Topic");
  ProducerRecord<String, String> republish = new ProducerRecord<>(targetTopic, dltRec.key(), dltRec.value());
  copyHeaders(dltRec, republish);
  republish.headers().add("X-Replay", "true".getBytes(StandardCharsets.UTF_8));
  kafka.send(republish);
}

// Consumer — assign without group for tool replay
public void replayRange(String topic, int partition, long startOffset, long endOffset) {
  try (KafkaConsumer<String, String> consumer = new KafkaConsumer<>(props)) {
    consumer.assign(List.of(new TopicPartition(topic, partition)));
    consumer.seek(new TopicPartition(topic, partition), startOffset);
    while (true) {
      var records = consumer.poll(Duration.ofSeconds(1));
      for (var rec : records) {
        if (rec.offset() > endOffset) return;
        handler.process(rec); // must be idempotent
      }
    }
  }
}`,
    kafkaCode: `retention.ms must cover replay window; compacted topics replay by key timeline`,
    unitTest: `@Test void replay_idempotentHandler_noDupEffect() { replay.twice(); assertEquals(1, db.count()); }`,
    integrationTest: `@Test void dltReplayToSource() { /* */ }`,
    edgeCases: ['Replay during live traffic — idempotency critical', 'Compacted topic replay gaps'],
    failureScenarios: ['Replay storm overloads downstream'],
    retry: 'Replay job batches with throttle.',
    idempotency: 'MANDATORY for any replay scenario.',
    timeout: 'Rate limit replay producer.',
    observability: 'replay_job_progress, audit actor in logs.',
    security: 'Replay API admin-only; dual approval in prod.',
    performance: 'Throttle RPS during replay.',
    scalability: 'Parallel replay by partition.',
    production: 'Never auto-replay without idempotency verification.',
    mistakes: ['Replay without throttle', 'Non-idempotent side effects'],
    antiPatterns: ['Reset production group offset casually'],
    alternatives: ['Batch re-export from warehouse'],
    tradeoffs: 'Pros: powerful recovery. Cons: ops risk, duplicate load.',
    interviewQs: ['Replay vs new consumer group?', 'DLT replay steps?'],
    trickyQs: ['Replay with schema v2 on v1 data?'],
    seniorFollowUps: ['Replay governance workflow.'],
  },
  {
    id: 'kafka-idempotent-consumer',
    part: 9,
    name: 'Kafka Idempotent Consumer (Business)',
    frequency: 'Frequently used',
    definition:
      'Consumer-side dedupe using processed_events store — distinct from broker idempotent producer.',
    problem:
      'enable.idempotence on producer does not prevent consumer duplicate processing after rebalance.',
    realWorld:
      'Every production Kafka consumer with DB side effects; pairs with inbox/idempotency key patterns.',
    whyExists:
      'Business exactly-once requires application-level idempotency regardless of broker features.',
    ascii: `
Consumer receives msg
  → check processed_events(messageId)
  → if exists: ack skip
  → else: process + insert processed_events + ack
`,
    flow: 'Dedupe check → process → record → ack.',
    components: [
      {name: 'Processed Store', responsibility: 'DB or Redis dedupe'},
      {name: 'Consumer', responsibility: 'Guarded processing'},
    ],
    javaCode: `
// Producer
ProducerRecord<String, String> rec = new ProducerRecord<>("events.v1", key, value);
rec.headers().add("messageId", messageId.getBytes(StandardCharsets.UTF_8));
kafka.send(rec);

// Consumer
@KafkaListener(topics = "events.v1", groupId = "idempotent-workers")
@Transactional
public void consume(ConsumerRecord<String, String> rec, Acknowledgment ack) {
  String messageId = header(rec, "messageId");
  if (processed.exists(messageId)) {
    ack.acknowledge();
    return;
  }
  handler.apply(rec);
  processed.save(messageId);
  ack.acknowledge();
}`,
    dbCode: `CREATE TABLE processed_events (message_id VARCHAR(256) PRIMARY KEY, processed_at TIMESTAMPTZ);`,
    redisCode: `SET processed:{messageId} 1 NX EX 604800 — cache layer optional`,
    unitTest: `@Test void duplicateMessageId_skipped() { consume twice; verify(handler, once()); }`,
    concurrencyTest: `@Test void parallelDedupe_uniqueConstraint() { /* */ }`,
    edgeCases: ['messageId vs offset-based id', 'TTL vs retention alignment'],
    failureScenarios: ['Processed saved but ack fails — safe skip on redelivery'],
    retry: 'Fully retry-safe.',
    idempotency: 'Core of pattern.',
    timeout: 'TX includes dedupe insert.',
    observability: 'duplicate_skip_rate.',
    security: 'messageId UUID — not guessable.',
    performance: 'Redis hot path + DB authoritative.',
    scalability: 'Shard processed table by hash.',
    production: 'Archive processed_events > 7d if offset committed.',
    mistakes: ['Confusing with producer idempotence'],
    antiPatterns: ['Trust EOS for external DB'],
    alternatives: ['Inbox pattern'],
    tradeoffs: 'Pros: reliable. Cons: storage, must design keys.',
    interviewQs: ['Producer vs consumer idempotency?'],
    trickyQs: ['Kafka transactions + DB?'],
    seniorFollowUps: ['EOS read-process-write Kafka only.'],
  },
  {
    id: 'ordering',
    part: 9,
    name: 'Ordering Guarantees',
    frequency: 'Frequently used',
    definition:
      'Kafka guarantees order within a partition only — same key → same partition → ordered delivery per key.',
    problem:
      'Payment events for order-1 must process PAYMENT_RESERVED before PAYMENT_CAPTURED — cross-partition breaks this.',
    realWorld:
      'All order lifecycle events keyed by orderId; bank account events keyed by accountId.',
    whyExists:
      'Global ordering is too expensive — partition-scoped order is the scalability sweet spot.',
    ascii: `
Key order-1 → Partition 2 → [e1, e2, e3] ordered
Key order-2 → Partition 5 → [e1, e2] ordered
Cross-key: no global order
`,
    flow: 'Producer sets key=orderId → partitioner maps to partition → single consumer per partition processes in offset order.',
    components: [
      {name: 'Key', responsibility: 'Routing + ordering scope'},
      {name: 'Partition', responsibility: 'Ordered log slice'},
      {name: 'Single Consumer per Partition', responsibility: 'Serial processing in group'},
    ],
    javaCode: `
// Producer — key ensures order per orderId
String orderId = "order-123";
kafka.send(new ProducerRecord<>("order.events.v1", orderId, Json.write(reservedEvent)));
kafka.send(new ProducerRecord<>("order.events.v1", orderId, Json.write(capturedEvent)));

// Consumer — single thread per partition preserves order
@KafkaListener(topics = "order.events.v1", groupId = "order-saga", concurrency = "3")
public void onEvent(ConsumerRecord<String, String> rec, Acknowledgment ack) {
  // records from same partition processed serially per consumer thread
  saga.apply(rec.key(), Json.read(rec.value(), OrderEvent.class));
  ack.acknowledge();
}`,
    kafkaCode: `partitioner: murmur2(key) % numPartitions; sticky partitioner for null keys batches`,
    unitTest: `@Test void sameKey_samePartition() { assertEquals(part(k1), part(k1)); }`,
    edgeCases: ['Key change — ordering scope changes', 'Compaction reorders visible history by key'],
    failureScenarios: ['Increase partitions — old keys may remap — in-flight sagas risk'],
    retry: 'Retry topics must use same key → same partition index.',
    idempotency: 'Out-of-order retry can arrive — version checks.',
    timeout: 'Slow message blocks partition order queue.',
    observability: 'per-partition consume latency variance.',
    security: 'N/A',
    performance: 'Hot key → one partition bottleneck.',
    scalability: 'More partitions + key spread; cannot scale hot key.',
    production: 'Never key=all for ordering needs.',
    mistakes: ['Null key expecting order', 'concurrency > partitions expecting global order'],
    antiPatterns: ['Cross-partition saga without orchestrator'],
    alternatives: ['Sequence number in payload + buffer'],
    tradeoffs: 'Pros: simple ordering scope. Cons: hot keys, partition count changes.',
    interviewQs: ['Global order in Kafka?', 'Key choice?'],
    trickyQs: ['Ordering with retry topics?'],
    seniorFollowUps: ['Partition expansion migration.'],
  },
  {
    id: 'partitioning',
    part: 9,
    name: 'Partitioning Strategy',
    frequency: 'Frequently used',
    definition:
      'Choosing partition count and key strategy to balance throughput, ordering, and consumer parallelism.',
    problem:
      '12 partitions limit to 12 consumers; wrong keys create hot partitions at 80% skew.',
    realWorld:
      'Payment topic 48 partitions keyed by merchantId; telemetry keyed by deviceId with salt for hot devices.',
    whyExists:
      'Partitions are the unit of parallelism and retention — foundational capacity planning.',
    ascii: `
partition count N
parallelism ≤ N per consumer group
key → hash → partition in [0, N-1]
`,
    flow: 'Capacity plan RPS → choose N ≥ peak consumer count → choose key for ordering scope → monitor skew.',
    components: [
      {name: 'Partition Count', responsibility: 'Throughput ceiling'},
      {name: 'Key Strategy', responsibility: 'Load distribution + ordering'},
      {name: 'Monitor', responsibility: 'Bytes in per partition'},
    ],
    javaCode: `
// Producer — explicit partition for testing only; normally use key
String merchantId = "m-99";
kafka.send(new ProducerRecord<>("payments.v1", null, merchantId, payload));

// Custom partitioner for salted hot keys (advanced)
public class SaltedPartitioner implements Partitioner {
  public int partition(String topic, Object key, byte[] keyBytes, Object value, byte[] valueBytes, Cluster cluster) {
    String salted = key + ":" + (hash(key) % 4); // split hot merchant across 4 sub-streams
    return Utils.toPositive(Utils.murmur2(salted.getBytes())) % cluster.partitionCountForTopic(topic);
  }
}

// Consumer — scale to partition count
@KafkaListener(topics = "payments.v1", groupId = "payment-processor", concurrency = "12")`,
    kafkaCode: `num.partitions broker default; increase only with planning — cannot decrease`,
    unitTest: `@Test void partitionCount_matchesConcurrencyPlan() { assertEquals(12, cluster.partitionCount("payments.v1")); }`,
    edgeCases: ['Add partitions — only new keys benefit', 'Compacted topic partition skew'],
    failureScenarios: ['Hot partition disk full'],
    retry: 'N/A',
    idempotency: 'N/A',
    timeout: 'N/A',
    observability: 'kafka.server:type=BrokerTopicMetrics,name=BytesInPerSec,topic=*,partition=*',
    security: 'N/A',
    performance: 'Target < 20% skew between partitions.',
    scalability: 'Plan 2x headroom on partition count at launch.',
    production: 'Runbook: partition increase is one-way.',
    mistakes: ['1 partition for high throughput topic', 'merchantId hot key no salt'],
    antiPatterns: ['Random key when order matters'],
    alternatives: ['Multiple topics sharded'],
    tradeoffs: 'Pros: tunable scale. Cons: cannot shrink, hot keys, rebalance on change.',
    interviewQs: ['Choose partition count?', 'Hot key fix?'],
    trickyQs: ['Partition vs topic for tenancy?'],
    seniorFollowUps: ['Auto-partitioning products comparison.'],
  },
  {
    id: 'consumer-lag',
    part: 9,
    name: 'Consumer Lag',
    frequency: 'Frequently used',
    definition:
      'Difference between log end offset and consumer committed/position offset — measures how far behind processing is.',
    problem:
      'Lag growing 10k/min means consumers cannot keep up — SLA breach before backlog clears.',
    realWorld:
      'Datadog lag alert > 5000 for 5m; K8s HPA on kafka.consumer.lag metric; on-call runbooks.',
    whyExists:
      'Primary health signal for async pipelines — like queue depth in traditional messaging.',
    ascii: `
LEO (end offset) = 10000
Committed offset   = 8500
Lag                = 1500 messages
`,
    flow: 'Monitor lag per partition per group → alert thresholds → scale consumers or fix slow handler.',
    components: [
      {name: 'Lag Metric', responsibility: 'end - committed per partition'},
      {name: 'Alerting', responsibility: 'Threshold and rate of change'},
      {name: 'Remediation', responsibility: 'Scale, optimize, or replay'},
    ],
    javaCode: `
// Producer — steady load
ScheduledExecutorService.scheduleAtFixedRate(() ->
    kafka.send(new ProducerRecord<>("metrics.v1", UUID.randomUUID().toString(), payload)), 0, 1, TimeUnit.SECONDS);

// Consumer — intentionally track processing time
@KafkaListener(topics = "metrics.v1", groupId = "metrics-processor")
public void process(ConsumerRecord<String, String> rec, Acknowledgment ack) {
  long start = System.nanoTime();
  metricsProcessor.handle(rec);
  long elapsedMs = (System.nanoTime() - start) / 1_000_000;
  lagMonitor.recordProcessingTime(rec.partition(), elapsedMs);
  ack.acknowledge();
}

// Lag inspection via AdminClient / kafka-consumer-groups.sh
public Map<TopicPartition, Long> computeLag(String groupId) {
  // endOffsets(partition) - committedOffsets(group, partition)
}`,
    kafkaCode: `kafka.consumer:type=consumer-fetch-manager-metrics,attribute=records-lag-max,client-id=*`,
    unitTest: `@Test void lagFormula_endMinusCommitted() { assertEquals(1500L, lag(10000, 8500)); }`,
    edgeCases: ['Lag 0 but slow — check processing time', 'New group lag = entire retention'],
    failureScenarios: ['False lag spike during rebalance'],
    retry: 'N/A',
    idempotency: 'N/A',
    timeout: 'Alert on lag AND max processing time.',
    observability: 'Core metric — lag max, lag sum, consume rate, produce rate.',
    security: 'N/A',
    performance: 'High lag → risk of retention loss if lag > retention.',
    scalability: 'Scale consumers until lag stable at peak.',
    production: 'SLO: lag < 1000 at peak; page if lag growth rate positive 10m.',
    mistakes: ['Only monitoring CPU not lag', 'Ignoring single hot partition lag'],
    antiPatterns: ['Infinite retention to ignore lag'],
    alternatives: ['Kinesis shard iterator age'],
    tradeoffs: 'Pros: actionable signal. Cons: rebalance noise, per-partition variance.',
    interviewQs: ['Lag vs processing time?', 'Lag exceeds retention?'],
    trickyQs: ['Lag during static membership?'],
    seniorFollowUps: ['HPA custom metrics on lag.'],
  },
  {
    id: 'kafka-backpressure',
    part: 9,
    name: 'Kafka Backpressure',
    frequency: 'Occasionally used',
    definition:
      'Slow consumers signal upstream to reduce publish rate or buffer — prevent unbounded memory growth and consumer crash loops.',
    problem:
      'Settlement consumer processes 100ms/msg but producer sends 10k/s — lag grows until OOM or max.poll.interval exceeded.',
    realWorld:
      'Pause consumption, scale consumers, reduce max.poll.records; reactive producer rate limit when lag alert fires.',
    whyExists:
      'Async systems need flow control — faster producer + slower consumer = unbounded queue (Kafka retention is not infinite buffer).',
    ascii: `
Producer (fast) ──► Kafka topic (buffer)
                         │
Consumer (slow) ◄────────┘
     │
     ├── lag grows → alert → scale consumers OR pause non-critical producers
     └── max.poll.interval exceeded → rebalance storm (worse)
`,
    flow: 'Monitor lag → threshold exceeded → scale consumer group OR throttle producer OR increase partitions → stabilize lag.',
    components: [
      {name: 'Lag monitor', responsibility: 'Alert on positive lag derivative'},
      {name: 'Consumer tuning', responsibility: 'max.poll.records, concurrency'},
      {name: 'Producer throttle', responsibility: 'Optional rate limit on non-critical topics'},
    ],
    javaCode: `// Reduce batch size when handler is slow
spring.kafka.consumer.max-poll-records=50
spring.kafka.listener.concurrency=12
// Pause/resume programmatically:
container.pause();
// ... scale up consumers ...
container.resume();`,
    config: `spring.kafka.consumer.max-poll-records=50
spring.kafka.consumer.max-poll-interval-ms=300000
spring.kafka.listener.concurrency=12`,
    kafkaCode: `Monitor: kafka.consumer:type=consumer-fetch-manager-metrics,client-id=*,attribute=records-lag-max`,
    unitTest: `@Test void maxPollRecords_tunedForHandlerDuration() {
  assertTrue(handlerP99Ms * maxPollRecords < maxPollIntervalMs);
}`,
    edgeCases: ['Rebalance during scale — use cooperative sticky assignor'],
    failureScenarios: ['Rebalance storm from slow handler + small max.poll.interval'],
    retry: 'N/A',
    idempotency: 'N/A',
    timeout: 'max.poll.interval.ms must exceed worst-case batch processing time',
    observability: 'Lag derivative alert; consumer processing time histogram',
    security: 'N/A',
    performance: 'Right-size max.poll.records vs handler duration',
    scalability: 'Scale consumers to partition count max',
    production: 'Autoscale on lag custom metric (KEDA)',
    mistakes: ['max.poll.interval too small for handler', 'Ignore lag until retention loss'],
    antiPatterns: ['Unbounded in-memory queue before Kafka'],
    alternatives: ['Separate priority topics', 'Load shed at gateway'],
    tradeoffs: 'Pros: system stability. Cons: added latency during overload.',
    interviewQs: ['Backpressure in Kafka vs reactive streams?', 'max.poll.interval exceeded — cause?'],
    trickyQs: ['Pause consumer — what happens to producer?'],
    seniorFollowUps: ['Design autoscaling on consumer lag'],
  },
];

