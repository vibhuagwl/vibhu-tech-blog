# Factory Method — Interview Explanation Board

> **Demo:** `PaymentGatewayFactoryDemo` — `src/main/java/com/example/designpatterns/creational/factory/PaymentGatewayFactoryDemo.java`

## 1. Pattern Identification

| Field | Value |
|-------|-------|
| **Name** | Factory Method |
| **Category** | Creational |
| **One-line definition** | Define an interface for creating objects; let subclasses or factory classes decide which concrete product to instantiate. |
| **Problem class** | Callers hard-code `new ConcreteType()` — creation logic spreads and new providers break every caller. |

## 2. Problem We Are Solving

Checkout and refund services charge customers through payment gateways. Today engineers write:

```java
PaymentGateway gw = new StripeGateway();
```

When product adds **Adyen** or switches default provider, every checkout path, refund path, and test must change. API keys and region-specific construction leak into business logic.

## 3. What Happens Without the Pattern

- `new StripeGateway()` / `new PaypalGateway()` scattered across codebase
- Adding `ADYEN` → edit N call sites
- Provider construction (credentials, sandbox flags) mixed with `charge()` logic
- Violates **OCP** — cannot extend providers without modifying callers

## 4. How the Pattern Solves It

1. **Problem** — callers instantiate concrete gateways
2. **Pain** — switch explosion at every call site
3. **Factory** — `PaymentGatewayFactory.create(Provider)` centralizes branching
4. **Product interface** — `PaymentGateway.charge(int)`
5. **Client** — `factory.create(Provider.STRIPE).charge(100)` — no `new StripeGateway()`

## 5. Pattern → Code Mapping

| Pattern role | Demo class / type | Why |
|--------------|-------------------|-----|
| **Product** | `PaymentGateway` (interface) | What callers use |
| **Concrete products** | `StripeGateway`, `PaypalGateway`, `AdyenGateway` | Provider-specific charge |
| **Creator / Factory** | `PaymentGatewayFactory` | `create(Provider)` picks concrete type |
| **Parameter** | `Provider` enum | STRIPE, PAYPAL, ADYEN |
| **Client** | `PaymentGatewayFactoryDemo.run()` | Factory + charge via interface |

## 6. Important Code Lines

| Code | Significance |
|------|--------------|
| `interface PaymentGateway { String charge(int amount); }` | Stable product contract |
| `switch (provider) { case STRIPE -> new StripeGateway(); ... }` | Single creation branch |
| `factory.create(Provider.STRIPE)` | Client never names concrete class |
| `gateway.charge(100)` | Polymorphic use after factory |

## 7. Object/Class Diagram

```text
┌──────────────────────┐
│ PaymentGatewayFactory│
│ + create(Provider)   │
└──────────┬───────────┘
           │ creates
           ▼
┌──────────────────────┐     ┌─────────────────┐
│ <<interface>>        │     │ StripeGateway   │
│ PaymentGateway       │◄────┤ PaypalGateway   │
│ + charge(amount)     │     │ AdyenGateway    │
└──────────────────────┘     └─────────────────┘
```

## 8. Runtime Execution Flow

```text
factory = new PaymentGatewayFactory()
gateway = factory.create(Provider.STRIPE)
  → switch STRIPE → new StripeGateway()
result = gateway.charge(100)
  → "Stripe charged 100"
```

## 9. What the Client Doesn't Need to Know

- Which concrete gateway class was constructed
- Switch logic inside factory
- Future providers — client only passes `Provider` enum

## 10. Before vs After

**Before:** Client → `new StripeGateway()` → charge.

**After:** Client → `factory.create(STRIPE)` → `PaymentGateway` → charge.

Creation centralized; business code depends on interface.

## 11. SOLID / Design Principles

| Principle | Application |
|-----------|-------------|
| **OCP** | New gateway = new class + factory branch, not N caller edits |
| **DIP** | Client depends on `PaymentGateway`, not Stripe |
| **SRP** | Factory creates; gateway charges |

## 12. Extensibility

- New provider: add `AdyenGateway` + enum value + switch case (or `EnumMap` registry)
- Feature flags: factory reads config before `create()`
- Trade-off: factory switch grows — registry map scales better

## 13. Advantages

- Single place for provider selection
- Callers stay stable when providers change
- Easy to mock `PaymentGateway` in tests

## 14. Disadvantages

- Simple `new StripeGateway()` in one place may suffice for single provider
- Factory can become god switch — use registry
- Not for **families** of related products — use Abstract Factory

## 15. When to Use

1. Multiple payment gateway implementations
2. Creation logic may grow (keys, region, sandbox)
3. Callers must not hard-code concrete classes

## 16. When NOT to Use

1. One implementation forever
2. Spring `@Qualifier` / profiles already select beans
3. Products form **families** — Abstract Factory fits better

## 17. Edge Cases / Production Concerns

| Concern | Note |
|---------|------|
| Unknown provider | Throw `IllegalArgumentException`, not null |
| Factory I/O | No network in `create()` — construct only |
| Thread safety | Factory stateless; gateways per call or pooled |
| Testing | Inject factory or override registry |

## 18. Possible Code Improvements

**Required:** Fail fast on unknown `Provider`.

**Optional:** `EnumMap<Provider, Supplier<PaymentGateway>>` registry; inject factory via DI.

## 19. Mental Model

**"Don't pick the product — ask the factory."** Client names the *kind* (Provider), factory names the *class*.

## 20. 30–60 Second Interview Answer

> Factory Method centralizes object creation behind a method that returns a product interface. Checkout hard-coding `new StripeGateway()` means adding Adyen edits every caller. `PaymentGatewayFactory.create(Provider)` switches once on STRIPE/PAYPAL/ADYEN and returns `PaymentGateway`. Callers call `charge(100)` on the interface without knowing the concrete gateway. New providers change the factory, not checkout logic.

## 21. Likely Interview Follow-ups

| Question | Answer |
|----------|--------|
| Factory Method vs Abstract Factory? | Factory Method creates **one** product type; Abstract Factory creates **families** |
| vs Builder? | Builder assembles complex object stepwise; factory picks implementation |
| vs DI? | Spring factory bean is DI-friendly Factory Method |

**Common mistake:** Calling any `new` in a utility class "factory" — must return polymorphic product interface.

---

## Run

```bash
cd java-design-patterns-real-world
mvn -q exec:java -Dexec.mainClass=com.example.designpatterns.creational.factory.PaymentGatewayFactoryDemo
```
