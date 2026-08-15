# Chain of Responsibility — Interview Explanation Board

> **Demo:** `PaymentValidationChainDemo` — `src/main/java/com/example/designpatterns/behavioral/chainofresponsibility/PaymentValidationChainDemo.java`

## 1. Pattern Identification

| Field | Value |
|-------|-------|
| **Name** | Chain of Responsibility |
| **Category** | Behavioral |
| **One-line definition** | Pass a request along a chain of handlers; each decides to handle it or forward to the next. |
| **Problem class** | Monolithic validation with nested if-else for auth, amount, fraud, account checks. |

## 2. Problem We Are Solving

`validatePayment()` grows into a 200-line method: authenticate user, validate amount, check fraud flag, verify account active. Reordering checks (fraud before amount) or adding KYC means editing the monolith and retesting everything.

## 3. What Happens Without the Pattern

Single method with nested if-else, early returns buried deep, every new check edits core validation, handlers not reusable across APIs (checkout vs refund).

## 4. How the Pattern Solves It

1. **Handler** — abstract `Validator` with `check()` and `linkWith(next)`
2. **Concrete handlers** — `AuthenticationValidator`, `AmountValidator`, `FraudValidator`, `AccountValidator`
3. **Chain** — `auth.linkWith(amount).linkWith(fraud).linkWith(account)`
4. **validate()** — runs `check()`; if OK and next exists, forwards; else returns result

## 5. Pattern → Code Mapping

| Role | Demo type | Why |
|------|-----------|-----|
| **Handler** | `Validator` | `validate()`, `linkWith()`, abstract `check()` |
| **Concrete handlers** | `AuthenticationValidator`, `AmountValidator`, `FraudValidator`, `AccountValidator` | One concern each |
| **Request** | `PaymentRequest` record | Context passed along chain |
| **Client** | `PaymentValidationChainDemo.run()` | Builds chain, validates requests |

## 6. Important Code Lines

| Code | Significance |
|------|--------------|
| `linkWith(Validator next)` | Builds chain, returns next for fluent linking |
| `result.equals("OK") && next != null ? next.validate(request)` | Forward on success |
| `AuthenticationValidator` — blank userId → `AUTH_FAIL` | Short-circuit fail |
| `FraudValidator` — fraudFlag → `FRAUD` | Stops chain with code |

## 7. Object/Class Diagram

```text
AuthenticationValidator → AmountValidator → FraudValidator → AccountValidator
        │                      │                │                  │
   check(userId)          check(amount)    check(fraud)    check(account)
```

## 8. Runtime Execution Flow

```text
chain = AuthenticationValidator
  .linkWith(AmountValidator)
  .linkWith(FraudValidator)
  .linkWith(AccountValidator)

valid = PaymentRequest("user-1", 500, false, true)
chain.validate(valid)
  → AUTH OK → AMOUNT OK → FRAUD OK → ACCOUNT OK → "OK"

fraud = PaymentRequest("user-1", 500, true, true)
chain.validate(fraud)
  → AUTH OK → AMOUNT OK → FRAUD → "FRAUD" (stops, no account check)
```

## 9. What the Client Doesn't Need to Know

- Chain order or which handler failed internally
- Individual handler classes — only calls `chain.validate(request)`

## 10. Before vs After

**Before:** One mega-method with all checks intertwined.

**After:** Linked validators; client submits request to chain head.

## 11. SOLID / Design Principles

| Principle | Application |
|-----------|-------------|
| **OCP** | New validator plugs in without editing others |
| **SRP** | Each validator one rule |
| **Single chain wiring** | Composition root builds order |

## 12. Extensibility

- Add `KycValidator` — link in factory
- Different chains per flow (refund skips fraud)
- Return structured `ValidationResult` vs string codes

## 13. Advantages

- Reorder handlers by re-linking
- Add/remove checks independently
- Clear failure codes per handler

## 14. Disadvantages

- No guarantee every handler runs — by design
- Chain order bugs if wired wrong
- Debugging which handler failed needs tracing

## 15. When to Use

1. Payment validation pipeline
2. Servlet filter chains
3. Logging pipelines with optional stages

## 16. When NOT to Use

1. Fixed pipeline where every step must always run — Template Method or simple list
2. Handlers need complex branching — workflow engine

## 17. Edge Cases / Production Concerns

| Concern | Note |
|---------|------|
| Null terminator | Chain ends when `next == null` |
| Partial success | Document short-circuit vs accumulate errors |
| Async handlers | Chain usually synchronous |
| Order | Fraud before charge authorization |

## 18. Possible Code Improvements

**Required:** Wire chain in factory, not ad hoc in controllers.

**Optional:** `ValidationResult` enum; parallel validation where independent.

## 19. Mental Model

**"Airport security lanes."** Each station pass or stop; don't reach gate if one fails.

## 20. 30–60 Second Interview Answer

> Chain of Responsibility passes a request through linked handlers until one handles or fails. `validatePayment()` with nested auth/amount/fraud/account ifs is hard to extend. Abstract `Validator` links via `linkWith`; each concrete validator implements `check()`. `validate()` returns failure code or forwards to next on OK. Demo chains Authentication → Amount → Fraud → Account; fraud-flagged request stops at `FRAUD` without account check. New validators plug in without editing existing handlers.

## 21. Likely Interview Follow-ups

| Question | Answer |
|----------|--------|
| vs Decorator? | Chain may not reach end; decorator always wraps delegate |
| vs Filter chain? | Servlet filters are Chain of Responsibility |
| Multiple failures? | Accumulate errors or first-fail — design choice |

**Common mistake:** Putting business charge logic in validators — keep validation only.

---

## Run

```bash
cd java-design-patterns-real-world
mvn -q exec:java -Dexec.mainClass=com.example.designpatterns.behavioral.chainofresponsibility.PaymentValidationChainDemo
```
