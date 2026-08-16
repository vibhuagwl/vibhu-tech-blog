/** Unique runnable payment-demo narrative absorbed from kafka-interview/kafka-payments-dlq. */

export const PAYMENTS_DEMO_BOX = `flowchart LR
    U[Support / checkout app] --> API[payment-api :8091]
    API -->|topic: payment.requested.v1| K[Kafka broker]
    K --> W[settlement-worker :8092]
    W -->|success| R[payment.results.v1]
    W -->|poison / retry exhausted| D[payment.requested.v1.DLT]
    W --> H2[(idempotency + dlq table)]`;

export const PAYMENTS_DEMO_SUCCESS = `sequenceDiagram
    autonumber
    actor Client
    participant API as payment-api
    participant K as Kafka
    participant W as settlement-worker
    participant DB as processed_payments

    Client->>API: POST /api/payments
    API->>API: key = accountId:paymentId
    API->>K: Produce PaymentRequestedEvent
    K->>W: Deliver record
    W->>DB: markProcessed(paymentId)
    W->>W: talk to bank
    W->>K: Produce PaymentResultEvent(status=SETTLED)
    W->>W: acknowledgment.acknowledge()
    W-->>Client: not direct; result is async`;

export const PAYMENTS_DEMO_POISON = `sequenceDiagram
    autonumber
    participant K as payment.requested.v1
    participant W as settlement-worker
    participant EH as DefaultErrorHandler
    participant DLT as payment.requested.v1.DLT

    K->>W: PaymentRequestedEvent(failMode=POISON)
    W->>W: throw PoisonPaymentException
    W->>EH: listener failed
    EH->>EH: no retry for poison
    EH->>DLT: DeadLetterPublishingRecoverer
    DLT->>W: DLT listener stores reason + publishes FAILED result`;

export const PAYMENTS_DEMO_RUN = `cd spring-kafka-payments-demo
docker compose up -d
mvn -q -DskipTests package

export SPRING_KAFKA_BOOTSTRAP_SERVERS=localhost:9092
mvn -q -pl payment-api spring-boot:run &
mvn -q -pl settlement-worker spring-boot:run &

# success
curl -X POST http://localhost:8091/api/payments \\
  -H 'Content-Type: application/json' \\
  -d '{"paymentId":"pay-1001","accountId":"acct-77","amount":"125.50","currency":"USD","merchantRef":"M-900","failMode":"NONE"}'

# poison -> immediate DLQ
curl -X POST http://localhost:8091/api/payments \\
  -H 'Content-Type: application/json' \\
  -d '{"paymentId":"pay-1002","accountId":"acct-77","amount":"9.99","currency":"USD","merchantRef":"M-901","failMode":"POISON"}'

# transient -> retries first, then DLQ if still failing
curl -X POST http://localhost:8091/api/payments \\
  -H 'Content-Type: application/json' \\
  -d '{"paymentId":"pay-1003","accountId":"acct-77","amount":"18.50","currency":"USD","merchantRef":"M-902","failMode":"TRANSIENT_BANK_TIMEOUT"}'

curl http://localhost:8092/api/ops/processed
curl http://localhost:8092/api/ops/dlq`;

export const PAYMENTS_DEMO_PRODUCER_PROPS = `spring.kafka.producer:
  acks: all
  properties:
    enable.idempotence: true
    linger.ms: 5          # small batching window
    batch.size: 32768
    compression.type: zstd
    transactional.id: payment-api-\${HOSTNAME}
# Key: accountId:paymentId — per-account ordering
# CooperativeStickyAssignor on consumer for fewer stop-the-world rebalances`;

export const PAYMENTS_DEMO_THIRTY_SEC =
  'Payment-api produces to payment.requested.v1 with an account-scoped key and idempotent producer. Settlement-worker uses MANUAL_IMMEDIATE ack after DB commit, DefaultErrorHandler with FixedBackOff for transient bank timeouts, and DeadLetterPublishingRecoverer for poison or exhausted retries into payment.requested.v1.DLT. UNIQUE(payment_id) makes at-least-once safe. We do not claim Kafka transactions alone give business exactly-once.';

export const PAYMENTS_DEMO_FILES = `spring-kafka-payments-demo/
  payment-api/          REST + KafkaTemplate producer
  settlement-worker/    @KafkaListener + DEH + DLT
  shared/               events + failMode enum
  docker-compose.yml    broker`;
