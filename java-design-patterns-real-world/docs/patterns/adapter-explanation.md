# Adapter — Interview Explanation Board

> **Demo:** `LegacyPaymentAdapterDemo` — `src/main/java/com/example/designpatterns/structural/adapter/LegacyPaymentAdapterDemo.java`

## 1. Pattern Identification

| Field | Value |
|-------|-------|
| **Name** | Adapter |
| **Category** | Structural |
| **One-line definition** | Convert the interface of an existing class into another interface clients expect, without changing the legacy code. |
| **Problem class** | Integration mismatches — new code expects one API shape; an existing SDK or third-party library exposes a different one. |

## 2. Problem We Are Solving

A fintech team ships a new checkout service. Every controller, use-case, and test expects a clean contract:

```text
ModernPaymentService.pay(customerId, amountInDollars) → String
```

The bank's legacy SDK — still in production, still under contract — only exposes:

```text
LegacyPaymentApi.submitLegacy(account, cents) → String
```

The mismatch is not cosmetic:

| Dimension | Modern client expects | Legacy SDK provides |
|-----------|----------------------|---------------------|
| Method name | `pay` | `submitLegacy` |
| Customer identity | `customerId` (string) | `account` (string) |
| Amount unit | dollars (integer) | cents (integer) |

Example call the product wants: `pay("acct-1001", 10)` — ten dollars.

What the bank actually needs: `submitLegacy("acct-1001", 1000)` — one thousand cents.

Relationships that make this hard:

- **Client** — built against `ModernPaymentService`; should not import legacy types
- **LegacyPaymentApi** — vendor-owned; cannot be rewritten this sprint
- **Translation** — dollar-to-cent conversion and parameter mapping must happen somewhere

## 3. What Happens Without the Pattern

Every caller duplicates the translation inline:

```java
// In CheckoutController
LegacyPaymentApi legacy = new LegacyPaymentApi();
String result = legacy.submitLegacy(customerId, amount * 100);

// In RefundService — same translation, copy-pasted
legacy.submitLegacy(account, dollars * 100);

// In SubscriptionRenewalJob — again
if (amount < 0) { ... }
legacy.submitLegacy(userId, amount * 100);
```

Concrete pains:

1. **Duplicated conversion logic** — `amount * 100` scattered across services; one team forgets it
2. **Leaky legacy types** — `LegacyPaymentApi` imported everywhere; swapping vendors breaks dozens of files
3. **Inconsistent error handling** — one caller maps legacy return codes; another ignores them
4. **Testing nightmare** — every test must mock the legacy shape instead of the modern interface
5. **Future API migration blocked** — no single seam to replace legacy with a new provider

SOLID hits: **SRP** (checkout owns payment *and* translation), **OCP** (new legacy quirks edit every caller), **DIP** (high-level modules depend on low-level legacy API).

## 4. How the Pattern Solves It

Conceptual chain:

1. **Problem** — clients need `pay(customerId, dollars)`; legacy only offers `submitLegacy(account, cents)`
2. **Naive pain** — every caller converts dollars to cents and knows legacy method names
3. **Pattern introduces** — `PaymentAdapter` implements `ModernPaymentService` (Target) and wraps `LegacyPaymentApi` (Adaptee)
4. **Translation lives in one place** — `pay()` calls `legacy.submitLegacy(customerId, amount * 100)`
5. **Client simplifies** — inject `ModernPaymentService`; never touch `LegacyPaymentApi`

The integration boundary moves **from every caller into one adapter**.

## 5. Pattern → Code Mapping

| Pattern role | Demo class / type | Why this role |
|--------------|-------------------|---------------|
| **Target** | `ModernPaymentService` (interface) | What new checkout code expects |
| **Adaptee** | `LegacyPaymentApi` | Existing incompatible bank SDK |
| **Adapter** | `PaymentAdapter` | Implements Target, wraps Adaptee, translates |
| **Client** | `LegacyPaymentAdapterDemo.run()` | Calls `adapter.pay("acct-1001", 10)` |

This demo uses an **object adapter** (composition): `PaymentAdapter` holds a `LegacyPaymentApi` reference. Java has no practical class adapter (multiple inheritance).

## 6. Important Code Lines

| Code | Design significance |
|------|---------------------|
| `interface ModernPaymentService { String pay(String customerId, int amount); }` | Target — the interface clients depend on |
| `String submitLegacy(String account, int cents)` in `LegacyPaymentApi` | Adaptee — incompatible method signature and units |
| `PaymentAdapter implements ModernPaymentService` | Adapter conforms to what clients need |
| `private final LegacyPaymentApi legacy` | Composition — wraps adaptee without subclassing it |
| `return legacy.submitLegacy(customerId, amount * 100)` | Translation encapsulated: dollars → cents at the boundary |

## 7. Object/Class Diagram

```text
┌─────────────────────┐         uses          ┌─────────────────────┐
│ Client              │ ────────────────────► │ <<interface>>       │
│ (checkout service)  │                       │ ModernPaymentService│
└─────────────────────┘                       │ + pay(id, amount)   │
                                              └──────────┬──────────┘
                                                         │ implements
                                              ┌──────────▼──────────┐
                                              │ PaymentAdapter      │
                                              │ - legacy: Legacy... │
                                              │ + pay(id, amount)   │
                                              │   → translate       │
                                              └──────────┬──────────┘
                                                         │ wraps
                                              ┌──────────▼──────────┐
                                              │ LegacyPaymentApi    │
                                              │ + submitLegacy(     │
                                              │     account, cents) │
                                              └─────────────────────┘
```

## 8. Runtime Execution Flow

From `LegacyPaymentAdapterDemo.run()`:

```text
Setup:
  legacy = new LegacyPaymentApi()
  adapter = new PaymentAdapter(legacy)

Client call:
  adapter.pay("acct-1001", 10)

Inside PaymentAdapter.pay():
  customerId = "acct-1001"
  amount     = 10 (dollars)
  cents      = 10 * 100 = 1000
  legacy.submitLegacy("acct-1001", 1000)

Inside LegacyPaymentApi.submitLegacy():
  return "legacy:acct-1001:1000"

Client receives:
  "legacy:acct-1001:1000"
```

The client never multiplies by 100 or calls `submitLegacy`.

## 9. What the Client Doesn't Need to Know

- That the bank SDK is named `LegacyPaymentApi`
- That amounts must be sent in cents, not dollars
- The legacy method name `submitLegacy`
- How customer IDs map to bank account strings (here 1:1; adapter could enrich)
- Return string format from the legacy layer
- Whether tomorrow's implementation is legacy, REST, or gRPC — only `ModernPaymentService` matters

Client mental model: **inject an interface, call `pay`**.

## 10. Before vs After

### Without Adapter

```text
Client A ──► LegacyPaymentApi.submitLegacy(id, amount * 100)
Client B ──► LegacyPaymentApi.submitLegacy(id, amount * 100)
Client C ──► LegacyPaymentApi.submitLegacy(id, amount * 100)
              ↑ duplicated translation, legacy type everywhere
```

Client **knows and speaks** the legacy API.

### With Adapter

```text
Client A ──┐
Client B ──┼──► ModernPaymentService.pay(id, amount)
Client C ──┘              │
                          ▼
                   PaymentAdapter
                          │
                          ▼ translate dollars → cents
                   LegacyPaymentApi
```

**Adapter understands the legacy shape; clients do not.**

## 11. SOLID / Design Principles

| Principle | How Adapter applies |
|-----------|---------------------|
| **Single Responsibility** | Adapter owns translation; clients own checkout flow |
| **Open/Closed** | Swap `LegacyPaymentApi` for a new vendor behind same `ModernPaymentService` |
| **Liskov** | `PaymentAdapter` is substitutable anywhere `ModernPaymentService` is expected |
| **Interface Segregation** | Clients depend only on `pay()` — not the full legacy surface |
| **Dependency Inversion** | High-level checkout depends on `ModernPaymentService`, not `LegacyPaymentApi` |

## 12. Extensibility

| Change | Approach | Trade-off |
|--------|----------|-----------|
| New legacy error codes | Map to domain exceptions inside `PaymentAdapter` | Adapter grows; still better than N callers |
| CustomerId → account lookup | Enrich `pay()` before calling legacy | Adapter becomes thicker; consider separate mapper |
| Second legacy provider | New adapter class, same Target interface | Factory selects adapter at runtime |
| Async payments | New `AsyncModernPaymentService` + async adapter | Cannot force sync legacy into async without bridge |

Do not leak `LegacyPaymentApi` through the Target interface — that defeats the pattern.

## 13. Advantages

- Clients stay on a clean, modern interface
- Translation logic exists in exactly one class
- Legacy SDK can be replaced without touching callers
- Easy to unit-test clients with a fake `ModernPaymentService`
- Works with third-party code you cannot modify

## 14. Disadvantages

- Extra indirection layer — one more class to maintain
- Adapter can become a "god translator" if too many concerns pile in
- Performance overhead is usually negligible but exists (extra hop)
- Two interfaces to document: Target for clients, Adaptee for integration
- Risk of permanent adapter if nobody ever migrates off legacy

## 15. When to Use

1. Integrating a legacy bank SDK whose API does not match your domain model
2. Wrapping third-party libraries with incompatible interfaces
3. Reusing existing classes when you cannot change their source
4. Gradual migration — new code on Target; old code on Adaptee until cutover
5. Unit conversion, naming, or protocol translation at system boundaries

## 16. When NOT to Use

1. You own both sides and can change the legacy API — fix the interface instead
2. The mismatch is a one-off call in one place — a private helper may suffice
3. You need to **add behavior** to an object — that's Decorator, not Adapter
4. You need to **control access** to an object — that's Proxy
5. The "adaptation" is really a full domain redesign — adapter hides deeper modeling problems

## 17. Edge Cases / Production Concerns

| Concern | In this demo | Production note |
|---------|--------------|-----------------|
| **Rounding** | `amount * 100` assumes whole dollars | Use `BigDecimal` for fractional currency |
| **Overflow** | `int` cents | Guard large amounts; consider `long` |
| **Idempotency** | Not addressed | Adapter should forward idempotency keys if legacy supports them |
| **Timeouts / retries** | Synchronous call | Wrap legacy in resilience layer or use Proxy |
| **Error mapping** | Returns raw string | Map legacy codes to `PaymentException` at adapter boundary |
| **Thread safety** | Stateless adapter | Safe if `LegacyPaymentApi` is thread-safe or adapter is per-request |

## 18. Possible Code Improvements

### Required (correctness)

- Validate `customerId` and `amount > 0` before calling legacy
- Map legacy failures to typed domain exceptions

### Optional (clarity / prod)

- `BigDecimal` for money conversion instead of `int * 100`
- Separate `CustomerAccountResolver` if ID mapping is non-trivial
- Metrics on adapter latency and legacy error rate
- Circuit breaker around `LegacyPaymentApi` for vendor outages

## 19. Mental Model

**Formula:**

```text
Problem:  Client API ≠ Existing API → duplication and leakage
Solution: Adapter implements Target, wraps Adaptee, translates inside
Benefit:  Clients speak one language; legacy stays behind one door
```

Memory trick: **"Plug adapter — client sees the socket they expect."**

## 20. 30–60 Second Interview Answer

> **Adapter** is a structural pattern for making an existing incompatible API work with code that expects a different interface. In our demo, new checkout code wants `ModernPaymentService.pay(customerId, amountInDollars)`, but the bank's `LegacyPaymentApi` only has `submitLegacy(account, cents)`. Without Adapter, every caller would duplicate `amount * 100` and import the legacy SDK. `PaymentAdapter` implements `ModernPaymentService`, wraps `LegacyPaymentApi`, and translates inside `pay()` — dollars to cents, then delegates to `submitLegacy`. The client calls `adapter.pay("acct-1001", 10)` and gets `"legacy:acct-1001:1000"` without knowing the legacy shape. We use object adapter (composition) because Java doesn't support multiple inheritance for class adapters.

## 21. Likely Interview Follow-ups

| Question | Answer sketch |
|----------|---------------|
| Object adapter vs class adapter? | Object adapter composes Adaptee (preferred in Java); class adapter subclasses both Target and Adaptee — not practical in Java |
| Adapter vs Facade? | Adapter **changes** interface to match; Facade **simplifies** many subsystems behind one coarse API |
| Adapter vs Decorator? | Adapter **converts** interface; Decorator **adds behavior** to same interface |
| Two-way adapter? | Possible but rare — both sides call through one translator |
| When remove the adapter? | After legacy deprecation — replace injection with native implementation of Target |

**Common mistake:** Calling any wrapper an Adapter — if interfaces already match and you're only adding caching or logging, that's Proxy or Decorator.

---

## Run

```bash
cd java-design-patterns-real-world
mvn -q exec:java -Dexec.mainClass=com.example.designpatterns.structural.adapter.LegacyPaymentAdapterDemo
```
