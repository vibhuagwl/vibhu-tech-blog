# Capacity planning

Assumptions for one SKU flash sale (interview numbers, not a measured SLA):

| Input                    | Value                  |
|--------------------------|------------------------|
| Users who open the page  | 5,000,000              |
| Conversion who tap Buy   | 10% = 500,000 attempts |
| Inventory                | 10,000                 |
| Sale window              | 10 minutes             |
| Bot / refresh multiplier | 5–20× HTTP             |

## Requests / second

- Honest humans: 500k / 600s ≈ **830 rps** if perfectly smooth.
- Real T-0 spike: most attempts in 2–5 seconds → **100k–250k rps**.
- With bots and retries: design the **gate** for **500k–1M rps**.
- Design **PostgreSQL reserve** for ~inventory + retries ≈ **10k–50k successful CAS**, not 1M.

If Redis is 0, HTTP 409 and **zero** Kafka / DB writes. That is the only way 1M rps is plausible.

## Kafka

Winning path events per order (approx):

`OrderRequested → InventoryReserved → PaymentRequested → PaymentSucceeded → OrderConfirmed → Notification`

≈ 6 messages × 10,000 winners = **60k events**.

Losing intents that passed the gate (Redis over-admit vs DB reject): a few thousand `InventoryRejected`.

Partitioning:

- Inventory topics keyed by `productId` → **1 hot partition** for one SKU. Extra inventory pods do nothing.
- Order/payment topics keyed by `orderId` → scale with partition count.

## Database writes

| Table                    | Cardinality                                                       |
|--------------------------|-------------------------------------------------------------------|
| `idempotency_records`    | up to 500k–5M (every admitted intent) — partition / TTL after 24h |
| `inventory`              | 1 hot row                                                         |
| `inventory_reservations` | ≤ 10k + expired                                                   |
| `orders`                 | ≤ 10k confirmed + cancelled                                       |
| `outbox_events`          | ~6× winners + rejects; truncate after publish + retention         |

Do **not** grow the connection pool to “match” 1M rPS. 20 connections × 4 services is plenty if the gate holds. Extra
connections queue on the same hot row.

## Redis

- `inv:gate:P1001` — 1 hot key, Lua DECR. Single-thread Redis shard.
- Rate-limit keys: `rl:user:{id}`, `rl:ip:{ip}` — high cardinality, short TTL.
- Catalog cache: `flashSales` — tiny.

1M DECR/s is a **cluster / sharding conversation**, not one `m5.large`. For one SKU you still hit one hash slot.

## Storage / day (order of magnitude)

- Idempotency row ~200 B × 2M ≈ 400 MB
- Outbox + Kafka retention 24h: a few GB
- Orders: negligible

## What we do **not** claim

p95 &lt; 100ms on the enqueue path is a **target**, not a measured number from this repo. Measure with
`k6 run load-test/purchase.js` against a warmed gate before quoting it in an interview.
