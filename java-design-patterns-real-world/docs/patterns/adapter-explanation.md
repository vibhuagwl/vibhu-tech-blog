# Adapter — Interview Explanation Board

> **Demo:** `LegacyPaymentAdapterDemo` — `src/main/java/com/example/designpatterns/structural/adapter/LegacyPaymentAdapterDemo.java`

## 1. Pattern Identification

| Field | Value |
|-------|-------|
| **Name** | Adapter |
| **Category** | Structural |
| **One-line definition** | Convert the interface of a class into another interface clients expect — wrap incompatible API so existing code can work together. |
| **Problem class** | Legacy/third-party APIs whose shape does not match what new payment code expects. |

## 2. Problem We Are Solving

New checkout expects `ModernPaymentService.pay(customerId, amountInDollars)`. The bank's legacy SDK only offers `LegacyPaymentApi.submitLegacy(account, cents)`. Every caller would duplicate:

- Dollar → cent conversion (`amount * 100`)
- `customerId` → `account` mapping

Integration cannot rewrite the legacy SDK overnight.

## 3. What Happens Without the Pattern

```java
int cents = amount * 100;
legacy.submitLegacy(customerId, cents); // duplicated in checkout, refund, admin
```

Pains: translation logic scattered, inconsistent rounding, legacy types leak into modern layers.

## 4. How the Pattern Solves It

1. **Target** — `ModernPaymentService` (what clients need)
2. **Adaptee** — `LegacyPaymentApi` (existing SDK)
3. **Adapter** — `PaymentAdapter` implements Target, wraps Adaptee
4. **Translation** — inside `pay()`: `legacy.submitLegacy(customerId, amount * 100)`

## 5. Pattern → Code Mapping

| Role | Demo type | Why |
|------|-----------|-----|
| **Target** | `ModernPaymentService` | Client-facing interface |
| **Adaptee** | `LegacyPaymentApi` | Legacy incompatible API |
| **Adapter** | `PaymentAdapter` | Implements Target, holds Adaptee |
| **Client** | `LegacyPaymentAdapterDemo.run()` | Calls `adapter.pay("acct-1001", 10)` |

## 6. Important Code Lines

| Code | Significance |
|------|--------------|
| `PaymentAdapter implements ModernPaymentService` | Adapter is usable where modern API expected |
| `private final LegacyPaymentApi legacy` | Object adapter (composition) |
| `legacy.submitLegacy(customerId, amount * 100)` | Translation boundary — dollars to cents |
| `new PaymentAdapter(new LegacyPaymentApi())` | Wrap at integration boundary |

## 7. Object/Class Diagram

```text
Client ──► ModernPaymentService (Target)
              ▲
              │ implements
         PaymentAdapter
              │ wraps
              ▼
         LegacyPaymentApi (Adaptee)
         + submitLegacy(account, cents)
```

## 8. Runtime Execution Flow

```text
adapter = new PaymentAdapter(new LegacyPaymentApi())
adapter.pay("acct-1001", 10)
  → legacy.submitLegacy("acct-1001", 1000)
  → "legacy:acct-1001:1000"
```

Client passes **10 dollars**; legacy receives **1000 cents**.

## 9. What the Client Doesn't Need to Know

- Legacy method name `submitLegacy`
- Cent conversion factor
- That adapter wraps `LegacyPaymentApi`

## 10. Before vs After

**Before:** Client → legacy SDK + manual conversion everywhere.

**After:** Client → `ModernPaymentService` → adapter translates once.

## 11. SOLID / Design Principles

| Principle | Application |
|-----------|-------------|
| **SRP** | Adapter owns translation only |
| **DIP** | Client depends on Target interface |
| **Isolation** | Legacy quirks contained at boundary |

## 12. Extensibility

- New legacy fields: extend adapter mapping
- Multiple legacy APIs: multiple adapters, same Target
- Error code mapping at adapter boundary

## 13. Advantages

- Reuse legacy without rewriting callers
- Single translation point
- Gradual migration path

## 14. Disadvantages

- Extra layer; can hide performance limits of legacy
- Adapter maintenance when either side changes
- Wrong pattern if you own both APIs — fix API instead

## 15. When to Use

1. Bank legacy SDK integration
2. Third-party payment APIs with different shapes
3. Cannot change Adaptee source

## 16. When NOT to Use

1. You control both sides — align interfaces
2. Need to **add** behavior to same interface — Decorator
3. Need access control — Proxy

## 17. Edge Cases / Production Concerns

| Concern | Note |
|---------|------|
| Rounding | Currency conversion rules in adapter |
| Error mapping | Legacy codes → domain exceptions |
| Idempotency | Legacy may not support — document in adapter |
| Leaking Adaptee | Never return legacy types through Target |

## 18. Possible Code Improvements

**Required:** Map legacy errors to `PaymentException`.

**Optional:** Injectable adapter for testing; metrics on translation failures.

## 19. Mental Model

**"Universal plug adapter."** Same outlet (Target) for foreign plug (Adaptee).

## 20. 30–60 Second Interview Answer

> Adapter makes incompatible interfaces work together. Checkout expects `pay(customerId, dollars)` but legacy bank SDK has `submitLegacy(account, cents)`. `PaymentAdapter` implements `ModernPaymentService`, wraps `LegacyPaymentApi`, and translates dollars to cents inside `pay()`. Clients stay on modern API; conversion lives in one class. Object adapter via composition — preferred in Java over class adapter.

## 21. Likely Interview Follow-ups

| Question | Answer |
|----------|--------|
| Adapter vs Decorator? | Adapter **changes** interface; Decorator **same** interface, adds behavior |
| Adapter vs Facade? | Adapter translates one API; Facade simplifies many services |
| Class vs object adapter? | Java uses composition (object adapter) |

**Common mistake:** Putting business rules in adapter — only translation/mapping.

---

## Run

```bash
cd java-design-patterns-real-world
mvn -q exec:java -Dexec.mainClass=com.example.designpatterns.structural.adapter.LegacyPaymentAdapterDemo
```
