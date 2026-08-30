# Kafka

Kafka is the **async backbone**, not a database and not a 2PC coordinator.

## Topics

| Topic                                    | Key            | Why that key                                               |
|------------------------------------------|----------------|------------------------------------------------------------|
| `flash-sale.order-requested`             | `productId`    | Inventory events for one SKU stay ordered                  |
| `flash-sale.inventory-reserved`          | `orderId`      | Order/saga timeline per order                              |
| `flash-sale.inventory-rejected`          | `orderId`      |                                                            |
| `flash-sale.payment-requested`           | `orderId`      |                                                            |
| `flash-sale.payment-succeeded`           | `orderId`      |                                                            |
| `flash-sale.payment-failed`              | `orderId`      |                                                            |
| `flash-sale.order-confirmed`             | `orderId`      |                                                            |
| `flash-sale.order-cancelled`             | `orderId`      |                                                            |
| `flash-sale.inventory-release-requested` | `productId`    | Release must not race another reserve on another partition |
| `flash-sale.notification-requested`      | `orderId`      |                                                            |
| `*.retry` / `*.dlq`                      | same as parent | Retry / poison isolation                                   |

## Partition trade-off

`productId` on inventory topics ⇒ **correctness of stock events** for that SKU, and a **hot partition** when there is
one iPhone.

Mitigations (in order we use them): Redis gate so the partition never sees 1M msgs/s; waiting room; more sale SKUs;
inventory token pre-split. Adding consumers beyond partition count does **nothing**.

`orderId` on order/payment ⇒ independent orders scale horizontally. You lose global order of payments (you do not need
it).

## Producer (every service)

```properties
acks=all
enable.idempotence=true
retries=2147483647
delivery.timeout.ms=120000
linger.ms=10
batch.size=32768
compression.type=lz4
```

| Setting                    | Why                                 | If removed                                  |
|----------------------------|-------------------------------------|---------------------------------------------|
| `acks=all`                 | ISR must ack. Survive leader crash. | Silent loss on failover                     |
| `enable.idempotence`       | PID+seq dedupes producer retries    | Duplicate `OrderRequested` on timeout-retry |
| `linger` + `batch` + `lz4` | Throughput                          | Tiny messages, broker CPU                   |

Idempotent producer ≠ one order per user. It only stops *this producer* from emitting the same record twice.

## Consumer

- `ack-mode: MANUAL` — ack after the **business transaction + outbox insert** commits.
- Idempotency table on `eventId`.
- Transient errors: retry topic with backoff. Permanent / poison: DLQ, no retry.
- Rebalance: do not hold DB transactions across poll. Short work, commit offset after commit.

## Consumer restart

Unacked message is redelivered. Consumer must treat `eventId` as already processed. **If you ack before the DB commit, a
crash loses the reserve and the offset — you skipped a sale.**

## Hot partition vs scale

```text
partitions = 30, inventory consumers = 30  → max parallelism 30
consumers = 60                               → 30 idle
```

For one SKU you still have **one partition**. Scale the *gate*, not the inventory consumer count.
