# Decorator — Interview Explanation Board

> **Demo:** `PaymentDecoratorDemo` — `src/main/java/com/example/designpatterns/structural/decorator/PaymentDecoratorDemo.java`

## 1. Pattern Identification

| Field | Value |
|-------|-------|
| **Name** | Decorator |
| **Category** | Structural |
| **One-line definition** | Attach additional responsibilities to an object dynamically by wrapping it with decorator objects that share the same interface. |
| **Problem class** | Cross-cutting concerns (logging, metrics, fraud, retry) on payment processing without subclass explosion. |

## 2. Problem We Are Solving

Production charges need **logging**, **fraud check**, **metrics**, and **retry** around core `process(amount)`. Subclassing `BasicPayment` for each combination yields `LoggingFraudRetryPayment`, etc. Editing core payment risks breaking observability on every release.

## 3. What Happens Without the Pattern

- Inheritance combinatorics: 2^4 decorator concerns = 16 subclasses
- Cross-cutting code copy-pasted in one fat `process()` method
- Cannot reorder concerns at runtime (metrics before vs after log)

## 4. How the Pattern Solves It

1. **Component** — `PaymentProcessor`
2. **Concrete component** — `BasicPayment`, `FlakyPayment`
3. **Decorator base** — `PaymentDecorator` holds `delegate`
4. **Concrete decorators** — `LoggingDecorator`, `FraudCheckDecorator`, `MetricsDecorator`, `RetryDecorator`
5. **Nest** — `new LoggingDecorator(new MetricsDecorator(new BasicPayment(), metrics), audit)`

## 5. Pattern → Code Mapping

| Role | Demo type | Why |
|------|-----------|-----|
| **Component** | `PaymentProcessor` | Common `process(int)` |
| **Concrete component** | `BasicPayment`, `FlakyPayment` | Core charge logic |
| **Decorator** | `PaymentDecorator` | Holds delegate |
| **Concrete decorators** | `LoggingDecorator`, `FraudCheckDecorator`, `MetricsDecorator`, `RetryDecorator` | Single concern each |
| **Client** | `PaymentDecoratorDemo.run()` | Stacks decorators |

## 6. Important Code Lines

| Code | Significance |
|------|--------------|
| `protected final PaymentProcessor delegate` | Forwarding target |
| `LoggingDecorator.process` — audit before/after delegate | Wrap behavior |
| `FraudCheckDecorator` — throws if amount > 10000 | Guard before delegate |
| `MetricsDecorator` — increment after success | Post-processing |
| `RetryDecorator` — loop on `RuntimeException` | Resilience wrapper |
| Nested constructor chain in `run()` | Runtime composition order |

## 7. Object/Class Diagram

```text
PaymentProcessor
      ▲
      │ implements
┌─────┴─────┬─────────────┬──────────────┐
BasicPayment  LoggingDecorator  MetricsDecorator ...
      ▲              │
      │ delegate     │ delegate
      └──────────────┘ (chain inward to core)
```

## 8. Runtime Execution Flow

```text
processor = LoggingDecorator(MetricsDecorator(BasicPayment, metrics), audit)
processor.process(120)

  LoggingDecorator:
    audit.add("log:request:120")
    → MetricsDecorator:
        → BasicPayment: "processed:120"
        metrics++
        return "processed:120:metric"
    audit.add("log:result:processed:120:metric")
  return "processed:120:metric"
```

## 9. What the Client Doesn't Need to Know

- How many wrappers are stacked
- Order of fraud vs retry vs logging
- Inner `BasicPayment` type

## 10. Before vs After

**Before:** One mega `process()` or subclass explosion.

**After:** Same interface; nest single-purpose decorators.

## 11. SOLID / Design Principles

| Principle | Application |
|-----------|-------------|
| **OCP** | New decorator without editing core |
| **SRP** | Each decorator one concern |
| **Composition** | Runtime stacking vs compile-time subclasses |

## 12. Extensibility

- New `EncryptionDecorator` wraps any `PaymentProcessor`
- Reorder stack: fraud outside retry vs inside
- `FlakyPayment` + `RetryDecorator` demo transient failures

## 13. Advantages

- Flexible runtime composition
- Core stays unchanged
- Single-purpose testable wrappers

## 14. Disadvantages

- Many small classes
- Order of decorators matters
- Hard to debug deep chains
- Overlap with AOP in Spring

## 15. When to Use

1. Cross-cutting payment wrappers (log, metrics, retry)
2. Optional features stacked per tenant
3. Same interface, added behavior

## 16. When NOT to Use

1. Global AOP/logging already covers concern
2. Behavior is core domain algorithm — put in service
3. Interface mismatch — Adapter

## 17. Edge Cases / Production Concerns

| Concern | Note |
|---------|------|
| Decorator order | Fraud before charge; metrics after success |
| Exception propagation | Retry swallows — limit attempts |
| Idempotency | Retry on non-idempotent charge dangerous |
| vs Proxy | Decorator **adds** behavior; Proxy **controls** access |

## 18. Possible Code Improvements

**Required:** Cap retry; idempotency keys for flaky gateway.

**Optional:** Factory builds standard decorator stacks per environment.

## 19. Mental Model

**"Onion layers."** Same `process()` call passes through rings; each ring adds one job.

## 20. 30–60 Second Interview Answer

> Decorator wraps objects with same-interface layers to add responsibilities at runtime. Production needs logging, metrics, fraud, retry on charges — subclassing `BasicPayment` explodes combinations. Decorators implement `PaymentProcessor`, hold a `delegate`, and forward calls. Demo stacks `LoggingDecorator` outside `MetricsDecorator` outside `BasicPayment`. `FraudCheckDecorator` blocks >10000; `RetryDecorator` retries `FlakyPayment`. Core unchanged; concerns compose by nesting.

## 21. Likely Interview Follow-ups

| Question | Answer |
|----------|--------|
| Decorator vs Proxy? | Decorator adds behavior; Proxy controls access/caching |
| vs Chain of Responsibility? | Chain may not reach end; Decorator always wraps one delegate |
| Spring AOP? | AOP is proxy-based decorator at framework level |

**Common mistake:** One decorator doing log+fraud+metrics — loses SRP and composability.

---

## Run

```bash
cd java-design-patterns-real-world
mvn -q exec:java -Dexec.mainClass=com.example.designpatterns.structural.decorator.PaymentDecoratorDemo
```
