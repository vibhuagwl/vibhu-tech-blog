# spring-resilience4j-lab

Spring Boot 3.4 + Resilience4j 2.4 payment interview lab.

```bash
mvn test
mvn spring-boot:run
# POST /api/orders  {"idempotencyKey":"k1","customerId":"c1","amountCents":1000}
# GET  /api/payment/simulate?mode=DOWN
```

Modes: `OK`, `ERROR`, `FLAKY`, `SLOW`, `DOWN`. Fallback returns **PENDING**, never fake CAPTURED.
