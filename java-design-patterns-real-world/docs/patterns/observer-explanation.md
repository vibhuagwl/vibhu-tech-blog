# Observer — Interview Explanation Board

> **Demo:** `PaymentObserverDemo` — `src/main/java/com/example/designpatterns/behavioral/observer/PaymentObserverDemo.java`

## 1. Pattern Identification

| Field | Value |
|-------|-------|
| **Name** | Observer |
| **Category** | Behavioral |
| **One-line definition** | Define a one-to-many dependency so when one object changes state, all dependents are notified and updated automatically. |
| **Problem class** | Publisher hard-codes calls to email, audit, analytics after every payment. |

## 2. Problem We Are Solving

After `charge()` succeeds, platform must notify audit, analytics, email, loyalty. `PaymentService` directly calls each listener — adding loyalty means editing and redeploying the publisher. Slow subscriber blocks others if not isolated.

## 3. What Happens Without the Pattern

```java
void charge() {
  // core logic
  audit.log();
  analytics.track();
  email.send();
  // new loyalty here — edit publisher
}
```

Pains: tight coupling, publisher knows all subscribers, hard to add/remove listeners at runtime.

## 4. How the Pattern Solves It

1. **Subject/Event bus** — `PaymentEventBus` with `register` and `publish`
2. **Observer** — `Observer.onPaymentCompleted(event)`
3. **Concrete observers** — `CollectingObserver` (audit, analytics stand-ins)
4. **Event** — `PaymentCompletedEvent(paymentId, amount)`
5. Publisher only knows `Observer` interface

## 5. Pattern → Code Mapping

| Role | Demo type | Why |
|------|-----------|-----|
| **Subject** | `PaymentEventBus` | Maintains observer list, publishes |
| **Observer** | `Observer` interface | `onPaymentCompleted` |
| **Concrete observer** | `CollectingObserver` | Records events per name |
| **Event** | `PaymentCompletedEvent` | Payload pushed to observers |
| **Client** | `PaymentObserverDemo.run()` | Register + publish |

## 6. Important Code Lines

| Code | Significance |
|------|--------------|
| `List<Observer> observers` | Subscriber registry |
| `register(Observer observer)` | Runtime subscription |
| `publish(PaymentCompletedEvent event)` | Fan-out `forEach(onPaymentCompleted)` |
| `CollectingObserver` — `received.add(name + ":" + paymentId)` | Independent handling |

## 7. Object/Class Diagram

```text
PaymentEventBus (subject)
    │
    ├── register ──► Observer (audit)
    ├── register ──► Observer (analytics)
    │
    publish(event) ──► notifies all observers
```

## 8. Runtime Execution Flow

```text
bus = new PaymentEventBus()
auditObserver = new CollectingObserver("audit")
analyticsObserver = new CollectingObserver("analytics")
bus.register(auditObserver)
bus.register(analyticsObserver)

bus.publish(PaymentCompletedEvent("pay-obs-1", 450))

auditObserver.received → ["audit:pay-obs-1"]
analyticsObserver.received → ["analytics:pay-obs-1"]
```

Publisher never names audit or analytics classes.

## 9. What the Client Doesn't Need to Know

- Which observers registered
- Observer count at publish time
- Individual observer implementation

## 10. Before vs After

**Before:** Publisher → audit, analytics, email hard-coded.

**After:** Publisher → bus.publish → registered observers.

## 11. SOLID / Design Principles

| Principle | Application |
|-----------|-------------|
| **OCP** | New observer without editing publisher |
| **DIP** | Publisher depends on `Observer` interface |
| **Loose coupling** | One-way notification |

## 12. Extensibility

- Unsubscribe/remove observer
- Async dispatch per observer
- Kafka as distributed observer bus (cross-process)

## 13. Advantages

- Dynamic subscribe/unsubscribe
- Add listeners without publisher changes
- Multiple independent reactions to one event

## 14. Disadvantages

- Order of notification undefined
- One slow observer blocks sync `forEach` — isolate failures
- Debugging fan-out harder
- Not distributed by itself — use messaging for cross-service

## 15. When to Use

1. Payment completed → audit + analytics + email
2. UI model-view notify
3. In-process event fan-out

## 16. When NOT to Use

1. Single hard-wired collaborator — direct call simpler
2. Cross-service — message broker instead

## 17. Edge Cases / Production Concerns

| Concern | Note |
|---------|------|
| Observer failure | Catch per listener; don't abort others |
| Reentrant publish | Observer triggers another publish |
| Memory leaks | Unregister on destroy |
| Threading | Sync vs async notification |

## 18. Possible Code Improvements

**Required:** Per-observer try/catch; async executor for slow listeners.

**Optional:** Weak references for auto-unregister; reactive streams.

## 19. Mental Model

**"Newsletter subscribers."** Publisher sends one email; subscribers react independently.

## 20. 30–60 Second Interview Answer

> Observer defines one-to-many notification when state changes. PaymentService hard-coding audit and analytics after charge means every new listener edits the publisher. `PaymentEventBus` registers `Observer` instances and `publish(PaymentCompletedEvent)` fans out to `onPaymentCompleted`. Demo uses `CollectingObserver` for audit and analytics — both receive `pay-obs-1` independently. Publisher only knows Observer interface. For cross-service fan-out use Kafka — in-process Observer is not a distributed bus.

## 21. Likely Interview Follow-ups

| Question | Answer |
|----------|--------|
| Observer vs Pub/Sub? | Pub/Sub often message broker; Observer in-process |
| vs Mediator? | Observer: subject notifies observers; Mediator: coordinates peers |
| java.util.Observable? | Legacy — prefer explicit interface |

**Common mistake:** One slow observer blocking all — isolate with async/error handling.

---

## Run

```bash
cd java-design-patterns-real-world
mvn -q exec:java -Dexec.mainClass=com.example.designpatterns.behavioral.observer.PaymentObserverDemo
```
