# Abstract Factory — Interview Explanation Board

> **Demo:** `RegionalBankingFactoryDemo` — `src/main/java/com/example/designpatterns/creational/abstractfactory/RegionalBankingFactoryDemo.java`

## 1. Pattern Identification

| Field | Value |
|-------|-------|
| **Name** | Abstract Factory |
| **Category** | Creational |
| **One-line definition** | Provide an interface for creating families of related objects without specifying concrete classes. |
| **Problem class** | Mixing incompatible regional products (US ACH + EU IBAN) when objects must stay in consistent families. |

## 2. Problem We Are Solving

A global merchant operates in India, Europe, and the US. Each region needs:

- A **payment rail** (UPI, SEPA, ACH)
- **Account/KYC rules** matching that region

If checkout picks `SEPA` payment and `US routing` account rules independently, settlements become **illegal combinations**. Region is the constraint — products must be chosen as a **family**.

## 3. What Happens Without the Pattern

```java
PaymentService pay = new SepaPayment();      // EU rail
AccountService acc = new UsAccountRules();   // US rules — WRONG
```

Pains: illegal combos, compliance bugs, callers must know compatibility matrix, every new region multiplies pairing errors.

## 4. How the Pattern Solves It

1. **Problem** — related products must match region
2. **Pain** — independent picking mixes families
3. **Abstract factory** — `BankingFactory` exposes `paymentService()` + `accountService()`
4. **Concrete factories** — `IndiaBankingFactory`, `EuropeBankingFactory`, `USBankingFactory`
5. **Client** picks one factory → both products are compatible

## 5. Pattern → Code Mapping

| Role | Demo type | Why |
|------|-----------|-----|
| **Abstract factory** | `BankingFactory` | Creates family members |
| **Abstract products** | `PaymentService`, `AccountService` | Family interfaces |
| **Concrete factories** | `IndiaBankingFactory`, `EuropeBankingFactory`, `USBankingFactory` | Regional families |
| **Concrete products** | Lambda implementations per region | UPI+KYC, SEPA+IBAN, ACH+routing |
| **Client** | `RegionalBankingFactoryDemo.run()` | Uses `IndiaBankingFactory` |

## 6. Important Code Lines

| Code | Significance |
|------|--------------|
| `interface BankingFactory { paymentService(); accountService(); }` | Family creation contract |
| `IndiaBankingFactory.paymentService()` → UPI | Region-locked rail |
| `IndiaBankingFactory.accountService()` → India KYC | Matching account rules |
| `factory = new IndiaBankingFactory()` | One choice locks family |

## 7. Object/Class Diagram

```text
┌─────────────────────────────────────────────────────────┐
│ <<interface>> BankingFactory                            │
│ + paymentService(): PaymentService                      │
│ + accountService(): AccountService                      │
└────────────┬────────────────────────────────────────────┘
             │
    ┌────────┼────────┬────────────┐
    ▼        ▼        ▼            ▼
 India    Europe     US      (client picks one)
Factory  Factory  Factory

Each factory creates:
  PaymentService  +  AccountService  (compatible pair)
```

## 8. Runtime Execution Flow

```text
factory = new IndiaBankingFactory()
payment = factory.paymentService()
  → pay() → "UPI payment rail"
account = factory.accountService()
  → account() → "India account KYC"
// Both from same regional family — no US/EU mix
```

## 9. What the Client Doesn't Need to Know

- Concrete payment/account class names
- Compatibility rules between rails and KYC
- How many regions exist — only the chosen factory

## 10. Before vs After

**Before:** Client picks payment + account separately → mix risk.

**After:** Client picks `BankingFactory` once → gets matched pair.

## 11. SOLID / Design Principles

| Principle | Application |
|-----------|-------------|
| **OCP** | New region = new factory class |
| **DIP** | Client depends on `BankingFactory` + product interfaces |
| **Consistency** | Family invariant enforced by factory boundary |

## 12. Extensibility

- New region: `JapanBankingFactory` with both methods
- New product in family: add method to `BankingFactory` — all factories must implement
- Trade-off: fat factory interface when family grows

## 13. Advantages

- Prevents illegal cross-region pairings
- Client code region-agnostic after factory injection
- Clear mapping: one factory = one product family

## 14. Disadvantages

- Heavy when products are independent — Factory Method enough
- Adding product type touches every concrete factory
- Can parallel many small factories — consider module boundaries

## 15. When to Use

1. Regional banking stacks (IN / EU / US)
2. UI widget families (Win/Mac themed controls)
3. Any **must-not-mix** product sets

## 16. When NOT to Use

1. Single product creation — Factory Method
2. Products independent — plain DI
3. Family rarely used together

## 17. Edge Cases / Production Concerns

| Concern | Note |
|---------|------|
| Factory selection | From tenant region header, not user choice |
| Partial families | Some regions lack product — optional methods or split factories |
| Testing | Inject `BankingFactory` mock per region |
| Runtime region change | New factory instance per region switch |

## 18. Possible Code Improvements

**Required:** Region resolver that returns correct `BankingFactory`.

**Optional:** Registry `Map<Region, BankingFactory>`; separate factories per bounded context if family grows.

## 19. Mental Model

**"Pick the kitchen, get a matching set."** Don't mix EU oven with US plug — pick European kitchen factory.

## 20. 30–60 Second Interview Answer

> Abstract Factory creates **families** of related objects that must stay consistent. A US merchant can't pair SEPA rails with US routing account rules. `BankingFactory` defines `paymentService()` and `accountService()`. `IndiaBankingFactory` returns UPI + India KYC; `EuropeBankingFactory` returns SEPA + IBAN; `USBankingFactory` returns ACH + US routing. Client selects one factory and never mixes regions. Adding a region adds one factory class, not combinatorial pairing logic in callers.

## 21. Likely Interview Follow-ups

| Question | Answer |
|----------|--------|
| vs Factory Method? | Abstract Factory = **multiple related products** per factory |
| vs Builder? | Builder builds one complex object; AF builds product sets |
| New product in family? | Update all factories — painful; design family carefully |

**Common mistake:** Using Abstract Factory for one object type — that's Factory Method.

---

## Run

```bash
cd java-design-patterns-real-world
mvn -q exec:java -Dexec.mainClass=com.example.designpatterns.creational.abstractfactory.RegionalBankingFactoryDemo
```
