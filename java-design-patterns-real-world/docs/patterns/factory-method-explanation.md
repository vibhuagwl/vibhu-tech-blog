# Factory Method — Interview Explanation Board

> **Demo:** `PaymentGatewayFactoryDemo` — `src/main/java/com/example/designpatterns/creational/factory/PaymentGatewayFactoryDemo.java`

## 1. Pattern Identification

| Field | Value |
|-------|-------|
| **Name** | Factory Method |
| **Category** | Creational |
| **One-line definition** | Define an interface for creating an object, but let subclasses or factory classes decide which concrete class to instantiate; callers depend on the product interface, not `new Concrete()`. |
| **Problem class** | Multiple interchangeable implementations of the same capability (payment gateways) where construction branching must not leak into business logic. |

## 2. Problem We Are Solving

Checkout must charge customers through a payment provider. The platform supports:

- **Stripe** — card payments in US/EU
- **PayPal** — wallet and PayPal balance
- **Adyen** — enterprise multi-rail gateway

Today, three services hard-code their provider:

```text
CheckoutService     → new StripeGateway()
RefundService       → new PaypalGateway()
SubscriptionService → new StripeGateway()
```

Product asks to add **Adyen** as default in Germany and switch checkout to Adyen without touching refund flows yet.

The painful question:

> How can checkout request "a gateway that can charge" without `new StripeGateway()` scattered everywhere — and without editing every service when we add Adyen or change default provider logic?

Relationships that make this hard:

- **Product interface** — all gateways expose `charge(int amount)`
- **Concrete products** — `StripeGateway`, `PaypalGateway`, `AdyenGateway` differ in construction (API keys, region endpoints)
- **Client** — checkout should depend on `PaymentGateway`, not Stripe-specific types
- **Creation logic** — `switch (provider)` belongs in one place, not in every charge path

## 3. What Happens Without the Pattern

Naive checkout code picks concrete classes directly:

```java
public class CheckoutService {
    public String pay(int amount, String region) {
        PaymentGateway gateway;
        if (region.equals("US")) {
            gateway = new StripeGateway();  // hard-coded
        } else if (region.equals("EU")) {
            gateway = new AdyenGateway();
        } else {
            gateway = new PaypalGateway();
        }
        return gateway.charge(amount);
    }
}

public class RefundService {
    public String refund(int amount) {
        return new StripeGateway().charge(-amount);  // duplicate construction
    }
}
```

Concrete pains:

1. **Hard-coded `new`** — every caller knows concrete gateway classes
2. **Switch duplication** — region/provider logic copied into checkout, refund, subscription
3. **OCP violation** — adding Adyen edits N services instead of one factory
4. **Construction leaks** — API keys, sandbox flags, HTTP client setup mixed with business logic
5. **Testing pain** — cannot substitute a fake gateway without changing production constructors

SOLID hits: **OCP** (new provider breaks all callers), **DIP** (clients depend on concretes), **SRP** (checkout owns both orchestration and gateway construction).

## 4. How the Pattern Solves It

Conceptual chain:

1. **Problem** — checkout, refund, subscription each `new` different gateways
2. **Naive pain** — duplicated switches, hard-coded Stripe/PayPal, Adyen addition is a repo-wide hunt
3. **Pattern introduces** — `PaymentGateway` product interface + `PaymentGatewayFactory.create(Provider)`
4. **Factory centralizes branch** — `switch (provider)` maps `STRIPE` → `StripeGateway`, etc.
5. **Client depends on interface** — `PaymentGateway gateway = factory.create(Provider.STRIPE); gateway.charge(100)`
6. **New provider** — add `AdyenGateway` + one `case ADYEN` in factory; callers unchanged

Gateway construction moves **from every service into the factory**.

## 5. Pattern → Code Mapping

| Pattern role | Demo class / type | Why this role |
|--------------|-------------------|---------------|
| **Product** | `PaymentGateway` (interface) | Common `charge(int)` contract for all gateways |
| **Concrete products** | `StripeGateway`, `PaypalGateway`, `AdyenGateway` | Provider-specific charge implementation |
| **Creator / Factory** | `PaymentGatewayFactory` | Owns `create(Provider)` branching |
| **Factory parameter** | `Provider` enum (`STRIPE`, `PAYPAL`, `ADYEN`) | Type-safe key for which concrete to build |
| **Client** | `PaymentGatewayFactoryDemo.run()` | Creates factory, requests STRIPE, charges through interface |

## 6. Important Code Lines

| Code | Design significance |
|------|---------------------|
| `interface PaymentGateway { String charge(int amount); }` | Product abstraction — client never names Stripe/PayPal |
| `StripeGateway implements PaymentGateway` | Concrete product — construction + charge logic encapsulated |
| `public PaymentGateway create(Provider provider)` | Factory method — returns interface type, hides `new` |
| `switch (provider) { case STRIPE -> new StripeGateway(); ... }` | Single branch point for all provider selection |
| `var gateway = factory.create(Provider.STRIPE)` | Client asks factory for product; does not instantiate concrete |
| `gateway.charge(100)` | Business operation through interface — polymorphic charge |

## 7. Object/Class Diagram

```text
                    ┌─────────────────────────┐
                    │  <<interface>>          │
                    │  PaymentGateway         │
                    │  + charge(amount): Str  │
                    └────────────┬────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
┌────────▼────────┐   ┌─────────▼─────────┐   ┌────────▼────────┐
│ StripeGateway   │   │ PaypalGateway     │   │ AdyenGateway    │
│ + charge()      │   │ + charge()        │   │ + charge()      │
└─────────────────┘   └───────────────────┘   └─────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ PaymentGatewayFactory                                       │
│ + create(Provider): PaymentGateway                          │
└──────────────────────────┬──────────────────────────────────┘
                           │ creates
                           ▼
                    PaymentGateway (concrete instance)

┌─────────────────────────────────────────────────────────────┐
│ Provider (enum)                                             │
│ STRIPE | PAYPAL | ADYEN                                     │
└─────────────────────────────────────────────────────────────┘
```

## 8. Runtime Execution Flow

From `PaymentGatewayFactoryDemo.run()`:

```text
STEP 1: factory = new PaymentGatewayFactory()
  → empty factory, no gateways yet

STEP 2: gateway = factory.create(Provider.STRIPE)
  → enter create(STRIPE)
  → switch matches STRIPE
  → new StripeGateway() constructed
  → return as PaymentGateway reference

STEP 3: gateway.charge(100)
  → runtime dispatch to StripeGateway.charge
  → returns "Stripe charged 100"

Output:
  Result: Stripe charged 100

If create(Provider.PAYPAL):
  → PaypalGateway → "PayPal charged 100"

If create(Provider.ADYEN):
  → AdyenGateway → "Adyen charged 100"
```

Client never references `StripeGateway` class name after factory returns the interface.

## 9. What the Client Doesn't Need to Know

- Which concrete class was instantiated (`StripeGateway` vs `AdyenGateway`)
- That `create` uses a `switch` expression (could be map registry or Spring bean lookup)
- Provider-specific setup (API keys, HTTP clients, retry policies)
- That three separate gateway classes exist — only `PaymentGateway` matters at call site
- Enum ordinals or naming of `Provider` values beyond the key passed to `create`

Client mental model: **ask factory for gateway, call charge on interface**.

## 10. Before vs After

### Without Factory Method

```text
CheckoutService                    RefundService
     │                                  │
     │ if US → new StripeGateway()      │ new StripeGateway()
     │ if EU → new AdyenGateway()       │
     ▼                                  ▼
  charge(100)                        charge(-50)

  ← duplicated construction + branching in every service
```

Client **knows and constructs** concrete gateways.

### With Factory Method

```text
CheckoutService          RefundService
     │                        │
     │ factory.create(STRIPE) │ factory.create(STRIPE)
     └────────────┬───────────┘
                  ▼
        PaymentGatewayFactory
                  │
                  │ create(Provider)
                  ▼
           PaymentGateway
                  │
                  │ charge(amount)
                  ▼
         StripeGateway / PaypalGateway / AdyenGateway
```

**Factory knows concretes; client knows interface only.**

## 11. SOLID / Design Principles

| Principle | How Factory Method applies |
|-----------|---------------------------|
| **Open/Closed** | New `WiseGateway` + factory case — clients unchanged |
| **Dependency Inversion** | Clients depend on `PaymentGateway`, not `StripeGateway` |
| **Single Responsibility** | Factory owns creation; checkout owns charge orchestration |
| **Liskov** | Any `PaymentGateway` can substitute another for `charge()` |

## 12. Extensibility

| Change | Approach | Trade-off |
|--------|----------|-----------|
| New provider (`WISE`) | Add enum value + concrete class + factory case | One edit point |
| Map registry | `Map<Provider, Supplier<PaymentGateway>>` | Cleaner than growing switch |
| Factory Method per subclass | `StripeFactory extends GatewayFactory` | Classic GoF; more classes |
| Spring `@Qualifier` | Container picks bean by name | Factory pattern redundant in DI |
| Async / reactive charge | Extend interface or new product type | Factory still returns right impl |
| Credentials in `create` | Pass `GatewayConfig` into factory | Factory grows — consider Abstract Factory for families |

## 13. Advantages

- Centralizes `new` and provider branching in one class
- Clients depend on stable `PaymentGateway` interface
- Adding Adyen touches factory + new class, not every checkout path
- Easy to mock factory in tests (return stub gateway)
- Enum `Provider` gives type-safe keys vs stringly `"stripe"` switches

## 14. Disadvantages

- Extra factory class for a single provider forever
- Switch/map can grow large with many providers
- Not ideal when products form **families** (payment + account per region) — use Abstract Factory
- Spring bean selection often replaces manual factories
- Factory can become a dumping ground for credentials, HTTP setup, metrics — keep it thin

## 15. When to Use

1. Checkout/refund need one of several `PaymentGateway` implementations
2. Provider selection logic (region, feature flag) should not live in business services
3. Construction may grow (sandbox keys, mTLS) while `charge()` interface stays stable
4. You add providers quarterly (Stripe, PayPal, Adyen, Wise)
5. Unit tests must inject fake gateways without editing checkout code

## 16. When NOT to Use

1. Only one gateway implementation for the product lifetime
2. Spring `@Autowired PaymentGateway` with `@Qualifier` or profiles already selects beans
3. Products are **families** that must stay matched (payment rail + account rules) — Abstract Factory
4. Simple `List<PaymentGateway>` iteration with no creation branching
5. Provider is chosen at deploy time via config file — single bean wiring suffices

## 17. Edge Cases / Production Concerns

| Concern | In this demo | Production note |
|---------|--------------|-----------------|
| **Unknown provider** | Switch covers all enum values | Add `default` throwing `IllegalArgumentException` if enum grows |
| **Null return** | Never returns null | Never return null from factory — fail fast |
| **Side effects in create** | Pure `new` | No network I/O inside `create()` — construct client, connect lazily |
| **Thread safety** | New gateway per `create` | Pool shared HTTP clients if gateways are expensive |
| **Secrets** | No keys in demo | Inject credentials via factory constructor, not hard-coded |
| **Testing** | Manual factory | `@MockBean PaymentGateway` in Spring integration tests |

## 18. Possible Code Improvements

### Required (correctness)

- Throw on unknown `Provider` if enum extended without factory update (defensive `default` case)
- Return interface type explicitly — never leak `StripeGateway` from `create`

### Optional (clarity / prod)

- `Map<Provider, Supplier<PaymentGateway>>` registry for OCP without editing switch
- `GatewayFactory` interface + `StripeGatewayFactory` for true Factory Method subclass style
- Pass `GatewayCredentials` into `create` for sandbox vs production
- Separate `PaymentGateway` interface into own file in multi-module builds

## 19. Mental Model

**Formula:**

```text
Problem:  Callers hard-code new StripeGateway() everywhere → brittle, duplicated switches
Solution: Factory.create(Provider) centralizes branching → returns PaymentGateway interface
Benefit:  Add Adyen in one place; checkout only knows charge(amount)
```

Memory trick: **"Client names the kind (Provider); factory names the class (StripeGateway)."**

## 20. 30–60 Second Interview Answer

> **Factory Method** is a creational pattern that defers instantiation to a factory while clients depend on a product interface. Our checkout and refund services used to hard-code `new StripeGateway()` or `new PaypalGateway()` — adding Adyen meant editing every charge path. We define `PaymentGateway` with `charge(int)`, concrete classes `StripeGateway`, `PaypalGateway`, `AdyenGateway`, and `PaymentGatewayFactory.create(Provider)` that switches on `STRIPE`, `PAYPAL`, or `ADYEN` and returns the interface type. The client does `factory.create(Provider.STRIPE)` then `gateway.charge(100)` — it never references `StripeGateway`. New providers add one class and one factory branch; business logic stays untouched. In the demo, charging 100 through STRIPE prints "Stripe charged 100".

## 21. Likely Interview Follow-ups

| Question | Answer sketch |
|----------|---------------|
| Factory Method vs Abstract Factory? | Factory Method: one product, pick implementation. Abstract Factory: **family** of related products (payment + account per region) |
| Factory Method vs Simple Factory? | Simple factory is one method with if/switch — same idea, not always subclass-based; interviewers often mean centralized creation |
| Static factory vs instance factory? | Instance factory allows injection of credentials/config; static `create()` is simpler but less flexible |
| Spring replaces this? | Often yes — `@Bean` + `@Qualifier` is container-managed factory |
| Where put API keys? | Factory constructor or config injected into factory — not in checkout service |

**Common mistake:** Calling any `new` in a utility class "Factory Method" — the pattern requires clients to depend on the **product interface** and creation to be **centralized and substitutable**.

---

## Run

```bash
cd java-design-patterns-real-world
mvn -q exec:java -Dexec.mainClass=com.example.designpatterns.creational.factory.PaymentGatewayFactoryDemo
```
