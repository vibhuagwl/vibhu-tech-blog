# Template Method — Interview Explanation Board

> **Demo:** `PaymentProcessingTemplateDemo` — `src/main/java/com/example/designpatterns/behavioral/templatemethod/PaymentProcessingTemplateDemo.java`

## 1. Pattern Identification

| Field | Value |
|-------|-------|
| **Name** | Template Method |
| **Category** | Behavioral |
| **One-line definition** | Define the skeleton of an algorithm in a base class, letting subclasses override specific steps without changing structure. |
| **Problem class** | Card and UPI flows duplicate validate → authenticate → process → audit → notify with only process differing. |

## 2. Problem We Are Solving

Card and UPI payments share the same pipeline steps. Teams copy-paste the skeleton; one team reorders audit/notify in UPI only. Only the middle **process** step truly differs (`process-card` vs `process-upi`).

## 3. What Happens Without the Pattern

Duplicate methods:

```java
void payCard() { validate(); auth(); processCard(); audit(); notify(); }
void payUpi()  { validate(); auth(); processUpi(); audit(); notify(); }
```

Drift risk when shared steps change.

## 4. How the Pattern Solves It

1. **Abstract class** — `PaymentProcessor` with `final execute()` template
2. **Fixed steps** — `validate`, `authenticate`, `audit`, `notifyCustomer` (hooks with defaults)
3. **Abstract hook** — `process(List<String> steps)` — subclasses must implement
4. **Concrete** — `CardProcessor`, `UpiProcessor` override only `process()`

## 5. Pattern → Code Mapping

| Role | Demo type | Why |
|------|-----------|-----|
| **Abstract class** | `PaymentProcessor` | Defines template `execute()` |
| **Template method** | `final execute()` | Fixed step order |
| **Hook methods** | `validate`, `authenticate`, `audit`, `notifyCustomer` | Overridable defaults |
| **Primitive operation** | abstract `process(steps)` | Subclass-specific |
| **Concrete classes** | `CardProcessor`, `UpiProcessor` | Card vs UPI process |
| **Client** | `PaymentProcessingTemplateDemo.run()` | Runs both processors |

## 6. Important Code Lines

| Code | Significance |
|------|--------------|
| `public final List<String> execute()` | Template — order cannot be overridden |
| `validate → authenticate → process → audit → notify` | Skeleton sequence |
| `protected abstract void process(List<String> steps)` | Subclass extension point |
| `CardProcessor.process` → `process-card` | Only varying step |
| `UpiProcessor.process` → `process-upi` | Same skeleton, different hook |

## 7. Object/Class Diagram

```text
PaymentProcessor (abstract)
  + final execute()  ← template method
  + validate()
  + authenticate()
  + process() *abstract*
  + audit()
  + notifyCustomer()
        ▲
        ├── CardProcessor (process-card)
        └── UpiProcessor (process-upi)
```

## 8. Runtime Execution Flow

```text
CardProcessor.execute()
  → [validate, authenticate, process-card, audit, notify]

UpiProcessor.execute()
  → [validate, authenticate, process-upi, audit, notify]

Same order; only middle step differs.
```

## 9. What the Client Doesn't Need to Know

- Which hooks are overridden
- That `execute()` is final on base class
- Step list accumulation in `List<String> steps`

## 10. Before vs After

**Before:** Duplicated pipelines in card and UPI services.

**After:** One template; subclasses override `process()` only.

## 11. SOLID / Design Principles

| Principle | Application |
|-----------|-------------|
| **DRY** | Shared steps once in base |
| **Hollywood Principle** | "Don't call us, we'll call you" — template drives hooks |
| **Caution** | Deep inheritance — consider composition for large variation |

## 12. Extensibility

- New `WalletProcessor` extends `PaymentProcessor`
- Override `authenticate` for UPI OTP flow
- Hook defaults allow optional customization

## 13. Advantages

- Enforces consistent pipeline order
- Subclasses cannot skip audit/notify
- Shared code in base class

## 14. Disadvantages

- Inheritance-bound — tight coupling to base
- Limited flexibility if steps must reorder per subclass
- vs Strategy: Template fixes **order**; Strategy swaps **whole algorithm**

## 15. When to Use

1. Payment pipeline with fixed step order
2. JUnit test lifecycle (`setUp`/`tearDown`)
3. Servlet `doGet`/`doPost` frameworks

## 16. When NOT to Use

1. Steps independently swappable — Strategy/Chain
2. Many varying steps — composition over inheritance

## 17. Edge Cases / Production Concerns

| Concern | Note |
|---------|------|
| Hook failure | Template should define error handling in `execute()` |
| Partial override | Subclass skipping `super` in hook — document |
| Final template | Prevents accidental skeleton rewrite |
| Testing | Test each concrete processor's hooks |

## 18. Possible Code Improvements

**Required:** Error handling wrapper in `execute()`; don't swallow hook failures.

**Optional:** Composition-based pipeline (Chain) if order varies per tenant.

## 19. Mental Model

**"Recipe with one swapable ingredient."** Steps 1-2-4-5 fixed; step 3 is card vs UPI.

## 20. 30–60 Second Interview Answer

> Template Method defines algorithm skeleton in base class; subclasses override steps. Card and UPI duplicate validate-authenticate-audit-notify — only process differs. `PaymentProcessor.execute()` is final and runs validate → authenticate → process → audit → notify. `CardProcessor` and `UpiProcessor` override only abstract `process()` adding process-card vs process-upi. Skeleton order identical. Subclasses can't skip audit. Use when **sequence is fixed**; use Strategy when whole algorithm swaps.

## 21. Likely Interview Follow-ups

| Question | Answer |
|----------|--------|
| Template vs Strategy? | Template: fixed order + hooks; Strategy: interchangeable full algorithm |
| Hollywood Principle? | Base calls subclass hooks, not vice versa |
| final execute()? | Prevents breaking template contract |

**Common mistake:** Making `execute()` overridable — subclasses reorder or skip steps.

---

## Run

```bash
cd java-design-patterns-real-world
mvn -q exec:java -Dexec.mainClass=com.example.designpatterns.behavioral.templatemethod.PaymentProcessingTemplateDemo
```
