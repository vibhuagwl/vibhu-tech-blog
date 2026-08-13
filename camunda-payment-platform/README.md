# Camunda 8 Payment Platform Lab

Production-shaped **Camunda 8 + Spring Boot** payment orchestration used by the `/camunda` hub.

## Modes

| Mode | How | Purpose |
|------|-----|---------|
| **in-memory** (default) | `mvn spring-boot:run` | Learn APIs + BPMN path without Docker Zeebe |
| **zeebe** | `docker compose up -d` then `mvn spring-boot:run -Dspring-boot.run.profiles=zeebe` | Real Zeebe jobs, Operate, Tasklist |

Business data lives in **PostgreSQL/H2** (`payment` table). Camunda/Zeebe owns **workflow state only**.

## Quick start (in-memory)

```bash
cd camunda-payment-platform
mvn test
mvn spring-boot:run
# API :8094
```

```bash
curl -s -X POST localhost:8094/api/payments \
  -H 'Content-Type: application/json' \
  -d '{"paymentId":"PAY-10001","customerId":"CUST-100","amount":5000,"currency":"INR"}'

# Fraud reject
curl -s -X POST localhost:8094/api/payments \
  -H 'Content-Type: application/json' \
  -d '{"paymentId":"PAY-F1","customerId":"CUST-FRAUD","amount":100,"currency":"USD"}'

# High-value approval
curl -s -X POST localhost:8094/api/payments \
  -H 'Content-Type: application/json' \
  -d '{"paymentId":"PAY-HV","customerId":"CUST-VIP","amount":150000,"currency":"INR"}'
curl -s -X POST 'localhost:8094/api/payments/PAY-HV/approvals?approved=true'
```

## Zeebe mode

```bash
docker compose up -d
# Operate http://localhost:8081  Tasklist http://localhost:8082  Zeebe :26500
mvn spring-boot:run -Dspring-boot.run.profiles=zeebe
```

BPMN: `src/main/resources/processes/payment-process.bpmn`

Job types: `validate-payment`, `fraud-check`, `account-validation`, `credit-check`, `process-payment`, `notify-payment`, `escalate-approval`.

Message: `bank-callback` correlated by `paymentId`.

## Architecture (interview)

```text
Client → Spring Boot API → Zeebe (process instance)
                              ↓
                         create jobs
                              ↓
                    Spring @JobWorker beans
                              ↓
                 Payment / Fraud / Bank services
                              ↓
                    complete / fail / throw error
                              ↓
                    token moves / incident in Operate
```

## Demo customer suffixes

| Suffix | Behavior |
|--------|----------|
| `-FRAUD` | Fraud gateway → reject |
| `-DECLINE` | BPMN error `BANK_DECLINED` → manual review |

## Camunda 8 vs 7 (do not mix APIs)

- **C8**: Zeebe gRPC/REST, `@JobWorker`, Operate/Tasklist exporters, no `ACT_*` tables
- **C7**: embedded/shared engine, JDBC `ACT_RU_*` / `ACT_HI_*`, Java delegates

See the site hub `/camunda` for sequence diagrams, REST catalogue, saga, and 60+ interview answers.
