# Facade — Interview Explanation Board

> **Demo:** `PaymentFacadeDemo` — `src/main/java/com/example/designpatterns/structural/facade/PaymentFacadeDemo.java`

## 1. Pattern Identification

| Field | Value |
|-------|-------|
| **Name** | Facade |
| **Category** | Structural |
| **One-line definition** | Provide a unified, simplified interface to a set of interfaces in a subsystem so clients interact with one entry point instead of many. |
| **Problem class** | Orchestration complexity — multiple collaborating services must be called in order, with consistent failure handling, and every client repeats the same wiring. |

## 2. Problem We Are Solving

A mobile payments API must process a charge through **five subsystems**:

```text
1. FraudService        — block suspicious amounts
2. AccountService      — verify account has balance
3. PaymentService      — charge the card / ledger
4. NotificationService — tell customer payment succeeded
5. AuditService        — record compliance trail
```

Correct order matters:

```text
fraud → account → charge → notify → audit
```

If fraud fails at ₹5000+, stop immediately — do not charge or notify.

Example happy path: `processDetailed("acct-555", 300)` → success with reference and step list.

The painful question:

> How can a mobile controller charge a customer **without** knowing five services, their order, and what to do when fraud rejects?

Relationships that make this hard:

- **Controller / client** — wants "process payment"
- **Subsystems** — each owns one concern; none knows the full workflow
- **Orchestration** — belongs somewhere, but not copy-pasted in every API endpoint

## 3. What Happens Without the Pattern

Every client wires subsystems manually:

```java
// MobileController
if (!fraud.ok(amount)) return rejected;
if (!account.hasBalance(accountId)) return rejected;
String ref = payment.charge(accountId, amount);
notification.notifyCustomer(accountId);
audit.audit(accountId);
return success(ref);

// WebhookHandler — forgot notification under pressure
if (!fraud.ok(amount)) return;
payment.charge(accountId, amount);
audit.audit(accountId);  // customer never notified

// AdminRefundTool — wrong order
payment.charge(...);
if (!fraud.ok(amount)) ...  // too late
```

Concrete pains:

1. **Duplicated orchestration** — same five-step dance in every entry point
2. **Missed steps** — one handler skips notification or audit
3. **Inconsistent rejection** — different error shapes per client
4. **Hard to change workflow** — add KYC step → edit every controller
5. **Fat controllers** — HTTP layer owns domain orchestration

SOLID hits: **SRP** (controller owns HTTP + payment pipeline), **OCP** (new step edits all clients), **DIP** (clients depend on five concrete services).

## 4. How the Pattern Solves It

Conceptual chain:

1. **Problem** — five subsystems, strict order, repeated in every client
2. **Naive pain** — controllers duplicate fraud → account → charge → notify → audit
3. **Pattern introduces** — `PaymentFacade` with `processDetailed(accountId, amount)`
4. **Facade orchestrates** — calls subsystems in order, records steps, returns `PaymentOutcome`
5. **Early exit on failure** — fraud or account rejection returns without charge
6. **Client simplifies** — `facade.processDetailed("acct-555", 300)`

Orchestration moves **from scattered clients into one facade**.

## 5. Pattern → Code Mapping

| Pattern role | Demo class / type | Why this role |
|--------------|-------------------|---------------|
| **Facade** | `PaymentFacade` | Single entry: `processPayment`, `processDetailed` |
| **Subsystem** | `FraudService`, `AccountService`, `PaymentService`, `NotificationService`, `AuditService` | Independent domain services |
| **Result DTO** | `PaymentOutcome` (record) | Unified status, reference, steps list |
| **Client** | `PaymentFacadeDemo.run()` | Calls facade once; reads outcome |

Facade **coordinates** — it does not reimplement fraud rules inside `FraudService`.

## 6. Important Code Lines

| Code | Design significance |
|------|---------------------|
| `record PaymentOutcome(String status, String reference, List<String> steps)` | One coherent response for clients |
| `if (!fraud.ok(amount)) return new PaymentOutcome("rejected:fraud", "", steps)` | Early exit — subsystem logic stays in `FraudService` |
| `String reference = payment.charge(accountId, amount)` | Charge only after fraud + account pass |
| `steps.add(notification.notifyCustomer(accountId))` | Side-effect steps recorded in outcome trail |
| `processPayment()` delegates to `processDetailed().status()` | Simple API for callers that only need status string |

## 7. Object/Class Diagram

```text
┌─────────────────┐
│ Client          │
│ (mobile API)    │
└────────┬────────┘
         │ processDetailed(acct, amount)
         ▼
┌─────────────────────────────────────────────┐
│ PaymentFacade                               │
│ + processPayment(accountId, amount)         │
│ + processDetailed(accountId, amount)        │
└──┬──────┬──────┬──────┬──────┬──────────────┘
   │      │      │      │      │
   ▼      ▼      ▼      ▼      ▼
┌──────┐┌──────┐┌──────┐┌──────┐┌──────┐
│Fraud ││Account││Payment││Notify││Audit │
│Service││Service││Service││Service││Service│
└──────┘└──────┘└──────┘└──────┘└──────┘
   subsystem classes — unchanged, loosely coupled to each other
```

## 8. Runtime Execution Flow

From `PaymentFacadeDemo.run()` — `processDetailed("acct-555", 300)`:

```text
steps = []
steps.add("fraud-check")
  fraud.ok(300) → true (300 < 5000)

steps.add("account-check")
  account.hasBalance("acct-555") → true

steps.add("charge")
  payment.charge("acct-555", 300) → "charged:acct-555:300"

steps.add(notification.notifyCustomer("acct-555"))
  → "notified:acct-555"

steps.add(audit.audit("acct-555"))
  → "audit:acct-555"

return PaymentOutcome(
  status    = "success",
  reference = "charged:acct-555:300",
  steps     = [fraud-check, account-check, charge, notified:..., audit:...]
)
```

Rejection path (`amount = 6000`):

```text
steps = [fraud-check]
fraud.ok(6000) → false
return PaymentOutcome("rejected:fraud", "", steps)
  → no charge, no notify, no audit
```

## 9. What the Client Doesn't Need to Know

- That five separate services exist behind the facade
- Correct call order (fraud before charge)
- What happens when fraud blocks — facade returns structured rejection
- Individual return strings from notification vs audit
- How `FraudService` decides threshold (5000) — only outcome status matters

Client mental model: **one call, one `PaymentOutcome`**.

## 10. Before vs After

### Without Facade

```text
Mobile API ──► Fraud → Account → Payment → Notify → Audit
Web API    ──► Fraud → Account → Payment → (missed Notify) → Audit
Batch job  ──► Payment → Fraud  (wrong order)
```

Each client **orchestrates** the subsystem graph.

### With Facade

```text
Mobile API ──┐
Web API    ──┼──► PaymentFacade.processDetailed()
Batch job  ──┘           │
                         ├── FraudService
                         ├── AccountService
                         ├── PaymentService
                         ├── NotificationService
                         └── AuditService
```

**Facade orchestrates; clients do not.**

## 11. SOLID / Design Principles

| Principle | How Facade applies |
|-----------|-------------------|
| **Single Responsibility** | Each subsystem owns one concern; facade owns workflow order |
| **Open/Closed** | Add `KycService` step inside facade without changing subsystem APIs |
| **Dependency Inversion** | Clients depend on `PaymentFacade`, not five services |
| **Interface Segregation** | `processPayment` for simple callers; `processDetailed` for observability |
| **Loose coupling** | Subsystems don't reference each other — only facade wires them |

## 12. Extensibility

| Change | Approach | Trade-off |
|--------|----------|-----------|
| Add KYC step | Insert in `processDetailed` before charge | Facade grows; subsystems stay focused |
| Different flows (refund) | `RefundFacade` or separate method | Avoid one god facade for all use cases |
| Async notification | Facade fires async after charge | Client still one call; complexity inside |
| Inject subsystems | Constructor DI instead of `new` in facade | Better testing — mock `FraudService` |

Keep business rules in subsystems — facade should not embed `amount < 5000` inline.

## 13. Advantages

- Simple client API over complex subsystem
- Consistent workflow — no missed steps
- Single place to update orchestration order
- Subsystems remain independently testable
- Clear boundary between "use case" and "domain services"

## 14. Disadvantages

- Facade can become a **god service** if every use case lands there
- Hides subsystem richness — power users may need direct access
- Another layer — debugging requires stepping into facade
- Risk of putting business logic in facade instead of subsystems
- Not a substitute for proper domain modeling (DDD application service)

## 15. When to Use

1. Mobile/API layer needs one "process payment" over many services
2. Legacy subsystem sprawl — unify entry for new features
3. Onboarding — new developers call facade first, learn subsystems later
4. Consistent error handling and step tracing (`PaymentOutcome.steps`)
5. Library or framework exposing simplified API over complex internals

## 16. When NOT to Use

1. Only one class behind the call — no subsystem to simplify
2. Clients need fine-grained control over each step every time
3. Facade would duplicate an existing application service layer
4. You're trying to **convert interfaces** — that's Adapter
5. You need to **wrap one object with extra behavior** — Decorator

## 17. Edge Cases / Production Concerns

| Concern | In this demo | Production note |
|---------|--------------|-----------------|
| **Partial failure** | Charge succeeds; notify fails? | Saga / compensation; idempotent notify |
| **Transactions** | No rollback | `@Transactional` on charge + ledger only |
| **Idempotency** | None | Facade accepts idempotency key, dedupes charge |
| **Observability** | Steps in outcome | Correlate trace ID across subsystem calls |
| **Testing** | Hard-coded `new` services | Inject mocks via constructor |
| **Concurrency** | Synchronous | Async facade method for long pipelines |

## 18. Possible Code Improvements

### Required (correctness)

- Constructor injection for all five services (testability)
- Handle notify/audit failure after successful charge (compensating action or retry queue)

### Optional (clarity / prod)

- Separate `PaymentApplicationService` name in DDD projects
- Domain events instead of direct notify/audit calls
- `PaymentOutcome` as sealed hierarchy (`Success`, `RejectedFraud`, …)
- Metrics per step latency inside facade

## 19. Mental Model

**Formula:**

```text
Problem:  N subsystems × M clients → duplicated orchestration
Solution: Facade exposes one method, coordinates subsystems internally
Benefit:  Clients get simple API; workflow lives in one place
```

Memory trick: **"Hotel concierge — you ask once; they coordinate the backstage."**

## 20. 30–60 Second Interview Answer

> **Facade** provides a simplified interface to a complex subsystem. Our payment flow needs fraud check, account balance, charge, customer notification, and audit — in that order, with early exit on rejection. Without Facade, every controller duplicates those five calls and sometimes skips steps. `PaymentFacade.processDetailed` orchestrates: fraud → account → charge → notify → audit, returning a `PaymentOutcome` with status, reference, and a steps list. For `acct-555` and amount 300, fraud passes, account passes, charge returns `charged:acct-555:300`, then notify and audit run. Clients call one method — they don't wire five services. Subsystems keep their own logic; the facade only coordinates. It's not Adapter — we're not converting interfaces, we're hiding orchestration complexity.

## 21. Likely Interview Follow-ups

| Question | Answer sketch |
|----------|---------------|
| Facade vs Mediator? | Facade is **one-way** simplification for clients; Mediator **bi-directional** communication between colleagues |
| Facade vs API Gateway? | Gateway is network-level routing; Facade is in-process structural pattern |
| Can subsystems use facade? | Avoid circular deps — subsystems should not call facade |
| God facade anti-pattern? | Split by use case: `PaymentFacade`, `RefundFacade` |
| Does facade violate Law of Demeter? | Intentionally — clients trade knowledge for simplicity |

**Common mistake:** Putting all business rules inside the facade — orchestrate, don't reimplement `FraudService.ok`.

---

## Run

```bash
cd java-design-patterns-real-world
mvn -q exec:java -Dexec.mainClass=com.example.designpatterns.structural.facade.PaymentFacadeDemo
```
