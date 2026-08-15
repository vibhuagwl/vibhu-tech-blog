# Memento — Interview Explanation Board

> **Demo:** `PaymentConfigurationMementoDemo` — `src/main/java/com/example/designpatterns/behavioral/memento/PaymentConfigurationMementoDemo.java`

## 1. Pattern Identification

| Field | Value |
|-------|-------|
| **Name** | Memento |
| **Category** | Behavioral |
| **One-line definition** | Capture and externalize an object's internal state so it can be restored later, without violating encapsulation. |
| **Problem class** | Ops needs undo of gateway/timeout edits without exposing private configuration fields or redeploying from backup. |

## 2. Problem We Are Solving

Payment platform configuration lives in `PaymentConfiguration`:

- **Gateway** — `STRIPE`, `ADYEN`, `PAYPAL`
- **Timeout** — `timeoutSeconds` (e.g. 30 → 60)

Ops workflow:

```text
1. Production config: gateway=STRIPE, timeout=30
2. Ops edits:        gateway=ADYEN, timeout=60  (experiment / mistake)
3. Bad change:       need UNDO back to STRIPE, 30
```

The painful questions:

> How does support **undo** a bad gateway switch without exposing `private String gateway` to the caretaker?

> How do you store a snapshot the caretaker can hold but not mutate?

Relationships:

- **Originator** (`PaymentConfiguration`) — owns live state and knows how to save/restore
- **Memento** (`Snapshot`) — opaque carrier of gateway + timeout at save time
- **Caretaker** (demo's `snapshot` variable, or undo stack in UI) — stores mementos without inspecting internals
- **Client** — triggers save before edit, restore on undo

## 3. What Happens Without the Pattern

Naive undo breaks encapsulation:

```java
public class PaymentConfiguration {
    public String gateway;      // public for caretaker to copy
    public int timeoutSeconds;
}

// Caretaker "undo"
String oldGateway = config.gateway;
int oldTimeout = config.timeoutSeconds;
config.gateway = "ADYEN";
// ... mistake ...
config.gateway = oldGateway;  // caretaker pokes private state
```

Or no undo at all:

```java
config = new PaymentConfiguration("ADYEN", 60);
// wrong — must redeploy from backup or manual DB rollback
```

Concrete pains:

1. **Encapsulation broken** — caretaker reads/writes fields directly
2. **No opaque snapshot** — caretaker can corrupt state mid-undo
3. **Full redeploy** — bad config change requires backup restore
4. **Caretaker knows too much** — must track which fields matter for undo
5. **Shallow copy bugs** — caretaker holds reference to mutable object, not true snapshot
6. **No history** — single variable undo vs multi-level stack

SOLID hits: **Encapsulation** violated; **SRP** blurred (caretaker owns state mapping).

## 4. How the Pattern Solves It

Conceptual chain:

1. **Problem** — undo needs prior state; exposing fields breaks encapsulation
2. **Naive pain** — public fields or no undo path
3. **Pattern introduces** — `Snapshot` memento record (gateway, timeoutSeconds)
4. **Originator** — `PaymentConfiguration.save()` creates `Snapshot` from current fields
5. **Caretaker** — holds `Snapshot` variable; does not interpret fields for mutation
6. **Restore** — `config.restore(snapshot)` writes memento back through originator API
7. **Client** — save → edit → restore demonstrates undo to STRIPE

State capture and restore stay **inside originator**; caretaker only stores opaque memento.

## 5. Pattern → Code Mapping

| Pattern role | Demo class / type | Why this role |
|--------------|-------------------|---------------|
| **Originator** | `PaymentConfiguration` | Owns `gateway`, `timeoutSeconds`; `save()` / `restore()` |
| **Memento** | `Snapshot` record | Immutable carrier: `(gateway, timeoutSeconds)` |
| **Caretaker** | Local `snapshot` in `run()` | Stores memento between edit and restore |
| **Client** | `PaymentConfigurationMementoDemo.run()` | save → bad edit → restore flow |

## 6. Important Code Lines

| Code | Design significance |
|------|---------------------|
| `public record Snapshot(String gateway, int timeoutSeconds)` | Memento — immutable snapshot of state |
| `public Snapshot save()` | Originator packages private fields into memento |
| `return new Snapshot(gateway, timeoutSeconds)` | Deep enough snapshot for undo correctness |
| `public void restore(Snapshot snapshot)` | Only originator maps memento back to fields |
| `this.gateway = snapshot.gateway()` | Restore through originator API |
| `public String gateway()` | Read-only accessor — caretaker doesn't need private fields |
| After restore → `STRIPE` | Undo demonstrated without caretaker mutating fields |

## 7. Object/Class Diagram

```text
┌─────────────────────────────────────────────────────────┐
│ Caretaker (demo: local variable / prod: undo stack)     │
│   holds: Snapshot memento                                 │
│   does NOT: read gateway/timeout to mutate originator   │
└───────────────────────────┬─────────────────────────────┘
                            │ restore(snapshot)
                            ▼
┌─────────────────────────────────────────────────────────┐
│ PaymentConfiguration (Originator)                       │
│   - gateway: String                                     │
│   - timeoutSeconds: int                                 │
│   + save(): Snapshot          ──creates──► Snapshot     │
│   + restore(Snapshot)                                   │
│   + gateway(): String                                   │
└─────────────────────────────────────────────────────────┘

Snapshot (Memento)
  gateway: String
  timeoutSeconds: int
  (immutable record)
```

## 8. Runtime Execution Flow

From `PaymentConfigurationMementoDemo.run()`:

```text
STEP 1: Initial config
  config = new PaymentConfiguration("STRIPE", 30)
  config.gateway() → "STRIPE"

STEP 2: Save memento (before risky edit)
  snapshot = config.save()
  snapshot = Snapshot(gateway="STRIPE", timeoutSeconds=30)

STEP 3: Bad edit (simulated mistake)
  config = new PaymentConfiguration("ADYEN", 60)
  config.gateway() → "ADYEN"

STEP 4: Undo via restore
  config.restore(snapshot)
  config.gateway() → "STRIPE"

Caretaker never called config.gateway = ... directly.
Originator alone interpreted Snapshot fields on restore.
```

## 9. What the Client Doesn't Need to Know

- Internal field names inside `PaymentConfiguration`
- How `restore` maps each memento field
- Whether memento is record, class, or serialized bytes (opaque to caretaker)
- Timeout value after restore (demo only prints gateway)
- Difference between live config object and snapshot object

Client mental model: **save before edit, restore on undo**.

## 10. Before vs After

### Without Memento

```text
Caretaker
   │
   ├── reads config.gateway (breaks encapsulation)
   ├── mutates config.gateway = "ADYEN"
   └── manual copy back on undo

Or: no undo — redeploy from backup
```

### With Memento

```text
Caretaker
   │
   ├── snapshot = config.save()     (opaque)
   ├── ... edit happens elsewhere ...
   └── config.restore(snapshot)     (originator restores)

Originator owns save/restore mapping
```

**Caretaker stores; originator interprets.**

## 11. SOLID / Design Principles

| Principle | How Memento applies |
|-----------|---------------------|
| **Encapsulation** | Caretaker stores memento without poking private fields |
| **Single Responsibility** | Originator owns state; caretaker owns history storage |
| **Immutability** | `Snapshot` record is immutable — undo target won't drift |
| **Separation** | Memento is not general persistence — short-lived undo scope |

## 12. Extensibility

| Change | Approach | Trade-off |
|--------|----------|-----------|
| Multi-level undo | Stack of `Snapshot` in caretaker | Memory grows — cap stack depth |
| Stricter opacity | Package-private `Snapshot` class | Caretaker can't read fields at compile time |
| Redo | Second stack of undone mementos | Classic undo/redo caretaker |
| vs Command undo | Command stores inverse **operation** | Memento stores **state snapshot** |
| Large state | Serialize memento to disk | Still not ORM entity persistence |

## 13. Advantages

- Undo/redo without breaking encapsulation
- Caretaker logic is simple: store and pass memento back
- Clear rollback for config UIs and admin wizards
- Originator controls exactly what goes into snapshot
- Immutable memento prevents caretaker corrupting history

## 14. Disadvantages

- Memory for deep undo stacks (many snapshots)
- Not general persistence — use ORM/serialization for entities
- Large state graphs produce large mementos
- Memento opacity in demo is weak — public record fields are readable
- Distributed systems need event sourcing, not in-process memento

## 15. When to Use

1. Payment config editor with undo (gateway, timeout, retry policy)
2. Multi-step wizard rollback to previous step state
3. Graphics editor undo (shape positions in memento)
4. Game save slot (originator restores from memento bytes)
5. IDE text buffer undo snapshots

## 16. When NOT to Use

1. Database entity persistence — normal serialization/ORM
2. Audit trail sufficient — event sourcing replaces undo stack
3. State is tiny and public — simple copy may suffice
4. Cross-service rollback — saga compensation, not memento

## 17. Edge Cases / Production Concerns

| Concern | In this demo | Production note |
|---------|--------------|-----------------|
| **History cap** | Single snapshot | Limit undo stack (e.g. 50 levels) |
| **Deep copy** | Record copies values | Nested objects need deep snapshot |
| **Opacity** | Public `Snapshot` record | Package-private memento type |
| **Concurrency** | Single thread | Don't share mutable originator across threads |
| **Memento size** | Two fields | Large config JSON → compress or diff |
| **Caretaker leak** | Local variable | Long-lived stack holds old mementos — cap size |
| **Restore validation** | No validation | Reject restore if gateway enum invalid |

## 18. Possible Code Improvements

### Required (correctness)

- Cap undo stack size in caretaker to avoid memory leak
- Package-private `Snapshot` so caretaker cannot read fields
- Validate `snapshot` non-null in `restore()`

### Optional (clarity / prod)

- `ConfigurationCaretaker` class with `undo()` / `redo()` methods
- Include `timeoutSeconds` in demo console output after restore
- Deep copy for nested configuration objects
- Timestamp on memento for audit display

## 19. Mental Model

**Formula:**

```text
Problem:  Undo needs old state without exposing internals
Solution: Originator save() → opaque memento → caretaker stores → restore()
Benefit:  Encapsulated rollback without field-level caretaker access
```

Memory trick: **"Save game slot — slot holds opaque bytes; only the game knows how to load."**

## 20. 30–60 Second Interview Answer

> **Memento** captures an object's internal state for later restore without violating encapsulation. Ops editing payment gateway from STRIPE to ADYEN can't undo without exposing `PaymentConfiguration` private fields or redeploying from backup. The **originator** `PaymentConfiguration` exposes `save()` returning an opaque `Snapshot` memento with gateway and timeout, and `restore(snapshot)` rolls state back. The **caretaker** stores the snapshot but doesn't mutate originator fields directly. In our demo: start STRIPE/30, save, switch to ADYEN/60, restore → gateway back to STRIPE. Use for config undo wizards — not general database persistence. Stricter production code uses package-private memento types so caretaker truly cannot inspect fields.

## 21. Likely Interview Follow-ups

| Question | Answer sketch |
|----------|---------------|
| vs Command undo? | Command stores inverse **operation**; Memento stores **state snapshot** |
| How make memento opaque? | Package-private class; only originator can construct/read |
| Memory with deep undo? | Cap stack; store diffs instead of full snapshots |
| vs Serialization? | Memento is in-process undo scope; serialization is persistence |
| Deep copy? | Memento must snapshot nested state, not live references |

**Common mistake:** Using Memento for long-term persistence — use ORM/DB; Memento is short-lived undo.

---

## Run

```bash
cd java-design-patterns-real-world
mvn -q exec:java -Dexec.mainClass=com.example.designpatterns.behavioral.memento.PaymentConfigurationMementoDemo
```
