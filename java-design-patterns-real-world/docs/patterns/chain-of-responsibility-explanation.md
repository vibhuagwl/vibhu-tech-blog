# Chain of Responsibility — Interview Explanation Board

> **Demo:** `PaymentValidationChainDemo` — `src/main/java/com/example/designpatterns/behavioral/chainofresponsibility/PaymentValidationChainDemo.java`

## 1. Pattern Identification

| Field | Value |
|-------|-------|
| **Name** | Chain of Responsibility |
| **Category** | Behavioral |
| **One-line definition** | Pass a request along a chain of handlers; each handler decides whether to process, reject, or forward — avoiding a monolithic validator with nested if-else. |
| **Problem class** | `validatePayment()` grows into a 200-line method chaining auth, amount, fraud, and account checks; reordering or adding KYC means editing the monolith and retesting everything. |

## 2. Problem We Are Solving

Before a payment is accepted, it must pass **ordered validation gates**:

```text
Authentication → Amount → Fraud → Account
```

Each gate inspects one concern on `PaymentRequest`:

```text
PaymentRequest(userId="user-1", amount=500, fraudFlag=false, accountActive=true)
```

Failure codes:

| Validator | Rejects when | Code returned |
|-----------|--------------|---------------|
| `AuthenticationValidator` | `userId` blank | `AUTH_FAIL` |
| `AmountValidator` | `amount <= 0` | `BAD_AMOUNT` |
| `FraudValidator` | `fraudFlag == true` | `FRAUD` |
| `AccountValidator` | `accountActive == false` | `ACCOUNT_BLOCKED` |

The painful questions:

> How do we insert a KYC validator between fraud and account without rewriting the mega-method?

> How do we short-circuit on first failure with a **clear error code** instead of buried `return` statements?

Relationships that make this hard:

- **Request** — shared `PaymentRequest` record passed down the chain
- **Handler** — one class per validation concern
- **Order matters** — auth before amount before fraud (cheap checks first is a design choice)
- **Short-circuit** — first non-`OK` result stops the chain

## 3. What Happens Without the Pattern

Naive validation nests every check in one method:

```java
public String validatePayment(PaymentRequest request) {
    if (request.userId().isBlank()) {
        return "AUTH_FAIL";
    }
    if (request.amount() <= 0) {
        return "BAD_AMOUNT";
    }
    if (request.fraudFlag()) {
        return "FRAUD";
    }
    if (!request.accountActive()) {
        return "ACCOUNT_BLOCKED";
    }
    return "OK";
}
```

Concrete pains:

1. **Monolith grows** — KYC, velocity limits, sanctions lists added to same method
2. **Reorder risk** — moving fraud before auth requires careful edit + full retest
3. **Mixed ownership** — fraud team and account team edit the same file
4. **Early returns buried** — nested if-else in larger flows hides failure paths
5. **No reuse** — cannot run `FraudValidator` alone in admin replay tool

SOLID hits: **OCP** (new check edits monolith), **SRP** (one method owns all validation concerns).

## 4. How the Pattern Solves It

Conceptual chain:

1. **Problem** — one `validatePayment()` with sequential if checks
2. **Naive pain** — reordering or adding gates edits central method
3. **Pattern introduces** — abstract `Validator` with `check(request)` and `validate(request)` orchestration
4. **Linking** — `linkWith(next)` wires `Authentication → Amount → Fraud → Account`
5. **Each handler** — implements `check()` returning `"OK"` or error code
6. **Orchestration** — `validate()` calls `check()`; if `OK` and `next != null`, delegate; else return result
7. **Short-circuit** — first non-`OK` stops propagation automatically

Validation logic moves **from one method into linked handler objects**.

## 5. Pattern → Code Mapping

| Pattern role | Demo class / type | Why this role |
|--------------|-------------------|---------------|
| **Handler** | `Validator` (abstract) | `check()` hook + `validate()` chain walk + `linkWith()` |
| **Concrete Handler** | `AuthenticationValidator`, `AmountValidator`, `FraudValidator`, `AccountValidator` | One concern per class |
| **Request** | `PaymentRequest` (record) | Shared context: `userId`, `amount`, `fraudFlag`, `accountActive` |
| **Chain head** | `AuthenticationValidator` instance | Entry point for `validate()` |
| **Linking API** | `linkWith(Validator next)` returns `next` for fluent wiring | `a.linkWith(b).linkWith(c)` |
| **Client** | `PaymentValidationChainDemo.run()` | Builds chain, validates valid and fraud requests |

## 6. Important Code Lines

| Code | Design significance |
|------|---------------------|
| `abstract class Validator { private Validator next; }` | Successor pointer forms the chain |
| `linkWith(Validator next) { this.next = next; return next; }` | Fluent builder; returns next for chaining |
| `validate(request) { result = check(request); return OK && next != null ? next.validate(request) : result; }` | Short-circuit + delegate template |
| `protected abstract String check(PaymentRequest request)` | Subclass implements one concern only |
| `AuthenticationValidator: userId blank → AUTH_FAIL` | Fail fast on missing identity |
| `FraudValidator: fraudFlag → FRAUD` | Isolated fraud rule — fraud team owns this class |
| `AccountValidator: !accountActive → ACCOUNT_BLOCKED` | Final gate before acceptance |
| Chain build: `new AuthenticationValidator().linkWith(...).linkWith(...)` | Composition root wires order explicitly |

## 7. Object/Class Diagram

```text
  Client.validate(request)
         │
         ▼
┌────────────────────┐     next    ┌─────────────────┐     next
│ Authentication     │────────────►│ AmountValidator │────────────► ...
│ Validator          │             │ check: amount>0 │
│ check: userId set  │             └─────────────────┘
└────────────────────┘
         │ fail "AUTH_FAIL" → return (chain stops)

... ──► ┌─────────────────┐     next    ┌──────────────────┐
        │ FraudValidator  │────────────►│ AccountValidator │
        │ check: !fraud   │             │ check: active    │
        └─────────────────┘             └──────────────────┘
                                              │ OK → "OK"
                                              │ fail → "ACCOUNT_BLOCKED"

                    ┌─────────────────────────┐
                    │  Validator (abstract)   │
                    │  - next: Validator      │
                    │  + linkWith(next)         │
                    │  + validate(request)      │
                    │  # check(request) abstract│
                    └─────────────────────────┘
                              ▲
              ┌───────────────┼───────────────┐
              │               │               │
        Authentication   AmountValidator  FraudValidator  AccountValidator
```

## 8. Runtime Execution Flow

From `PaymentValidationChainDemo.run()`:

```text
STEP 1 — Build chain:
  chain = new AuthenticationValidator()
  chain.linkWith(new AmountValidator())
       .linkWith(new FraudValidator())
       .linkWith(new AccountValidator())

STEP 2 — Valid request:
  valid = PaymentRequest("user-1", 500, fraudFlag=false, accountActive=true)
  chain.validate(valid):
    AuthenticationValidator.check() → "OK" → delegate
    AmountValidator.check()         → "OK" → delegate
    FraudValidator.check()          → "OK" → delegate
    AccountValidator.check()        → "OK" → no next → "OK"
  Output: Valid request: OK

STEP 3 — Fraud request:
  fraud = PaymentRequest("user-1", 500, fraudFlag=true, accountActive=true)
  chain.validate(fraud):
    AuthenticationValidator.check() → "OK" → delegate
    AmountValidator.check()         → "OK" → delegate
    FraudValidator.check()          → "FRAUD" → return "FRAUD" (short-circuit)
    AccountValidator never runs
  Output: Fraud flagged: FRAUD

Test path:
  fraud request → assert result == "FRAUD"
```

Cheap checks run first; expensive fraud still before account in this wiring.

## 9. What the Client Doesn't Need to Know

- How many validators exist in the chain
- Internal `check()` implementation of each validator
- That `linkWith` returns `next` for fluent chaining
- Order of validators unless ordering is part of API contract
- Whether a handler processed or passed through (only final code matters)

Client mental model: **call `validate(request)` on chain head; get `OK` or error code**.

## 10. Before vs After

### Without Chain

```text
validatePayment(request)
  │
  ├── if auth fail → return
  ├── if amount fail → return
  ├── if fraud fail → return
  └── if account fail → return
```

One function **owns all gates**.

### With Chain

```text
chain.validate(request)
  │
  ▼
AuthenticationValidator ──OK──► AmountValidator ──OK──► FraudValidator ──FRAUD──► STOP
```

**Each handler owns one gate; chain owns order.**

## 11. SOLID / Design Principles

| Principle | How Chain applies |
|-----------|-------------------|
| **Open/Closed** | New `KycValidator` class + insert in chain wiring — no edit to existing validators |
| **Single Responsibility** | `FraudValidator` only checks `fraudFlag` |
| **Liskov** | Any `Validator` can be chained; `validate()` behavior consistent |
| **Composition** | Chain built by linking objects, not inheritance hierarchy |
| **Separation of wiring** | Build chain in composition root / factory — not in business code |

## 12. Extensibility

| Change | Approach | Trade-off |
|--------|----------|-----------|
| Add KYC gate | `fraud.linkWith(new KycValidator()).linkWith(account)` | Wiring file changes; handlers unchanged |
| Reorder gates | Re-link in factory | Document why order matters |
| Parallel checks | Not this pattern — async gather or rules engine | Chain is inherently sequential |
| Rich errors | Return `ValidationResult` object instead of `String` | More type-safe |
| Conditional chain | Different chain per payment type | Multiple factory methods |

Demo uses **string codes** — production may prefer typed results.

## 13. Advantages

- Splits monolithic validator into focused classes
- Reorder chain in one wiring location
- Short-circuit on first failure with explicit code
- Each handler unit-testable: `FraudValidatorTest` only fraud cases
- Teams own handlers independently (fraud team owns `FraudValidator`)

## 14. Disadvantages

- Chain order implicit in wiring — wrong order causes subtle bugs
- Debugging "which handler failed?" requires tracing (mitigate with logging)
- Overkill for 2–3 trivial checks — plain method may suffice
- Returning `String` codes is fragile — typos, no compiler help
- Not ideal when **every** step must always run (audit all failures) — need composite result

## 15. When to Use

1. Payment validation pipeline (this demo)
2. HTTP filter chains (servlet filters, Spring `HandlerInterceptor`)
3. Logging pipelines, middleware stacks
4. Support ticket escalation — L1 → L2 → L3 until handled

## 16. When NOT to Use

1. Every step must run regardless — collect all errors; use validator list + aggregate
2. Fixed pipeline with one varying step — **Template Method** may fit
3. Complex boolean rules — rules engine or decision table
4. Handlers need bidirectional communication — **Mediator**

## 17. Edge Cases / Production Concerns

| Concern | In this demo | Production note |
|---------|--------------|-----------------|
| **Null next** | Terminal handler returns last result | Always terminate chain explicitly |
| **NPE on missing link** | Last handler has `next == null` | Factory validates full chain |
| **Mutable request** | `PaymentRequest` is record (immutable) | Good — handlers cannot corrupt shared state |
| **Idempotency** | Validators should be side-effect free | Side effects (hold funds) belong after chain passes |
| **Observability** | No logging | Log handler name + result on each step |
| **Performance** | Sync sequential | Cache account status; parallelize independent checks separately |
| **False negative order** | Auth before amount | Document: fail cheap checks first |

## 18. Possible Code Improvements

### Required (correctness)

- Typed `ValidationResult` enum instead of raw `String`
- Factory class `PaymentValidationChainFactory.build()` — business code never wires ad hoc

### Optional (clarity / prod)

- Log at each `check()`: `log.debug("validator={} result={}", name, result)`
- `Optional<Validator> next` for explicit termination
- Servlet-style: separate `handle(request, chain)` for "pass to next" control
- Metrics: counter per failure code `validation.failure.FRAUD`

## 19. Mental Model

**Formula:**

```text
Problem:  One validate() method with nested ifs → unmaintainable
Solution: Linked handlers → each check() one concern → validate() walks chain
Benefit:  Insert KYC by linking; first failure short-circuits with clear code
```

Memory trick: **"Airport security line."** Each station checks one thing; fail one station, you do not proceed — order is defined when the line is built.

## 20. 30–60 Second Interview Answer

> **Chain of Responsibility** passes a request through linked handlers until one rejects or all pass. Our problem is `validatePayment()` as a monolith of auth, amount, fraud, and account checks — adding KYC means editing everything. Abstract `Validator` has `check()` and `validate()` that delegates to `next` when result is `OK`. Concrete handlers: `AuthenticationValidator`, `AmountValidator`, `FraudValidator`, `AccountValidator`. We wire with `linkWith` fluent API. Valid request walks full chain → `OK`. Fraud flag stops at `FraudValidator` → `FRAUD`; account check never runs. Each class owns one concern; order is configured at composition root. Differs from **Decorator** (add behavior) and **Composite** (tree structure) — Chain is linear pass/fail pipeline.

## 21. Likely Interview Follow-ups

| Question | Answer sketch |
|----------|---------------|
| Chain vs Filter (Servlet)? | Same idea — servlet filters are Chain of Responsibility |
| Chain vs Pipeline that runs all steps? | Chain short-circuits; pipeline collects all results |
| Who builds the chain? | Factory / Spring config — not scattered in controllers |
| Can handler skip self? | Override `validate()` to delegate without `check()` — document carefully |
| Chain vs AOP? | AOP weaves cross-cutting advice; Chain is explicit ordered objects |

**Common mistake:** Putting business mutation inside validators — keep handlers **pure checks**; mutate after chain returns `OK`.

---

## Run

```bash
cd java-design-patterns-real-world
mvn -q exec:java -Dexec.mainClass=com.example.designpatterns.behavioral.chainofresponsibility.PaymentValidationChainDemo
```
