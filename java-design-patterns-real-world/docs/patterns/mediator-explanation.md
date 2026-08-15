# Mediator — Interview Explanation Board

> **Demo:** `OrderProcessingMediatorDemo` — `src/main/java/com/example/designpatterns/behavioral/mediator/OrderProcessingMediatorDemo.java`

## 1. Pattern Identification

| Field | Value |
|-------|-------|
| **Name** | Mediator |
| **Category** | Behavioral |
| **One-line definition** | Define an object that encapsulates how a set of objects interact, promoting loose coupling by keeping objects from referring to each other explicitly. |
| **Problem class** | Payment, inventory, and notification services call each other directly — spaghetti mesh, circular imports, hidden call chains. |

## 2. Problem We Are Solving

Checkout must complete an order in sequence:

1. **Authorize payment** — `PaymentService.authorize(orderId)`
2. **Reserve inventory** — `InventoryService.reserve(orderId)`
3. **Notify customer** — `NotificationService.notifyCustomer(orderId)`

In a naive mesh, each colleague knows the next:

```text
PaymentService
    └── calls InventoryService.reserve()
            └── calls NotificationService.notifyCustomer()
                    └── (maybe calls PaymentService.cancel() on failure)

InventoryService
    └── calls PaymentService on stock conflict
```

Example order `order-777`:

```text
Client
  └── PaymentService.authorize("order-777")
        └── InventoryService.reserve("order-777")
              └── NotificationService.notifyCustomer("order-777")
```

The painful questions:

> How do you add **shipping** without editing `PaymentService` and `InventoryService`?

> How do you trace the full checkout flow when calls bounce between five services?

Relationships that make this hard:

- **Colleagues** (`PaymentService`, `InventoryService`, `NotificationService`) — domain services that should stay focused
- **Mesh** — every colleague may reference every other colleague
- **Client** — should place an order without orchestrating authorize → reserve → notify manually
- **Workflow** — order of steps and failure handling belong in one coordinator, not scattered

## 3. What Happens Without the Pattern

Naive peer-to-peer checkout:

```java
public class PaymentService {
    private final InventoryService inventory = new InventoryService();

    String authorize(String orderId) {
        String result = "payment-ok:" + orderId;
        inventory.reserve(orderId);  // Payment knows Inventory
        return result;
    }
}

public class InventoryService {
    private final NotificationService notification = new NotificationService();

    String reserve(String orderId) {
        String result = "inventory-ok:" + orderId;
        notification.notifyCustomer(orderId);  // Inventory knows Notification
        return result;
    }
}
```

Concrete pains:

1. **Circular dependencies** — Payment imports Inventory; Inventory may import Payment for rollback
2. **Hidden call chains** — `authorize()` secretly triggers reserve and notify three levels deep
3. **Every new colleague** (ShippingService) requires edits in Payment, Inventory, Notification
4. **Hard to test** — cannot test Payment without Inventory and Notification wired in
5. **No single workflow view** — orchestration logic is fragmented across classes
6. **Client confusion** — must know to call Payment first, or does Inventory already notify?

SOLID hits: **SRP** (Payment owns payment + orchestration), **OCP** (new step edits multiple peers), **DIP** (concrete mesh instead of abstraction).

## 4. How the Pattern Solves It

Conceptual chain:

1. **Problem** — colleagues call each other; checkout is a mesh of dependencies
2. **Naive pain** — Payment → Inventory → Notification; adding shipping edits everyone
3. **Pattern introduces** — `Mediator` interface with `placeOrder(orderId)`
4. **Concrete mediator** — `OrderProcessingMediator` holds colleagues as private fields
5. **Rule** — colleagues **never** call each other; only mediator invokes them
6. **Orchestration** — `placeOrder` runs authorize → reserve → notify in one method
7. **Client simplifies** — `mediator.placeOrder("order-777")` — single entry, star topology

Coupling moves from peer-to-peer mesh to **hub-and-spoke** through the mediator.

## 5. Pattern → Code Mapping

| Pattern role | Demo class / type | Why this role |
|--------------|-------------------|---------------|
| **Mediator** | `Mediator` interface | Client contract: `placeOrder(String orderId)` |
| **Concrete mediator** | `OrderProcessingMediator` | Owns colleagues; runs checkout sequence |
| **Colleague** | `PaymentService` | Authorizes payment; no peer references |
| **Colleague** | `InventoryService` | Reserves stock; no peer references |
| **Colleague** | `NotificationService` | Notifies customer; no peer references |
| **Client** | `OrderProcessingMediatorDemo.run()` | Creates mediator, calls `placeOrder` |

## 6. Important Code Lines

| Code | Design significance |
|------|---------------------|
| `interface Mediator { String placeOrder(String orderId); }` | Client depends on abstraction, not concrete services |
| `private final PaymentService payment = new PaymentService()` | Mediator owns colleague references — peers stay isolated |
| `payment.authorize(orderId)` | Step 1 orchestrated centrally |
| `inventory.reserve(orderId)` | Step 2 — Payment never calls Inventory directly |
| `notification.notifyCustomer(orderId)` | Step 3 — Inventory never calls Notification |
| `return "order-complete:" + orderId` | Single outcome returned to client after full workflow |
| Colleagues have no imports of other colleagues | **No peer-to-peer arrows** — core mediator rule |

## 7. Object/Class Diagram

```text
                    ┌─────────────────────┐
                    │  <<interface>>      │
                    │  Mediator           │
                    │  + placeOrder(id)   │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │ OrderProcessing     │
                    │ Mediator            │
                    │ - payment           │
                    │ - inventory         │
                    │ - notification      │
                    │ + placeOrder(id)    │
                    └──────────┬──────────┘
                               │
         ┌─────────────────────┼─────────────────────┐
         │                     │                     │
┌────────▼────────┐  ┌─────────▼─────────┐  ┌──────▼──────────┐
│ PaymentService  │  │ InventoryService  │  │ Notification    │
│ + authorize()   │  │ + reserve()       │  │ Service         │
│ (colleague)     │  │ (colleague)       │  │ + notifyCustomer│
└─────────────────┘  └───────────────────┘  └─────────────────┘

No arrows between colleagues — only mediator invokes them

Client ──placeOrder()──► OrderProcessingMediator
```

## 8. Runtime Execution Flow

From `OrderProcessingMediatorDemo.run()`:

```text
Client:
  Mediator mediator = new OrderProcessingMediator();
  mediator.placeOrder("order-777");

Inside OrderProcessingMediator.placeOrder("order-777"):
  Step 1: payment.authorize("order-777")
          → returns "payment-ok:order-777" (discarded in demo)

  Step 2: inventory.reserve("order-777")
          → returns "inventory-ok:order-777"

  Step 3: notification.notifyCustomer("order-777")
          → returns "notified:order-777"

  Step 4: return "order-complete:order-777"

Console output:
  Result: order-complete:order-777

Peer services never invoked each other — only mediator called them.
```

## 9. What the Client Doesn't Need to Know

- That `PaymentService`, `InventoryService`, or `NotificationService` exist
- The order of authorize vs reserve vs notify
- That colleagues are fields inside `OrderProcessingMediator`
- How to compensate if reserve fails after authorize
- That peers have zero references to each other
- Individual return values from each colleague (demo aggregates to one outcome)

Client mental model: **one mediator, one `placeOrder` call**.

## 10. Before vs After

### Without Mediator

```text
Client
  │
  └── PaymentService.authorize()
         │
         └── InventoryService.reserve()
                │
                └── NotificationService.notifyCustomer()

Payment ──► Inventory ──► Notification
Inventory ──► Payment (on rollback)
```

Client and colleagues **understand the mesh**.

### With Mediator

```text
Client
   │
   │ placeOrder("order-777")
   ↓
OrderProcessingMediator
   │
   ├── payment.authorize()
   ├── inventory.reserve()
   └── notification.notifyCustomer()

No arrows between colleagues
```

**Mediator understands workflow; colleagues do not know peers.**

## 11. SOLID / Design Principles

| Principle | How Mediator applies |
|-----------|----------------------|
| **Loose coupling** | Colleagues isolated — no peer imports |
| **Single Responsibility** | Each colleague owns one domain concern; mediator owns orchestration |
| **Open/Closed** | Add `ShippingService` by extending mediator sequence, not editing Payment |
| **Dependency Inversion** | Client depends on `Mediator` interface |
| **Caution — God object** | Mediator must stay thin orchestrator; domain rules stay in colleagues |

## 12. Extensibility

| Change | Approach | Trade-off |
|--------|----------|-----------|
| Add shipping step | Mediator calls `shipping.ship(orderId)` after reserve | Mediator grows — watch god-object risk |
| Async checkout | Mediator publishes events; colleagues subscribe | Event bus **is** a mediator variant |
| Distributed saga | Mediator coordinates compensating transactions | Outbox + saga, not synchronous calls |
| vs Facade | Facade simplifies subsystem for **external** client | Mediator coordinates **peers** internally |
| vs Observer | Observer fan-out notify | Mediator sequential orchestration |

## 13. Advantages

- Eliminates peer-to-peer coupling and circular imports
- Central place to read checkout workflow (`placeOrder` body)
- Add colleague without editing existing colleagues
- Easier to inject mock colleagues into mediator for tests
- Star topology scales better than full mesh for N colleagues

## 14. Disadvantages

- Mediator complexity grows as workflow grows (many steps, branches, compensations)
- Risk of **god mediator** if domain logic is dumped into orchestrator
- Overkill when only two components interact — direct dependency is simpler
- Single mediator can become bottleneck for team ownership (everyone edits it)
- Synchronous demo hides async/event-driven complexity in production

## 15. When to Use

1. Order checkout coordinating payment, inventory, notification, shipping
2. UI dialog where controls (list, text, button) interact via dialog mediator
3. Chat room routing messages between users without direct connections
4. Air traffic control — many agents coordinated by central tower
5. When colleagues would otherwise form a dense dependency mesh

## 16. When NOT to Use

1. Only two components with a clear direct relationship
2. Simple external API wrapper — **Facade** is enough
3. Pure broadcast notify — **Observer** or event bus may fit better
4. Workflow is already owned by a saga/orchestration engine (Temporal, Camunda)

## 17. Edge Cases / Production Concerns

| Concern | In this demo | Production note |
|---------|--------------|-----------------|
| **Failure mid-flow** | No rollback | Compensate: void payment if reserve fails |
| **Idempotency** | Single `placeOrder` call | Same orderId must not double-charge |
| **God mediator** | Thin demo | Push business rules back to colleagues |
| **Distributed peers** | In-process calls | Saga + outbox; mediator becomes orchestrator |
| **Async** | Synchronous sequence | Event-driven mediator for slow notification |
| **Testing** | Hard-coded colleagues | Inject colleagues via constructor for mocks |
| **Timeouts** | No timeout | Each step needs deadline and failure path |

## 18. Possible Code Improvements

### Required (correctness)

- Compensating transaction if `inventory.reserve` fails after `payment.authorize`
- Inject colleagues via constructor instead of `new` inside mediator (testability)
- Reject null or blank `orderId` in `placeOrder`

### Optional (clarity / prod)

- `ShippingService` colleague in sequence
- Event bus implementation of `Mediator` for async steps
- Structured result type instead of concatenated strings
- Separate `OrderWorkflow` from `OrderProcessingMediator` if orchestration grows

## 19. Mental Model

**Formula:**

```text
Problem:  N colleagues × N colleagues → mesh coupling
Solution: Hub mediator orchestrates → star topology, no peer calls
Benefit:  Add colleague / change workflow in one place
```

Memory trick: **"Air traffic control — planes don't talk to each other; tower coordinates."**

## 20. 30–60 Second Interview Answer

> **Mediator** encapsulates how a set of objects interact so they don't refer to each other explicitly. In checkout, Payment calling Inventory calling Notification creates spaghetti dependencies and circular imports — adding shipping means editing payment and inventory. **Mediator** gives a hub: `OrderProcessingMediator.placeOrder` runs authorize, reserve, and notify in sequence. Colleagues (`PaymentService`, `InventoryService`, `NotificationService`) never call each other — only the mediator invokes them. The client talks to the `Mediator` interface only. In our demo, `placeOrder("order-777")` returns `order-complete:order-777` after orchestrating all three steps. Differs from **Facade**: mediator coordinates **peers**; facade simplifies a subsystem for **outside** clients. Watch the god-mediator trap — keep domain logic in colleagues, orchestration in mediator.

## 21. Likely Interview Follow-ups

| Question | Answer sketch |
|----------|---------------|
| Mediator vs Facade? | Mediator: **peer** mesh → star; Facade: **external** client → subsystem |
| vs Event bus? | Event bus is often a mediator implementation — async fan-out vs sync sequence |
| God object risk? | Keep orchestration in mediator; business rules in colleagues |
| vs Saga? | Distributed checkout uses saga orchestrator — conceptually a mediator across services |
| How test without mesh? | Inject mock colleagues into mediator; verify call order |

**Common mistake:** Colleagues still calling each other "just one direct call" — breaks the pattern and recreates the mesh.

---

## Run

```bash
cd java-design-patterns-real-world
mvn -q exec:java -Dexec.mainClass=com.example.designpatterns.behavioral.mediator.OrderProcessingMediatorDemo
```
