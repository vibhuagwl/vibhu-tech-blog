# Mediator — Interview Explanation Board

> **Demo:** `OrderProcessingMediatorDemo` — `src/main/java/com/example/designpatterns/behavioral/mediator/OrderProcessingMediatorDemo.java`

## 1. Pattern Identification

| Field | Value |
|-------|-------|
| **Name** | Mediator |
| **Category** | Behavioral |
| **One-line definition** | Define an object that encapsulates how a set of objects interact, promoting loose coupling by keeping objects from referring to each other explicitly. |
| **Problem class** | Payment, inventory, and notification services call each other directly — spaghetti mesh. |

## 2. Problem We Are Solving

Checkout needs: authorize payment → reserve inventory → notify customer. `PaymentService` calls `InventoryService` which calls `NotificationService` — circular imports, hidden chains, adding shipping requires editing payment and inventory.

## 3. What Happens Without the Pattern

Peer-to-peer calls:

```text
Payment → Inventory → Notification
Inventory → Payment (cancel on fail)
```

Pains: mesh coupling, hard to trace flow, every new colleague edits multiple peers.

## 4. How the Pattern Solves It

1. **Mediator** — `OrderProcessingMediator.placeOrder(orderId)`
2. **Colleagues** — `PaymentService`, `InventoryService`, `NotificationService`
3. **Rule** — colleagues do **not** call each other; mediator orchestrates
4. Client talks only to `Mediator` interface

## 5. Pattern → Code Mapping

| Role | Demo type | Why |
|------|-----------|-----|
| **Mediator** | `Mediator` interface, `OrderProcessingMediator` | Coordinates peers |
| **Colleagues** | `PaymentService`, `InventoryService`, `NotificationService` | Domain services |
| **Client** | `OrderProcessingMediatorDemo.run()` | `mediator.placeOrder("order-777")` |

## 6. Important Code Lines

| Code | Significance |
|------|--------------|
| `payment.authorize(orderId)` inside mediator | Orchestration step 1 |
| `inventory.reserve(orderId)` | Step 2 — peers not called by payment |
| `notification.notifyCustomer(orderId)` | Step 3 |
| `return "order-complete:" + orderId` | Single outcome to client |

## 7. Object/Class Diagram

```text
Client
   │
   ▼
OrderProcessingMediator (mediator)
   ├── PaymentService      (colleague)
   ├── InventoryService    (colleague)
   └── NotificationService (colleague)

No arrows between colleagues
```

## 8. Runtime Execution Flow

```text
mediator = new OrderProcessingMediator()
mediator.placeOrder("order-777")
  → payment.authorize("order-777")     // payment-ok:order-777
  → inventory.reserve("order-777")     // inventory-ok:order-777
  → notification.notifyCustomer(...)   // notified:order-777
  → "order-complete:order-777"
```

## 9. What the Client Doesn't Need to Know

- Which colleagues exist
- Order of authorize vs reserve
- That peers never reference each other

## 10. Before vs After

**Before:** Colleague mesh — Payment knows Inventory.

**After:** Star topology — all through mediator.

## 11. SOLID / Design Principles

| Principle | Application |
|-----------|-------------|
| **Loose coupling** | Colleagues isolated from each other |
| **Caution** | Mediator can become god object — keep orchestration thin |

## 12. Extensibility

- Add `ShippingService` — mediator calls it, peers unchanged
- Event-driven mediator vs synchronous demo
- vs Facade: Mediator for **peer** coordination; Facade for **external** simplification

## 13. Advantages

- Eliminates peer-to-peer coupling
- Central place to see workflow
- Add colleague without editing others

## 14. Disadvantages

- Mediator complexity grows with workflow
- Can become god mediator
- Overkill for two components

## 15. When to Use

1. Order checkout coordinating payment/inventory/notify
2. UI dialog controls interacting via dialog mediator
3. Chat room routing messages

## 16. When NOT to Use

1. Two components with direct relationship
2. Simple external API — Facade enough

## 17. Edge Cases / Production Concerns

| Concern | Note |
|---------|------|
| Failure handling | Compensate on reserve fail after authorize |
| Saga | Mediator + outbox for distributed colleagues |
| God mediator | Push domain rules back to colleagues |
| Async | Mediator publishes events vs direct calls |

## 18. Possible Code Improvements

**Required:** Rollback/compensate on mid-flow failure.

**Optional:** Event bus as mediator; inject colleagues for tests.

## 19. Mental Model

**"Air traffic control."** Planes don't talk to each other; tower coordinates.

## 20. 30–60 Second Interview Answer

> Mediator encapsulates how colleagues interact so they don't reference each other. Payment, inventory, and notification calling each other creates spaghetti. `OrderProcessingMediator.placeOrder` runs authorize, reserve, and notify in sequence — colleagues only invoked by mediator, never peer-to-peer. Client talks to `Mediator` only. Differs from Facade: mediator coordinates **peers**; facade simplifies subsystem for **outside** clients. Adding shipping updates mediator, not payment class.

## 21. Likely Interview Follow-ups

| Question | Answer |
|----------|--------|
| Mediator vs Facade? | Mediator: peer mesh; Facade: external entry |
| vs Event bus? | Event bus is often mediator implementation |
| God object? | Keep domain logic in colleagues |

**Common mistake:** Colleagues still calling each other — breaks mediator purpose.

---

## Run

```bash
cd java-design-patterns-real-world
mvn -q exec:java -Dexec.mainClass=com.example.designpatterns.behavioral.mediator.OrderProcessingMediatorDemo
```
