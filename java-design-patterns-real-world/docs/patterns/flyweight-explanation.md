# Flyweight — Interview Explanation Board

> **Demo:** `CurrencyFlyweightDemo` — `src/main/java/com/example/designpatterns/structural/flyweight/CurrencyFlyweightDemo.java`

## 1. Pattern Identification

| Field | Value |
|-------|-------|
| **Name** | Flyweight |
| **Category** | Structural |
| **One-line definition** | Share intrinsic state across many fine-grained objects to reduce memory when most state can be shared. |
| **Problem class** | Millions of money line items each duplicate identical currency metadata. |

## 2. Problem We Are Solving

Settlement exports create **millions** of line items per day. Naive design stores `code`, `symbol` on every row:

```java
new MoneyLine("USD", "$", amount) // symbol duplicated millions of times
```

Only ~150 ISO currencies exist — heap grows with transaction count, GC pressure rises, though metadata is identical per currency.

## 3. What Happens Without the Pattern

- Each line item owns full `CurrencyMetadata` copy
- Memory ∝ transaction count, not currency count
- Wasted heap on repeated `"USD"` / `"$"` strings

## 4. How the Pattern Solves It

1. **Intrinsic state** — `CurrencyMetadata(code, symbol)` shared, immutable
2. **Flyweight factory** — `CurrencyFactory` caches by code
3. **Extrinsic state** — amount per line (not stored on flyweight)
4. `factory.get("USD")` twice → same instance (`usd1 == usd2`)

## 5. Pattern → Code Mapping

| Role | Demo type | Why |
|------|-----------|-----|
| **Flyweight** | `CurrencyMetadata` (record) | Shared intrinsic state |
| **Flyweight factory** | `CurrencyFactory` | `ConcurrentHashMap` cache |
| **Client** | `CurrencyFlyweightDemo.run()` | Requests USD/INR repeatedly |
| **Extrinsic** | amount (conceptual) | Per-line, not on flyweight |

## 6. Important Code Lines

| Code | Significance |
|------|--------------|
| `ConcurrentHashMap<String, CurrencyMetadata> cache` | Thread-safe flyweight pool |
| `computeIfAbsent(code, ...)` | Create once per currency code |
| `switch (c) { case "USD" -> "$"; ... }` | Intrinsic symbol mapping |
| `usd1 == usd2` | Identity equality proves sharing |
| `factory.size()` | Bounded by distinct currencies |

## 7. Object/Class Diagram

```text
CurrencyFactory
  cache: Map<code, CurrencyMetadata>
  + get(code) → shared flyweight

Many line items (conceptual)
  extrinsic: amount
  intrinsic ref → CurrencyMetadata (shared)
```

## 8. Runtime Execution Flow

```text
factory = new CurrencyFactory()
usd1 = factory.get("USD")
usd2 = factory.get("USD")
inr = factory.get("INR")

usd1 == usd2 → true
usd1.symbol() → "$"
inr.symbol() → "₹"
factory.size() → 2
```

## 9. What the Client Doesn't Need to Know

- Cache internals
- That metadata is shared — must not mutate flyweight
- Symbol lookup switch inside factory

## 10. Before vs After

**Before:** N line items × full metadata copies.

**After:** ~150 flyweights + N amounts.

## 11. SOLID / Design Principles

| Principle | Application |
|-----------|-------------|
| **Immutability** | Flyweights must not hold extrinsic mutable state |
| **Separation** | Intrinsic vs extrinsic state split |

## 12. Extensibility

- New currency: auto-added on first `get(code)`
- Eviction policy if key space unbounded (not for ISO codes)
- Pool warm-up at startup for hot currencies

## 13. Advantages

- Massive memory reduction at scale
- Cache size bounded by distinct keys
- Thread-safe sharing with immutable flyweights

## 14. Disadvantages

- Complexity for small datasets
- Must not store request-specific data on flyweight
- Identity semantics (`==`) may surprise if expecting new instances

## 15. When to Use

1. Millions of money rows sharing currency metadata
2. Text editor character glyphs
3. Game tile sprites with shared texture

## 16. When NOT to Use

1. Small object counts
2. Intrinsic state varies per instance
3. Extrinsic state hard to separate

## 17. Edge Cases / Production Concerns

| Concern | Note |
|---------|------|
| Mutability | Never mutate `CurrencyMetadata` after publish |
| Unbounded keys | Need eviction (user-generated tags) |
| Serialization | Flyweights re-resolve through factory on deserialize |
| Cluster | Each JVM has own cache — OK for metadata |

## 18. Possible Code Improvements

**Required:** Document extrinsic vs intrinsic; immutable flyweights.

**Optional:** Enum for known currencies; metrics on cache size.

## 19. Mental Model

**"Shared stencil, different ink amounts."** One USD stencil; each line only stores the number.

## 20. 30–60 Second Interview Answer

> Flyweight shares intrinsic state across many objects to save memory. Settlement creates millions of line items duplicating USD code and $ symbol — only ~150 currencies exist. `CurrencyFactory` caches immutable `CurrencyMetadata` in a `ConcurrentHashMap` keyed by code. `get("USD")` twice returns same instance. Amount is extrinsic — passed per use, not stored on flyweight. Cache size stays at distinct currencies, not transaction count.

## 21. Likely Interview Follow-ups

| Question | Answer |
|----------|--------|
| Intrinsic vs extrinsic? | Intrinsic shared immutable; extrinsic per-context |
| vs Singleton? | Flyweight many shared objects per type; Singleton one instance total |
| Thread safety? | Immutable flyweight + concurrent factory map |

**Common mistake:** Storing amount on `CurrencyMetadata` — breaks sharing.

---

## Run

```bash
cd java-design-patterns-real-world
mvn -q exec:java -Dexec.mainClass=com.example.designpatterns.structural.flyweight.CurrencyFlyweightDemo
```
