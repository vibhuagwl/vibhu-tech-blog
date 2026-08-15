# Template Method — Interview Explanation Board

> **Demo:** `PaymentProcessingTemplateDemo` — `src/main/java/com/example/designpatterns/behavioral/templatemethod/PaymentProcessingTemplateDemo.java`

## 1. Pattern Identification

| Field | Value |
|-------|-------|
| **Name** | Template Method |
| **Category** | Behavioral |
| **One-line definition** | Define the skeleton of an algorithm in a base class, deferring some steps to subclasses — subclasses override hooks without changing the invariant step order. |
| **One-line definition (alt)** | `final` template method fixes workflow; hooks vary per payment rail. |
| **Problem class** | Card and UPI flows duplicate `validate → authenticate → process → audit → notify`; only the middle `process` step truly differs, but teams reorder steps in one rail and forget the other. |

## 2. Problem We Are Solving

Every payment rail must run the **same ordered pipeline**:

```text
validate → authenticate → process → audit → notify
```

Only the **process** step differs:

- **Card** — `process-card` (Stripe tokenization, 3DS, etc.)
- **UPI** — `process-upi` (VPA collect, NPCI flow, etc.)

Example outputs from demo:

```text
CardProcessor.execute() → [validate, authenticate, process-card, audit, notify]
UpiProcessor.execute()  → [validate, authenticate, process-upi, audit, notify]
```

The painful questions:

> How do we guarantee audit and notify **always** run after process — even when a new engineer adds `CryptoProcessor`?

> How do we avoid copy-pasting the same four shared steps into every rail class?

Relationships that make this hard:

- **Invariant skeleton** — step order is a compliance requirement
- **Variable step** — `process()` is rail-specific
- **Shared steps** — `validate`, `authenticate`, `audit`, `notifyCustomer` identical today
- **Subclass temptation** — override `execute()` and break order

## 3. What Happens Without the Pattern

Naive card and UPI processors duplicate the full pipeline:

```java
public class CardProcessor {
    public List<String> execute() {
        List<String> steps = new ArrayList<>();
        steps.add("validate");
        steps.add("authenticate");
        steps.add("process-card");
        steps.add("audit");
        steps.add("notify");
        return steps;
    }
}

public class UpiProcessor {
    public List<String> execute() {
        List<String> steps = new ArrayList<>();
        steps.add("validate");
        steps.add("authenticate");
        steps.add("process-upi");
        steps.add("audit");
        // engineer forgets notify in UPI copy — production incident
        return steps;
    }
}
```

Concrete pains:

1. **Duplication** — four shared steps copied per rail
2. **Drift** — card team adds fraud check; UPI team ships without it
3. **Order violations** — subclass reorders `audit` before `process` for "optimization"
4. **Compliance risk** — skipping `notify` in one rail breaks regulatory receipt rules
5. **Testing** — must assert full pipeline separately for every processor class

SOLID hits: **DRY violation**, **fragile base** if subclasses override wrong methods.

## 4. How the Pattern Solves It

Conceptual chain:

1. **Problem** — card and UPI copy identical validate-authenticate-audit-notify sequences
2. **Naive pain** — only `process` differs but every rail reimplements full list
3. **Pattern introduces** — abstract `PaymentProcessor` with `final execute()` template
4. **Fixed skeleton** — `validate` → `authenticate` → `process` → `audit` → `notifyCustomer`
5. **Hook** — `protected abstract void process(List<String> steps)` — subclass must implement
6. **Default hooks** — shared steps have concrete implementations in base class
7. **Subclasses** — `CardProcessor` adds `process-card`; `UpiProcessor` adds `process-upi`
8. **Cannot skip steps** — `execute()` is `final`; subclasses override hooks only

Invariant order moves **into the base class template method**.

## 5. Pattern → Code Mapping

| Pattern role | Demo class / type | Why this role |
|--------------|-------------------|---------------|
| **Abstract Class** | `PaymentProcessor` | Defines template + default hook implementations |
| **Template Method** | `PaymentProcessor.execute()` (`final`) | Fixed algorithm skeleton; calls hooks in order |
| **Primitive operation (hook)** | `process(List<String> steps)` — abstract | Rail-specific extension point |
| **Concrete hook defaults** | `validate`, `authenticate`, `audit`, `notifyCustomer` | Shared steps with default behavior |
| **Concrete Class** | `CardProcessor`, `UpiProcessor` | Override `process()` only |
| **Client** | `PaymentProcessingTemplateDemo.run()` | Runs both processors; compares step lists |

## 6. Important Code Lines

| Code | Design significance |
|------|---------------------|
| `public final List<String> execute()` | Template method — subclasses cannot rewrite skeleton |
| `validate(steps); authenticate(steps); process(steps); audit(steps); notifyCustomer(steps);` | Invariant order enforced in one place |
| `protected abstract void process(List<String> steps)` | Only mandatory override for new rail |
| `protected void validate(List<String> steps) { steps.add("validate"); }` | Default hook — subclass may override if needed |
| `CardProcessor.process() → steps.add("process-card")` | Card-specific middle step |
| `UpiProcessor.process() → steps.add("process-upi")` | UPI-specific middle step |
| `List<String> steps` passed through hooks | Demo traceability; prod might use context object |
| Identical prefix/suffix in both outputs | Proves skeleton stability |

## 7. Object/Class Diagram

```text
                    ┌─────────────────────────────────┐
                    │  PaymentProcessor (abstract)    │
                    │  + execute() final  ◄── template│
                    │  # validate(steps)              │
                    │  # authenticate(steps)          │
                    │  # process(steps) abstract      │
                    │  # audit(steps)                 │
                    │  # notifyCustomer(steps)        │
                    └───────────────┬─────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
          ┌─────────▼─────────┐           ┌─────────▼─────────┐
          │ CardProcessor   │           │ UpiProcessor      │
          │ # process()     │           │ # process()       │
          │  → process-card │           │  → process-upi    │
          └─────────────────┘           └───────────────────┘

  execute() flow (same for both subclasses):
  ┌──────────┐   ┌──────────────┐   ┌─────────┐   ┌───────┐   ┌────────┐
  │ validate │ → │ authenticate │ → │ process │ → │ audit │ → │ notify │
  └──────────┘   └──────────────┘   └────┬────┘   └───────┘   └────────┘
                                         │
                              CardProcessor or UpiProcessor
```

## 8. Runtime Execution Flow

From `PaymentProcessingTemplateDemo.run()`:

```text
STEP 1 — CardProcessor:
  cardSteps = new CardProcessor().execute()
    validate(steps)      → ["validate"]
    authenticate(steps)    → [..., "authenticate"]
    process(steps)       → [..., "process-card"]    ← CardProcessor override
    audit(steps)         → [..., "audit"]
    notifyCustomer(steps)→ [..., "notify"]
  Output: [validate, authenticate, process-card, audit, notify]

STEP 2 — UpiProcessor:
  upiSteps = new UpiProcessor().execute()
    ... same first two steps ...
    process(steps)       → [..., "process-upi"]     ← UpiProcessor override
    ... same last two steps ...
  Output: [validate, authenticate, process-upi, audit, notify]

STEP 3 — Compare:
  Skeleton order identical; only middle hook differs

Test path (PaymentProcessingTemplateDemoTest):
  CardProcessor.execute()
    .containsSequence("validate", "authenticate", "process-card", "audit", "notify")
```

Neither subclass can skip `audit` or `notify` without overriding `final execute()` — compile error.

## 9. What the Client Doesn't Need to Know

- Which hooks `CardProcessor` overrides (only `process`)
- Default implementations of `validate` and `authenticate` in base class
- That `execute()` is `final` on `PaymentProcessor`
- Internal `List<String>` accumulation mechanism
- Inheritance hierarchy depth

Client mental model: **pick processor, call `execute()`, get completed pipeline**.

## 10. Before vs After

### Without Template Method

```text
CardProcessor.execute()     UpiProcessor.execute()
  validate                      validate
  authenticate                  authenticate
  process-card                  process-upi
  audit                         audit
  notify                        (forgot notify?)
```

Each subclass **owns full pipeline** — drift risk.

### With Template Method

```text
PaymentProcessor.execute()  [final]
  validate
  authenticate
  process  ──► CardProcessor | UpiProcessor
  audit
  notify
```

**Base class owns order; subclasses own one hook.**

## 11. SOLID / Design Principles

| Principle | How Template Method applies |
|-----------|----------------------------|
| **Don't Repeat Yourself** | Shared steps written once in `PaymentProcessor` |
| **Hollywood Principle** | "Don't call us, we'll call you" — base calls subclass `process()` |
| **Open/Closed** | New rail = new subclass overriding `process()`; skeleton closed |
| **Liskov** | Any `PaymentProcessor` runs full pipeline via `execute()` |
| **vs Strategy** | Template uses **inheritance** for fixed skeleton; Strategy uses **composition** for swappable algorithms |

## 12. Extensibility

| Change | Approach | Trade-off |
|--------|----------|-----------|
| New rail (`NetBankingProcessor`) | Extend `PaymentProcessor`, override `process()` | Inheritance depth grows |
| Optional fraud step | Add hook with empty default `fraudCheck(steps) {}` | All subclasses inherit; override if needed |
| Skip step for one rail | **Avoid** overriding `execute()` — breaks pattern | Use Strategy for variable pipelines instead |
| Shared state between steps | Pass `PaymentContext` instead of `List<String>` | Richer hook signature |
| Composition alternative | `PaymentProcessor` holds `ProcessStrategy` | Strategy inside template — hybrid |

Demo uses **minimal hook surface** — one abstract method.

## 13. Advantages

- Enforces invariant step order across all payment rails
- Eliminates duplicated validate-authenticate-audit-notify code
- New rail adds one class with one override — low ceremony
- Compliance-friendly: audit/notify cannot be accidentally dropped
- Clear extension point: `process()` is obviously rail-specific

## 14. Disadvantages

- Inheritance coupling — subclasses tied to base class hierarchy
- Rigid skeleton — if one rail needs different step order, pattern fights you
- Fragile if `execute()` not `final` — subclass can break contract
- God base class risk if too many hooks accumulate
- Harder to test one step in isolation without running full `execute()`
- vs **Strategy/Chain**: less flexible when many steps vary independently

## 15. When to Use

1. Card vs UPI with identical pipeline (this demo)
2. Data export: open → transform → write → close (transform varies)
3. Servlet `service()` / framework lifecycle hooks
4. Test setup: `@BeforeEach` template in base test class

## 16. When NOT to Use

1. Steps independently swappable policies — **Strategy** or **Chain**
2. Only one step differs but order also differs per rail — composition
3. Flat variation with no shared skeleton — duplication is cheaper than hierarchy
4. Many varying steps — inheritance explosion; prefer pipeline of strategies

## 17. Edge Cases / Production Concerns

| Concern | In this demo | Production note |
|---------|--------------|-----------------|
| **Exception in hook** | Not shown | Template should define rollback / compensating steps |
| **Override execute()** | `final` prevents | Never remove `final` without team agreement |
| **Hook default empty** | All hooks add strings | Optional hooks: empty default in base |
| **Parallel steps** | Strictly sequential | Async notify may break template — document |
| **Testing** | Full `execute()` only | Test hooks via subclass test doubles |
| **List mutation** | Shared `steps` list | Immutable event log in production |
| **Spring `@Transactional`** | Not shown | Template method can be `@Transactional` on base |

## 18. Possible Code Improvements

### Required (correctness)

- Keep `execute()` `final` — document as invariant
- On hook failure, run compensating `rollback(steps)` hook

### Optional (clarity / prod)

- Replace `List<String>` with `ProcessingContext` record
- `protected boolean skipNotify()` hook default false — rare override with audit log
- Extract `ProcessStrategy` interface if `process` grows large — template + strategy hybrid
- Metrics span per hook: `timer.record("payment.validate", ...)`

## 19. Mental Model

**Formula:**

```text
Problem:  Every rail copies same 5-step pipeline → drift and skipped audit
Solution: final execute() in base calls hooks; subclass overrides process() only
Benefit:  Order fixed in one place; new rail = one hook implementation
```

Memory trick: **"Recipe with one swap."** Same recipe steps every time; only the main ingredient (card vs UPI) changes — chef cannot skip dessert (notify).

## 20. 30–60 Second Interview Answer

> **Template Method** defines an algorithm skeleton in a base class and lets subclasses override specific steps. Card and UPI both need validate → authenticate → process → audit → notify, but only `process` differs. Without the pattern, each processor copies the full list and teams forget steps like notify on UPI. `PaymentProcessor.execute()` is **final** and calls hooks in fixed order. `validate`, `authenticate`, `audit`, and `notifyCustomer` have defaults in the base class. `process()` is abstract — `CardProcessor` adds `process-card`, `UpiProcessor` adds `process-upi`. Both produce identical prefix and suffix with different middle step. Subclasses cannot reorder or skip compliance steps. Differs from **Strategy**: Template uses inheritance for **fixed workflow**; Strategy swaps **entire algorithm** via composition.

## 21. Likely Interview Follow-ups

| Question | Answer sketch |
|----------|---------------|
| Template Method vs Strategy? | Template: **fixed order**, one hook varies (inheritance). Strategy: **whole algorithm** swappable (composition) |
| Why `final execute()`? | Prevents subclass breaking skeleton — core pattern rule |
| Hook vs abstract method? | Abstract = must override; hook = default in base, override optional |
| One rail needs different order? | Template Method is wrong fit — use Chain or Strategy pipeline |
| Framework examples? | JUnit `runTest()`, Servlet `service()`, `InputStream.read()` template |

**Common mistake:** Subclass overrides `execute()` and skips audit — defeats the pattern; keep template `final`.

---

## Run

```bash
cd java-design-patterns-real-world
mvn -q exec:java -Dexec.mainClass=com.example.designpatterns.behavioral.templatemethod.PaymentProcessingTemplateDemo
```
