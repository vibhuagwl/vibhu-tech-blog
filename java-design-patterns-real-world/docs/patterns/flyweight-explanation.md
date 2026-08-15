# Flyweight — Interview Explanation Board

> **Demo:** `CurrencyFlyweightDemo` — `src/main/java/com/example/designpatterns/structural/flyweight/CurrencyFlyweightDemo.java`

## 1. Pattern Identification

| Field | Value |
|-------|-------|
| **Name** | Flyweight |
| **Category** | Structural |
| **One-line definition** | Share intrinsic (immutable, repeatable) state across many fine-grained objects so memory scales with distinct shared data, not instance count. |
| **Problem class** | Massive object counts where most fields are identical across instances — only a small extrinsic part varies per use. |

## 2. Problem We Are Solving

A settlement system processes millions of transaction line items per day. Each line conceptually has:

| Field | Example | Cardinality |
|-------|---------|-------------|
| Amount | `1500.00` | Unique per line (extrinsic) |
| Currency code | `"USD"` | ~150 ISO codes worldwide |
| Currency symbol | `"$"` | One per code (intrinsic) |

Naive modeling creates one fat object per line:

```text
MoneyLine #1:     amount=100,  code="USD", symbol="$"
MoneyLine #2:     amount=250,  code="USD", symbol="$"   ← duplicate symbol
MoneyLine #3:     amount=75,   code="INR", symbol="₹"
...
MoneyLine #N:     amount=...,  code="USD", symbol="$"   ← duplicate again
```

For 10 million USD lines, `"USD"` and `"$"` are stored **10 million times**.

The painful question:

> How do we represent millions of money lines when currency metadata is identical across most of them — and only ~150 currency codes exist?

Relationships that make this hard:

- **Intrinsic state** — `code`, `symbol` — immutable, shared, keyed by currency
- **Extrinsic state** — `amount`, account, timestamp — unique per line
- **Factory** — must return the **same** `CurrencyMetadata` instance for `"USD"` every time

## 3. What Happens Without the Pattern

Every line embeds full currency metadata:

```java
record MoneyLine(String code, String symbol, BigDecimal amount) {}

// 10M allocations:
lines.add(new MoneyLine("USD", "$", amount1));
lines.add(new MoneyLine("USD", "$", amount2));
lines.add(new MoneyLine("USD", "$", amount3));
```

Concrete pains:

1. **Heap bloat** — duplicate strings and objects for identical metadata
2. **GC pressure** — millions of short-lived objects with repeated fields
3. **Cache unfriendly** — scattered identical data across heap
4. **Inconsistency risk** — one line has `symbol="US$"`, another `"$"` for same code
5. **Scale ceiling** — memory grows O(lines), not O(distinct currencies)

SOLID hits: less about SOLID — this is a **memory/performance** structural optimization. Still: **SRP** violated if line object owns both amount logic and currency encyclopedia.

## 4. How the Pattern Solves It

Conceptual chain:

1. **Problem** — millions of lines duplicate currency code + symbol
2. **Naive pain** — each `MoneyLine` stores full metadata
3. **Pattern introduces** — `CurrencyMetadata` flyweight (intrinsic) + factory cache
4. **Factory** — `CurrencyFactory.get("USD")` returns shared instance via `ConcurrentHashMap`
5. **Extrinsic amount** — stays on the line object or method parameter, not on flyweight
6. **Client simplifies** — `var usd = factory.get("USD")` — same reference every time

Memory scales with **distinct currency codes**, not transaction volume.

## 5. Pattern → Code Mapping

| Pattern role | Demo class / type | Why this role |
|--------------|-------------------|---------------|
| **Flyweight** | `CurrencyMetadata` (record) | Immutable intrinsic: `code`, `symbol` |
| **Flyweight Factory** | `CurrencyFactory` | Caches flyweights keyed by `code` |
| **Extrinsic context** | (implicit) amount per settlement line | Not stored on flyweight in this demo |
| **Client** | `CurrencyFlyweightDemo.run()` | Requests USD twice, verifies `usd1 == usd2` |

## 6. Important Code Lines

| Code | Design significance |
|------|---------------------|
| `record CurrencyMetadata(String code, String symbol)` | Immutable flyweight — safe to share across threads |
| `Map<String, CurrencyMetadata> cache = new ConcurrentHashMap<>()` | Thread-safe factory cache |
| `cache.computeIfAbsent(code, c -> new CurrencyMetadata(...))` | Create once per code; return existing on repeat |
| `switch (c) { case "USD" -> "$"; case "INR" -> "₹"; ... }` | Symbol resolution centralized in factory |
| `usd1 == usd2` identity check in `run()` | Proves sharing — same flyweight instance, not equal copies |

## 7. Object/Class Diagram

```text
┌─────────────────────────────────────────────────────────────┐
│ CurrencyFactory                                             │
│ - cache: ConcurrentHashMap<String, CurrencyMetadata>        │
│ + get(code): CurrencyMetadata                               │
│ + size(): int                                               │
└───────────────────────────┬─────────────────────────────────┘
                            │ creates / returns shared
                            ▼
              ┌─────────────────────────────┐
              │ CurrencyMetadata (Flyweight)│
              │ - code: String  (intrinsic) │
              │ - symbol: String (intrinsic)│
              │ immutable record            │
              └─────────────────────────────┘
                            ▲
            shared reference │
    ┌───────────┬───────────┼───────────┬───────────┐
    │           │           │           │           │
 LineItem    LineItem    LineItem    LineItem    LineItem
 amount=100  amount=250  amount=75   amount=...  amount=...
 (extrinsic) (extrinsic) (extrinsic) (extrinsic) (extrinsic)
```

## 8. Runtime Execution Flow

From `CurrencyFlyweightDemo.run()`:

```text
factory = new CurrencyFactory()

First USD request:
  usd1 = factory.get("USD")
    cache miss on "USD"
    computeIfAbsent → new CurrencyMetadata("USD", "$")
    cache size = 1

Second USD request:
  usd2 = factory.get("USD")
    cache hit on "USD"
    return existing instance
    usd1 == usd2 → true

INR request:
  inr = factory.get("INR")
    cache miss → CurrencyMetadata("INR", "₹")
    cache size = 2

Output:
  USD symbol: $, same instance? true
  INR symbol: ₹
  Cache size: 2
```

Millions of lines would still leave `cache.size()` at ~150, not millions.

## 9. What the Client Doesn't Need to Know

- That `CurrencyMetadata` is cached or shared
- How symbols are resolved (switch in factory)
- `ConcurrentHashMap` internals
- Whether flyweight was just created or reused
- Memory savings — transparent to business logic

Client mental model: **`factory.get("USD")` gives currency info** — like a interned string.

## 10. Before vs After

### Without Flyweight

```text
10,000,000 MoneyLine objects
  each embeds: code + symbol + amount
Heap: O(lines) for metadata duplication
```

### With Flyweight

```text
10,000,000 line items
  each holds: reference to CurrencyMetadata + amount
~150 CurrencyMetadata flyweights in factory cache
Heap: O(lines) for amounts + O(codes) for metadata
```

**Flyweight shares intrinsic state; extrinsic stays local.**

## 11. SOLID / Design Principles

| Principle | How Flyweight applies |
|-----------|----------------------|
| **Single Responsibility** | Factory owns creation/cache; flyweight owns immutable metadata only |
| **Immutability** | Flyweights must not change after publish — required for safe sharing |
| **Open/Closed** | Add new currency in factory switch/map without changing line item structure |
| **Don't repeat yourself** | One canonical `CurrencyMetadata` per code |
| **Separation** | Intrinsic on flyweight; extrinsic passed in at use site |

## 12. Extensibility

| Change | Approach | Trade-off |
|--------|----------|-----------|
| New currency (EUR) | Extend factory mapping | Cache auto-grows per distinct code |
| Richer metadata (decimals) | Add fields to `CurrencyMetadata` | Still shared — one copy per code |
| Unbounded key space (user themes) | Need eviction (Caffeine LRU) | Flyweight factory becomes cache policy problem |
| Format amount with symbol | Method taking extrinsic amount + flyweight | `format(usd, 100)` — extrinsic as parameter |

Never store per-line `amount` on `CurrencyMetadata` — that breaks sharing.

## 13. Advantages

- Dramatic memory reduction when intrinsic state repeats massively
- Consistent metadata — one source of truth per currency code
- Factory centralizes creation and symbol lookup
- Thread-safe sharing with immutable flyweights + concurrent cache
- GC friendly — fewer distinct string/object allocations

## 14. Disadvantages

- Added complexity for small object counts — premature optimization
- Factory becomes bottleneck if creation is expensive (mitigate with eager init)
- Unbounded cache keys → memory leak without eviction policy
- Identity semantics (`==`) vs equality (`equals`) can surprise developers
- Debugging harder — "same object" shared across unrelated lines

## 15. When to Use

1. Millions of settlement lines sharing ~150 currency definitions
2. Text editors — glyph flyweights for character rendering
3. Game engines — shared tile/grass/sprite metadata
4. Map applications — repeated icon/style objects
5. When profiling shows heap dominated by duplicate immutable fields

## 16. When NOT to Use

1. Thousands of objects, not millions — overhead not worth it
2. No shared intrinsic state — every object is unique
3. Intrinsic state must vary per instance
4. `String.intern()` or enum already solves the sharing simply
5. Distributed systems — flyweight is per-JVM; use shared cache service instead

## 17. Edge Cases / Production Concerns

| Concern | In this demo | Production note |
|---------|--------------|-----------------|
| **Thread safety** | `ConcurrentHashMap` | Flyweight immutable after publish |
| **Cache growth** | Bounded (~150 ISO) | Custom keys need eviction (Caffeine) |
| **Invalid code** | `default -> c` symbol | Validate ISO 4217; reject unknown |
| **Serialization** | Records serialize by value | Deserialize through factory to preserve sharing |
| **Classloader leaks** | Static cache holds references | Weak references in long-lived containers |
| **Distributed** | Single JVM cache | Redis for cross-node metadata if needed |

## 18. Possible Code Improvements

### Required (correctness)

- Validate currency code against ISO 4217 set
- Throw on unknown code instead of `default -> c` silent fallback

### Optional (clarity / prod)

- `MoneyLine` record holding `CurrencyMetadata currency` + `BigDecimal amount`
- Load symbols from config/DB instead of hard-coded switch
- `Enum` for well-known currencies if set is fixed and small
- JMH benchmark proving memory win before adopting

## 19. Mental Model

**Formula:**

```text
Problem:  Millions of objects × repeated immutable fields → heap explosion
Solution: Factory caches shared flyweight; extrinsic stays outside
Benefit:  Memory ∝ distinct keys, not object count
```

Memory trick: **"Intern the currency — share the shell, carry the amount yourself."**

## 20. 30–60 Second Interview Answer

> **Flyweight** minimizes memory by sharing intrinsic immutable state across many objects. In settlement, millions of money lines each stored currency code and symbol, but only about 150 ISO currencies exist — massive duplication. We split state: intrinsic (`code`, `symbol`) lives in immutable `CurrencyMetadata` flyweights; extrinsic (`amount`) stays per line. `CurrencyFactory` caches flyweights in a `ConcurrentHashMap` — `get("USD")` uses `computeIfAbsent` to create once. Calling `get("USD")` twice returns the same instance (`usd1 == usd2`). Cache size stays at 2 for USD and INR, not millions. The pattern trades a bit of complexity for heap and GC wins when object count is huge and shared data is small.

## 21. Likely Interview Follow-ups

| Question | Answer sketch |
|----------|---------------|
| Intrinsic vs extrinsic? | Intrinsic = shared, immutable, in flyweight; extrinsic = per-use, passed in |
| Flyweight vs Singleton? | Singleton = one instance globally; Flyweight = one per **key** (per USD, per INR) |
| Flyweight vs Object Pool? | Pool reuses **mutable** expensive objects; Flyweight shares **immutable** state |
| `String.intern()`? | Simple flyweight for strings — JVM deduplicates literal pool |
| When factory cache is dangerous? | Unbounded keys (user-generated) without eviction → memory leak |

**Common mistake:** Storing request-specific data on the flyweight — that prevents sharing and breaks thread safety.

---

## Run

```bash
cd java-design-patterns-real-world
mvn -q exec:java -Dexec.mainClass=com.example.designpatterns.structural.flyweight.CurrencyFlyweightDemo
```
