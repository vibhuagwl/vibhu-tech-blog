# Prototype — Interview Explanation Board

> **Demo:** `ReportConfigurationPrototypeDemo` — `src/main/java/com/example/designpatterns/creational/prototype/ReportConfigurationPrototypeDemo.java`

## 1. Pattern Identification

| Field | Value |
|-------|-------|
| **Name** | Prototype |
| **Category** | Creational |
| **One-line definition** | Create new objects by copying a pre-configured prototype instance rather than reconstructing from scratch, especially when initialization is expensive or error-prone. |
| **Problem class** | Many near-identical instances (daily settlement reports per country) differing only in small deltas, with mutable nested state that shallow copies would share. |

## 2. Problem We Are Solving

Finance ops runs **daily-settlement** reports every morning for multiple regions:

```text
Base template:  reportName=daily-settlement, country=IN, format=CSV
India run:      same + country=IN     (default)
US run:         same + country=US     (clone + tweak)
EU run:         same + country=DE     (clone + tweak)
```

Each report needs a `ReportConfiguration` with:

- `reportName` — shared across all regional runs
- `filters` map — `country`, `format`, optional `tenant`, `dateRange`

Rebuilding from strings each time repeats validation (allowed formats, country codes, mandatory keys). Copy-paste of filter maps risks typos.

The painful question:

> How do we produce dozens of regional variants **cheaply and safely** — without re-validating from scratch each time, and without shallow copies that leak filter edits across tenants?

Relationships that make this hard:

- **Prototype** — validated base `ReportConfiguration` template
- **Clone** — regional variant differs only in `country` filter
- **Mutable filters** — `Map<String,String>` must be deep-copied; shallow copy shares map
- **Invariant** — mutating US clone must not change India prototype's `country=IN`

## 3. What Happens Without the Pattern

Naive per-region construction:

```java
// Rebuild from scratch — repeated validation
ReportConfiguration india = new ReportConfiguration(
    "daily-settlement", Map.of("country", "IN", "format", "CSV"));
validate(india);  // expensive

ReportConfiguration us = new ReportConfiguration(
    "daily-settlement", Map.of("country", "US", "format", "CSV"));
validate(us);  // duplicate work

// Shallow copy disaster
ReportConfiguration usBad = india;  // same reference
usBad.putFilter("country", "US");
// india now shows US — prototype corrupted
```

Or manual map copy with mistakes:

```java
Map<String, String> filters = india.getFilters();  // exposed mutable map
filters.put("country", "US");  // mutates prototype if shared
```

Concrete pains:

1. **Repeated validation** — same rules run N times per morning batch
2. **Copy-paste errors** — wrong format string in one region's constructor
3. **Shallow copy leaks** — shared `filters` map mutates prototype
4. **Object.clone() fragility** — `Cloneable` is broken in Java; checked exceptions, shallow by default
5. **No template catalog** — each job reinvents base config strings

SOLID hits: **DRY violation** (validation duplicated), **correctness** (shared mutable state breaks isolation).

## 4. How the Pattern Solves It

Conceptual chain:

1. **Problem** — many similar report configs; rebuild or shallow copy is slow or dangerous
2. **Naive pain** — duplicate validation, shared map mutations corrupt base template
3. **Pattern introduces** — `ReportConfiguration` prototype with explicit `deepCopy()`
4. **Deep copy** — `new ReportConfiguration(reportName, filters)` copies map via constructor `new HashMap<>(filters)`
5. **Clone and tweak** — `copy.putFilter("country", "US")` only on clone
6. **Prototype untouched** — `base.filter("country")` stays `IN` after US clone mutates

Copy logic moves **into the prototype class**; clients clone instead of reconstruct.

## 5. Pattern → Code Mapping

| Pattern role | Demo class / type | Why this role |
|--------------|-------------------|---------------|
| **Prototype** | `ReportConfiguration` | Template instance to copy; holds `reportName` + `filters` |
| **Clone operation** | `deepCopy()` | Explicit copy API — avoids `Object.clone()` |
| **Deep copy mechanics** | Constructor `new HashMap<>(filters)` | New map so clone mutations do not affect prototype |
| **Client mutation** | `putFilter(key, value)` | Adjust clone after copy — prototype not modified |
| **Client** | `ReportConfigurationPrototypeDemo.run()` | Creates base, deep copies, mutates clone only |
| **Registry (implicit)** | `base` template in `run()` | Could be map of template id → prototype in production |

## 6. Important Code Lines

| Code | Design significance |
|------|---------------------|
| `private final Map<String, String> filters` | Filters owned by instance; constructor copies incoming map |
| `this.filters = new HashMap<>(filters)` in constructor | Defensive copy on creation — external map cannot mutate internal state |
| `public ReportConfiguration deepCopy()` | Prototype pattern API — name says deep, not `clone()` |
| `return new ReportConfiguration(reportName, filters)` | Copy constructor path — new map from existing filters |
| `copy.putFilter("country", "US")` | Client tweaks clone only |
| `base.filter("country")` still `IN` | Proof prototype isolation after clone mutation |
| `implements Cloneable` on class | Illustrative — demo prefers explicit `deepCopy()` over `Object.clone()` |

## 7. Object/Class Diagram

```text
┌─────────────────────────────────────────────────────────────┐
│ ReportConfigurationPrototypeDemo (client)                   │
│ + run()                                                     │
└──────────────────────────┬──────────────────────────────────┘
                           │
           ┌───────────────┴───────────────┐
           │ creates base (prototype)      │ deepCopy()
           ▼                               ▼
┌──────────────────────┐         ┌──────────────────────┐
│ base (prototype)     │         │ copy (clone)         │
│ reportName:          │         │ reportName:          │
│  "daily-settlement"  │         │  "daily-settlement"  │
│ filters:             │         │ filters:             │
│  country=IN          │         │  country=US (mutated)│
│  format=CSV          │         │  format=CSV          │
└──────────────────────┘         └──────────────────────┘
         │                                 │
         │ separate HashMap instances      │
         ▼                                 ▼
    map @0x1a2b                       map @0x3c4d
    (not shared)
```

## 8. Runtime Execution Flow

From `ReportConfigurationPrototypeDemo.run()`:

```text
STEP 1: base = new ReportConfiguration("daily-settlement",
           Map.of("country", "IN", "format", "CSV"))
  → constructor copies Map.of into new HashMap
  → base.filters = {country=IN, format=CSV}
  → Base country filter: IN

STEP 2: copy = base.deepCopy()
  → new ReportConfiguration("daily-settlement", base.filters)
  → constructor copies base.filters into new HashMap
  → copy.filters is separate map @0x3c4d

STEP 3: copy.putFilter("country", "US")
  → copy.filters["country"] = "US"
  → base.filters["country"] still "IN"

Output:
  Prototype country: IN
  Clone country: US

Internal state:
  base.filter("country")  → "IN"   (prototype safe)
  copy.filter("country")  → "US"   (regional variant)
  copy.filter("format")   → "CSV"  (inherited from prototype)
```

No re-validation loop in client — base was validated when first created (implicit in production).

## 9. What the Client Doesn't Need to Know

- That constructor performs `new HashMap<>(filters)` defensive copy
- Difference between shallow and deep copy for nested structures
- That `Cloneable` is implemented but `Object.clone()` is not used
- Internal map reference addresses
- How `reportName` is shared as immutable `String` (safe to share between clone and prototype)
- Registry/catalog mechanics if templates are stored in a `Map<String, ReportConfiguration>`

Client mental model: **copy template, change what differs, leave prototype alone**.

## 10. Before vs After

### Without Prototype

```text
Client
  │
  ├── new ReportConfiguration(...) + validate   (India)
  │
  ├── new ReportConfiguration(...) + validate   (US)
  │
  └── OR shallow ref / shared map
         └── putFilter on "copy" mutates prototype → IN becomes US
```

Client **rebuilds or accidentally shares** mutable state.

### With Prototype

```text
Client
   │
   │ base = validated template (IN, CSV)
   │
   │ copy = base.deepCopy()
   │
   │ copy.putFilter("country", "US")
   ▼
base (IN)          copy (US)
  unchanged          regional variant
```

**Prototype stays canonical; clones absorb deltas.**

## 11. SOLID / Design Principles

| Principle | How Prototype applies |
|-----------|----------------------|
| **DRY** | Validation and base defaults live in one prototype instance |
| **Encapsulation** | Copy logic inside `ReportConfiguration` — clients don't hand-copy maps |
| **Safe defaults** | Template encodes approved `format=CSV` once |

Prototype complements **Factory** and **Builder** when copy is cheaper than parameterized construction.

## 12. Extensibility

| Change | Approach | Trade-off |
|--------|----------|-----------|
| Prototype registry | `Map<String, ReportConfiguration> templates` | Keyed by `daily-settlement` |
| Deep nested config | Recursive deepCopy on nested objects | More fields to duplicate |
| Immutable prototype | Prototype frozen; only clones mutable | Safer shared catalog |
| `copyWithCountry(String c)` | Convenience on prototype | Less error than raw `putFilter` |
| Serialization round-trip | JSON serialize prototype, deserialize clone | Alternative copy path |
| Pool of prototypes | Pre-validated templates warmed at startup | Memory vs CPU trade |

## 13. Advantages

- Faster than reconstruct + re-validate for each regional run
- Explicit `deepCopy()` clearer than `Object.clone()`
- Defensive map copy prevents filter leakage across tenants
- Small deltas (country only) easy after clone
- Natural fit for report templates, fee schedules, game entity presets

## 14. Disadvantages

- Must implement and maintain copy logic for every mutable field
- Deep copy can be expensive for large nested graphs
- Easy to forget deep copy on new field — regression to shallow share
- `Cloneable` / `clone()` in Java is widely discouraged
- Prototype registry adds lifecycle questions (when to refresh template?)
- Not helpful when each instance is structurally different, not similar

## 15. When to Use

1. Daily settlement reports cloned per country from one validated template
2. Fee schedule variants per merchant tier — clone base, adjust rate
3. Game levels copied from designer preset with small tweaks
4. Document templates (legal clauses) copied per jurisdiction
5. When construction from DB/strings is expensive and instances are **mostly identical**

## 16. When NOT to Use

1. Cheap construction with few fields — `new` or builder is simpler
2. Every instance radically different — factory with parameters wins
3. Immutability everywhere — share immutable prototype, no copy needed (flyweight)
4. Deep object graphs where copy cost exceeds rebuild
5. Prototype state hard to duplicate (open sockets, DB connections)

## 17. Edge Cases / Production Concerns

| Concern | In this demo | Production note |
|---------|--------------|-----------------|
| **Shallow vs deep** | Map deep-copied | Lists, nested objects need explicit deep copy |
| **Prototype mutation** | Client mutates clone only | Never mutate catalog prototype after registration |
| **Thread safety** | Single-threaded | Registry of prototypes needs concurrent map or immutability |
| **Stale template** | Static base | Refresh prototype when compliance rules change |
| **Object.clone()** | Not used | Prefer copy constructor or `deepCopy()` — `Cloneable` is fragile |
| **Null filters** | Map.of in demo | Null-safe copy in constructor |
| **Identity fields** | reportName copied | Some fields may need new id per clone — document which |

## 18. Possible Code Improvements

### Required (correctness)

- Make prototype immutable after registration; clones built via `deepCopy()` only
- Document shallow vs deep per field in class comment

### Optional (clarity / prod)

- `ReportConfiguration copyWithCountry(String country)` instead of raw `putFilter`
- `PrototypeRegistry` with `get("daily-settlement").deepCopy()`
- Remove `Cloneable` if unused — avoid implying `Object.clone()` support
- JSON-based copy for complex nested config with schema validation on deserialize
- Track `version` on prototype; reject clone if template version mismatch

## 19. Mental Model

**Formula:**

```text
Problem:  Rebuild similar configs → slow, error-prone; shallow copy → shared mutable maps
Solution: Validated prototype + deepCopy() → tweak clone only
Benefit:  Fast regional variants; prototype country=IN stays IN when clone becomes US
```

Memory trick: **"Copy the template, edit the clone — never edit the master."**

## 20. 30–60 Second Interview Answer

> **Prototype** creates objects by copying an existing instance instead of building from scratch. Finance ops runs `daily-settlement` reports for many countries that share `format=CSV` but differ in `country` filter. Rebuilding each `ReportConfiguration` from strings repeats validation; shallow copies share the `filters` map so changing US clone corrupts the India template. `ReportConfiguration` holds `reportName` and a `filters` map; constructor defensively copies the map. `deepCopy()` returns `new ReportConfiguration(reportName, filters)` with a fresh `HashMap`. Client creates base with `country=IN`, calls `deepCopy()`, then `copy.putFilter("country", "US")`. Prototype still returns `IN`; clone returns `US`. We avoid `Object.clone()` and use explicit `deepCopy()` for clarity and deep map isolation. Ideal when instances are nearly identical with small deltas and setup is expensive.

## 21. Likely Interview Follow-ups

| Question | Answer sketch |
|----------|---------------|
| Shallow vs deep copy? | Shallow shares nested references; deep copies nested mutable structures — maps here must be deep |
| Prototype vs Builder? | Builder assembles new object step-by-step; Prototype copies existing configured instance |
| Why not `Object.clone()`? | Shallow by default, `Cloneable` broken, checked exceptions — explicit `deepCopy()` is clearer |
| Prototype registry? | Map of template name → prototype; jobs call `registry.get(id).deepCopy()` |
| Mutable prototype safe? | Freeze prototype after validation; only clones mutate |

**Common mistake:** Assigning `copy = base` (reference copy) or shallow-cloning the map — US `putFilter` silently changes India template.

---

## Run

```bash
cd java-design-patterns-real-world
mvn -q exec:java -Dexec.mainClass=com.example.designpatterns.creational.prototype.ReportConfigurationPrototypeDemo
```
