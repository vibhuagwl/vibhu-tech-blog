# Prototype — Interview Explanation Board

> **Demo:** `ReportConfigurationPrototypeDemo` — `src/main/java/com/example/designpatterns/creational/prototype/ReportConfigurationPrototypeDemo.java`

## 1. Pattern Identification

| Field | Value |
|-------|-------|
| **Name** | Prototype |
| **Category** | Creational |
| **One-line definition** | Create new objects by copying a prototype instance rather than constructing from scratch. |
| **Problem class** | Expensive or error-prone reconstruction of nearly identical configurations. |

## 2. Problem We Are Solving

Finance ops runs **daily settlement reports** for dozens of countries. Each report shares:

- Report name: `daily-settlement`
- Format: `CSV`
- Filters: country-specific

Rebuilding each config from strings repeats validation. Shallow copy shares mutable filter maps — editing US clone mutates IN template.

## 3. What Happens Without the Pattern

```java
var us = new ReportConfiguration("daily-settlement", Map.of("country","US",...));
var in = new ReportConfiguration("daily-settlement", Map.of("country","IN",...));
// copy-paste validation; or shallow clone leaks shared map
```

Pains: slow setup, copy-paste errors, shared mutable state across tenants.

## 4. How the Pattern Solves It

1. **Problem** — many similar configs differing slightly
2. **Pain** — rebuild or shallow copy risks
3. **Prototype** — validated `ReportConfiguration` template
4. **deepCopy()** — new instance with copied map
5. **Clone** mutates only `country` filter; base stays `IN`

## 5. Pattern → Code Mapping

| Role | Demo type | Why |
|------|-----------|-----|
| **Prototype** | `ReportConfiguration` | Template to copy |
| **Clone method** | `deepCopy()` | Explicit copy API (not `Object.clone()`) |
| **Client** | `ReportConfigurationPrototypeDemo.run()` | base → copy → mutate clone |
| **Registry** (conceptual) | base template | Could map template id → prototype |

## 6. Important Code Lines

| Code | Significance |
|------|--------------|
| `new HashMap<>(filters)` in constructor | Defensive copy on create |
| `deepCopy() → new ReportConfiguration(reportName, filters)` | Clone via constructor re-copy |
| `putFilter(key, value)` on instance | Mutate clone only |
| `base.filter("country")` still `IN` after clone → `US` | Prototype untouched |

## 7. Object/Class Diagram

```text
┌─────────────────────────┐
│ ReportConfiguration     │
│ - reportName            │
│ - filters: Map          │
│ + deepCopy(): self      │
│ + putFilter(k,v)        │
└─────────────────────────┘
         │
    deepCopy()
         ▼
   new instance (independent map)
```

## 8. Runtime Execution Flow

```text
base = new ReportConfiguration("daily-settlement", Map.of("country","IN","format","CSV"))
  → base.filter("country") = IN

copy = base.deepCopy()
copy.putFilter("country", "US")

base.filter("country") → IN  (prototype unchanged)
copy.filter("country")  → US
```

## 9. What the Client Doesn't Need to Know

- Internal map structure
- Whether copy uses constructor vs serialization
- Clone depth — client trusts `deepCopy()`

## 10. Before vs After

**Before:** Rebuild N configs or shallow copy with shared maps.

**After:** Clone template, tweak delta fields only.

## 11. SOLID / Design Principles

| Principle | Application |
|-----------|-------------|
| **DRY** | Validation once on prototype |
| **Encapsulation** | Copy logic inside class |
| **Safe mutation** | Clone isolated from prototype |

## 12. Extensibility

- Prototype registry: `Map<String, ReportConfiguration>` keyed by template id
- Deep vs shallow: document per field
- New field: update constructor + `deepCopy()`

## 13. Advantages

- Faster than full reconstruction
- Less copy-paste than manual `new`
- Central validated template

## 14. Disadvantages

- `Object.clone()` fragile in Java — prefer explicit copy
- Deep copy cost for large graphs
- Builder may be clearer for simple deltas

## 15. When to Use

1. Report/config templates with small per-run deltas
2. Game entity spawning from archetypes
3. Clone expensive validated objects

## 16. When NOT to Use

1. Cheap construction via Builder
2. Objects with external resources (DB connections) — copy semantics unclear

## 17. Edge Cases / Production Concerns

| Concern | Note |
|---------|------|
| Deep vs shallow | Nested lists need recursive copy |
| Mutable prototype | Never mutate shared prototype in prod |
| Thread safety | Copy per thread or immutable prototypes |
| Cloneable interface | Avoid — use explicit `deepCopy()` |

## 18. Possible Code Improvements

**Required:** Document deep-copy fields; immutable prototype templates.

**Optional:** Prototype registry; copy via serialization for complex graphs (careful with performance).

## 19. Mental Model

**"Photocopy the form, then fill in one field."** Template stays blank; copy gets the edit.

## 20. 30–60 Second Interview Answer

> Prototype creates objects by cloning a prototype instead of rebuilding from scratch. Finance needs dozens of `daily-settlement` reports differing only by country filter. Rebuilding repeats validation; shallow copy shares mutable filter maps. `ReportConfiguration.deepCopy()` clones the template with a copied map — mutate clone's country to US while base stays IN. Explicit `deepCopy()` beats fragile `Object.clone()`.

## 21. Likely Interview Follow-ups

| Question | Answer |
|----------|--------|
| Deep vs shallow? | Shallow shares references; deep copies nested mutables |
| vs Builder? | Prototype when starting from existing; Builder from scratch |
| Registry? | Map of template id → prototype for ops catalog |

**Common mistake:** Shallow clone of `HashMap` — tenants leak filters.

---

## Run

```bash
cd java-design-patterns-real-world
mvn -q exec:java -Dexec.mainClass=com.example.designpatterns.creational.prototype.ReportConfigurationPrototypeDemo
```
