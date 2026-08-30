# Resilience

## Layers

| Layer           | Tool                              | Protects                |
|-----------------|-----------------------------------|-------------------------|
| Edge            | Gateway token-bucket + body limit | Cluster                 |
| App             | Redis rate limit 100 rps/user     | Flash-sale pods / Redis |
| Shed            | Redis inventory 0                 | Kafka + inventory DB    |
| Downstream HTTP | Resilience4j on payment provider  | Payment service threads |
| Messaging       | retry topic + DLQ                 | Poison / outage         |
| Data            | short TX, SKIP LOCKED             | Lock convoys            |

## Resilience4j on `PaymentProvider.pay`

```yaml
resilience4j.circuitbreaker.instances.payment:
  failure-rate-threshold: 50
  slow-call-rate-threshold: 80
  slow-call-duration-threshold: 2s
  wait-duration-in-open-state: 15s
  permitted-number-of-calls-in-half-open-state: 10
  sliding-window-size: 50
resilience4j.retry.instances.payment:
  max-attempts: 3
  wait-duration: 200ms
  retry-exceptions: [java.io.IOException, org.springframework.web.client.ResourceAccessException]
  ignore-exceptions: [com.example.flashsale.common.error.PermanentException]
resilience4j.timelimiter.instances.payment:
  timeout-duration: 3s
resilience4j.bulkhead.instances.payment:
  max-concurrent-calls: 40
```

| Knob                                    | Meaning                                                                               |
|-----------------------------------------|---------------------------------------------------------------------------------------|
| `failureRateThreshold`                  | Open when this % of the window failed                                                 |
| `slowCallRateThreshold`                 | Timeouts count as failure for the sale                                                |
| `waitDurationInOpenState`               | How long we fail fast (circuit open)                                                  |
| `permittedNumberOfCallsInHalfOpenState` | Probe size                                                                            |
| `maxAttempts` / `waitDuration`          | Bounded retry. Infinite retry + payment = double charge unless provider is idempotent |

**Bulkhead** keeps payment HTTP from eating the Kafka consumer pool.

## Backpressure at 1M in / 100K process

1. Rate limit + waiting room admit ~100K
2. Redis gate drops sold-out instantly
3. Kafka buffers the rest (until disk)
4. Consumer lag is the signal to scale inventory replicas **up to partition count**
5. If lag and DB CPU are red: `503` / `429` at the gate (load shed)

## Classify exceptions

| Class     | Examples                   | Action                  |
|-----------|----------------------------|-------------------------|
| Transient | deadlock, connection reset | Retry / retry topic     |
| Permanent | schema, bad JSON           | DLQ                     |
| Business  | sold out, duplicate        | Commit offset, no retry |

## 2PC

Not used. Coordinator outage freezes inventory, orders, and money together. Saga + outbox + compensation is the
production default.
