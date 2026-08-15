# State — Interview Explanation Board

> **Demo:** `PaymentStateDemo` — `src/main/java/com/example/designpatterns/behavioral/state/PaymentStateDemo.java`

## 1. Pattern Identification

| Field | Value |
|-------|-------|
| **Name** | State |
| **Category** | Behavioral |
| **One-line definition** | Let an object alter its behavior when its internal state changes; state-specific classes encapsulate legal operations and transitions instead of giant status switches. |
| **Problem class** | Payment lifecycle (`CREATED` → `AUTHORIZED` → `CAPTURED` → `SETTLED` → `COMPLETED`) implemented as string flags and `switch` statements that allow illegal moves like `capture()` before `authorize()`. |

## 2. Problem We Are Solving

A payment gateway tracks **lifecycle phases**. Each phase allows only certain operations:

```text
CREATED     → authorize() or fail()
AUTHORIZED  → capture() or fail()
CAPTURED    → settle() or fail()
SETTLED     → complete() only (fail blocked)
COMPLETED   → terminal — all ops rejected
FAILED      → terminal — all ops rejected with reason
```

Example happy path:

```text
CREATED → AUTHORIZED → CAPTURED → SETTLED → COMPLETED
```

The painful questions:

> How do we stop `capture()` from running when status is still `CREATED`?

> How do we record every transition for audit without scattering `if (status.equals(...))` across the codebase?

Relationships that make this hard:

- **Context** (`Payment`) — holds current phase; exposes `authorize()`, `capture()`, etc.
- **State** — behavior of each operation **depends on current phase**
- **Illegal transition** — must fail loudly (`IllegalStateException`), not silently
- **Timeline** — audit needs ordered history: `["CREATED", "AUTHORIZED", "CAPTURED", ...]`

## 3. What Happens Without the Pattern

Naive payment code uses a string status and central switch:

```java
public class Payment {
    private String status = "CREATED";

    public void capture() {
        if (status.equals("CREATED")) {
            throw new IllegalStateException("authorize first");
        }
        if (status.equals("AUTHORIZED")) {
            status = "CAPTURED";
            return;
        }
        if (status.equals("CAPTURED")) {
            throw new IllegalStateException("already captured");
        }
        // ... 20 more branches for FAILED, COMPLETED, settle, complete ...
    }
}
```

Concrete pains:

1. **Illegal transitions slip through** — typo in status string; `capture()` before `authorize()` in production
2. **Giant switch per method** — `authorize()`, `capture()`, `settle()`, `complete()`, `fail()` each duplicate status checks
3. **FAILED and COMPLETED paths interleave** — easy to allow `fail()` after settlement
4. **Every new state** edits every operation method
5. **Timeline logic duplicated** — `timeline.add(status)` forgotten in one branch

SOLID hits: **OCP** (new phase edits all methods), **SRP** (one class owns all transition rules).

## 4. How the Pattern Solves It

Conceptual chain:

1. **Problem** — string status + switches; illegal lifecycle moves hide in nested `if`
2. **Naive pain** — each operation method re-checks every status value
3. **Pattern introduces** — `PaymentState` interface with `authorize()`, `capture()`, `settle()`, `complete()`, `fail()`, `name()`
4. **Concrete states** — `CreatedState`, `AuthorizedState`, `CapturedState`, `SettledState`, `CompletedState`, `FailedState`
5. **Legal ops return next state** — `CreatedState.authorize()` → `new AuthorizedState()`
6. **Illegal ops throw** — `CreatedState.capture()` → `IllegalStateException("authorize first")`
7. **Context delegates** — `Payment` holds `PaymentState state`; each public method replaces `state = state.operation()`
8. **Timeline** — context appends `state.name()` after every transition

Behavior moves **from switches into state objects**.

## 5. Pattern → Code Mapping

| Pattern role | Demo class / type | Why this role |
|--------------|-------------------|---------------|
| **State** | `PaymentState` (interface) | Operation contract per lifecycle event |
| **Concrete State** | `CreatedState`, `AuthorizedState`, `CapturedState`, `SettledState`, `CompletedState`, `FailedState` | Each encodes legal/illegal transitions for one phase |
| **Context** | `Payment` | Holds current `PaymentState`; delegates `authorize()` / `capture()` / …; records `timeline` |
| **Terminal state** | `CompletedState`, `FailedState` | No forward progress; all or most ops throw |
| **State data** | `FailedState.reason` | Phase-specific payload (failure reason in name) |
| **Client** | `PaymentStateDemo.run()` | Drives happy path; tests show failure and invalid capture |

## 6. Important Code Lines

| Code | Design significance |
|------|---------------------|
| `interface PaymentState { PaymentState authorize(); ... String name(); }` | Operations are polymorphic per phase |
| `CreatedState.authorize() → new AuthorizedState()` | Transition = return new state object |
| `CreatedState.capture() → throw IllegalStateException("authorize first")` | Illegal op rejected at source |
| `private PaymentState state = new CreatedState()` | Context starts in known initial state |
| `state = state.authorize(); timeline.add(state.name())` | Context updates reference + audit trail |
| `SettledState.fail() → throw "cannot fail after settlement"` | Business rule localized to settled phase |
| `FailedState.name() → "FAILED(" + reason + ")"` | Observable state includes domain detail |
| `List<String> timeline = new ArrayList<>(List.of(state.name()))` | Audit begins at CREATED |

## 7. Object/Class Diagram

```text
                    ┌─────────────────────────┐
                    │       Payment           │
                    │       (Context)         │
                    │ - state: PaymentState   │
                    │ - timeline: List        │
                    │ + authorize()           │
                    │ + capture()             │
                    │ + settle() / complete() │
                    │ + fail(reason)          │
                    └───────────┬─────────────┘
                                │ delegates
                                ▼
                    ┌─────────────────────────┐
                    │  <<interface>>          │
                    │  PaymentState             │
                    │  + authorize()            │
                    │  + capture()              │
                    │  + settle() / complete()  │
                    │  + fail(reason)           │
                    │  + name()                 │
                    └───────────┬─────────────┘
                                │
     ┌──────────┬───────────┬───┴───┬───────────┬──────────┐
     ▼          ▼           ▼       ▼           ▼          ▼
 Created    Authorized   Captured Settled   Completed   Failed
 State      State        State    State     State       State
     │          │           │       │           │          │
     └─authorize─┴─capture──┴─settle┴─complete──┘          │
              (happy path transitions)              reason field
```

## 8. Runtime Execution Flow

From `PaymentStateDemo.run()` — happy path:

```text
STEP 1 — Initialize:
  payment = new Payment()
  state = CreatedState
  timeline = ["CREATED"]

STEP 2 — authorize():
  CreatedState.authorize() → AuthorizedState
  timeline = ["CREATED", "AUTHORIZED"]

STEP 3 — capture():
  AuthorizedState.capture() → CapturedState
  timeline = [..., "CAPTURED"]

STEP 4 — settle():
  CapturedState.settle() → SettledState
  timeline = [..., "SETTLED"]

STEP 5 — complete():
  SettledState.complete() → CompletedState
  timeline = ["CREATED", "AUTHORIZED", "CAPTURED", "SETTLED", "COMPLETED"]
  payment.state() → "COMPLETED"

Failure path (from tests):
  payment.authorize()
  payment.fail("gateway-timeout")
  state → FailedState
  payment.state() → "FAILED(gateway-timeout)"

Invalid path (from tests):
  new Payment().capture()
  → CreatedState.capture()
  → IllegalStateException("authorize first")
```

The client calls `authorize()` / `capture()` — never sets status strings directly.

## 9. What the Client Doesn't Need to Know

- Which concrete class represents `AUTHORIZED` (`AuthorizedState`)
- Full transition table (what `CapturedState` allows on `settle()`)
- That states are typically **stateless flyweights** — new instance per transition
- How `FailedState` stores `reason` internally
- Whether persistence maps `name()` to DB enum column

Client mental model: **call lifecycle methods; context enforces legality**.

## 10. Before vs After

### Without State

```text
Client
  │
  ▼
Payment.capture()
  │
  └── switch (status string)
         ├── CREATED → throw
         ├── AUTHORIZED → status = CAPTURED
         ├── CAPTURED → throw
         ├── SETTLED → throw
         └── ... every status in every method
```

One class **knows all phases**.

### With State

```text
Client
  │
  ▼
Payment.capture()
  │
  └── state.capture()
         │
         ├── CreatedState → throw
         ├── AuthorizedState → CapturedState
         ├── CapturedState → throw
         └── SettledState → throw
```

**Current state object knows only its own rules.**

## 11. SOLID / Design Principles

| Principle | How State applies |
|-----------|-------------------|
| **Open/Closed** | New phase (`DisputedState`) = new class; existing states unchanged |
| **Single Responsibility** | `AuthorizedState` owns AUTHORIZED rules only |
| **Liskov** | Any `PaymentState` responds to operations; illegal ones throw consistently |
| **Tell, Don't Ask** | Client tells payment to `capture()`; does not read status then branch |
| **Replace conditional with polymorphism** | Core State benefit — no status `switch` in context |

## 12. Extensibility

| Change | Approach | Trade-off |
|--------|----------|-----------|
| New phase (`REFUNDED`) | New `RefundedState` + wire transitions from `CompletedState` | More classes |
| Persist to DB | Save `state.name()` after each transition | Rehydrate via factory from stored enum |
| Enum + State hybrid | `PaymentStatus` enum maps to state singletons | Less allocation; enum switch in factory only |
| Side effects on transition | Context callback after `state = ...` | Keep states pure; effects in context |
| Async gateway callbacks | State objects stay sync; context queues events | Do not block in state methods |

This demo uses **immutable transition** (return new state) — clear audit trail.

## 13. Advantages

- Illegal transitions throw at the offending phase — bugs surface immediately
- Each phase's rules live in one class — readable transition table
- Context (`Payment`) stays thin — delegate + timeline only
- Natural fit for payment, order, ticket, and workflow lifecycles
- Testable per state: `CreatedStateTest` only tests CREATED edges

## 14. Disadvantages

- Many classes for rich lifecycles (six states here)
- State explosion if operations × phases grow (consider event-driven or table-driven FSM)
- Easy to confuse with **Strategy** — State changes with lifecycle; Strategy is client-selected algorithm
- Returning new state objects allocates — flyweight/singleton states mitigate
- Persistence + rehydration adds factory complexity not shown in demo

## 15. When to Use

1. Payment lifecycle with strict ordering (this demo)
2. Order status: PLACED → SHIPPED → DELIVERED
3. Document workflow: DRAFT → REVIEW → PUBLISHED
4. When `switch (status)` appears in **multiple** methods on the same entity

## 16. When NOT to Use

1. Behavior does not depend on lifecycle — use **Strategy** for algorithm pick
2. Simple two-state toggle (on/off) — boolean or enum suffices
3. Transitions are data-driven rules edited by ops — external rules engine may fit better
4. Hundreds of states — generated FSM or state machine library

## 17. Edge Cases / Production Concerns

| Concern | In this demo | Production note |
|---------|--------------|-----------------|
| **Concurrency** | Single-threaded | Optimistic locking on status column; reject stale transition |
| **Rehydration** | In-memory only | `StateFactory.fromName("AUTHORIZED")` after DB load |
| **Partial failure** | `fail(reason)` from most states | Map gateway codes to `FailedState` |
| **Idempotent retry** | `AuthorizedState.authorize()` throws | Gateway retry must detect "already authorized" |
| **Timeline size** | Unbounded list | Persist events table; cap in-memory history |
| **SETTLED fail** | Blocked explicitly | Business policy — document why |
| **Observability** | `timeline()` list | Emit metric per transition: `payment.state.capture` |

## 18. Possible Code Improvements

### Required (correctness)

- Factory to rebuild `PaymentState` from persisted `name()` on load
- Document thread-safety expectations on `Payment` if shared

### Optional (clarity / prod)

- `enum PaymentStatus` mirrors `name()` for DB column
- Singleton state instances (`AuthorizedState.INSTANCE`) — states are stateless except `FailedState`
- `onEnter` / `onExit` hooks on context for side effects (webhooks)
- Separate read-only `PaymentView` from mutating `Payment` for API layer

## 19. Mental Model

**Formula:**

```text
Problem:  status string + switch → illegal moves, duplicated checks
Solution: One class per phase → operation behavior depends on current state object
Benefit:  capture() on CREATED throws inside CreatedState, not scattered ifs
```

Memory trick: **"The object changes personality when its phase changes."** Same `payment.capture()` call — different behavior in AUTHORIZED vs CREATED.

## 20. 30–60 Second Interview Answer

> **State** models lifecycle phases as objects so behavior changes without giant `switch` on status strings. Our payment moves CREATED → AUTHORIZED → CAPTURED → SETTLED → COMPLETED. Without State, `capture()` before `authorize()` slips through string flags. Each phase is a `PaymentState`: `CreatedState`, `AuthorizedState`, etc. Legal operations return the **next** state; illegal ones throw `IllegalStateException`. `Payment` delegates `authorize()` to `state.authorize()`, replaces `state`, and appends `state.name()` to a timeline. `FailedState` carries a reason and blocks further ops. Differs from **Strategy**: State transitions are **constrained by current phase**; Strategy is **client picks UPI vs CARD**.

## 21. Likely Interview Follow-ups

| Question | Answer sketch |
|----------|---------------|
| State vs Strategy? | State: object **is in** a phase; ops mean different things per phase. Strategy: same `pay()` call, client **picked** the algorithm |
| State vs enum + switch? | State spreads rules across classes (OCP); enum keeps one file (simpler for tiny FSMs) |
| How persist? | Store `state.name()` or enum; factory rebuilds `PaymentState` on load |
| Who owns side effects? | Context after transition — keep state objects pure |
| State pattern vs Spring Statemachine? | Pattern is in-process OO; libraries add persistence, guards, UIs |

**Common mistake:** Calling it State when the client freely swaps algorithms at will — that's **Strategy**.

---

## Run

```bash
cd java-design-patterns-real-world
mvn -q exec:java -Dexec.mainClass=com.example.designpatterns.behavioral.state.PaymentStateDemo
```
