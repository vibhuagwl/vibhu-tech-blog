# Decorator — Interview Explanation Board

> **Demo:** `PaymentDecoratorDemo` — `src/main/java/com/example/designpatterns/structural/decorator/PaymentDecoratorDemo.java`

## 1. Pattern Identification

| Field | Value |
|-------|-------|
| **Name** | Decorator |
| **Category** | Structural |
| **One-line definition** | Attach additional responsibilities to an object dynamically by wrapping it in decorator objects that share the same interface. |
| **Problem class** | Cross-cutting concerns (logging, metrics, fraud, retry) that must compose around core behavior without subclass explosion or editing the core. |

## 2. Problem We Are Solving

Production payment processing needs more than `BasicPayment.process(amount)`:

| Concern | Requirement |
|---------|-------------|
| Logging | Audit trail: request amount + result string |
| Metrics | Increment success counter on each charge |
| Fraud check | Reject amounts over ₹10,000 |
| Retry | Recover from transient gateway failures |

Core logic is simple: `return "processed:" + amount`.

But operations wants **all four** on every charge — and wants to toggle or reorder them per environment (dev vs prod vs canary).

Example stack in the demo:

```text
LoggingDecorator
  └── MetricsDecorator
        └── BasicPayment
```

The painful question:

> How do we add logging, metrics, fraud, and retry **without** creating `LoggingMetricsFraudRetryPayment`, `LoggingFraudPayment`, … — and without editing `BasicPayment` every sprint?

Relationships that make this hard:

- **Core** (`BasicPayment`) — should stay focused on charging
- **Cross-cutting wrappers** — observability, safety, resilience
- **Client** — should call one `PaymentProcessor` regardless of how many decorators wrap the core

## 3. What Happens Without the Pattern

Subclass every combination:

```java
class LoggingPayment extends BasicPayment { ... }
class LoggingMetricsPayment extends BasicPayment { ... }
class LoggingMetricsFraudPayment extends BasicPayment { ... }
class LoggingMetricsFraudRetryPayment extends BasicPayment { ... }
// 2^4 = 16 combinations for 4 concerns
```

Or worse — edit `BasicPayment` directly:

```java
public String process(int amount) {
    audit.add("log:request:" + amount);           // logging
    if (amount > 10000) throw ...;                  // fraud
    String result = chargeGateway(amount);          // core
    successCounter.incrementAndGet();               // metrics
    audit.add("log:result:" + result);
    return result;
}
```

Concrete pains:

1. **Subclass explosion** — each concern combination is a new class
2. **Core pollution** — `BasicPayment` accumulates observability code unrelated to charging
3. **Fixed order** — cannot reorder fraud-before-logging without another subclass
4. **Runtime inflexibility** — cannot enable retry only in prod without recompile
5. **Release risk** — every metrics tweak touches the same class as payment logic

SOLID hits: **SRP** (core owns charging + logging + metrics), **OCP** (new concern edits `BasicPayment` or adds subclass matrix).

## 4. How the Pattern Solves It

Conceptual chain:

1. **Problem** — multiple cross-cutting concerns around `process(amount)`
2. **Naive pain** — subclass matrix or bloated core class
3. **Pattern introduces** — decorators implement `PaymentProcessor` and wrap a `delegate`
4. **Each decorator** — one concern: before/after logic, then `delegate.process(amount)`
5. **Compose by nesting** — `new LoggingDecorator(new MetricsDecorator(new BasicPayment()))`
6. **Client simplifies** — always calls `processor.process(120)` on outermost decorator

Behavior stacks **outward-in** through the decorator chain.

## 5. Pattern → Code Mapping

| Pattern role | Demo class / type | Why this role |
|--------------|-------------------|---------------|
| **Component** | `PaymentProcessor` (interface) | Common contract for core and all decorators |
| **Concrete Component** | `BasicPayment` | Core charge logic |
| **Decorator** | `PaymentDecorator` (abstract) | Holds `delegate`; implements `PaymentProcessor` |
| **Concrete Decorators** | `LoggingDecorator`, `MetricsDecorator`, `FraudCheckDecorator`, `RetryDecorator` | Single-purpose wrappers |
| **Flaky stand-in** | `FlakyPayment` | Simulates transient failure for retry demos |
| **Client** | `PaymentDecoratorDemo.run()` | Builds stack, calls `process(120)` |

## 6. Important Code Lines

| Code | Design significance |
|------|---------------------|
| `interface PaymentProcessor { String process(int amount); }` | Component — decorators and core share this |
| `protected final PaymentProcessor delegate` in `PaymentDecorator` | Composition — decorator forwards to wrapped object |
| `audit.add("log:request:" + amount); ... delegate.process(amount)` | Before/after hook without touching core |
| `successCounter.incrementAndGet()` after delegate call | MetricsDecorator adds behavior post-success |
| `if (amount > 10000) throw ...` before delegate | FraudCheckDecorator short-circuits chain |
| `for (attempt = 1; attempt <= maxAttempts)` in `RetryDecorator` | Retries delegate on `RuntimeException` |

## 7. Object/Class Diagram

```text
                    ┌─────────────────────┐
                    │ <<interface>>       │
                    │ PaymentProcessor    │
                    │ + process(amount)   │
                    └──────────┬──────────┘
                               │
         ┌─────────────────────┼─────────────────────┐
         │                     │                     │
┌────────▼────────┐  ┌─────────▼─────────┐  ┌───────▼────────┐
│ BasicPayment    │  │ PaymentDecorator  │  │ FlakyPayment   │
│ (core)          │  │ (abstract)        │  │ (test double)  │
└─────────────────┘  │ - delegate        │  └────────────────┘
                     └─────────┬─────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
    ┌─────────▼──────┐ ┌───────▼──────┐ ┌──────▼───────┐
    │LoggingDecorator│ │MetricsDecorator│ │FraudCheck... │
    └────────────────┘ └──────────────┘ └──────────────┘
              │
    ┌─────────▼──────┐
    │ RetryDecorator │
    └────────────────┘

Runtime stack: Logging → Metrics → BasicPayment
```

## 8. Runtime Execution Flow

From `PaymentDecoratorDemo.run()`:

```text
Build:
  processor = LoggingDecorator(
                MetricsDecorator(
                  BasicPayment(), metrics), audit)

Call:
  processor.process(120)

Chain (outer → inner):
  LoggingDecorator.process(120)
    audit.add("log:request:120")
    → MetricsDecorator.process(120)
        → BasicPayment.process(120)
            returns "processed:120"
        successCounter.incrementAndGet()  → 1
        returns "processed:120:metric"
    audit.add("log:result:processed:120:metric")
    returns "processed:120:metric"

Output:
  Result: processed:120:metric
  Audit: [log:request:120, log:result:processed:120:metric]
  Success count: 1
```

Order matters: logging wraps metrics, so audit captures the metric-suffixed result.

## 9. What the Client Doesn't Need to Know

- How many decorators wrap the core
- Whether fraud or retry is enabled — only the composed `PaymentProcessor` matters
- That `MetricsDecorator` appends `:metric` to the result string
- Inner delegate type (`BasicPayment` vs `FlakyPayment`)
- Exact nesting order (unless behavior depends on it — then wiring layer configures it)

Client mental model: **one interface, one `process` call**.

## 10. Before vs After

### Without Decorator

```text
Client → BasicPayment (bloated with log + metrics + fraud + retry)
         OR
Client → LoggingMetricsFraudRetryPayment (subclass explosion)
```

Client **inherits** a fixed bundle of concerns.

### With Decorator

```text
Client
  │ process(120)
  ↓
LoggingDecorator ──► MetricsDecorator ──► BasicPayment
     │                      │                  │
  audit trail           counter++          core charge
```

**Decorators stack concerns; core stays untouched.**

## 11. SOLID / Design Principles

| Principle | How Decorator applies |
|-----------|----------------------|
| **Open/Closed** | Add `EncryptionDecorator` without editing `BasicPayment` |
| **Single Responsibility** | Each decorator owns one concern |
| **Liskov** | Any `PaymentProcessor` substitutes for another in the chain |
| **Composition over inheritance** | Nest decorators instead of subclassing combinations |
| **Dependency Inversion** | Client depends on `PaymentProcessor`, not concrete stack |

## 12. Extensibility

| Change | Approach | Trade-off |
|--------|----------|-----------|
| New concern (encryption) | New decorator implementing `PaymentProcessor` | One class; wire into stack |
| Different stack per env | Factory builds decorator chain from config | Order must be documented |
| Remove metrics in tests | `new BasicPayment()` only | No production parity |
| `FlakyPayment` + retry | `RetryDecorator(new FlakyPayment())` | Order: retry must wrap flaky core |

Decorator order cheat sheet for this demo:

- **Fraud** before core — block before charging
- **Retry** closest to flaky core — retry the actual failure
- **Logging** outermost — capture full result including inner decorators

## 13. Advantages

- Add/remove responsibilities at runtime by changing nesting
- Avoids subclass combinatorics
- Core `BasicPayment` stays small and stable
- Each decorator is independently testable
- Same pattern as Java I/O (`BufferedInputStream` wrapping `FileInputStream`)

## 14. Disadvantages

- Many small classes — stack can be hard to debug
- Order of decorators changes behavior — subtle bugs
- Identity confusion — `processor instanceof BasicPayment` fails on wrapped object
- Deep stacks add call overhead (usually negligible)
- Harder to see "full behavior" than one monolithic method

## 15. When to Use

1. Cross-cutting concerns around a stable interface (logging, metrics, auth, retry)
2. Need to combine concerns in different orders per deployment
3. Cannot or should not modify core class source
4. Responsibilities can be peeled off one at a time
5. Alternative to AOP when explicit composition is preferred

## 16. When NOT to Use

1. Concern is **core domain logic** — belongs inside `BasicPayment`, not a decorator
2. Global AOP (Spring `@Aspect`) already covers logging/metrics uniformly
3. You need to **change the interface** — use Adapter
4. You need **access control / lazy load** — Proxy is clearer intent
5. Flat list with no wrapping semantics — helper functions may suffice

## 17. Edge Cases / Production Concerns

| Concern | In this demo | Production note |
|---------|--------------|-----------------|
| **Decorator order** | Logging outside metrics | Document standard stack in factory |
| **Double counting** | Metrics after one success | Retries may need "attempt" vs "success" metrics |
| **Exception propagation** | Fraud throws before delegate | Decide if outer decorators should catch |
| **Idempotency** | Retry re-invokes delegate | Dangerous for non-idempotent charges |
| **Thread safety** | `AtomicInteger`, `ArrayList` audit | Shared audit list needs sync in multi-thread |
| **Identity / equals** | Not implemented | Decorators break reference equality to core |

## 18. Possible Code Improvements

### Required (correctness)

- Idempotency key check before `RetryDecorator` retries
- Immutable audit log or thread-safe collection for concurrent requests

### Optional (clarity / prod)

- `PaymentProcessorFactory` building standard prod stack
- Separate read interface if some decorators should not expose `process` to all callers
- Circuit breaker decorator alongside retry
- Integration with Micrometer in `MetricsDecorator` instead of raw `AtomicInteger`

## 19. Mental Model

**Formula:**

```text
Problem:  N concerns → 2^N subclasses or bloated core
Solution: Same interface wrappers nest around delegate
Benefit:  Compose concerns at runtime; core unchanged
```

Memory trick: **"Russian dolls — same shape outside, extra behavior each layer."**

## 20. 30–60 Second Interview Answer

> **Decorator** adds responsibilities to an object dynamically by wrapping it in objects that implement the same interface. Our payment demo needs logging, metrics, fraud check, and retry around `BasicPayment.process(amount)`. Subclassing every combination explodes; editing `BasicPayment` couples observability to core charging. Each decorator implements `PaymentProcessor`, holds a `delegate`, and adds one concern before or after forwarding. The demo stacks `LoggingDecorator(MetricsDecorator(BasicPayment))` and calls `process(120)` — logging records request/result, metrics increments counter and appends `:metric`, core returns `processed:120`. We can add `FraudCheckDecorator` or `RetryDecorator` without touching `BasicPayment`. Order matters: fraud before core, retry around flaky implementations.

## 21. Likely Interview Follow-ups

| Question | Answer sketch |
|----------|---------------|
| Decorator vs Proxy? | Decorator **adds behavior** transparently; Proxy **controls access** (auth, cache, lazy init) |
| Decorator vs Chain of Responsibility? | CoR passes along a chain until someone handles; Decorator **always** wraps and forwards |
| Decorator vs Composite? | Composite models **tree of children**; Decorator wraps **one** object in a linear stack |
| How test decorators? | Mock delegate; assert decorator's before/after side effects |
| Java I/O example? | `new BufferedInputStream(new FileInputStream(file))` — classic Decorator |

**Common mistake:** Saying Decorator is "inheritance" — it's **composition** with the same interface, nested at runtime.

---

## Run

```bash
cd java-design-patterns-real-world
mvn -q exec:java -Dexec.mainClass=com.example.designpatterns.structural.decorator.PaymentDecoratorDemo
```
