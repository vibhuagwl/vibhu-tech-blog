# Memento — Interview Explanation Board

> **Demo:** `PaymentConfigurationMementoDemo` — `src/main/java/com/example/designpatterns/behavioral/memento/PaymentConfigurationMementoDemo.java`

## 1. Pattern Identification

| Field | Value |
|-------|-------|
| **Name** | Memento |
| **Category** | Behavioral |
| **One-line definition** | Capture and externalize an object's internal state so it can be restored later, without violating encapsulation. |
| **Problem class** | Ops needs undo of gateway/timeout edits without exposing private configuration fields. |

## 2. Problem We Are Solving

Ops changes payment gateway from STRIPE to ADYEN and timeout 30→60. Bad change needs **undo** without:

- Exposing `PaymentConfiguration` private fields to caretaker
- Full service redeploy from backup

Support needs snapshot/restore with opaque state.

## 3. What Happens Without the Pattern

```java
String oldGateway = config.gateway; // breaks encapsulation
config.gateway = "ADYEN"; // caretaker mutates internals
```

Or no undo — manual rollback from DB backup.

## 4. How the Pattern Solves It

1. **Originator** — `PaymentConfiguration` with `save()` and `restore()`
2. **Memento** — `Snapshot` record (gateway, timeoutSeconds)
3. **Caretaker** — demo holds snapshot variable (could be history stack)
4. `restore(snapshot)` rolls back without public field access

## 5. Pattern → Code Mapping

| Role | Demo type | Why |
|------|-----------|-----|
| **Originator** | `PaymentConfiguration` | Creates/restores from memento |
| **Memento** | `Snapshot` record | Opaque state carrier |
| **Caretaker** | `run()` local `snapshot` variable | Stores memento without inspecting |
| **Client** | `PaymentConfigurationMementoDemo.run()` | save → edit → restore |

## 6. Important Code Lines

| Code | Significance |
|------|--------------|
| `Snapshot save()` | Captures current gateway + timeout |
| `restore(Snapshot snapshot)` | Writes back from memento |
| `gateway()` public read | Caretaker doesn't need private fields |
| After restore → STRIPE again | Undo demonstrated |

## 7. Object/Class Diagram

```text
Caretaker
   holds Snapshot (memento)
        │
        ▼ restore
PaymentConfiguration (originator)
   save() → Snapshot
```

## 8. Runtime Execution Flow

```text
config = PaymentConfiguration("STRIPE", 30)
snapshot = config.save()

config = PaymentConfiguration("ADYEN", 60)  // bad edit
config.gateway() → ADYEN

config.restore(snapshot)
config.gateway() → STRIPE
```

## 9. What the Client Doesn't Need to Know

- Memento field values if caretaker is disciplined (opaque)
- How restore maps fields internally

## 10. Before vs After

**Before:** Expose fields or no undo.

**After:** `save()` / `restore(snapshot)` with encapsulation.

## 11. SOLID / Design Principles

| Principle | Application |
|-----------|-------------|
| **Encapsulation** | Caretaker stores memento, doesn't mutate originator fields |
| **SRP** | Originator owns state mapping to memento |

## 12. Extensibility

- Stack of snapshots for multi-level undo
- Package-private memento type for stricter opacity
- Immutable memento records

## 13. Advantages

- Undo without breaking encapsulation
- Caretaker simple storage
- Clear rollback for config UIs

## 14. Disadvantages

- Memory for history stacks
- Not general persistence — use ORM for entities
- Memento size for large state graphs

## 15. When to Use

1. Config editor undo
2. Wizard step rollback
3. Game save state (originator restores)

## 16. When NOT to Use

1. Database entity persistence
2. Audit log sufficient — event sourcing

## 17. Edge Cases / Production Concerns

| Concern | Note |
|---------|------|
| History cap | Limit stack size |
| Deep copy | Memento must be snapshot, not live reference |
| Concurrency | Don't share mutable memento |
| Distributed | Memento is in-process undo, not cluster state |

## 18. Possible Code Improvements

**Required:** Cap undo stack; immutable `Snapshot`.

**Optional:** Caretaker class with `undo()`/`redo()`; package-private memento.

## 19. Mental Model

**"Save game slot."** Slot holds opaque bytes; only game knows how to load them.

## 20. 30–60 Second Interview Answer

> Memento captures object state for later restore without exposing internals. Ops editing gateway STRIPE→ADYEN can't undo without exposing `PaymentConfiguration` fields. `save()` returns opaque `Snapshot` record; `restore(snapshot)` rolls back gateway and timeout. Caretaker stores snapshot but doesn't inspect fields. Originator controls memento contents. For config undo wizards — not general DB persistence.

## 21. Likely Interview Follow-ups

| Question | Answer |
|----------|--------|
| vs Command undo? | Command stores inverse op; Memento stores state snapshot |
| Opaque memento? | Package-private type so caretaker can't read fields |
| Memory? | Cap history depth |

**Common mistake:** Using Memento for long-term persistence — use normal serialization/DB.

---

## Run

```bash
cd java-design-patterns-real-world
mvn -q exec:java -Dexec.mainClass=com.example.designpatterns.behavioral.memento.PaymentConfigurationMementoDemo
```
