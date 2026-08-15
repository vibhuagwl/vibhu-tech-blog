# State — Interview Explanation Board

> **Demo:** `PaymentStateDemo` — `src/main/java/com/example/designpatterns/behavioral/state/PaymentStateDemo.java`

## 1. Pattern Identification

| Field | Value |
|-------|-------|
| **Name** | State |
| **Category** | Behavioral |
| **One-line definition** | Allow an object to alter its behavior when its internal state changes; object appears to change its class. |
| **Problem class** | Payment lifecycle managed by string status flags and illegal operations in wrong phase. |

## 2. Problem We Are Solving

Payment flows: CREATED → AUTHORIZED → CAPTURED → SETTLED → COMPLETED (or FAILED). Bugs call `capture()` before `authorize()`. Giant `switch(status)` spreads illegal-transition checks. FAILED and COMPLETED paths interleave in one class.

## 3. What Happens Without the Pattern

```java
if (status.equals("CREATED")) { authorize(); status = "AUTHORIZED"; }
if (status.equals("CREATED")) { capture(); } // bug — should fail
```

Pains: stringly status, illegal ops slip through, transition rules duplicated.

## 4. How the Pattern Solves It

1. **State interface** — `PaymentState` with `authorize()`, `capture()`, `settle()`, `complete()`, `fail()`
2. **Concrete states** — `CreatedState`, `AuthorizedState`, `CapturedState`, `SettledState`, `CompletedState`, `FailedState`
3. **Context** — `Payment` holds current `PaymentState`, delegates transitions
4. Illegal ops throw `IllegalStateException` from current state

## 5. Pattern → Code Mapping

| Role | Demo type | Why |
|------|-----------|-----|
| **State** | `PaymentState` interface | Ops per lifecycle phase |
| **Concrete states** | `CreatedState`, `AuthorizedState`, etc. | Legal transitions only |
| **Context** | `Payment` | `state` field + `timeline` |
| **Client** | `PaymentStateDemo.run()` | Drives authorize→capture→settle→complete |

## 6. Important Code Lines

| Code | Significance |
|------|--------------|
| `CreatedState.capture()` throws "authorize first" | Illegal op blocked in state |
| `CreatedState.authorize()` → `AuthorizedState` | Legal transition returns new state |
| `Payment.authorize()` — `state = state.authorize()` | Context updates state |
| `timeline` list | Audit of state names |
| `FailedState` — all ops throw with reason | Terminal failure state |

## 7. Object/Class Diagram

```text
Payment (context)
  - state: PaymentState
  - timeline

PaymentState
  ▲
  ├── CreatedState → authorize → AuthorizedState
  ├── AuthorizedState → capture → CapturedState
  ├── CapturedState → settle → SettledState
  ├── SettledState → complete → CompletedState
  └── FailedState (terminal)
```

## 8. Runtime Execution Flow

```text
payment = new Payment()
  timeline: [CREATED]

payment.authorize()  → AUTHORIZED
payment.capture()    → CAPTURED
payment.settle()     → SETTLED
payment.complete()   → COMPLETED

timeline: [CREATED, AUTHORIZED, CAPTURED, SETTLED, COMPLETED]
current state: COMPLETED
```

`capture()` on CREATED would throw before authorize.

## 9. What the Client Doesn't Need to Know

- Which concrete state class is active
- Transition rules — calls `payment.capture()` and state enforces
- State object reuse (states can be flyweight singletons)

## 10. Before vs After

**Before:** String status + switch + scattered guards.

**After:** Context delegates to state objects; illegal ops throw from state.

## 11. SOLID / Design Principles

| Principle | Application |
|-----------|-------------|
| **SRP** | Each state class owns its transition rules |
| **OCP** | New state without editing all switches |
| **vs Strategy** | State: behavior changes with **lifecycle**; Strategy: pick **algorithm** |

## 12. Extensibility

- New state: `RefundedState` with its allowed ops
- State singletons (stateless state objects)
- Persist `state.name()` to DB enum

## 13. Advantages

- Explicit illegal transition errors
- Transition logic localized per state
- Timeline/audit friendly

## 14. Disadvantages

- Many classes for complex lifecycles
- State explosion if many dimensions
- Overkill for 2-state on/off

## 15. When to Use

1. Payment authorize/capture/settle lifecycle
2. Document workflow (draft/review/published)
3. TCP connection states

## 16. When NOT to Use

1. Behavior doesn't depend on lifecycle — Strategy
2. Simple enum + switch sufficient for 2-3 states

## 17. Edge Cases / Production Concerns

| Concern | Note |
|---------|------|
| Persistence | Store status enum; rehydrate state object on load |
| Distributed | State machine + saga for cross-service |
| Concurrency | Optimistic lock on status column |
| Partial failure | FAILED state with reason |

## 18. Possible Code Improvements

**Required:** Map `name()` to persisted enum; idempotent transitions.

**Optional:** State flyweights; Spring Statemachine for complex flows.

## 19. Mental Model

**"Traffic light modes."** Red light rejects go; green allows — behavior is in the mode, not the driver.

## 20. 30–60 Second Interview Answer

> State lets an object change behavior when internal state changes. Payment with string status allows capture before authorize. Each lifecycle phase is a `PaymentState` — `CreatedState.authorize()` returns `AuthorizedState`; `CreatedState.capture()` throws. `Payment` context delegates `authorize()`, `capture()`, etc., updating `state` and `timeline`. Demo runs CREATED→AUTHORIZED→CAPTURED→SETTLED→COMPLETED. Differs from Strategy: State models **lifecycle transitions**, not interchangeable algorithms.

## 21. Likely Interview Follow-ups

| Question | Answer |
|----------|--------|
| State vs Strategy? | State: transitions + lifecycle; Strategy: swap algorithm |
| vs enum switch? | State spreads rules across classes; enum switch centralizes |
| State pattern objects singleton? | Often yes — stateless flyweights |

**Common mistake:** Using State when only algorithm varies — that's Strategy.

---

## Run

```bash
cd java-design-patterns-real-world
mvn -q exec:java -Dexec.mainClass=com.example.designpatterns.behavioral.state.PaymentStateDemo
```
