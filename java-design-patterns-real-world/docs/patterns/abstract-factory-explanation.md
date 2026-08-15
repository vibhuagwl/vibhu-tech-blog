# Abstract Factory — Interview Explanation Board

> **Demo:** `RegionalBankingFactoryDemo` — `src/main/java/com/example/designpatterns/creational/abstractfactory/RegionalBankingFactoryDemo.java`

## 1. Pattern Identification

| Field | Value |
|-------|-------|
| **Name** | Abstract Factory |
| **Category** | Creational |
| **One-line definition** | Provide an interface for creating families of related or dependent objects without specifying their concrete classes; one factory choice locks in a compatible product set. |
| **Problem class** | Regional stacks where payment rails, account rules, and compliance must stay matched — mixing US ACH with EU IBAN is invalid. |

## 2. Problem We Are Solving

A global banking onboarding flow must provision two services per merchant:

- **Payment service** — rail used to move money (UPI, SEPA, ACH)
- **Account service** — KYC and account identifiers (India KYC, IBAN rules, US routing)

Three regions:

```text
India   → UPI payment rail      + India account KYC
Europe  → SEPA payment rail     + IBAN account rules
US      → ACH payment rail      + US routing account rules
```

A US merchant was onboarded with **SEPA payment** (EU factory mistake) but **US routing account rules** — settlement failed compliance review.

The painful question:

> How do we ensure payment rail and account rules always come from the **same regional family** — so callers never accidentally pair `SEPA` with `US routing`?

Relationships that make this hard:

- **Product family** — `PaymentService` + `AccountService` must be region-consistent
- **Multiple factories** — `IndiaBankingFactory`, `EuropeBankingFactory`, `USBankingFactory`
- **Client** — onboarding should depend on `BankingFactory`, not pick payment and account independently
- **Invalid combinations** — UPI + IBAN, ACH + India KYC are illegal in production

## 3. What Happens Without the Pattern

Naive onboarding picks products independently:

```java
public class MerchantOnboarding {
    public void onboard(String region) {
        PaymentService payment;
        AccountService account;

        if (region.equals("IN")) {
            payment = () -> "UPI payment rail";
        } else if (region.equals("EU")) {
            payment = () -> "SEPA payment rail";
        } else {
            payment = () -> "ACH payment rail";
        }

        // Bug: separate switch — easy to mismatch
        if (region.equals("US")) {
            account = () -> "US routing account rules";
        } else {
            account = () -> "IBAN account rules";  // wrong for India!
        }

        payment.pay();
        account.account();
    }
}
```

Concrete pains:

1. **Family mismatch** — payment from EU switch, account from US switch
2. **Duplicated region logic** — two switches must stay in sync manually
3. **No compile-time guarantee** — compatible pairs are a convention, not enforced
4. **Adding Brazil** — edit every switch in every product picker
5. **Testing** — hard to mock "India stack" as one unit

SOLID hits: **OCP** (new region edits all switches), **DIP** (client constructs lambdas/concretes directly), **consistency invariant** violated at runtime.

## 4. How the Pattern Solves It

Conceptual chain:

1. **Problem** — payment and account picked separately; US ACH + EU IBAN combinations slip through
2. **Naive pain** — parallel switches, copy-paste region keys, compliance failures
3. **Pattern introduces** — `BankingFactory` with `paymentService()` and `accountService()`
4. **Concrete factories** — `IndiaBankingFactory` returns UPI + India KYC; `EuropeBankingFactory` returns SEPA + IBAN; `USBankingFactory` returns ACH + US routing
5. **One factory choice** — `BankingFactory factory = new IndiaBankingFactory()` locks entire family
6. **Client simplifies** — `factory.paymentService().pay()` and `factory.accountService().account()` — both guaranteed India-compatible

Region pairing moves **from duplicated switches into one factory object**.

## 5. Pattern → Code Mapping

| Pattern role | Demo class / type | Why this role |
|--------------|-------------------|---------------|
| **Abstract Factory** | `BankingFactory` (interface) | Declares methods for each product in the family |
| **Abstract products** | `PaymentService`, `AccountService` | Family members with region-specific contracts |
| **Concrete factory** | `IndiaBankingFactory` | Returns UPI + India KYC — matched pair |
| **Concrete factory** | `EuropeBankingFactory` | Returns SEPA + IBAN — matched pair |
| **Concrete factory** | `USBankingFactory` | Returns ACH + US routing — matched pair |
| **Concrete products** | Lambda implementations in each factory | Region-specific `pay()` / `account()` behavior |
| **Client** | `RegionalBankingFactoryDemo.run()` | Selects `IndiaBankingFactory`, uses both products from same factory |

## 6. Important Code Lines

| Code | Design significance |
|------|---------------------|
| `interface BankingFactory { PaymentService paymentService(); AccountService accountService(); }` | Abstract factory — one method per family member |
| `interface PaymentService { String pay(); }` | Abstract product — payment rail abstraction |
| `interface AccountService { String account(); }` | Abstract product — account/KYC abstraction |
| `IndiaBankingFactory.paymentService() → "UPI payment rail"` | Concrete factory binds India payment product |
| `IndiaBankingFactory.accountService() → "India account KYC"` | Same factory binds matching account product |
| `BankingFactory factory = new IndiaBankingFactory()` | Single choice selects entire compatible stack |
| `factory.paymentService().pay()` + `factory.accountService().account()` | Client uses family without cross-region mix |

## 7. Object/Class Diagram

```text
              ┌──────────────────────────────────────┐
              │  <<interface>> BankingFactory        │
              │  + paymentService(): PaymentService    │
              │  + accountService(): AccountService    │
              └───────────────────┬────────────────────┘
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        │                         │                         │
┌───────▼──────────┐   ┌──────────▼─────────┐   ┌──────────▼─────────┐
│IndiaBankingFactory│   │EuropeBankingFactory│   │ USBankingFactory   │
│ payment→UPI      │   │ payment→SEPA       │   │ payment→ACH        │
│ account→India KYC│   │ account→IBAN       │   │ account→US routing │
└───────┬──────────┘   └──────────┬─────────┘   └──────────┬─────────┘
        │ creates                 │ creates                 │ creates
        ▼                         ▼                         ▼
┌───────────────┐         ┌───────────────┐         ┌───────────────┐
│PaymentService │         │PaymentService │         │PaymentService │
│AccountService │         │AccountService │         │AccountService │
└───────────────┘         └───────────────┘         └───────────────┘

        <<interface>> PaymentService          <<interface>> AccountService
              ▲                                      ▲
              │ implemented by                       │ implemented by
              └────────────── per factory ───────────┘
```

## 8. Runtime Execution Flow

From `RegionalBankingFactoryDemo.run()`:

```text
STEP 1: factory = new IndiaBankingFactory()
  → concrete factory selected for India region
  → no products created yet

STEP 2: payment = factory.paymentService()
  → IndiaBankingFactory.paymentService()
  → returns lambda: pay() → "UPI payment rail"
  → Payment rail: UPI payment rail

STEP 3: account = factory.accountService()
  → IndiaBankingFactory.accountService()
  → returns lambda: account() → "India account KYC"
  → Account rules: India account KYC

Both products sourced from same factory → UPI + India KYC (valid)

Contrast illegal path (without pattern):
  payment from EuropeBankingFactory → SEPA
  account from USBankingFactory → US routing
  → compliance failure

Europe path:
  factory = new EuropeBankingFactory()
  → SEPA + IBAN

US path:
  factory = new USBankingFactory()
  → ACH + US routing
```

Client never constructs `PaymentService` and `AccountService` from different region switches.

## 9. What the Client Doesn't Need to Know

- Which concrete class or lambda implements `PaymentService` for India
- That three separate factory classes exist — only `BankingFactory` reference is held
- IBAN vs routing number validation rules inside account product
- UPI vs SEPA vs ACH wire protocol details
- How factories are registered or discovered (config, DI, feature flags)
- That products are lambdas in this demo (could be full classes in production)

Client mental model: **pick region factory once, get matching payment + account**.

## 10. Before vs After

### Without Abstract Factory

```text
Client
  │
  ├── switch region → pick PaymentService   (switch #1)
  │
  └── switch region → pick AccountService   (switch #2)
         │
         └── mismatch risk: SEPA + US routing
```

Client **runs two independent region switches** that must stay synchronized.

### With Abstract Factory

```text
Client
   │
   │ new IndiaBankingFactory()
   ▼
BankingFactory (India)
   │
   ├── paymentService() → UPI payment rail
   │
   └── accountService() → India account KYC
```

**One factory choice guarantees compatible family.**

## 11. SOLID / Design Principles

| Principle | How Abstract Factory applies |
|-----------|------------------------------|
| **Open/Closed** | `BrazilBankingFactory` added — client using `BankingFactory` unchanged |
| **Dependency Inversion** | Client depends on `BankingFactory` + product interfaces |
| **Single Responsibility** | Each concrete factory owns one region's product pairing |
| **Consistency invariant** | Family cannot cross-contaminate at factory boundary |

## 12. Extensibility

| Change | Approach | Trade-off |
|--------|----------|-----------|
| New region (Brazil) | New `BrazilBankingFactory` implementing `BankingFactory` | Classic extension |
| Third product (KycService) | Add method to `BankingFactory` — all factories must implement | Interface growth |
| Factory from config | `BankingFactoryRegistry.get("IN")` | Keeps client on abstract factory |
| Spring | `@Configuration` per region exposing `BankingFactory` bean | Container-managed abstract factory |
| Product independence | If payment and account don't form families — use Factory Method only | Abstract Factory is overkill |

## 13. Advantages

- Enforces compatible product families at compile time (one factory object)
- Client code free of region switches for each product type
- Adding Europe vs India vs US is localized to concrete factories
- Easy to test "India stack" by injecting `IndiaBankingFactory`
- Clear mapping to business domains (regional compliance bundles)

## 14. Disadvantages

- Adding a new product type to the family updates **every** concrete factory
- More classes than independent Factory Methods (factory per region × products)
- Over-engineering when products are not truly related families
- Can duplicate similar logic across factories if not composed carefully
- Fat `BankingFactory` interfaces when families grow (payment, account, kyc, tax, ledger)

## 15. When to Use

1. Regional banking: payment rail + account rules must match (IN, EU, US)
2. UI widget kits: `WindowsFactory` returns Windows button + scrollbar together
3. Cross-platform toolkits: Mac vs Windows families of controls
4. Database access families: connection + query builder + transaction manager per vendor
5. When mixing products across families is **invalid** or **illegal**

## 16. When NOT to Use

1. Single product choice (only payment gateway) — Factory Method suffices
2. Products are independent — no family consistency requirement
3. Spring wires unrelated beans — no need for bundled factory if container enforces profiles
4. One product type with many variants — Factory Method or strategy
5. Family has only one member — abstract factory adds ceremony without benefit

## 17. Edge Cases / Production Concerns

| Concern | In this demo | Production note |
|---------|--------------|-----------------|
| **Family growth** | Two products | New `ComplianceService` method — touch all factories |
| **Partial regions** | All three complete | Stub factory throwing `UnsupportedOperationException` for beta regions |
| **Runtime region** | `new IndiaBankingFactory()` | Select factory from merchant country code — validate allowed |
| **Shared deps** | Lambdas only | Share HTTP client across factories via injected builder |
| **Testing** | Concrete factories | Fake `BankingFactory` returning test doubles for both products |
| **Multi-region merchant** | One factory per onboard | May need factory per legal entity, not per JVM |

## 18. Possible Code Improvements

### Required (correctness)

- Factory selector validates region code — reject unknown `"XX"` before creating wrong stack
- Document that payment and account from **same** `BankingFactory` instance is mandatory

### Optional (clarity / prod)

- `BankingFactoryProvider.forCountry("IN")` centralizes `new IndiaBankingFactory()`
- Concrete product classes instead of lambdas for richer behavior and typing
- Separate interfaces per region only if products diverge radically (rare)
- Compose shared base (`AbstractBankingFactory`) for common HTTP/logging setup

## 19. Mental Model

**Formula:**

```text
Problem:  Pick payment and account separately → illegal regional pairs (SEPA + US routing)
Solution: Abstract factory returns whole family → one IndiaBankingFactory = UPI + India KYC
Benefit:  Client cannot cross-contaminate stacks without bypassing factory
```

Memory trick: **"Pick the factory for the region — the family comes as a set."**

## 20. 30–60 Second Interview Answer

> **Abstract Factory** creates **families** of related objects so they stay compatible. In global banking, a merchant needs a payment rail (UPI, SEPA, ACH) and account rules (India KYC, IBAN, US routing) that must match — pairing SEPA with US routing fails compliance. Without the pattern, two separate region switches let bugs slip in. We define `BankingFactory` with `paymentService()` and `accountService()`, and concrete factories `IndiaBankingFactory`, `EuropeBankingFactory`, `USBankingFactory` each return a matched pair. The client does `BankingFactory factory = new IndiaBankingFactory()`, then `factory.paymentService().pay()` and `factory.accountService().account()` — both are India-compatible (UPI + India KYC). One factory choice locks the entire regional stack; callers never mix US ACH with EU IBAN.

## 21. Likely Interview Follow-ups

| Question | Answer sketch |
|----------|---------------|
| Abstract Factory vs Factory Method? | Factory Method: one product, pick impl. Abstract Factory: **bundle** of related products per factory |
| Abstract Factory vs Builder? | Builder: step-by-step one complex object. Abstract Factory: **several** related objects from one family |
| Adding new product to family? | Add method to `BankingFactory` — every concrete factory must implement (pain point) |
| Spring equivalent? | `@Configuration` class per region exposing all beans for that stack |
| When is it overkill? | Independent products with no consistency rule — use simple DI |

**Common mistake:** Using Abstract Factory for a single variable type (just payment gateway) — the pattern's value is **family consistency**, not centralized `new`.

---

## Run

```bash
cd java-design-patterns-real-world
mvn -q exec:java -Dexec.mainClass=com.example.designpatterns.creational.abstractfactory.RegionalBankingFactoryDemo
```
