# Singleton — Interview Explanation Board

> **Demo:** `ConfigManagerDemo` — `src/main/java/com/example/designpatterns/creational/singleton/ConfigManagerDemo.java`

## 1. Pattern Identification

| Field | Value |
|-------|-------|
| **Name** | Singleton |
| **Category** | Creational |
| **One-line definition** | Ensure exactly one instance of a class exists in a scope (typically JVM-wide) and provide a global access point. |
| **Problem class** | Multiple copies of shared configuration or registries diverge under concurrency and waste memory. |

## 2. Problem We Are Solving

A payment platform has fraud, gateway, and ledger services. Each service **loads its own copy** of payment config (`payment.timeout`, `fraud.threshold`). Under load:

- Fraud uses threshold 5000; gateway uses 3000 from a stale file
- Three parsers hold duplicate `Map` instances in heap
- Mid-settlement reload creates two `ConfigManager` instances with different values

The platform needs **one authoritative config source** per JVM.

## 3. What Happens Without the Pattern

```java
var config1 = new ConfigManager(); // fraud module
var config2 = new ConfigManager(); // gateway module
// config1 != config2, may disagree on fraud.threshold
```

Pains: inconsistent settings, duplicate memory, racey reloads, no single place to invalidate cache.

SOLID: scattered construction violates **single source of truth**; callers depend on concrete construction.

## 4. How the Pattern Solves It

1. **Problem** — many modules each construct their own config holder
2. **Pain** — drift, duplication, concurrency bugs
3. **Pattern** — private constructor + static `getInstance()` via holder
4. **All callers** use `ConfigManager.getInstance()` — same object (`first == second`)
5. **Demo also shows** `EnumConfigManager.INSTANCE` as alternate thread-safe style

## 5. Pattern → Code Mapping

| Pattern role | Demo class / type | Why this role |
|--------------|-------------------|---------------|
| **Singleton** | `ConfigManager` | Holds shared `Map<String,String>` config |
| **Private constructor** | `ConfigManager()` | Blocks external `new` |
| **Holder (lazy init)** | `Holder.INSTANCE` | Thread-safe without synchronized getter |
| **Access point** | `getInstance()` | Global entry for all modules |
| **Alternate singleton** | `EnumConfigManager.INSTANCE` | Enum singleton pattern |
| **Client** | `ConfigManagerDemo.run()` | Proves identity + reads shared values |

## 6. Important Code Lines

| Code | Design significance |
|------|---------------------|
| `private ConfigManager() {}` | Only class controls instance creation |
| `private static class Holder` | Bill Pugh holder — lazy, thread-safe |
| `private static final ConfigManager INSTANCE = new ConfigManager()` | Created when Holder class loads |
| `getInstance() → Holder.INSTANCE` | Single access path |
| `Map.of("payment.timeout", "30s", ...)` | Immutable shared config snapshot |
| `paymentTimeout()` static helper | Convenience without exposing singleton type everywhere |

## 7. Object/Class Diagram

```text
┌─────────────────────────────────────┐
│ ConfigManagerDemo (client)          │
│ + paymentTimeout()                  │
└──────────────┬──────────────────────┘
               │ getInstance()
               ▼
┌─────────────────────────────────────┐
│ ConfigManager <<singleton>>         │
│ - config: Map<String,String>        │
│ - ConfigManager() private           │
│ + getInstance(): ConfigManager      │
│ + get(key): String                  │
└─────────────────────────────────────┘
         ▲
         │ static final INSTANCE
┌────────┴────────┐
│ Holder (nested) │
└─────────────────┘

┌─────────────────────────────────────┐
│ EnumConfigManager <<enum singleton>>│
│ INSTANCE                            │
│ + get(key): String                  │
└─────────────────────────────────────┘
```

## 8. Runtime Execution Flow

From `ConfigManagerDemo.run()`:

```text
first = ConfigManager.getInstance()
  → loads Holder class → creates INSTANCE

second = ConfigManager.getInstance()
  → returns same INSTANCE

first == second → true

paymentTimeout()
  → getInstance().get("payment.timeout") → "30s"

EnumConfigManager.INSTANCE.get("region") → "IN"
```

## 9. What the Client Doesn't Need to Know

- Holder class loading mechanics
- That constructor is private (client uses `getInstance()`)
- Whether instance was created at startup or first use
- Internal map structure — only `get(key)` matters

## 10. Before vs After

**Before:** Each module `new ConfigManager()` — N instances, N configs.

**After:** All modules `ConfigManager.getInstance()` — one instance, one map.

## 11. SOLID / Design Principles

| Principle | Application |
|-----------|-------------|
| **SRP** | ConfigManager holds config only — not payment flows |
| **Controlled creation** | Creational pattern centralizes instance lifecycle |
| **Caution** | Singleton can become hidden global state — hurts testability |

In Spring apps, `@Bean` singleton scope often replaces hand-rolled Singleton.

## 12. Extensibility

- New config keys: extend map / externalize to file — same instance
- Multi-tenant: **not** one global singleton — per-tenant scoped beans
- Hot reload: replace map behind same instance with care for visibility

## 13. Advantages

- Guaranteed single instance in JVM
- Global access point
- Holder / enum avoid synchronized getters
- Saves memory for heavy shared registries

## 14. Disadvantages

- Hidden global dependency — hard to mock in tests
- Violates "inject dependencies" in modern DI frameworks
- Can grow into god object if it holds too much
- Cluster-wide singleton needs distributed store — not JVM Singleton alone

## 15. When to Use

1. Process-wide config cache (`payment.timeout`)
2. Metrics registry, ID generator with single sequence
3. Logger factory, connection pool manager (careful with lifecycle)

## 16. When NOT to Use

1. Spring `@Bean` already provides singleton scope
2. Per-request / per-tenant state
3. When testability via injection matters more than global access

## 17. Edge Cases / Production Concerns

| Concern | Note |
|---------|------|
| **Serialization** | Deserialization can create second instance — use `readResolve()` |
| **Reflection** | Can invoke private constructor — guard in constructor if strict |
| **Cluster** | JVM Singleton ≠ cluster singleton — use Redis/DB for shared state |
| **Mutable config** | Thread-safe updates or immutable snapshots |
| **Double-checked locking** | Easy to get wrong — prefer holder or enum |

## 18. Possible Code Improvements

**Required:** Externalize config from hard-coded `Map.of`.

**Optional:** Interface `PaymentConfig` injected; reload with version stamp; `readResolve()` for serialization safety.

## 19. Mental Model

**One door in, one object inside.** Everyone knocks on `getInstance()` — same room.

## 20. 30–60 Second Interview Answer

> Singleton ensures exactly one instance of a class in the JVM and a global access point. Our payment fraud, gateway, and ledger modules each loading config would duplicate maps and disagree on `fraud.threshold`. `ConfigManager` uses a private constructor and Bill Pugh holder (`Holder.INSTANCE`) so `getInstance()` always returns the same instance — demo prints `first == second` as true. We also show enum singleton `EnumConfigManager.INSTANCE`. Use for true process globals; in Spring prefer `@Bean` singleton instead of hand-rolled globals.

## 21. Likely Interview Follow-ups

| Question | Answer |
|----------|--------|
| Singleton vs Spring bean? | Spring manages scoped singleton with DI and testing support |
| Thread safety? | Holder / enum are safe; lazy `new` in getter needs sync or holder |
| How test? | Inject interface; or reset holder in tests (fragile) |

**Common mistake:** Using Singleton for everything — most objects should be injected, not global.

---

## Run

```bash
cd java-design-patterns-real-world
mvn -q exec:java -Dexec.mainClass=com.example.designpatterns.creational.singleton.ConfigManagerDemo
```
