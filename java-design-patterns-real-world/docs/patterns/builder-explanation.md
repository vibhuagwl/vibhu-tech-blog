# Builder — Interview Explanation Board

> **Demo:** `PaymentTransactionBuilderDemo` — `src/main/java/com/example/designpatterns/creational/builder/PaymentTransactionBuilderDemo.java`

## 1. Pattern Identification

| Field | Value |
|-------|-------|
| **Name** | Builder |
| **Category** | Creational |
| **One-line definition** | Separate construction of a complex object from its representation; assemble step-by-step via a fluent builder. |
| **Problem class** | Many optional fields and validation rules make telescoping constructors and half-built objects unsafe. |

## 2. Problem We Are Solving

`PaymentTransaction` has eight fields: `transactionId`, `customerId`, `amount`, `currency`, `metadata`, `retryPolicy`, `fraudCheck`, `callbackUrl`. Checkout APIs need:

- Required: id, customer, amount, currency
- Optional: metadata, retry policy, fraud flag, callback

Without structure, callers forget `fraudCheck` or send amount without currency — **invalid objects reach the gateway**.

## 3. What Happens Without the Pattern

```java
new PaymentTransaction(id, cust, amount);           // missing currency
new PaymentTransaction(id, cust, amount, currency, null, null, true, null); // unreadable
```

Pains: telescoping constructors, mutable partial objects, validation scattered, optional defaults duplicated.

## 4. How the Pattern Solves It

1. **Problem** — complex object with many optionals
2. **Pain** — invalid partial construction
3. **Builder** — fluent `Builder` with defaults (`retryPolicy="NONE"`, `fraudCheck=true`)
4. **Step-by-step** — `.transactionId().amount().currency().metadata().build()`
5. **Immutable product** — `PaymentTransaction` record returned from `build()`

## 5. Pattern → Code Mapping

| Role | Demo type | Why |
|------|-----------|-----|
| **Product** | `PaymentTransaction` (record) | Immutable assembled result |
| **Builder** | `Builder` | Mutable staging; fluent setters |
| **Director** (optional) | `run()` method | Shows typical build sequence |
| **Client** | `PaymentTransactionBuilderDemo.run()` | Constructs via builder |

## 6. Important Code Lines

| Code | Significance |
|------|--------------|
| `private String retryPolicy = "NONE"` | Sensible default on builder |
| `private boolean fraudCheck = true` | Default without caller specifying |
| `public Builder transactionId(String v) { ... return this; }` | Fluent chaining |
| `metadata.put(k,v)` on builder map | Staged optional fields |
| `Map.copyOf(metadata)` in `build()` | Defensive copy into immutable product |
| `return new PaymentTransaction(...)` | Single assembly point |

## 7. Object/Class Diagram

```text
┌─────────────────┐         builds         ┌──────────────────────┐
│ Builder         │ ─────────────────────► │ PaymentTransaction   │
│ - staged fields │                        │ (immutable record)   │
│ + transactionId │                        └──────────────────────┘
│ + amount()      │
│ + build()       │
└─────────────────┘
```

## 8. Runtime Execution Flow

```text
tx = new Builder()
  .transactionId("tx-demo-1")
  .customerId("cust-42")
  .amount(new BigDecimal("250.00"))
  .currency("USD")
  .metadata("flow", "api")
  .retryPolicy("EXPONENTIAL")
  .build()

→ PaymentTransaction with all fields + copied metadata map
Print: id=tx-demo-1, amount=250.00 USD, metadata={flow=api}, retryPolicy=EXPONENTIAL
```

## 9. What the Client Doesn't Need to Know

- Field order in record constructor
- That metadata map is copied at build time
- Default retry/fraud values unless overriding

## 10. Before vs After

**Before:** 8-arg constructor or invalid 3-arg shortcut.

**After:** Fluent builder → validated immutable `PaymentTransaction`.

## 11. SOLID / Design Principles

| Principle | Application |
|-----------|-------------|
| **SRP** | Builder constructs; transaction holds data |
| **Immutability** | Product safe to share after `build()` |
| **OCP** | New optional field extends builder, not all callers |

## 12. Extensibility

- New field: add builder field + `build()` validation
- Cross-field rules in `build()` (currency required if amount set)
- Static nested builder on product class for discoverability

## 13. Advantages

- Readable construction for many optionals
- Defaults centralized on builder
- Immutable product after build
- Validation at one choke point

## 14. Disadvantages

- Overkill for 2–3 simple fields
- Duplicate field list (builder + product)
- Java records may use compact constructors instead

## 15. When to Use

1. Payment/API payloads with many optional fields
2. Immutable domain objects with invariants
3. Stepwise assembly with validation at end

## 16. When NOT to Use

1. 1–3 required fields only
2. Lombok `@Builder` / record with defaults sufficient

## 17. Edge Cases / Production Concerns

| Concern | Note |
|---------|------|
| Missing required fields | Validate in `build()`, not setters |
| Reusing builder | Clear or new builder per transaction |
| Thread safety | Builder per thread; product immutable |
| BigDecimal scale | Validate amount scale in `build()` |

## 18. Possible Code Improvements

**Required:** `build()` throws if `amount` or `currency` null.

**Optional:** Separate `PaymentTransaction.Builder` static factory on record; JSR-303 validation.

## 19. Mental Model

**"Lego instructions step-by-step, sealed box at the end."** Mutate builder; product is frozen after `build()`.

## 20. 30–60 Second Interview Answer

> Builder separates constructing a complex object from the object itself. `PaymentTransaction` has eight fields with optionals like retry policy and fraud check — telescoping constructors create invalid half-built objects. Fluent `Builder` sets fields step-by-step with defaults (`fraudCheck=true`, `retryPolicy=NONE`), then `build()` returns immutable `PaymentTransaction` with `Map.copyOf(metadata)`. Gateway always receives a complete, consistent snapshot.

## 21. Likely Interview Follow-ups

| Question | Answer |
|----------|--------|
| Builder vs Factory? | Builder assembles **one** complex object; Factory picks **which** class |
| Telescoping constructor? | Builder replaces constructor overload explosion |
| Lombok @Builder? | Same pattern, generated code |

**Common mistake:** Mutable product with public setters — loses immutability benefit.

---

## Run

```bash
cd java-design-patterns-real-world
mvn -q exec:java -Dexec.mainClass=com.example.designpatterns.creational.builder.PaymentTransactionBuilderDemo
```
