# Low-Level Design

## Aggregates

| Aggregate   | Root                   | Invariants                                                                              |
|-------------|------------------------|-----------------------------------------------------------------------------------------|
| FlashSale   | `FlashSale`            | Status transitions only via state machine. Purchase allowed only in `ACTIVE`.           |
| Inventory   | `Inventory`            | `available >= 0`, `available + reserved + sold == initial`. Decrement is atomic SQL.    |
| Reservation | `InventoryReservation` | One open reservation per `(orderRequestId)`. Expires → release.                         |
| Order       | `Order`                | At most one confirmed/pending order per `(userId, saleId, productId)`.                  |
| Payment     | `Payment`              | One logical payment per `orderId`. Provider attempts are `PaymentTransaction` children. |
| Saga        | `SagaTransaction`      | Legal transitions only. Compensation is idempotent.                                     |
| Outbox      | `OutboxEvent`          | Inserted in the same DB transaction as the business write.                              |

Entities never leave the service. REST returns records (`PurchaseAccepted`, `OrderView`).

## Flash-sale state machine

```text
CREATED → SCHEDULED → ACTIVE → SOLD_OUT
                         ↓         ↓
                       ENDED ←—————┘
CREATED / SCHEDULED / ACTIVE → CANCELLED
```

Illegal: `ENDED → ACTIVE`, `SOLD_OUT → SCHEDULED`. Implemented as `FlashSaleState` (State pattern). Each state
implements `validatePurchase`. `SoldOutState` / `EndedState` / `CancelledState` throw domain exceptions. **If you use a
boolean `active` flag, two deploys will disagree.**

## Purchase command (sync)

```text
PurchaseCommand(userId, saleId, productId, quantity, idempotencyKey)
```

Flash-sale service:

1. State.validatePurchase
2. Quantity == 1 for this SKU (flash SKU policy — change via config, not code)
3. Redis rate limit (user + IP + API)
4. Idempotency insert (`UNIQUE(user_id, operation, key)`). Hit → return stored 202 body
5. Redis Lua gate
6. Persist outbox `OrderRequested` (partition key = productId)
7. Return `202 { requestId, orderId, status: PENDING }`

`orderId` is allocated here (ULID) so every downstream event shares one id. Inventory and payment never invent a second
order id.

## Inventory reserve (async)

Preferred implementation — **Approach 3, atomic SQL**:

```sql
UPDATE inventory
SET available_quantity = available_quantity - :qty,
    reserved_quantity  = reserved_quantity + :qty,
    version            = version + 1,
    updated_at         = now()
WHERE product_id = :productId
  AND available_quantity >= :qty;
```

`rows == 1` → insert `RESERVED` row + outbox `InventoryReserved`.
`rows == 0` → outbox `InventoryRejected` + Redis `INCRBY` to undo the gate.

Optimistic (`@Version`) and pessimistic (`SELECT FOR UPDATE`) exist as `ReservationStrategy` implementations for
interview comparison. Production default is atomic SQL.

## Package map (hexagonal)

```text
api/           HTTP adapters, DTOs
application/   use cases, saga, commands
domain/        model, state, ports
infrastructure/ JPA, Kafka, Redis, outbox poller
```

No 2,000-line `FlashSaleService`. Purchase use case is `SubmitPurchaseService`. Redis is `RedisInventoryGate`. DB
reserve is `AtomicSqlReservationStrategy`.
