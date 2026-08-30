# Database

Four PostgreSQL databases (one server, four DBs in Compose): `flashsale`, `inventory`, `orders`, `payments`.

## Why each index exists

| Index                                                 | Why                          | If missing                   |
|-------------------------------------------------------|------------------------------|------------------------------|
| `inventory(product_id)` unique                        | Point lookup + atomic update | Seq scan on reserve          |
| `orders(user_id, flash_sale_id, product_id)` unique   | Double-buy safety net        | Two orders for one user      |
| `outbox_events(status, created_at)`                   | Poller `NEW` + time order    | Full table scan every 200ms  |
| `idempotency_records(user_id, operation, key)` unique | HTTP retries                 | Double enqueue               |
| `inventory_reservations(order_id)` unique             | Idempotent reserve           | Double reserve on redelivery |
| `saga_transactions(order_id)` unique                  | One saga per order           | Split brain orchestrator     |
| `outbox_events(event_id)` unique                      | Publisher / replay           | Duplicate Kafka produce      |

`version` on inventory is for optimistic strategy and admin updates, not the hot decrement.

Check: `available_quantity >= 0`, `quantity > 0`.

## Partitioning (when, not now)

`orders` and `outbox_events` grow with every attempt, not just wins.

- **orders:** monthly `RANGE (created_at)` after ~50M rows or when vacuum/HOT update hurts p99.
- **outbox:** time-based; published rows deleted or moved after N days. Do not keep `PUBLISHED` forever in the hot
  table.

Partitioning too early costs unique-constraint pain (`UNIQUE` must include partition key). We keep a single table +
indexes for the lab.

## HikariCP

```yaml
maximum-pool-size: 20   # per pod, not 200
connection-timeout: 2s  # fail fast into 503
idle-timeout: 10m
max-lifetime: 30m       # below LB idle
```

Connections are a scarce lock on Postgres CPU. 50 pods × 50 connections = 2500 backends. The sale dies of context
switch, not “not enough pool.”

## Deadlocks

Reserve only touches `inventory` then `inventory_reservations` — **fixed order**. Never lock reservation then inventory.
Retry `40P01` with jitter (bounded).

## Transactions

`@Transactional` wraps **only** the SQL for that aggregate + outbox insert. No `RestClient`, no `KafkaTemplate.send`
inside. The poller publishes after commit.
