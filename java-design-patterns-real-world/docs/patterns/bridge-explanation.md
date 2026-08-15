# Bridge — Interview Explanation Board

> **Demo:** `NotificationBridgeDemo` — `src/main/java/com/example/designpatterns/structural/bridge/NotificationBridgeDemo.java`

## 1. Pattern Identification

| Field | Value |
|-------|-------|
| **Name** | Bridge |
| **Category** | Structural |
| **One-line definition** | Decouple abstraction from implementation so both can vary independently via composition. |
| **Problem class** | Cartesian explosion of subclasses when two dimensions (alert type × delivery provider) multiply. |

## 2. Problem We Are Solving

Payment alerts must go via **Email** or **SMS**, using providers like **Twilio** or **AWS SNS**. Naive design creates:

`EmailTwilio`, `SmsTwilio`, `EmailSns`, `SmsSns` — and repeats for every new channel (Push) or vendor.

## 3. What Happens Without the Pattern

Subclass matrix N channels × M providers. Adding Push requires new subclasses for every provider. Code duplication in transport vs channel logic.

Violates **OCP** — every dimension change multiplies classes.

## 4. How the Pattern Solves It

1. **Abstraction** — `Notification` (+ `EmailNotification`, `SmsNotification`)
2. **Implementor** — `Provider` (`TwilioProvider`, `SnsProvider`)
3. **Bridge** — abstraction holds `Provider` reference, composes at runtime
4. `EmailNotification(SnsProvider)` — channel + vendor without `EmailSns` subclass

## 5. Pattern → Code Mapping

| Role | Demo type | Why |
|------|-----------|-----|
| **Implementor** | `Provider` | Transport/vendor interface |
| **Concrete implementors** | `TwilioProvider`, `SnsProvider` | Send with vendor prefix |
| **Abstraction** | `Notification` | Holds `Provider` |
| **Refined abstractions** | `EmailNotification`, `SmsNotification` | Pick EMAIL vs SMS channel |
| **Client** | `NotificationBridgeDemo.run()` | Composes email+SNS, sms+Twilio |

## 6. Important Code Lines

| Code | Significance |
|------|--------------|
| `protected final Provider provider` in `Notification` | Bridge link — composition |
| `EmailNotification.send()` → `provider.send("EMAIL", message)` | Abstraction sets channel |
| `SnsProvider.send(channel, message)` | Implementor handles transport |
| `new EmailNotification(new SnsProvider())` | Runtime composition |

## 7. Object/Class Diagram

```text
        Notification (abstraction)
        - provider: Provider
        + send(message)
              ▲
    ┌─────────┴─────────┐
EmailNotification   SmsNotification
    │                     │
    └──────────┬──────────┘
               │ uses
        ┌──────▼──────┐
        │  Provider   │ (implementor)
        └──────┬──────┘
    TwilioProvider  SnsProvider
```

## 8. Runtime Execution Flow

```text
provider = new SnsProvider()
email = new EmailNotification(provider)
email.send("Payment receipt ready")
  → provider.send("EMAIL", "Payment receipt ready")
  → "SNS EMAIL:Payment receipt ready"

sms = new SmsNotification(new TwilioProvider())
sms.send("OTP 123456")
  → "Twilio SMS:OTP 123456"
```

Two dimensions composed without `EmailSns` class.

## 9. What the Client Doesn't Need to Know

- Which provider class is injected
- That channel string is passed to provider
- Subclass matrix that was avoided

## 10. Before vs After

**Before:** `EmailSns`, `SmsTwilio`, … — N×M classes.

**After:** N notification classes + M provider classes — N+M.

## 11. SOLID / Design Principles

| Principle | Application |
|-----------|-------------|
| **OCP** | New provider = one class, not N channel subclasses |
| **Composition over inheritance** | Core Bridge idea |
| **SRP** | Channel logic vs transport logic separated |

## 12. Extensibility

- New channel: `PushNotification extends Notification`
- New vendor: `SendGridProvider implements Provider`
- Inject provider via constructor for tests

## 13. Advantages

- Avoids subclass explosion
- Independent variation of abstraction and implementor
- Runtime rebinding of provider

## 14. Disadvantages

- More classes/interfaces for simple cases
- Can overlap with Strategy if only one dimension varies
- Indirection — harder to trace for juniors

## 15. When to Use

1. Notification type × delivery vendor
2. UI widgets × platform rendering
3. Two independent axes of variation

## 16. When NOT to Use

1. Single dimension — Strategy or DI enough
2. Fixed pairing — direct dependency fine

## 17. Edge Cases / Production Concerns

| Concern | Note |
|---------|------|
| Provider failover | Swap `Provider` implementation |
| Thread safety | Providers should be stateless or pooled |
| Config | Credentials per provider, not per combo subclass |

## 18. Possible Code Improvements

**Required:** Inject `Provider` from config/DI.

**Optional:** Provider registry; async send with same bridge structure.

## 19. Mental Model

**"Remote + batteries."** Remote (abstraction) works with any battery brand (implementor) — no remote-per-brand subclass.

## 20. 30–60 Second Interview Answer

> Bridge decouples abstraction from implementation so both vary independently. Payment alerts need Email/SMS crossed with Twilio/SNS — naive design gives EmailTwilio, SmsSns, etc. `Notification` abstractions compose a `Provider` implementor. `EmailNotification` calls `provider.send("EMAIL", msg)`; `SnsProvider` vs `TwilioProvider` vary transport. New channel or vendor adds one class, not N×M subclasses. Composition in constructor is the bridge link.

## 21. Likely Interview Follow-ups

| Question | Answer |
|----------|--------|
| Bridge vs Strategy? | Bridge splits **abstraction hierarchy** + implementor; Strategy swaps **algorithm** in context |
| Bridge vs Adapter? | Bridge designed together; Adapter fits legacy after the fact |
| vs Abstract Factory? | AF creates families; Bridge separates runtime roles |

**Common mistake:** Creating `EmailSns` subclass when composition suffices.

---

## Run

```bash
cd java-design-patterns-real-world
mvn -q exec:java -Dexec.mainClass=com.example.designpatterns.structural.bridge.NotificationBridgeDemo
```
