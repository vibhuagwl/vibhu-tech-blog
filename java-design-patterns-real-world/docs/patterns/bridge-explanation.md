# Bridge — Interview Explanation Board

> **Demo:** `NotificationBridgeDemo` — `src/main/java/com/example/designpatterns/structural/bridge/NotificationBridgeDemo.java`

## 1. Pattern Identification

| Field | Value |
|-------|-------|
| **Name** | Bridge |
| **Category** | Structural |
| **One-line definition** | Decouple an abstraction from its implementation so both can vary independently via composition instead of inheritance. |
| **Problem class** | Cartesian product explosion — two (or more) dimensions of variation would require N×M concrete subclasses. |

## 2. Problem We Are Solving

A payments platform must send alerts through multiple **notification types** and multiple **delivery providers**:

| Notification type | Example message |
|-------------------|-----------------|
| Email | "Payment receipt ready" |
| SMS | "OTP 123456" |

| Provider (transport) | Backend |
|---------------------|---------|
| Twilio | Third-party SMS/email API |
| AWS SNS | Internal cloud messaging |

Naive design subclasses every combination:

```text
EmailTwilioNotification
SmsTwilioNotification
EmailSnsNotification
SmsSnsNotification
EmailSendGridNotification   ← new vendor
SmsSendGridNotification     ← duplicate again
PushTwilioNotification      ← new channel duplicates all providers
PushSnsNotification
...
```

The painful question:

> How do we add **one** new provider (SendGrid) or **one** new channel (Push) without creating or editing N subclasses?

Relationships that make this hard:

- **Notification type** — decides *what* channel label to use (EMAIL vs SMS)
- **Provider** — decides *how* transport happens (Twilio vs SNS)
- **Product** — wants to mix any notification with any provider at runtime

## 3. What Happens Without the Pattern

Subclass-per-combination approach:

```java
class EmailTwilioNotification {
    String send(String msg) {
        return twilioClient.send("EMAIL", msg);
    }
}
class SmsSnsNotification {
    String send(String msg) {
        return snsClient.send("SMS", msg);
    }
}
// ... 6 more classes for 3 providers × 3 channels
```

Concrete pains:

1. **Subclass explosion** — N channels × M providers = N×M classes
2. **Code duplication** — every Email* class repeats "pass EMAIL to provider"
3. **Rigid binding** — cannot switch Twilio → SNS without new object type
4. **Testing combinatorics** — each subclass needs its own test matrix
5. **Open/Closed violation** — new provider forces new subclasses for every channel

SOLID hits: **OCP** (new dimension reopens all classes), **SRP** (notification class owns both channel semantics and transport).

## 4. How the Pattern Solves It

Conceptual chain:

1. **Problem** — notification type and provider vary independently; inheritance multiplies classes
2. **Naive pain** — EmailTwilio, SmsTwilio, EmailSns, SmsSns, …
3. **Pattern introduces** — `Notification` abstraction composes a `Provider` implementor
4. **Refined abstractions** — `EmailNotification`, `SmsNotification` set channel; delegate transport
5. **Implementors** — `TwilioProvider`, `SnsProvider` only know `send(channel, message)`
6. **Client mixes at runtime** — `new EmailNotification(new SnsProvider())`

Variation splits across **two hierarchies connected by composition**.

## 5. Pattern → Code Mapping

| Pattern role | Demo class / type | Why this role |
|--------------|-------------------|---------------|
| **Implementor** | `Provider` (interface) | Low-level transport: `send(channel, message)` |
| **Concrete Implementor** | `TwilioProvider`, `SnsProvider` | Vendor-specific delivery |
| **Abstraction** | `Notification` (abstract class) | Holds `Provider`; declares `send(message)` |
| **Refined Abstraction** | `EmailNotification`, `SmsNotification` | Channel-specific behavior before delegating |
| **Client** | `NotificationBridgeDemo.run()` | Composes email+SNS, sms+Twilio |

## 6. Important Code Lines

| Code | Design significance |
|------|---------------------|
| `interface Provider { String send(String channel, String message); }` | Implementor — stable transport API |
| `protected final Provider provider` in `Notification` | Bridge link — abstraction does not subclass providers |
| `abstract class Notification` | Abstraction base — constructor-injected implementor |
| `return provider.send("EMAIL", message)` in `EmailNotification` | Refined abstraction adds channel; provider handles how |
| `new EmailNotification(new SnsProvider())` | Runtime binding — any notification × any provider |

## 7. Object/Class Diagram

```text
        Abstraction                           Implementor
┌─────────────────────────┐            ┌─────────────────────────┐
│ Notification (abstract) │──composes─►│ <<interface>> Provider  │
│ # provider: Provider    │            │ + send(ch, msg)         │
│ + send(msg): String     │            └───────────┬─────────────┘
└───────────┬─────────────┘                        │
            │                            ┌─────────┴─────────┐
   ┌────────┴────────┐                   │                   │
┌──▼────────────┐ ┌──▼────────────┐  ┌───▼──────────┐ ┌──────▼───────┐
│EmailNotification│ │SmsNotification│  │TwilioProvider│ │ SnsProvider  │
│send→"EMAIL"   │ │send→"SMS"     │  │Twilio ch:msg │ │ SNS ch:msg   │
└───────────────┘ └───────────────┘  └──────────────┘ └──────────────┘
```

## 8. Runtime Execution Flow

From `NotificationBridgeDemo.run()`:

```text
Path 1 — Email via SNS:
  provider = new SnsProvider()
  email = new EmailNotification(provider)
  email.send("Payment receipt ready")
    → EmailNotification.send()
    → provider.send("EMAIL", "Payment receipt ready")
    → SnsProvider returns "SNS EMAIL:Payment receipt ready"

Path 2 — SMS via Twilio:
  sms = new SmsNotification(new TwilioProvider())
  sms.send("OTP 123456")
    → SmsNotification.send()
    → provider.send("SMS", "OTP 123456")
    → TwilioProvider returns "Twilio SMS:OTP 123456"
```

Same `SnsProvider` instance could serve a different `SmsNotification` without new classes.

## 9. What the Client Doesn't Need to Know

- Whether email rides Twilio or SNS internally
- Provider class names or vendor SDK details
- That channel is passed as a string to the implementor
- How many notification subclasses exist — only the composed pair matters
- Inheritance tree under `Notification` vs `Provider`

Client mental model: **pick notification style, inject provider, call `send`**.

## 10. Before vs After

### Without Bridge

```text
                    Twilio    SNS    SendGrid
Email                 ✓        ✓        ✓      → 3 classes
SMS                   ✓        ✓        ✓      → 3 classes
Push (new)            ✓        ✓        ✓      → 3 NEW classes

9 classes for 3×3 — grows N×M
```

### With Bridge

```text
Notification side:     EmailNotification, SmsNotification, PushNotification  → N classes
Provider side:         TwilioProvider, SnsProvider, SendGridProvider            → M classes

Total: N + M (not N × M)
```

**Bridge separates dimensions; composition connects them.**

## 11. SOLID / Design Principles

| Principle | How Bridge applies |
|-----------|-------------------|
| **Open/Closed** | Add `PushNotification` or `SendGridProvider` without touching the other side |
| **Single Responsibility** | Notification sets channel semantics; Provider handles transport |
| **Dependency Inversion** | Abstraction depends on `Provider` interface, not concrete vendors |
| **Composition over inheritance** | Core Bridge idea — bind via `provider` field, not extends |
| **Liskov** | Any `Provider` works inside any `Notification` subclass |

## 12. Extensibility

| Change | Approach | Trade-off |
|--------|----------|-----------|
| New provider (SendGrid) | Implement `Provider` | One class; all notifications gain access |
| New channel (Push) | Extend `Notification` | One class; works with all providers |
| Richer messages (HTML email) | Override `EmailNotification.send()` | May need provider support for MIME |
| Config-driven wiring | DI container injects Provider | Same pattern, better prod ergonomics |

Avoid giant `switch (providerType)` inside `Notification` — that recreates the coupling Bridge removes.

## 13. Advantages

- Stops N×M subclass explosion
- Abstraction and implementation vary independently at runtime
- Easier to test — mock `Provider` for any notification type
- Swap vendors without changing notification classes
- Clear separation: product semantics vs infrastructure transport

## 14. Disadvantages

- More classes and indirection than a single "send email" function
- Can be overkill when only one channel and one provider exist
- Requires discipline — teams may still shortcut with switches
- Implementor interface may be too generic (`send(channel, msg)`) or too specific
- Harder onboarding — juniors must understand two hierarchies

## 15. When to Use

1. Notification type × delivery provider (this demo)
2. UI widgets × rendering backends (DOM vs Canvas)
3. Remote device drivers × platform implementations
4. Any time **two dimensions** of variation would multiply subclasses
5. When binding between abstraction and implementation must change at runtime

## 16. When NOT to Use

1. Only one notification type and one provider — direct call or Strategy is enough
2. Variations are not orthogonal — one dimension fully determines the other
3. A simple DI-injected service already gives independent variation without hierarchy
4. You need to add cross-cutting wrappers — Decorator or Proxy fits better
5. The "bridge" is really one big Facade over unrelated subsystems

## 17. Edge Cases / Production Concerns

| Concern | In this demo | Production note |
|---------|--------------|-----------------|
| **Provider failures** | Always succeeds | Retry, circuit breaker at Provider level |
| **Channel validation** | Trusts refined abstraction | Provider may reject unknown channels |
| **Thread safety** | Stateless providers | Share provider beans carefully if they hold clients |
| **Config** | Hard-coded in `run()` | Wire Provider via Spring `@Bean` |
| **Observability** | No metrics | Decorate Provider or use Bridge + Decorator |
| **Multi-region** | Single SNS | Region-specific Provider instances |

## 18. Possible Code Improvements

### Required (correctness)

- Null-check `message` and `provider` in constructors
- Propagate provider errors as domain `NotificationException`

### Optional (clarity / prod)

- `PushNotification` refined abstraction for third channel
- Provider interface with typed `Channel` enum instead of raw strings
- Async `CompletableFuture<String> send(...)` for non-blocking transport
- Factory: `NotificationFactory.email(snsProvider)`

## 19. Mental Model

**Formula:**

```text
Problem:  Channel × Provider → N×M subclass matrix
Solution: Abstraction composes Implementor → N + M classes
Benefit:  Mix any notification with any provider at runtime
```

Memory trick: **"Two ladders, one plank — Bridge connects them."**

## 20. 30–60 Second Interview Answer

> **Bridge** decouples abstraction from implementation so both can vary independently. In our notification demo, we'd otherwise need EmailTwilio, SmsTwilio, EmailSns, SmsSns — subclass explosion every time we add a channel or vendor. Bridge splits the problem: `Notification` abstractions (`EmailNotification`, `SmsNotification`) compose a `Provider` implementor (`TwilioProvider`, `SnsProvider`). Email sets channel to `"EMAIL"` and calls `provider.send("EMAIL", message)`; the provider handles transport. The client does `new EmailNotification(new SnsProvider())` and gets `"SNS EMAIL:Payment receipt ready"` without a dedicated EmailSns class. Adding SendGrid is one new `Provider`; adding Push is one new `Notification` — not six new combinations.

## 21. Likely Interview Follow-ups

| Question | Answer sketch |
|----------|---------------|
| Bridge vs Strategy? | Bridge separates abstraction hierarchy from implementation hierarchy for **structural** decoupling; Strategy swaps **one algorithm** for one context |
| Bridge vs Adapter? | Bridge designed upfront for two dimensions; Adapter fixes **existing** interface mismatch |
| Can abstraction and implementor be interfaces? | Yes — demo uses abstract class + interface; both sides can be interfaces |
| Who creates the bridge link? | Usually constructor injection — client or DI container passes Implementor |
| Bridge in JDK? | `JDBC` — `DriverManager` abstraction over database-specific drivers |

**Common mistake:** Describing Bridge as "just dependency injection" — the key is **two parallel hierarchies** avoiding N×M subclasses, not merely injecting a dependency.

---

## Run

```bash
cd java-design-patterns-real-world
mvn -q exec:java -Dexec.mainClass=com.example.designpatterns.structural.bridge.NotificationBridgeDemo
```
