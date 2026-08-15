# Singleton — Interview Explanation Board

> **Demo:** `ConfigManagerDemo` — `src/main/java/com/example/designpatterns/creational/singleton/ConfigManagerDemo.java`

## 1. Pattern Identification

| Field | Value |
|-------|-------|
| **Name** | Singleton |
| **Category** | Creational |
| **One-line definition** | Ensure exactly one instance of a class exists in the JVM and provide a global access point to it. |
| **Problem class** | Process-wide shared resources (config, metrics, ID generators) where duplicate instances cause drift, wasted memory, and inconsistent behavior under concurrency. |

## 2. Problem We Are Solving

A payment platform runs multiple services in the same JVM:

- **Fraud service** — reads `fraud.threshold` from a config file
- **Gateway service** — reads `payment.timeout` from the same file
- **Ledger service** — loads the file again on startup

Each service constructs its own `ConfigLoader` and parses `payment-config.json` independently.

Example drift scenario:

```text
FraudService config     → fraud.threshold = 5000
GatewayService config   → payment.timeout = 30s
LedgerService config    → payment.timeout = 45s   ← stale copy on disk
```

The painful question:

> How do we guarantee every module reads **identical** payment settings — and that only **one** parsed config map exists in memory — when dozens of classes could each call `new ConfigLoader()`?

Relationships that make this hard:

- **Shared state** — timeout and fraud threshold must be consistent across settlement
- **Many callers** — fraud, gateway, ledger, reconciliation all need the same values
- **Concurrency** — two instances mid-settlement can disagree on `fraud.threshold` after a hot reload
- **Construction cost** — parsing YAML/JSON on every `new` wastes CPU and heap

## 3. What Happens Without the Pattern

Naive config access in every service:

```java
public class FraudService {
    private final Map<String, String> config = loadConfigFromDisk(); // parse #1

    public boolean isSuspicious(int amount) {
        int threshold = Integer.parseInt(config.get("fraud.threshold"));
        return amount > threshold;
    }
}

public class GatewayService {
    private final Map<String, String> config = loadConfigFromDisk(); // parse #2

    public Duration timeout() {
        return Duration.parse(config.get("payment.timeout"));
    }
}
```

Concrete pains:

1. **Duplicate parsing** — same file read N times; memory holds N identical maps
2. **Drift under reload** — one service refreshes config, another keeps stale values
3. **No single source of truth** — `fraud.threshold` and `payment.timeout` can disagree across modules
4. **Race on lazy init** — `if (instance == null) instance = new ConfigManager()` without synchronization creates two instances on concurrent first access
5. **Testing nightmare** — no controlled way to reset or substitute config across the JVM

SOLID hits: **SRP** (every service owns config loading), **DIP** (callers depend on ad-hoc maps instead of a shared abstraction).

## 4. How the Pattern Solves It

Conceptual chain:

1. **Problem** — many services each load and hold their own config copy
2. **Naive pain** — duplicate parsing, drift, inconsistent thresholds mid-settlement
3. **Pattern introduces** — `ConfigManager` with private constructor + static `getInstance()` returning one JVM-wide instance
4. **Holder pattern** — `Holder.INSTANCE` is created lazily by the JVM when the holder class is first loaded (thread-safe without explicit locks)
5. **Shared immutable map** — `Map.of("payment.timeout", "30s", "fraud.threshold", "5000")` is read by all callers through the same instance
6. **Client simplifies** — `ConfigManager.getInstance().get("payment.timeout")` or `paymentTimeout()` static helper; never `new ConfigManager()`

Config loading moves **from every service into one singleton**.

## 5. Pattern → Code Mapping

| Pattern role | Demo class / type | Why this role |
|--------------|-------------------|---------------|
| **Singleton** | `ConfigManager` | Holds the single config map; private constructor blocks external `new` |
| **Lazy holder** | `ConfigManager.Holder` | JVM initializes `INSTANCE` on first `getInstance()` — thread-safe by class loading |
| **Access point** | `ConfigManager.getInstance()` | Global entry; always returns the same reference |
| **Alternate singleton** | `EnumConfigManager` | Enum constant `INSTANCE` — serialization-safe, thread-safe alternative |
| **Client** | `ConfigManagerDemo.run()` | Obtains instance twice, proves identity, reads shared keys |
| **Convenience accessor** | `paymentTimeout()` | Static wrapper so callers need not chain `getInstance().get(...)` everywhere |

## 6. Important Code Lines

| Code | Design significance |
|------|---------------------|
| `private ConfigManager() {}` | Blocks `new ConfigManager()` — only the class itself can construct |
| `private static class Holder { static final ConfigManager INSTANCE = new ConfigManager(); }` | Bill Pugh holder — lazy, thread-safe, no synchronized getter |
| `public static ConfigManager getInstance() { return Holder.INSTANCE; }` | Single access point; first call loads `Holder`, which creates `INSTANCE` |
| `Map.of("payment.timeout", "30s", "fraud.threshold", "5000")` | Immutable shared state — callers cannot accidentally fork settings |
| `first == second` in `run()` | Runtime proof: two `getInstance()` calls return identical reference |
| `EnumConfigManager.INSTANCE` | Second style — enum guarantees one instance per enum constant |

## 7. Object/Class Diagram

```text
┌─────────────────────────────────────────────────────────────┐
│ ConfigManagerDemo (client)                                  │
│ + paymentTimeout(): String                                  │
│ + run()                                                     │
└──────────────────────────┬──────────────────────────────────┘
                           │ uses
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ ConfigManager (singleton)                                   │
│ - config: Map<String,String>  (immutable)                   │
│ - ConfigManager()             (private)                     │
│ + getInstance(): ConfigManager                              │
│ + get(key): String                                          │
│                                                             │
│   ┌─────────────────────────────────────┐                   │
│   │ Holder (static nested)              │                   │
│   │ - INSTANCE: ConfigManager (final)   │                   │
│   └─────────────────────────────────────┘                   │
└─────────────────────────────────────────────────────────────┘

Alternate:
┌─────────────────────────────────────────────────────────────┐
│ EnumConfigManager (enum singleton)                          │
│ INSTANCE                                                    │
│ - config: Map<String,String>                                │
│ + get(key): String                                          │
└─────────────────────────────────────────────────────────────┘
```

## 8. Runtime Execution Flow

From `ConfigManagerDemo.run()`:

```text
STEP 1: first = ConfigManager.getInstance()
  → JVM loads ConfigManager.Holder (first time)
  → Holder.<clinit> runs → INSTANCE = new ConfigManager()
  → returns Holder.INSTANCE  (reference @0x1a2b)

STEP 2: second = ConfigManager.getInstance()
  → Holder already loaded
  → returns same Holder.INSTANCE  (reference @0x1a2b)
  → first == second → true

STEP 3: paymentTimeout()
  → ConfigManager.getInstance().get("payment.timeout")
  → returns "30s"

STEP 4: EnumConfigManager.INSTANCE.get("region")
  → enum constant already exists at class load
  → returns "IN"

Output:
  Same instance? true
  payment.timeout = 30s
  region = IN
```

No second `ConfigManager` is ever constructed after the holder initializes.

## 9. What the Client Doesn't Need to Know

- That `Holder` exists or when it is loaded
- How thread safety is achieved (class-loader initialization vs `synchronized`)
- That the config map is `Map.of` (immutable) vs a mutable `HashMap`
- That `EnumConfigManager` is an alternate implementation style
- Parsing logic, file paths, or reload mechanics (not in this demo)
- Whether `getInstance()` allocates anything on the second call (it does not)

Client mental model: **one config object, one call to get it**.

## 10. Before vs After

### Without Singleton

```text
FraudService          GatewayService         LedgerService
     │                      │                      │
     │ loadConfig()         │ loadConfig()         │ loadConfig()
     ▼                      ▼                      ▼
 Map copy #1            Map copy #2            Map copy #3
 threshold=5000         timeout=30s            timeout=45s  ← drift
```

Each service **owns and parses** its own config.

### With Singleton

```text
FraudService    GatewayService    LedgerService
     │                │                │
     │ getInstance()  │ getInstance()  │ getInstance()
     └────────────────┼────────────────┘
                      ▼
              ConfigManager (one instance)
              config: { payment.timeout=30s,
                        fraud.threshold=5000 }
```

**One instance serves all; callers never construct.**

## 11. SOLID / Design Principles

| Principle | How Singleton applies |
|-----------|----------------------|
| **Single Responsibility** | `ConfigManager` owns config storage; services own business logic only |
| **Dependency Inversion** | Callers depend on `getInstance()` / accessor, not file I/O details |
| **Controlled global state** | One place to audit what is shared process-wide |

Singleton is **not** a free pass for god objects — keep the singleton thin (hold state, not orchestrate flows).

## 12. Extensibility

| Change | Approach | Trade-off |
|--------|----------|-----------|
| Hot reload config | Replace inner map on reload behind same `getInstance()` | Must synchronize or use volatile reference swap |
| Per-environment config | Factory chooses holder contents at startup | Still one instance per JVM |
| Spring `@Bean` singleton | Container manages single bean — classic Singleton pattern often redundant | Prefer DI in Spring apps |
| Multiple logical singletons | Separate classes (`MetricsRegistry`, `IdGenerator`) | Do not stuff everything into one mega singleton |
| Testing | Package-private constructor + test subclass, or inject `ConfigProvider` interface | Singleton hard-codes global — interface + DI is more testable |

## 13. Advantages

- Guaranteed single instance — no accidental `new` duplicates
- Lazy initialization with holder — no work until first use
- Thread-safe without explicit locking (holder / enum)
- Global access point — any class can read consistent payment settings
- Enum variant is serialization-safe and reflection-resistant

## 14. Disadvantages

- Hidden global dependency — hard to see who reads config
- Testing requires discipline (reset state, or avoid singleton in tests)
- Violates "inject dependencies" in modern Spring apps
- Temptation to grow into a god object (DB pools, caches, metrics all in one class)
- Clustered deployments still need external config (Redis, Consul) — JVM singleton does not sync across nodes
- Double-checked locking is easy to get wrong without `volatile`

## 15. When to Use

1. Process-wide config cache (`payment.timeout`, `fraud.threshold`) read by many modules
2. Metrics registry or logging context that must be unique per JVM
3. In-memory ID sequence generator that cannot fork counters
4. Hardware or OS handle wrappers (single printer spooler connection)
5. When exactly one instance is a **business invariant**, not just convenience

## 16. When NOT to Use

1. Spring `@Bean` with default singleton scope already provides one instance
2. Per-request, per-tenant, or per-user state (use scoped beans or context objects)
3. Stateless utility classes (`MathUtils`) — static methods suffice, no instance needed
4. When you need multiple instances in tests without global pollution
5. Distributed config across pods — external store + cache, not JVM singleton alone

## 17. Edge Cases / Production Concerns

| Concern | In this demo | Production note |
|---------|--------------|-----------------|
| **Threads** | Holder is thread-safe | Mutable config inside singleton needs `volatile` swap or locks on reload |
| **Serialization** | Not demonstrated | Deserialization can create second instance — use enum singleton or `readResolve()` |
| **Reflection** | Private constructor | `setAccessible(true)` can bypass — enum singleton is safer |
| **Class loaders** | One holder per loader | Web apps with multiple WARs may get multiple "singletons" |
| **Testing** | Static `getInstance()` | Prefer injectable `ConfigProvider`; or reset in `@AfterEach` if unavoidable |
| **God object** | Thin map holder | Do not add charge(), settle(), email() to `ConfigManager` |
| **Cluster drift** | JVM-local only | Use central config service; singleton is local cache fronting it |

## 18. Possible Code Improvements

### Required (correctness)

- Validate keys in `get()` — return `Optional` or throw on missing `payment.timeout`
- Document that `EnumConfigManager` is illustrative; pick one style per app

### Optional (clarity / prod)

- `interface PaymentConfig` + singleton implements it — enables mock injection in tests
- File-backed loader inside private constructor with immutable snapshot
- `volatile` reference swap for hot reload: `configRef = Map.copyOf(newMap)`
- Remove static `paymentTimeout()` in Spring apps; inject config bean instead

## 19. Mental Model

**Formula:**

```text
Problem:  Many copies of shared config → drift, waste, races
Solution: Private constructor + one static access path → single JVM instance
Benefit:  All callers read identical payment.timeout and fraud.threshold
```

Memory trick: **"One JVM, one instance, one front door (`getInstance`)."**

## 20. 30–60 Second Interview Answer

> **Singleton** is a creational pattern that guarantees exactly one instance of a class per JVM and a global access point. In our payment platform, fraud, gateway, and ledger services each loading their own config causes duplicate parsing and drift — one service might see `payment.timeout=45s` while another sees `30s`. `ConfigManager` uses a private constructor and Bill Pugh holder: `Holder.INSTANCE` is created lazily when `getInstance()` is first called, thread-safe without synchronized getters. The immutable map holds `payment.timeout` and `fraud.threshold`; every caller gets the same reference (`first == second` is true). We also show `EnumConfigManager` as an alternate thread-safe style. Callers use `ConfigManager.getInstance().get("payment.timeout")` or the `paymentTimeout()` helper — never `new ConfigManager()`.

## 21. Likely Interview Follow-ups

| Question | Answer sketch |
|----------|---------------|
| Holder vs double-checked locking? | Holder: JVM class init is thread-safe. DCL needs `volatile` on instance — easy to break |
| Singleton vs Spring `@Bean`? | Spring scope singleton is per container; classic Singleton is per JVM class loader — often redundant in Spring |
| How test singleton code? | Inject interface; or test-only reset; avoid static in unit tests when possible |
| Enum singleton pros? | Serialization-safe, reflection-resistant, thread-safe by definition |
| Clustered apps? | JVM singleton ≠ cluster singleton — use distributed config + local cache |

**Common mistake:** Using Singleton for everything "because we only need one" — many objects are naturally single-instance via DI scopes; reserve Singleton for true process globals like config registry.

---

## Run

```bash
cd java-design-patterns-real-world
mvn -q exec:java -Dexec.mainClass=com.example.designpatterns.creational.singleton.ConfigManagerDemo
```
