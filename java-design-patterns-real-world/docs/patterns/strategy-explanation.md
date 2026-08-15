# Strategy — Interview Explanation Board

> **Demo:** `PaymentStrategyDemo` — `src/main/java/com/example/designpatterns/behavioral/strategy/PaymentStrategyDemo.java`

## 1. Pattern Identification

| Field | Value |
|-------|-------|
| **Name** | Strategy |
| **Category** | Behavioral |
| **One-line definition** | Define a family of algorithms, encapsulate each one, and make them interchangeable. |
| **Problem class** | Giant switch on payment method (UPI, CARD, PayPal) inside one service method. |

## 2. Problem We Are Solving

`PaymentService.pay()` switches on UPI, CARD, PAYPAL, BANK_TRANSFER. Each rail has different charge logic and recurring eligibility. Adding UPI edits the same method and all tests. Recurring rules mix with rail-specific code.

## 3. What Happens Without the Pattern

```java
switch (method) {
  case UPI: ...
  case CARD: ...
  // grows forever
}
```

Pains: OCP violation, untestable mega-method, mixed concerns.

## 4. How the Pattern Solves It

1. **Strategy** — `PaymentStrategy.pay(PaymentRequest)` + `supportsRecurring()`
2. **Concrete strategies** — `UpiPaymentStrategy`, `CardPaymentStrategy`, `PaypalPaymentStrategy`, `BankTransferStrategy`
3. **Context** — `PaymentService` + `PaymentMethodRouter`
4. **Router** — `EnumMap` resolves strategy by `PaymentMethod`

## 5. Pattern → Code Mapping

| Role | Demo type | Why |
|------|-----------|-----|
| **Strategy** | `PaymentStrategy` | Algorithm interface |
| **Concrete strategies** | `UpiPaymentStrategy`, `CardPaymentStrategy`, etc. | Per-rail logic |
| **Context** | `PaymentService` | Delegates `process()` |
| **Router** | `PaymentMethodRouter` | O(1) strategy lookup |
| **Request** | `PaymentRequest`, `PaymentReceipt` | Input/output |
| **Client** | `PaymentStrategyDemo.run()` | UPI + CARD payments |

## 6. Important Code Lines

| Code | Significance |
|------|--------------|
| `EnumMap<PaymentMethod, PaymentStrategy> strategies` | Registry dispatch |
| `router.resolve(method)` | Context gets strategy |
| `if (request.recurring() && !strategy.supportsRecurring())` | Cross-cutting check in context |
| `UpiPaymentStrategy.supportsRecurring() → false` | Rail-specific capability |
| `strategy.pay(request)` | Polymorphic charge |

## 7. Object/Class Diagram

```text
PaymentService (context)
    │
    ▼ resolve
PaymentMethodRouter
    │
    ├── UpiPaymentStrategy
    ├── CardPaymentStrategy
    ├── PaypalPaymentStrategy
    └── BankTransferStrategy
```

## 8. Runtime Execution Flow

```text
service = new PaymentService()

service.pay("UPI", 500)
  → resolve(UPI) → UpiPaymentStrategy
  → pay → "UPI:500" (via receipt)

service.process(CARD, PaymentRequest(..., recurring=true))
  → CardPaymentStrategy.supportsRecurring() true
  → receipt: Stripe — CARD success for 900
```

## 9. What the Client Doesn't Need to Know

- Which strategy class handles UPI vs CARD
- Router map contents
- Provider names (Razorpay-UPI, Stripe) unless reading receipt

## 10. Before vs After

**Before:** `PaymentService` switch on method type.

**After:** `PaymentService` → router → `PaymentStrategy.pay()`.

## 11. SOLID / Design Principles

| Principle | Application |
|-----------|-------------|
| **OCP** | New rail = new strategy class + map entry |
| **SRP** | Each strategy one rail |
| **DIP** | Context depends on `PaymentStrategy` interface |

## 12. Extensibility

- New `CryptoPaymentStrategy` + enum value
- Inject strategies for testing
- Strategy per tenant configuration

## 13. Advantages

- Eliminates growing switch
- Strategies testable independently
- Runtime algorithm selection

## 14. Disadvantages

- Many classes for many rails
- Context must know how to pick strategy
- vs State: Strategy for algorithms, not lifecycle

## 15. When to Use

1. Multiple payment rails (UPI, card, PayPal)
2. Pricing/discount algorithms
3. Sorting/compression strategy selection

## 16. When NOT to Use

1. Behavior changes with lifecycle — State
2. One algorithm forever

## 17. Edge Cases / Production Concerns

| Concern | Note |
|---------|------|
| Unknown method | Fail if `resolve` returns null |
| Strategy state | Prefer stateless strategies |
| Recurring rules | Context or strategy — document ownership |
| Feature flags | Router picks strategy variant |

## 18. Possible Code Improvements

**Required:** Throw on unknown `PaymentMethod`; null-safe resolve.

**Optional:** Inject `Map<PaymentMethod, PaymentStrategy>` via Spring.

## 19. Mental Model

**"Payment app picker."** Same checkout button; behind it swaps UPI vs card processor.

## 20. 30–60 Second Interview Answer

> Strategy encapsulates interchangeable algorithms behind one interface. `PaymentService.pay()` as switch on UPI/CARD/PayPal grows with every rail. Each rail is a `PaymentStrategy` — `UpiPaymentStrategy`, `CardPaymentStrategy`, etc. `PaymentMethodRouter` resolves from `EnumMap`. `PaymentService.process()` checks recurring support then delegates `strategy.pay(request)`. New rail adds class and registry entry — no switch growth. Differs from State: Strategy swaps **charge algorithm**; State models **lifecycle phase**.

## 21. Likely Interview Follow-ups

| Question | Answer |
|----------|--------|
| Strategy vs State? | Strategy: pick algorithm; State: lifecycle transitions |
| vs Factory? | Factory creates objects; Strategy executes behavior |
| Functional interface? | `PaymentStrategy` can be lambda for simple rails |

**Common mistake:** Giant switch remaining in context — move all branches to strategies.

---

## Run

```bash
cd java-design-patterns-real-world
mvn -q exec:java -Dexec.mainClass=com.example.designpatterns.behavioral.strategy.PaymentStrategyDemo
```
