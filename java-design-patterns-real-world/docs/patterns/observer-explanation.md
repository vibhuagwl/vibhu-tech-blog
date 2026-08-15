# Observer — Interview Explanation Board

> **Demo:** `PaymentObserverDemo` — `src/main/java/com/example/designpatterns/behavioral/observer/PaymentObserverDemo.java`

## 1. Pattern Identification

| Field | Value |
|-------|-------|
| **Name** | Observer |
| **Category** | Behavioral |
| **One-line definition** | Define a one-to-many dependency so when one object (subject) changes state, all dependents (observers) are notified automatically — without the subject knowing their concrete types. |
| **Problem class** | `PaymentService` hard-codes calls to email, audit, and analytics after every charge; adding a loyalty listener requires editing and redeploying the publisher. |

## 2. Problem We Are Solving

When a payment completes, **multiple independent systems** must react:

- **Audit** — compliance log of `paymentId`
- **Analytics** — funnel and revenue metrics
- **Email** — receipt to customer (not in demo, but typical)
- **Loyalty** — points accrual (future requirement)

Example event:

```text
PaymentCompletedEvent(paymentId="pay-obs-1", amount=450)
```

The painful questions:

> How do we add a loyalty listener without opening `PaymentService` and risking a production regression?

> How do we keep audit and analytics **decoupled** so one team's slow subscriber does not block payment core?

Relationships that make this hard:

- **Publisher** — payment domain completes a charge; should not import audit/analytics packages
- **Subscribers** — many, grow over time, owned by different teams
- **Event payload** — observers need `paymentId` and `amount`, not full `Payment` entity internals
- **Registration** — listeners attach at runtime (feature flags, plugins)

## 3. What Happens Without the Pattern

Naive payment completion couples every downstream system:

```java
public class PaymentService {
    private final EmailService email;
    private final AuditService audit;
    private final AnalyticsService analytics;

    public void completePayment(String paymentId, int amount) {
        // charge logic ...
        email.sendReceipt(paymentId);
        audit.log(paymentId, amount);
        analytics.trackRevenue(paymentId, amount);
        // loyalty? edit here again ...
    }
}
```

Concrete pains:

1. **Publisher knows all subscribers** — tight compile-time coupling to audit, analytics, email
2. **Adding loyalty** — edit `PaymentService`, retest entire charge path
3. **One slow listener blocks others** — synchronous call chain; analytics timeout fails receipt email
4. **Testing payment** — must mock audit + analytics + email for every unit test
5. **Circular dependency risk** — audit service imports payment types; payment imports audit

SOLID hits: **OCP** (new listener edits publisher), **DIP** (publisher depends on concrete audit classes).

## 4. How the Pattern Solves It

Conceptual chain:

1. **Problem** — payment core directly calls audit, analytics, email after every charge
2. **Naive pain** — every new listener edits publisher; synchronous fan-out blocks
3. **Pattern introduces** — `Observer` interface with `onPaymentCompleted(PaymentCompletedEvent)`
4. **Subject / event bus** — `PaymentEventBus` maintains `List<Observer>`; `register()` / `publish()`
5. **Concrete observers** — `CollectingObserver("audit")`, `CollectingObserver("analytics")` (stand-ins for real services)
6. **Event object** — `PaymentCompletedEvent` record pushes data; subject does not expose internals
7. **Publisher publishes once** — `bus.publish(event)`; each observer reacts independently

Fan-out moves **from hard-coded calls into registered observers**.

## 5. Pattern → Code Mapping

| Pattern role | Demo class / type | Why this role |
|--------------|-------------------|---------------|
| **Subject** | `PaymentEventBus` | Maintains observer list; `publish()` notifies all |
| **Observer** | `Observer` (interface) | `onPaymentCompleted(PaymentCompletedEvent)` callback |
| **Concrete Observer** | `CollectingObserver` | Named stand-in for audit/analytics; records received events |
| **Event** | `PaymentCompletedEvent` (record) | Immutable push payload: `paymentId`, `amount` |
| **Client** | `PaymentObserverDemo.run()` | Registers observers, publishes one event, prints results |

Note: This demo uses an explicit **event bus** as subject — payment core would call `bus.publish()` after charge success.

## 6. Important Code Lines

| Code | Design significance |
|------|---------------------|
| `record PaymentCompletedEvent(String paymentId, int amount)` | Push model — observers get data, not subject reference |
| `interface Observer { void onPaymentCompleted(...); }` | Uniform subscription contract |
| `List<Observer> observers = new ArrayList<>()` | Subject owns subscriber registry |
| `register(Observer observer)` | Runtime attachment — no publisher code change |
| `publish(PaymentCompletedEvent event)` | Single entry point for fan-out |
| `observers.forEach(o -> o.onPaymentCompleted(event))` | Notify all; order = registration order |
| `CollectingObserver("audit")` + `received.add(name + ":" + event.paymentId())` | Traceable stand-in for real audit sink |
| `received()` exposes list for demo verification | Test asserts `"audit:p1"` independently |

## 7. Object/Class Diagram

```text
                    ┌─────────────────────────┐
                    │   PaymentEventBus       │
                    │   (Subject)             │
                    │ - observers: List     │
                    │ + register(observer)    │
                    │ + publish(event)        │
                    └───────────┬─────────────┘
                                │
              publish           │  notify (for each)
              PaymentCompletedEvent
                                │
              ┌─────────────────┼─────────────────┐
              │                 │                 │
    ┌─────────▼─────────┐ ┌─────▼──────┐  ┌──────▼──────────┐
    │ CollectingObserver│ │ Collecting │  │ (future)        │
    │ name: "audit"     │ │ Observer   │  │ LoyaltyObserver │
    │ onPaymentCompleted│ │ "analytics"│  │                 │
    └───────────────────┘ └────────────┘  └─────────────────┘
              │                 │
              └──── implements ─┘
                        │
              ┌─────────▼─────────┐
              │  <<interface>>    │
              │  Observer         │
              │  + onPayment...() │
              └───────────────────┘

    PaymentCompletedEvent ──► passed to each onPaymentCompleted()
```

## 8. Runtime Execution Flow

From `PaymentObserverDemo.run()`:

```text
STEP 1 — Register observers:
  bus = new PaymentEventBus()
  auditObserver = new CollectingObserver("audit")
  analyticsObserver = new CollectingObserver("analytics")
  bus.register(auditObserver)
  bus.register(analyticsObserver)

STEP 2 — Publish event:
  bus.publish(PaymentCompletedEvent("pay-obs-1", 450))

STEP 3 — Fan-out (synchronous in demo):
  auditObserver.onPaymentCompleted(event)
    → received = ["audit:pay-obs-1"]
  analyticsObserver.onPaymentCompleted(event)
    → received = ["analytics:pay-obs-1"]

STEP 4 — Output:
  Audit received: [audit:pay-obs-1]
  Analytics received: [analytics:pay-obs-1]

Test path (PaymentObserverDemoTest):
  publish(PaymentCompletedEvent("p1", 100))
  audit.received() contains "audit:p1"
  notify.received() contains "notify:p1"
```

Publisher never imports `CollectingObserver` — only `Observer` interface at registration boundary.

## 9. What the Client Doesn't Need to Know

- How many observers are registered on the bus
- Concrete classes implementing audit vs analytics
- Order observers run (unless ordering is a documented guarantee)
- Whether observers are sync or async in production (demo is sync)
- Internal list implementation in `PaymentEventBus`

Client mental model: **register listeners once, publish event, done**.

## 10. Before vs After

### Without Observer

```text
PaymentService.completePayment()
  │
  ├── email.sendReceipt()
  ├── audit.log()
  ├── analytics.track()
  └── (edit file to add loyalty)
```

Publisher **knows every subscriber**.

### With Observer

```text
PaymentService (or bus).publish(event)
  │
  └── PaymentEventBus
         ├── Observer (audit)
         ├── Observer (analytics)
         └── Observer (loyalty) ← register without editing publisher
```

**Subscribers attach; publisher only knows `Observer` interface.**

## 11. SOLID / Design Principles

| Principle | How Observer applies |
|-----------|---------------------|
| **Open/Closed** | New listener = new `Observer` class + `register()` — publisher unchanged |
| **Single Responsibility** | Payment core charges; audit observer audits |
| **Dependency Inversion** | Subject depends on `Observer` abstraction, not `AuditService` concrete |
| **Interface Segregation** | Narrow callback: one event type, one method |
| **Loose coupling** | Core pattern goal — publish/subscribe boundary |

## 12. Extensibility

| Change | Approach | Trade-off |
|--------|----------|-----------|
| New listener (loyalty) | `bus.register(new LoyaltyObserver())` | Zero publisher edit |
| Unsubscribe | Add `unregister(Observer)` | Weak references or explicit remove |
| Async fan-out | `@Async` or message queue per listener | Eventual consistency; harder debugging |
| Filtered subscribe | `register(Observer, Predicate<Event>)` | Bus complexity grows |
| Cross-process | Kafka/RabbitMQ instead of in-process list | True distributed observer; not this pattern's scope |

Demo is **in-process synchronous** — document prod upgrade path to messaging.

## 13. Advantages

- Decouples payment completion from audit, analytics, email
- New listeners without redeploying payment core (if wiring is external)
- Multiple reactions to one business event — natural fit
- Easy to test observers in isolation with synthetic events
- Event object (`PaymentCompletedEvent`) stable contract for subscribers

## 14. Disadvantages

- Notification order may matter but is implicit (list iteration order)
- Synchronous `forEach` — one throwing observer can break others (demo has no isolation)
- Debugging fan-out harder than linear code ("who handled this event?")
- Memory leak if observers not unregistered (long-lived bus, short-lived UI)
- Not a distributed bus — `java.util.Observable` legacy; cross-service needs messaging
- Can obscure control flow — "what runs after pay?" requires reading all observers

## 15. When to Use

1. Payment completed → audit + analytics + email (this demo)
2. UI model changes → multiple widgets refresh
3. Domain events in DDD — aggregate publishes, handlers subscribe
4. Plugin architectures — listeners register at startup

## 16. When NOT to Use

1. **One** hard-wired collaborator — direct method call is simpler
2. Request/response needed from subscriber — use command/query, not fire-and-forget
3. Cross-service fan-out at scale — message broker, not in-memory list
4. Guaranteed delivery / ordering — needs transactional outbox, not naive Observer

## 17. Edge Cases / Production Concerns

| Concern | In this demo | Production note |
|---------|--------------|-----------------|
| **Observer failure** | No try/catch per listener | Wrap each call; log and continue |
| **Reentrancy** | `publish` during `onPaymentCompleted` | Copy observer list before iterate |
| **Thread safety** | `ArrayList` not concurrent | `CopyOnWriteArrayList` or synchronized register |
| **Unregister** | No `unregister` | Prevent leaks on shutdown |
| **Async** | Sync forEach | Queue to executor; monitor lag |
| **Idempotency** | Observers may receive duplicate publish | Idempotent handlers keyed by `paymentId` |
| **PII in event** | Only id + amount | Minimize payload; GDPR retention on audit observer |

## 18. Possible Code Improvements

### Required (correctness)

- Per-observer try/catch in `publish()` so one failure does not abort fan-out
- Snapshot copy: `new ArrayList<>(observers)` before iteration (safe against concurrent register)

### Optional (clarity / prod)

- `unregister(Observer)` and weak references for UI bindings
- `@EventListener` Spring abstraction over manual bus
- Structured logging: `log.info("publish", event)` with correlation ID
- Replace demo bus with Kafka topic `payment.completed` for multi-service

## 19. Mental Model

**Formula:**

```text
Problem:  Publisher calls audit, analytics, email directly → coupling
Solution: Subject maintains Observer list → publish(event) fans out
Benefit:  New listener registers without editing payment core
```

Memory trick: **"Radio broadcast."** Station transmits once; any tuned receiver listens — station does not know who owns each radio.

## 20. 30–60 Second Interview Answer

> **Observer** decouples a one-to-many notification: when payment completes, many systems must react. Without it, `PaymentService` hard-codes audit and analytics calls — adding loyalty means editing the publisher. We introduce `PaymentEventBus` as subject, `Observer` interface with `onPaymentCompleted`, and immutable `PaymentCompletedEvent`. `CollectingObserver` stands in for audit and analytics. Client registers both, calls `publish(event)`, and each observer records independently — `audit:pay-obs-1` and `analytics:pay-obs-1`. Publisher never imports concrete listener classes. In production, wrap each notification in try/catch and consider async messaging for cross-service fan-out. Differs from **Mediator**: Observer is broadcast; Mediator centralizes complex colleague coordination.

## 21. Likely Interview Follow-ups

| Question | Answer sketch |
|----------|---------------|
| Observer vs Mediator? | Observer: subject notifies many subscribers. Mediator: colleagues talk **through** hub with rich protocols |
| Observer vs Pub/Sub (Kafka)? | Observer is in-process OO; Kafka is distributed, durable, consumer groups |
| What if observer throws? | Catch per listener; dead-letter failed handlers; never abort entire fan-out |
| `java.util.Observable`? | Legacy, deprecated — explicit interface + event object preferred |
| Event sourcing? | Observer is notification; event sourcing stores events as source of truth |

**Common mistake:** Using Observer for request/response ("observer, give me a result") — use callback or query bus instead.

---

## Run

```bash
cd java-design-patterns-real-world
mvn -q exec:java -Dexec.mainClass=com.example.designpatterns.behavioral.observer.PaymentObserverDemo
```
