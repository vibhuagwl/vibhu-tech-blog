# Concurrency

Assume inventory = 10 and 100,000 concurrent buyers. The bug is always the same:

```text
read qty
if qty > 0
  qty = qty - 1
  write qty
```

Two threads both read 1. Both write 0. You sold 2. **This is the interview.**

## Approach 1 — Optimistic locking (`@Version`)

Hibernate adds `WHERE version = :old`. Loser gets `OptimisticLockException`. Retry 1..3 then fail.

| Pros              | Cons                                                                         |
|-------------------|------------------------------------------------------------------------------|
| No long row locks | Hot row = retry storm. 10,000 waiters on 1 iPhone = almost everyone retries. |

Use for low-contention catalog updates, not the hot SKU decrement.

## Approach 2 — Pessimistic `SELECT FOR UPDATE`

```java
@Lock(LockModeType.PESSIMISTIC_WRITE)
Optional<Inventory> findByProductId(String productId);
```

Serializes writers on that row. Correct. Throughput = 1 / (lock hold time). If you call Kafka or HTTP inside that
transaction you stall the sale.

## Approach 3 — Atomic SQL (default)

One statement. No read-modify-write in Java. The database’s row lock lives only for the statement.

**Why safer:** there is no window between “I saw 1” and “I wrote 0.” Either the `WHERE available >= qty` matches or it
does not.

## Redis gate (not a lock around the world)

Lua `GET` + compare + `DECRBY` is atomic **inside one Redis shard**. It is a **filter**:

- Return `0` → HTTP `409 PRODUCT_SOLD_OUT`. Kafka/DB never see the request.
- Return `1` → you *may* still lose in PostgreSQL (Redis replica lag, crash before persist, admin restock). DB decides.

**If you treat Redis as truth and Redis dies after DECR but before outbox commit, you leaked a unit unless you
compensate (INCR on reject / expiry).** We always compensate on `InventoryRejected` and reservation expiry.

## Distributed lock (`SET lock:inventory:{productId} NX PX`)

Implemented with owner token + Lua unlock (never `DEL` a lock you do not own).

**Do not put this on every purchase.** 1M RPS on one lock is a mutex in the sky. Use it for:

- cache stampede (single flight on catalog miss)
- admin restock
- reconciliation jobs

Not for the hot path. Atomic SQL + Redis counter already serialize the stock.

## Lock failure modes (say these)

| Failure                       | Effect                                                                                                                                     |
|-------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------|
| Lock contention               | Tail latency explodes                                                                                                                      |
| Lease expires while work runs | Two owners. Unlock Lua prevents the late owner from deleting the new lock; the *work* can still double-apply unless the work is idempotent |
| Redis split brain             | Two masters grant the lock                                                                                                                 |
| Redis down                    | Fail closed on the gate (503) or degraded DB-only path with a much tighter rate limit                                                      |

## Duplicate purchase

Application check + `UNIQUE(user_id, flash_sale_id, product_id)`. Concurrent inserts: one commits, one gets
`DataIntegrityViolation`. Map to `DUPLICATE_PURCHASE` / return the winner’s order id.

## Test that must pass

`inventory=1`, `N=1000` threads, `successful reservations == 1`, `available >= 0`. See `AtomicInventoryReservationTest`.
