# Builder — Interview Explanation Board

> **Demo:** `PaymentTransactionBuilderDemo` — `src/main/java/com/example/designpatterns/creational/builder/PaymentTransactionBuilderDemo.java`

## 1. Pattern Identification

| Field | Value |
|-------|-------|
| **Name** | Builder |
| **Category** | Creational |
| **One-line definition** | Separate the construction of a complex object from its representation so the same construction process can create different configurations step-by-step, with validation at `build()`. |
| **Problem class** | Domain objects with many fields (required + optional), telescoping constructors, and invariants that half-built instances violate before they reach the gateway. |

## 2. Problem We Are Solving

A payment API sends `PaymentTransaction` to the gateway with eight fields:

| Field | Required? | Example |
|-------|-----------|---------|
| `transactionId` | Yes | `tx-demo-1` |
| `customerId` | Yes | `cust-42` |
| `amount` | Yes | `250.00` |
| `currency` | Yes | `USD` |
| `metadata` | Optional | `flow=api` |
| `retryPolicy` | Optional (default `NONE`) | `EXPONENTIAL` |
| `fraudCheck` | Optional (default `true`) | `true` |
| `callbackUrl` | Optional (default `""`) | webhook URL |

Callers include checkout API, batch settlement, and mobile SDK — each sets different optional fields.

The painful question:

> How do we build a **complete, immutable** `PaymentTransaction` without telescoping constructors for every combination — and without sending half-filled objects missing `currency` or `fraudCheck` to the gateway?

Relationships that make this hard:

- **Many optional fields** — metadata, retry, callback vary per flow
- **Cross-field rules** — `amount` meaningless without `currency`; gateway rejects null currency
- **Immutability** — once sent, transaction snapshot must not mutate mid-flight
- **Defaults** — `fraudCheck=true`, `retryPolicy=NONE` should apply without every caller repeating them

## 3. What Happens Without the Pattern

Naive construction with constructors and setters:

```java
// Telescoping constructors explode
public PaymentTransaction(String id, String customerId, BigDecimal amount) { ... }
public PaymentTransaction(String id, String customerId, BigDecimal amount, String currency) { ... }
public PaymentTransaction(String id, String customerId, BigDecimal amount, String currency,
                            String retryPolicy) { ... }
// ... 2^optional combinations

// Or mutable bean — half-built object leaks
PaymentTransaction tx = new PaymentTransaction();
tx.setTransactionId("tx-1");
tx.setAmount(new BigDecimal("250.00"));
// forgot currency — gateway.submit(tx) throws or mischarges
```

Concrete pains:

1. **Telescoping constructors** — unreadable, combinatorial explosion with 8 fields
2. **Invalid partial objects** — mutable setters allow submit before required fields set
3. **Duplicated defaults** — every caller must remember `fraudCheck=true`
4. **Shared mutable metadata** — `Map` passed in and modified by gateway corrupts caller copy
5. **Validation scattered** — currency check in checkout, amount check in batch job

SOLID hits: **SRP** (callers own construction + validation), **immutability** violated by beans.

## 4. How the Pattern Solves It

Conceptual chain:

1. **Problem** — eight fields, optional metadata/retry/callback, telescoping constructors
2. **Naive pain** — half-built txs, forgotten currency, duplicated defaults
3. **Pattern introduces** — mutable `Builder` with fluent setters returning `this`
4. **Sensible defaults** — `retryPolicy = "NONE"`, `fraudCheck = true`, `callbackUrl = ""`
5. **Step-by-step** — `.transactionId(...).customerId(...).amount(...).currency(...).metadata(...).build()`
6. **Immutable product** — `build()` returns `PaymentTransaction` record with `Map.copyOf(metadata)`

Construction complexity moves **from many constructors into one fluent builder + one build()**.

## 5. Pattern → Code Mapping

| Pattern role | Demo class / type | Why this role |
|--------------|-------------------|---------------|
| **Product** | `PaymentTransaction` (record) | Immutable snapshot sent to gateway |
| **Builder** | `Builder` (static nested class) | Accumulates fields; mutable until `build()` |
| **Fluent setter** | `transactionId(String v)` etc. | Returns `this` for chained calls |
| **Default fields** | `retryPolicy = "NONE"`, `fraudCheck = true` | Optional fields pre-filled on builder |
| **Build method** | `build()` | Assembles record + `Map.copyOf(metadata)` |
| **Client** | `PaymentTransactionBuilderDemo.run()` | Chains setters, calls `build()`, prints snapshot |

## 6. Important Code Lines

| Code | Design significance |
|------|---------------------|
| `record PaymentTransaction(...)` | Immutable product — eight fields fixed at construction |
| `private final Map<String, String> metadata = new HashMap<>()` | Builder holds mutable map; copied on build |
| `private String retryPolicy = "NONE"` | Default optional field — callers omit if acceptable |
| `private boolean fraudCheck = true` | Security default — opt-out explicit via `.fraudCheck(false)` |
| `public Builder transactionId(String v) { transactionId = v; return this; }` | Fluent API — chain without separate builder variable noise |
| `metadata(String k, String v)` | Incremental optional map without exposing raw `HashMap` |
| `Map.copyOf(metadata)` in `build()` | Defensive copy — product map immutable, independent of builder |
| `new Builder().transactionId(...).amount(...).build()` | Client reads like a sentence of field assignments |

## 7. Object/Class Diagram

```text
┌─────────────────────────────────────────────────────────────┐
│ PaymentTransactionBuilderDemo (client)                      │
│ + run()                                                     │
└──────────────────────────┬──────────────────────────────────┘
                           │ uses
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ Builder (mutable)                                           │
│ - transactionId, customerId, amount, currency               │
│ - metadata: HashMap (mutable)                               │
│ - retryPolicy = "NONE"                                      │
│ - fraudCheck = true                                         │
│ - callbackUrl = ""                                          │
│ + transactionId(v): Builder                                 │
│ + customerId(v): Builder                                    │
│ + amount(v): Builder                                        │
│ + currency(v): Builder                                      │
│ + metadata(k,v): Builder                                    │
│ + retryPolicy(v): Builder                                   │
│ + fraudCheck(v): Builder                                    │
│ + callbackUrl(v): Builder                                   │
│ + build(): PaymentTransaction                               │
└──────────────────────────┬──────────────────────────────────┘
                           │ build()
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ PaymentTransaction (record, immutable)                      │
│ transactionId, customerId, amount, currency                 │
│ metadata (immutable Map), retryPolicy, fraudCheck, callback │
└─────────────────────────────────────────────────────────────┘
```

## 8. Runtime Execution Flow

From `PaymentTransactionBuilderDemo.run()`:

```text
STEP 1: new Builder()
  → retryPolicy="NONE", fraudCheck=true, callbackUrl=""
  → empty metadata HashMap

STEP 2: chain setters
  .transactionId("tx-demo-1")     → transactionId set
  .customerId("cust-42")         → customerId set
  .amount(BigDecimal("250.00"))  → amount set
  .currency("USD")                → currency set
  .metadata("flow", "api")        → metadata["flow"]="api"
  .retryPolicy("EXPONENTIAL")     → overrides default NONE

STEP 3: .build()
  → new PaymentTransaction(
        "tx-demo-1", "cust-42", 250.00, "USD",
        Map.copyOf({flow=api}), "EXPONENTIAL", true, "")
  → immutable record returned

Output:
  id=tx-demo-1, amount=250.00 USD
  metadata={flow=api}, retryPolicy=EXPONENTIAL

Note: fraudCheck not set in chain → default true applied
Note: callbackUrl not set → default "" applied
```

Gateway receives complete snapshot; builder can be reused or discarded.

## 9. What the Client Doesn't Need to Know

- That builder uses `HashMap` internally for metadata accumulation
- Default values for `retryPolicy`, `fraudCheck`, `callbackUrl`
- That `Map.copyOf` runs at build time for immutability
- Record canonical constructor parameter order
- Whether validation runs in `build()` (not in this demo — production should add)
- That builder is mutable — only the **product** is immutable

Client mental model: **chain what you need, build once, get immutable tx**.

## 10. Before vs After

### Without Builder

```text
Client
  │
  ├── pick constructor overload #3 of 12
  │
  ├── OR set field, set field, forget currency
  │
  └── submit half-built mutable bean → gateway error
```

Client **fights constructors or mutable beans**.

### With Builder

```text
Client
   │
   │ new Builder()
   │   .transactionId("tx-demo-1")
   │   .customerId("cust-42")
   │   .amount(250.00)
   │   .currency("USD")
   │   .metadata("flow", "api")
   │   .retryPolicy("EXPONENTIAL")
   │   .build()
   ▼
PaymentTransaction (immutable, complete snapshot)
```

**Builder absorbs optional complexity; product is always fully formed at build().**

## 11. SOLID / Design Principles

| Principle | How Builder applies |
|-----------|---------------------|
| **Single Responsibility** | Builder constructs; gateway charges; checkout orchestrates |
| **Open/Closed** | New optional field: add builder field + record component — callers opt in |
| **Immutability** | Record product — thread-safe snapshot after `build()` |

Builder is a **construction pattern**, not a substitute for domain validation — put invariants in `build()`.

## 12. Extensibility

| Change | Approach | Trade-off |
|--------|----------|-----------|
| New field (`idempotencyKey`) | Add to record + builder setter | All existing `build()` paths get default or required validation |
| Validation in `build()` | Throw if `currency` null when `amount` set | Fail fast before gateway |
| Static factory `Builder.forRefund()` | Presets retry + metadata | Convenience without subclass explosion |
| Lombok `@Builder` | Generated builder | Less control over defaults/copy |
| Java record compact builder | Custom static `builder()` on record | Modern style for records |
| Step builder | Separate stages (amount stage, metadata stage) | For very long wizard UIs |

## 13. Advantages

- Readable fluent construction — reads top-to-bottom like config
- Optional fields without constructor overload explosion
- Centralized defaults (`fraudCheck=true`) in one place
- Immutable product safe to pass across threads and async gateway calls
- `Map.copyOf` prevents metadata leakage between builder and product
- Easy to add validation once in `build()`

## 14. Disadvantages

- More code than a simple constructor for 2–3 field objects
- Mutable builder must not be shared across threads during construction
- No compile-time guarantee required fields set until `build()` validates (unless staged builder)
- Duplicate field names between builder and product
- Can be overused for trivial DTOs
- Lombok-generated builders hide defaults and copy logic

## 15. When to Use

1. `PaymentTransaction` with 8 fields and mixed required/optional
2. API requests with metadata maps and policy flags
3. SQL query builders, HTTP request builders, test data builders
4. When immutability + many optional params collide
5. When defaults (`fraudCheck`, `retryPolicy`) must be consistent across all creation paths

## 16. When NOT to Use

1. Object has 1–3 simple required fields — constructor suffices
2. All fields required always — canonical constructor is clearer
3. Java record with 2 fields — compact constructor wins
4. Construction is always identical — factory method returns fixed instance
5. IDE-generated mutable beans acceptable and immutability not required

## 17. Edge Cases / Production Concerns

| Concern | In this demo | Production note |
|---------|--------------|-----------------|
| **Missing required fields** | No validation in `build()` | `if (currency == null) throw` in `build()` |
| **Mutable metadata** | `Map.copyOf` on build | Also copy nested values if maps hold mutable objects |
| **Builder reuse** | New builder per tx | After `build()`, reset or discard — stale fields leak |
| **Threads** | Single-threaded demo | Do not share builder across threads |
| **BigDecimal scale** | `250.00` | Normalize scale in `amount()` setter |
| **Empty callback** | Default `""` | Distinguish null vs empty vs valid URL in validation |
| **Record immutability** | All fields final | Deep immutability requires immutable map contents |

## 18. Possible Code Improvements

### Required (correctness)

- Validate in `build()`: non-null `transactionId`, `customerId`, `amount`, `currency`
- Reject `amount <= 0` and blank `currency` before creating record

### Optional (clarity / prod)

- Static `PaymentTransaction.builder()` factory on record for discoverability
- `Builder.from(PaymentTransaction)` for copy-with-changes
- Enum `RetryPolicy` instead of string `retryPolicy`
- Separate `MetadataBuilder` if metadata rules grow complex
- `@JsonDeserialize(builder = ...)` for API deserialization symmetry

## 19. Mental Model

**Formula:**

```text
Problem:  Many optional fields → telescoping constructors or half-built beans
Solution: Mutable Builder with fluent setters + defaults → build() → immutable product
Benefit:  Readable construction, safe snapshot, centralized defaults and validation
```

Memory trick: **"Configure on the builder, commit on build() — the product is frozen."**

## 20. 30–60 Second Interview Answer

> **Builder** separates step-by-step construction of a complex object from its final representation. `PaymentTransaction` has eight fields — ids, amount, currency, metadata, retry policy, fraud check, callback — and telescoping constructors or mutable setters let half-filled objects reach the gateway without currency or with wrong fraud defaults. We use a nested `Builder` with fluent methods returning `this`, defaults like `retryPolicy="NONE"` and `fraudCheck=true`, and `build()` that creates an immutable `PaymentTransaction` record with `Map.copyOf(metadata)`. The client chains `.transactionId("tx-demo-1").customerId("cust-42").amount(250.00).currency("USD").metadata("flow","api").retryPolicy("EXPONENTIAL").build()`. Optional fields omitted still get safe defaults; the gateway receives one complete snapshot. Validation belongs in `build()` so invalid txs never exist.

## 21. Likely Interview Follow-ups

| Question | Answer sketch |
|----------|---------------|
| Builder vs Factory? | Factory chooses **which** type; Builder configures **one** complex instance step-by-step |
| Builder vs telescoping constructors? | Builder scales with optional fields; constructors combinatorially explode |
| Lombok `@Builder`? | Same pattern, generated — watch defaults and `toBuilder` for copies |
| Immutability with builder? | Mutate builder only until `build()`; product is immutable record |
| Validate in setters vs build()? | Cross-field rules (amount+currency) in `build()`; simple null checks can be in setters |

**Common mistake:** Making the **product** mutable with a builder — builder mutability is temporary; the built object should be immutable for domain types like payments.

---

## Run

```bash
cd java-design-patterns-real-world
mvn -q exec:java -Dexec.mainClass=com.example.designpatterns.creational.builder.PaymentTransactionBuilderDemo
```
