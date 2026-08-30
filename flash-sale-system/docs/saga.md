# Saga

## Choreography vs orchestration

|                       | Choreography             | Orchestration (we use)             |
|-----------------------|--------------------------|------------------------------------|
| Who decides next step | Each consumer            | `order-service` `SagaOrchestrator` |
| Visibility            | Grep topics              | `saga_transactions` row            |
| Payment timeout       | Easy to miss a listener  | Timer + explicit `COMPENSATING`    |
| Coupling              | Implicit topic contracts | Orchestrator knows the graph       |

Flash-sale payment + release is a **linear happy path with one compensation**. Orchestration is easier to explain and to
timeout. We would choreograph if 15 independent bounded contexts needed to react without a center.

## Happy path

```text
STARTED → INVENTORY_RESERVED → PAYMENT_PENDING → PAYMENT_COMPLETED → COMPLETED
```

## Failure

```text
PAYMENT_PENDING → COMPENSATING → COMPENSATED
```

Illegal: `COMPLETED → STARTED`. Enforced in `SagaStatus.canTransitionTo`.

## Compensation (must be idempotent)

`PaymentFailed` or payment timeout:

1. Mark order `CANCELLED` (no-op if already cancelled)
2. Outbox `InventoryReleaseRequested`
3. Inventory release: if reservation already `RELEASED`/`EXPIRED`, return
4. Increment PG available + Redis gate
5. Saga `COMPENSATED`

## Why not 2PC

Inventory DB, orders DB, and Stripe are three systems. A prepare/commit protocol cannot hold a Stripe authorization for
minutes and cannot survive a coordinator crash at 12:00:01. Saga accepts **temporary** “reserved but unpaid” and heals
with expiry + compensation.

## Timeouts

Reservation `expiresAt` (e.g. 5 minutes). Scheduler uses `FOR UPDATE SKIP LOCKED` to expire batches. This heals “payment
service crashed after reserve.”
