# Spring MSP Platform

Production-style checkout microservices platform: API Gateway, Order, Payment, Customer, Inventory, Notification with Kafka, Redis, PostgreSQL, Resilience4j, Outbox/Inbox, Saga choreography, idempotency, DLQ, Redis cache-aside, structured logging, and Micrometer.

## Architecture

```
                    +------------------+
                    |   API Gateway    | :8080
                    +--------+---------+
                             |
     +-----------+-----------+-----------+-----------+
     |           |           |           |           |
 Order:8081  Payment:8082 Customer:8083 Inventory:8084 Notification:8085
     |           |                       |
     |    PostgreSQL (per-service DB)    |
     |           |                       |
     +-----------+-----------+-----------+
                 |
           Kafka (Redpanda) :9092
     order.events / payment.events / inventory.events
                 |
              Redis :6379 (customer cache)
```

## Saga flow (choreography)

1. `POST /api/orders` with `Idempotency-Key` → order row + outbox in one TX
2. Outbox relay → `order.events` (`OrderCreated`)
3. Payment consumes (inbox dedupe) → charge → `payment.events`
4. Inventory consumes → reserve stock → `inventory.events`
5. Order consumes payment/inventory events → `OrderCompleted` or cancel on `PaymentFailed`
6. Inventory releases stock on `OrderCancelled`
7. Notification consumes events → persists notification records

## Pattern mapping

| Pattern | Where |
|---------|-------|
| API Gateway | `api-gateway` Spring Cloud Gateway |
| Outbox | `order-service`, `payment-service`, `inventory-service` |
| Inbox | all Kafka consumers |
| Saga (choreography) | order ↔ payment ↔ inventory via Kafka |
| Idempotency | `Idempotency-Key` header on order create |
| DLQ | `*.dlt` topics via `DeadLetterPublishingRecoverer` |
| Circuit breaker / retry / bulkhead | `order-service` → payment HTTP; gateway routes |
| Cache-aside | `customer-service` Redis |
| Correlation ID | `X-Correlation-Id` filter on all services + gateway |

## Prerequisites

- Java 21
- Maven 3.9+
- Docker (for infra + optional ITs)

## Start infrastructure

```bash
cd spring-msp-platform
docker compose up -d
```

Creates PostgreSQL databases (`orders`, `payments`, `inventory`, `customers`, `notifications`), Redis, and Redpanda (Kafka API on `localhost:9092`).

## Run services (Maven)

From repo root, start each module (infra must be running):

```bash
mvn -q -pl msp-common install -DskipTests
mvn -q -pl order-service spring-boot:run
mvn -q -pl payment-service spring-boot:run
mvn -q -pl customer-service spring-boot:run
mvn -q -pl inventory-service spring-boot:run
mvn -q -pl notification-service spring-boot:run
mvn -q -pl api-gateway spring-boot:run
```

Ports: gateway **8080**, order **8081**, payment **8082**, customer **8083**, inventory **8084**, notification **8085**.

## curl demos

**Happy path checkout**

```bash
curl -s -X POST http://localhost:8080/api/orders \
  -H 'Content-Type: application/json' \
  -H 'Idempotency-Key: demo-key-001' \
  -H 'X-Correlation-Id: corr-demo-001' \
  -d '{
    "customerId": "cust-1",
    "lines": [{"sku": "SKU-1", "quantity": 2, "unitPrice": 25.00}]
  }'
```

Poll order status until `COMPLETED`:

```bash
curl -s http://localhost:8080/api/orders/<orderId>
```

**Customer profile (Redis cache-aside)**

```bash
curl -s http://localhost:8080/api/customers/cust-1
```

**Payment failure / saga compensation** — use customer id containing `fail` or amount > 10000:

```bash
curl -s -X POST http://localhost:8080/api/orders \
  -H 'Content-Type: application/json' \
  -H 'Idempotency-Key: demo-fail-001' \
  -d '{
    "customerId": "cust-fail",
    "lines": [{"sku": "SKU-1", "quantity": 1, "unitPrice": 50.00}]
  }'
```

## Tests

Unit tests (no Docker):

```bash
mvn -q test -DskipITs
```

Integration tests (Testcontainers, skipped when Docker unavailable):

```bash
mvn -q verify -DskipITs=false
```

## Modules

| Module | Description |
|--------|-------------|
| `msp-common` | Shared events, envelopes, correlation id, headers |
| `order-service` | Order API, outbox relay, saga coordinator |
| `payment-service` | Payment processing, inbox/outbox |
| `inventory-service` | Stock reservation / release |
| `customer-service` | Customer API + Redis cache |
| `notification-service` | Event-driven notifications |
| `api-gateway` | Spring Cloud Gateway + circuit breaker |
