# Strategy — Interview Explanation Board

> **Demo:** `PaymentStrategyDemo` — `src/main/java/com/example/designpatterns/behavioral/strategy/PaymentStrategyDemo.java`

## 1. Pattern Identification

| Field | Value |
|-------|-------|
| **Name** | Strategy |
| **Category** | Behavioral |
| **One-line definition** | Define a family of interchangeable algorithms, encapsulate each one, and let the client select the right algorithm at runtime without conditional branching in the context. |
| **Problem class** | A single service method (`PaymentService.pay()`) grows a `switch` on payment rails (UPI, CARD, PAYPAL, BANK_TRANSFER), mixing charge logic with cross-cutting eligibility rules. |

## 2. Problem We Are Solving

A checkout service must charge customers through **multiple payment rails**. Each rail behaves differently:

- **UPI** — Razorpay-UPI provider; does **not** support recurring
- **CARD** — Stripe provider; supports recurring
- **PAYPAL** — PayPal provider; supports recurring
- **BANK_TRANSFER** — SWIFT provider; does **not** support recurring

Example request:

```text
PaymentRequest(customerId="cust-9", amount=900, currency="USD", recurring=true)
PaymentMethod = CARD
```

The painful questions:

> How do we add a fifth rail without editing `PaymentService.pay()` and retesting every existing rail?

> How do we keep recurring eligibility rules from leaking into UPI-specific charge code?

Relationships that make this hard:

- **Context** (`PaymentService`) — orchestrates checkout; should not know Stripe vs Razorpay internals
- **Algorithm** — rail-specific charge logic (`pay()`)
- **Capability** — `supportsRecurring()` differs per rail
- **Selection** — caller picks `PaymentMethod` at runtime (customer choice, geo, feature flag)

## 3. What Happens Without the Pattern

Naive checkout code branches on method type inside one method:

```java
public PaymentReceipt pay(PaymentMethod method, PaymentRequest request) {
    if (request.recurring()) {
        if (method == PaymentMethod.UPI || method == PaymentMethod.BANK_TRANSFER) {
            throw new IllegalArgumentException(method + " does not support recurring");
        }
    }
    switch (method) {
        case UPI:
            return new PaymentReceipt(UPI, "Razorpay-UPI", "UPI success for " + request.amount());
        case CARD:
            return new PaymentReceipt(CARD, "Stripe", "CARD success for " + request.amount());
        case PAYPAL:
            return new PaymentReceipt(PAYPAL, "PayPal", "PAYPAL success for " + request.amount());
        case BANK_TRANSFER:
            return new PaymentReceipt(BANK_TRANSFER, "SWIFT", "BANK_TRANSFER success for " + request.amount());
        default:
            throw new IllegalArgumentException("unknown method");
    }
}
```

Concrete pains:

1. **Switch grows with every rail** — OCP violation; each new provider edits the same method
2. **Mixed concerns** — recurring checks interleaved with provider-specific charge strings
3. **Untestable mega-method** — one test class must cover all rails and all cross-cutting rules
4. **Copy-paste drift** — teams add `APPLE_PAY` in one branch but forget recurring guard
5. **No independent deployment** — UPI hotfix requires redeploying the entire `PaymentService`

SOLID hits: **OCP** (closed for extension), **SRP** (one method owns selection + charge + eligibility).

## 4. How the Pattern Solves It

Conceptual chain:

1. **Problem** — one `pay()` method switches on `PaymentMethod` and mixes eligibility with charge logic
2. **Naive pain** — sprawling `switch` / `if` chains; every rail edit retests everything
3. **Pattern introduces** — `PaymentStrategy` interface with `pay()` and `supportsRecurring()`
4. **Concrete strategies** — `UpiPaymentStrategy`, `CardPaymentStrategy`, `PaypalPaymentStrategy`, `BankTransferStrategy`
5. **Router** — `PaymentMethodRouter` holds `EnumMap<PaymentMethod, PaymentStrategy>` for O(1) lookup
6. **Context delegates** — `PaymentService.process()` resolves strategy, checks recurring, calls `strategy.pay(request)`
7. **Client simplifies** — passes `PaymentMethod`; never branches on rail implementation

The branching moves **from the context into pluggable strategy objects**.

## 5. Pattern → Code Mapping

| Pattern role | Demo class / type | Why this role |
|--------------|-------------------|---------------|
| **Strategy** | `PaymentStrategy` (interface) | Common contract: `pay()` + `supportsRecurring()` |
| **Concrete Strategy** | `UpiPaymentStrategy`, `CardPaymentStrategy`, `PaypalPaymentStrategy`, `BankTransferStrategy` | One class per rail; encapsulates provider + charge logic |
| **Context** | `PaymentService` | Holds router; delegates `process()` without rail-specific branches |
| **Registry / factory** | `PaymentMethodRouter` | Maps `PaymentMethod` enum → strategy instance |
| **Request / result** | `PaymentRequest`, `PaymentReceipt` | Immutable input/output records |
| **Enum key** | `PaymentMethod` (`UPI`, `CARD`, `PAYPAL`, `BANK_TRANSFER`) | Runtime selection key |
| **Client** | `PaymentStrategyDemo.run()` | Pays via UPI string API and CARD `process()` |

## 6. Important Code Lines

| Code | Design significance |
|------|---------------------|
| `interface PaymentStrategy { PaymentReceipt pay(...); boolean supportsRecurring(); }` | Algorithm + capability in one pluggable unit |
| `EnumMap<PaymentMethod, PaymentStrategy> strategies` | Type-safe, O(1) dispatch without string keys |
| `strategies.put(PaymentMethod.UPI, new UpiPaymentStrategy())` | Open for extension: new entry, not new branch |
| `PaymentStrategy strategy = router.resolve(method)` | Context asks router; does not `switch` |
| `if (request.recurring() && !strategy.supportsRecurring()) throw ...` | Cross-cutting rule stays in context (document ownership) |
| `UpiPaymentStrategy.supportsRecurring() → false` | Rail-specific capability localized to strategy |
| `CardPaymentStrategy.pay() → new PaymentReceipt(CARD, "Stripe", ...)` | Provider name lives with the rail |
| `strategy.pay(request)` | Polymorphic charge — context unaware of Stripe vs Razorpay |

## 7. Object/Class Diagram

```text
                    ┌─────────────────────────┐
                    │   PaymentService        │
                    │   (Context)             │
                    │ + process(method, req)  │
                    └───────────┬─────────────┘
                                │ resolve
                                ▼
                    ┌─────────────────────────┐
                    │  PaymentMethodRouter    │
                    │  - strategies: EnumMap  │
                    │  + resolve(method)      │
                    └───────────┬─────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
┌───────▼────────┐   ┌──────────▼─────────┐   ┌────────▼──────────┐
│ UpiPayment     │   │ CardPayment        │   │ PaypalPayment     │
│ Strategy       │   │ Strategy           │   │ Strategy          │
│ recurring: no  │   │ recurring: yes     │   │ recurring: yes    │
│ provider:      │   │ provider: Stripe   │   │ provider: PayPal  │
│ Razorpay-UPI   │   └────────────────────┘   └───────────────────┘
└────────────────┘
        │
        │  + BankTransferStrategy (recurring: no, provider: SWIFT)
        ▼
┌─────────────────────────┐
│  <<interface>>          │
│  PaymentStrategy        │
│  + pay(request)         │
│  + supportsRecurring()  │
└─────────────────────────┘
```

## 8. Runtime Execution Flow

From `PaymentStrategyDemo.run()`:

```text
STEP 1 — UPI via pay("UPI", 500):
  service = new PaymentService()
  service.pay("UPI", 500)
    → PaymentMethod.valueOf("UPI")
    → PaymentRequest("cust-demo", 500, "USD", recurring=false)
    → router.resolve(UPI) → UpiPaymentStrategy
    → recurring=false → skip eligibility throw
    → UpiPaymentStrategy.pay()
         → PaymentReceipt(UPI, "Razorpay-UPI", "UPI success for 500")
    → return "UPI:500"

STEP 2 — CARD recurring via process():
  service.process(CARD, PaymentRequest("cust-9", 900, "USD", recurring=true))
    → router.resolve(CARD) → CardPaymentStrategy
    → CardPaymentStrategy.supportsRecurring() → true
    → CardPaymentStrategy.pay()
         → PaymentReceipt(CARD, "Stripe", "CARD success for 900")
    → print: "Stripe — CARD success for 900"

STEP 3 — UPI recurring (test path, not in run()):
  service.process(UPI, PaymentRequest("cust-1", 100, "INR", recurring=true))
    → UpiPaymentStrategy.supportsRecurring() → false
    → IllegalArgumentException: "UPI does not support recurring payments"
```

The client never implements UPI vs CARD charge logic — only selects the method.

## 9. What the Client Doesn't Need to Know

- Which concrete class implements UPI (`UpiPaymentStrategy`)
- Provider names (Razorpay-UPI, Stripe, PayPal, SWIFT) unless reading `PaymentReceipt`
- Contents of the `EnumMap` in `PaymentMethodRouter`
- How recurring eligibility is encoded per rail (only that `process()` enforces it)
- Whether strategies are singletons, prototypes, or new instances per request

Client mental model: **pick `PaymentMethod`, call `process()` or `pay()`**.

## 10. Before vs After

### Without Strategy

```text
Client
  │
  ▼
PaymentService.pay()
  │
  ├── if recurring → nested if per method
  │
  └── switch (method)
         ├── UPI → Razorpay logic
         ├── CARD → Stripe logic
         ├── PAYPAL → PayPal logic
         └── BANK_TRANSFER → SWIFT logic
```

Context **knows every rail**.

### With Strategy

```text
Client
  │
  ▼
PaymentService.process()
  │
  ├── recurring guard (context)
  │
  └── router.resolve(method)
         │
         ▼
      PaymentStrategy.pay()
         ├── UpiPaymentStrategy
         ├── CardPaymentStrategy
         ├── PaypalPaymentStrategy
         └── BankTransferStrategy
```

**Each strategy knows its rail; context only delegates.**

## 11. SOLID / Design Principles

| Principle | How Strategy applies |
|-----------|---------------------|
| **Open/Closed** | New rail = new `PaymentStrategy` class + router entry; no edit to existing strategies |
| **Single Responsibility** | `CardPaymentStrategy` owns CARD charge; `PaymentService` owns orchestration |
| **Liskov** | Any `PaymentStrategy` can substitute another for `pay()` |
| **Dependency Inversion** | `PaymentService` depends on `PaymentStrategy` interface, not Stripe/Razorpay classes |
| **Composition over inheritance** | Router composes strategies; no deep `AbstractPaymentService` hierarchy |

## 12. Extensibility

| Change | Approach | Trade-off |
|--------|----------|-----------|
| New rail (`APPLE_PAY`) | Add enum value + `ApplePayStrategy` + map entry | Enum change still touches router wiring |
| Inject strategies (Spring) | `Map<PaymentMethod, PaymentStrategy>` bean | Easier testing; wiring in config |
| Per-tenant rails | Router selects map by tenant ID | Second dimension of lookup |
| Feature-flagged provider | Strategy wrapper or router returns A/B variant | Indirection; log which variant ran |
| Move recurring check into strategy | `validate(request)` on interface | Context thinner; rule duplicated if shared |

This demo keeps recurring guard in **context** — document that choice in reviews.

## 13. Advantages

- Eliminates growing `switch` in `PaymentService`
- Each rail testable in isolation (`UpiPaymentStrategy` unit test)
- Runtime algorithm swap (customer picks method at checkout)
- Clear mapping from business concept (UPI) to code (`UpiPaymentStrategy`)
- Strategies can be stateless — safe to share as singletons in the map

## 14. Disadvantages

- Class explosion: four rails → four strategy classes + router + context
- Context still must know **how** to select (enum, config, feature flag)
- Cross-cutting rules (recurring, fraud) can land in wrong layer without discipline
- Easy to confuse with **State** when behavior "changes" — Strategy swaps algorithm; State follows lifecycle
- `EnumMap` wiring is manual — forgotten entry yields null strategy at runtime

## 15. When to Use

1. Multiple payment rails with different charge algorithms (this demo)
2. Pricing, tax, or discount policies selected at runtime
3. Sorting, compression, or routing algorithms swapped without editing client
4. When you must **eliminate** type-code `switch` inside one service method

## 16. When NOT to Use

1. Behavior changes with **lifecycle phase** (CREATED → AUTHORIZED) — use **State**
2. Only one algorithm forever — direct method call is simpler
3. Steps are fixed order with one varying hook — **Template Method** may fit
4. Every policy is independently composable — **Chain of Responsibility** or rules engine

## 17. Edge Cases / Production Concerns

| Concern | In this demo | Production note |
|---------|--------------|-----------------|
| **Unknown method** | `resolve()` can return null | Throw `UnsupportedPaymentMethodException` on null |
| **Strategy state** | Stateless classes | Inject HTTP clients; avoid mutable fields |
| **Recurring ownership** | Context checks `supportsRecurring()` | Alternative: strategy throws on invalid request |
| **Idempotency** | Not shown | Strategy or context passes idempotency key to provider |
| **Timeouts / retries** | Not shown | Wrap strategy in resilience decorator |
| **Currency validation** | `PaymentRequest.currency` unused | Validate in context before `pay()` |
| **Thread safety** | New router per `PaymentService` | Share immutable `EnumMap` across threads |

## 18. Possible Code Improvements

### Required (correctness)

- `router.resolve(method)` — throw if null: `Objects.requireNonNull(strategy, method.name())`
- Validate `PaymentMethod.valueOf(type)` in `pay(String type, ...)` — catch `IllegalArgumentException`

### Optional (clarity / prod)

- Inject `PaymentMethodRouter` into `PaymentService` for testing with stub strategies
- `PaymentStrategy` as `@FunctionalInterface` for trivial rails (one-liner lambdas)
- Separate `PaymentCapability` from charge logic if rules grow beyond recurring
- Metrics: tag `pay()` latency by `strategy.getClass().getSimpleName()`

## 19. Mental Model

**Formula:**

```text
Problem:  One method switches on type codes → grows forever
Solution: Interface per algorithm + registry lookup → context delegates
Benefit:  New rail = new class, not new branch in pay()
```

Memory trick: **"Payment app picker."** Same checkout button; behind it swaps UPI vs card processor without the button knowing Stripe.

## 20. 30–60 Second Interview Answer

> **Strategy** encapsulates interchangeable algorithms behind one interface. Our problem is `PaymentService.pay()` as a growing `switch` on UPI, CARD, PAYPAL, and BANK_TRANSFER — mixing Razorpay/Stripe charge logic with recurring eligibility. Each rail becomes a `PaymentStrategy`: `UpiPaymentStrategy`, `CardPaymentStrategy`, and so on. `PaymentMethodRouter` holds an `EnumMap` for O(1) lookup. `PaymentService.process()` resolves the strategy, rejects recurring on UPI/BANK_TRANSFER via `supportsRecurring()`, then calls `strategy.pay(request)`. Adding Apple Pay means a new class and map entry — no switch growth. Differs from **State**: Strategy picks **which charge algorithm**; State models **which lifecycle phase** the payment is in.

## 21. Likely Interview Follow-ups

| Question | Answer sketch |
|----------|---------------|
| Strategy vs State? | Strategy: client **chooses** algorithm (UPI vs CARD). State: object **is in** a phase (CREATED vs AUTHORIZED); transitions are constrained |
| Strategy vs Factory? | Factory **creates** objects; Strategy **executes** behavior on existing context |
| Where do recurring rules live? | Demo: context. Alternative: each strategy validates its own request |
| Functional interface? | `PaymentStrategy` can be lambda for trivial rails; capability methods need a class |
| Spring wiring? | `@Bean Map<PaymentMethod, PaymentStrategy>` injected into router |

**Common mistake:** Leaving a giant `switch` in `PaymentService` "just for routing" — the router **is** the switch replacement.

---

## Run

```bash
cd java-design-patterns-real-world
mvn -q exec:java -Dexec.mainClass=com.example.designpatterns.behavioral.strategy.PaymentStrategyDemo
```
