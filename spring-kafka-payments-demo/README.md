# Spring Kafka payments demo

Real interview story:

- `payment-api` takes `POST /api/payments`
- produces `payment.requested.v1` to Kafka with custom key `accountId:paymentId`
- `settlement-worker` consumes, validates, retries bank errors, commits offsets manually, and sends poison messages to DLQ
- success and failure both publish result events

## Services

| Module | Port | What it does |
|---|---:|---|
| `payment-api` | 8091 | REST controller + transactional Kafka producer |
| `settlement-worker` | 8092 | Consumer + DLQ + result publisher + idempotency store |
| `kafka-common` | jar | Shared events, topics, key strategy |

## Run broker

```bash
docker compose up -d
```

## Run apps

```bash
cd spring-kafka-payments-demo
mvn -q -DskipTests package

export SPRING_KAFKA_BOOTSTRAP_SERVERS=localhost:9092
mvn -q -pl payment-api spring-boot:run &
mvn -q -pl settlement-worker spring-boot:run &
```

## Try the story

```bash
curl -X POST http://localhost:8091/api/payments \
  -H 'Content-Type: application/json' \
  -d '{"paymentId":"pay-1001","accountId":"acct-77","amount":"125.50","currency":"USD","merchantRef":"M-900","failMode":"NONE"}'

curl -X POST http://localhost:8091/api/payments \
  -H 'Content-Type: application/json' \
  -d '{"paymentId":"pay-1002","accountId":"acct-77","amount":"9.99","currency":"USD","merchantRef":"M-901","failMode":"POISON"}'

curl http://localhost:8092/api/ops/processed
curl http://localhost:8092/api/ops/dlq
```

## What to remember in the interview

1. Key = `accountId:paymentId` keeps same-account ordering.
2. Producer is idempotent and transactional.
3. Consumer uses manual ack, not auto commit.
4. Transient errors retry, poison goes to DLQ.
5. Compression + linger + batch size reduce producer overhead.

## Full properties pack (copy-paste templates)

- `config-templates/producer-full.properties`
- `config-templates/consumer-full.properties`
- `config-templates/broker-full-template.properties`

These files cover practical producer, consumer, and broker properties for interview and prod-checklist use.
