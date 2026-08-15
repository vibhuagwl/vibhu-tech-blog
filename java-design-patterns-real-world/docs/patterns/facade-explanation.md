# Facade — Interview Explanation Board

> **Demo:** `PaymentFacadeDemo` — `src/main/java/com/example/designpatterns/structural/facade/PaymentFacadeDemo.java`

## 1. Pattern Identification

| Field | Value |
|-------|-------|
| **Name** | Facade |
| **Category** | Structural |
| **One-line definition** | Provide a unified, higher-level interface to a set of interfaces in a subsystem, simplifying use for clients. |
| **Problem class** | Clients must orchestrate many payment subsystems in correct order with consistent error handling. |

## 2. Problem We Are Solving

Mobile checkout API must: fraud check → account balance → charge → notify customer → audit. Controllers duplicate this orchestration; under pressure teams **skip audit** or mishandle fraud rejection. Each client reimplements the same five-service wiring.

## 3. What Happens Without the Pattern

```java
if (!fraud.ok(amount)) return reject;
if (!account.hasBalance(id)) return reject;
String ref = payment.charge(id, amount);
notification.notifyCustomer(id);
audit.audit(id);
```

Pains: duplicated orchestration, inconsistent rejection paths, controllers know subsystem details.

## 4. How the Pattern Solves It

1. **Subsystems** — `FraudService`, `AccountService`, `PaymentService`, `NotificationService`, `AuditService`
2. **Facade** — `PaymentFacade.processDetailed(accountId, amount)`
3. **Orchestration** — ordered steps, early return on fraud/account failure
4. **Outcome** — `PaymentOutcome(status, reference, steps)` single response

## 5. Pattern → Code Mapping

| Role | Demo type | Why |
|------|-----------|-----|
| **Facade** | `PaymentFacade` | Single entry `processDetailed` |
| **Subsystems** | `FraudService`, `AccountService`, `PaymentService`, `NotificationService`, `AuditService` | Independent services |
| **DTO** | `PaymentOutcome` | Aggregated result |
| **Client** | `PaymentFacadeDemo.run()` | One facade call |

## 6. Important Code Lines

| Code | Significance |
|------|--------------|
| `if (!fraud.ok(amount)) return rejected:fraud` | Early exit orchestration |
| `payment.charge(accountId, amount)` | Core step after gates |
| `steps.add(...)` | Trace for debugging/support |
| `processPayment` → `processDetailed().status()` | Simpler API variant |

## 7. Object/Class Diagram

```text
Client
   │
   ▼
PaymentFacade
   ├── FraudService
   ├── AccountService
   ├── PaymentService
   ├── NotificationService
   └── AuditService
```

## 8. Runtime Execution Flow

```text
facade.processDetailed("acct-555", 300)
  steps: fraud-check → OK (300 < 5000)
  steps: account-check → OK
  steps: charge → "charged:acct-555:300"
  steps: notified:acct-555
  steps: audit:acct-555
  PaymentOutcome("success", reference, steps)
```

Fraud amount ≥ 5000 would return `rejected:fraud` after first step only.

## 9. What the Client Doesn't Need to Know

- Individual subsystem classes
- Order of fraud vs account check
- That five services exist behind one method

## 10. Before vs After

**Before:** Client wires 5 services + branching.

**After:** Client → `PaymentFacade.processDetailed(...)`.

## 11. SOLID / Design Principles

| Principle | Application |
|-----------|-------------|
| **SRP** | Subsystems own domain; facade orchestrates |
| **Facade not god class** | Coordinate only — rules stay in services |
| **DIP** | Client depends on facade API |

## 12. Extensibility

- New step: KYC service in facade pipeline
- Different facades: `RefundFacade`, `MobilePaymentFacade`
- Trade-off: facade grows — consider workflow engine for complex flows

## 13. Advantages

- Simple client API
- Consistent orchestration and rejection handling
- Subsystems remain decoupled from each other

## 14. Disadvantages

- Facade can become god service if all logic moves in
- Extra layer for trivial one-service calls
- vs Mediator: Facade for **external** clients; Mediator for **peer** coordination

## 15. When to Use

1. Mobile API over fraud+ledger+gateway+notify
2. Legacy subsystem cluster with one modern entry
3. Onboarding devs to complex payment pipeline

## 16. When NOT to Use

1. Single service call — no subsystem
2. Peers must talk symmetrically — Mediator

## 17. Edge Cases / Production Concerns

| Concern | Note |
|---------|------|
| Partial failure | Charge succeeded but notify failed — compensating saga |
| Idempotency | Facade entry should accept idempotency key |
| Testing | Mock subsystems; test facade orchestration |
| Transaction boundaries | Facade doesn't imply one DB transaction |

## 18. Possible Code Improvements

**Required:** Compensating actions on notify/audit failure after charge.

**Optional:** Inject subsystems; async notify; structured `PaymentOutcome` errors.

## 19. Mental Model

**"Hotel concierge."** Client asks one desk; desk coordinates housekeeping, billing, valet.

## 20. 30–60 Second Interview Answer

> Facade provides a simple interface over a complex subsystem. Checkout must run fraud, balance, charge, notify, and audit in order — controllers duplicating that miss steps. `PaymentFacade.processDetailed` orchestrates `FraudService`, `AccountService`, `PaymentService`, `NotificationService`, and `AuditService`, returning `PaymentOutcome` with status, reference, and step trace. Subsystems stay separate; facade is the only orchestration point for mobile API clients.

## 21. Likely Interview Follow-ups

| Question | Answer |
|----------|--------|
| Facade vs Mediator? | Facade simplifies for **outside** client; Mediator stops **peer** direct calls |
| vs API Gateway? | Gateway is network facade; this is in-process |
| God class risk? | Keep domain rules in subsystems |

**Common mistake:** Putting all business logic in facade — should orchestrate only.

---

## Run

```bash
cd java-design-patterns-real-world
mvn -q exec:java -Dexec.mainClass=com.example.designpatterns.structural.facade.PaymentFacadeDemo
```
