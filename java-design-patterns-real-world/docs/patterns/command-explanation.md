# Command — Interview Explanation Board

> **Demo:** `PaymentCommandDemo` — `src/main/java/com/example/designpatterns/behavioral/command/PaymentCommandDemo.java`

## 1. Pattern Identification

| Field | Value |
|-------|-------|
| **Name** | Command |
| **Category** | Behavioral |
| **One-line definition** | Encapsulate a request as an object, letting you parameterize, queue, log, and undo operations. |
| **Problem class** | Payment actions as direct method calls cannot be queued, audited, or replayed structurally. |

## 2. Problem We Are Solving

Create, cancel, refund, and retry payments are invoked as plain `receiver.create(id)` calls. Batch jobs cannot queue operations. Compliance needs structured audit of **what** ran. Undo/retry requires capturing invocations as objects, not stack traces.

## 3. What Happens Without the Pattern

Direct calls — no queue, no uniform audit envelope, invoker coupled to receiver method names, hard to schedule retry at 2am.

## 4. How the Pattern Solves It

1. **Command** — `Command.execute()`
2. **Concrete commands** — `CreatePaymentCommand`, `CancelPaymentCommand`, `RefundPaymentCommand`, `RetryPaymentCommand`
3. **Receiver** — `PaymentReceiver` with `create`, `cancel`, `refund`, `retry`
4. **Invoker** — `CommandInvoker` queues commands, `runNext()` executes

## 5. Pattern → Code Mapping

| Role | Demo type | Why |
|------|-----------|-----|
| **Command** | `Command` interface | `execute()` |
| **Concrete commands** | `CreatePaymentCommand`, etc. (records) | Hold receiver + id |
| **Receiver** | `PaymentReceiver` | Performs work |
| **Invoker** | `CommandInvoker` | `submit`, `runNext` |
| **Client** | `PaymentCommandDemo.run()` | Queues create + refund |

## 6. Important Code Lines

| Code | Significance |
|------|--------------|
| `record CreatePaymentCommand(PaymentReceiver receiver, String id)` | Command as data + execute |
| `execute() → receiver.create(id)` | Delegates to receiver |
| `Deque<Command> queue` | Queue for deferred execution |
| `submit(command)` / `runNext()` | Invoker decoupled from receiver ops |

## 7. Object/Class Diagram

```text
CommandInvoker
    queue: Deque<Command>
         │
         ▼ execute()
    CreatePaymentCommand ──► PaymentReceiver.create()
    RefundPaymentCommand ──► PaymentReceiver.refund()
```

## 8. Runtime Execution Flow

```text
receiver = new PaymentReceiver()
invoker = new CommandInvoker()
invoker.submit(new CreatePaymentCommand(receiver, "pay-cmd-1"))
invoker.submit(new RefundPaymentCommand(receiver, "pay-cmd-1"))

invoker.runNext() → "created:pay-cmd-1"
invoker.runNext() → "refunded:pay-cmd-1"
```

Invoker never calls `receiver.create` directly.

## 9. What the Client Doesn't Need to Know

- Which receiver method runs
- Queue implementation
- Command class names at submit time if using factory

## 10. Before vs After

**Before:** `receiver.refund(id)` direct — no queue/audit object.

**After:** `invoker.submit(new RefundPaymentCommand(...))` — operation is an object.

## 11. SOLID / Design Principles

| Principle | Application |
|-----------|-------------|
| **DIP** | Invoker depends on `Command`, not receiver |
| **OCP** | New command type without editing invoker |
| **SRP** | Receiver owns mutation; command owns invocation envelope |

## 12. Extensibility

- `undo()` on commands with memento of state
- Macro command executing command list
- Persist queue to DB for async workers

## 13. Advantages

- Queue, log, schedule operations
- Uniform execute interface
- Decouple UI/API from receiver

## 14. Disadvantages

- Many command classes
- Overkill for single direct call
- Undo complexity for distributed payments

## 15. When to Use

1. Payment operation queue + audit
2. Undo/redo editors
3. Job scheduler executing typed tasks

## 16. When NOT to Use

1. Simple synchronous call with no audit/queue need

## 17. Edge Cases / Production Concerns

| Concern | Note |
|---------|------|
| Failed execute | Clear undo stack policy |
| Idempotency | Command id on retry |
| Serialization | Commands to message queue |
| Ordering | Queue FIFO vs priority |

## 18. Possible Code Improvements

**Required:** `undo()` for reversible commands; idempotency keys.

**Optional:** Command bus; persistent outbox pattern.

## 19. Mental Model

**"Order ticket on kitchen rail."** Ticket (command) queued; cook (receiver) executes when picked.

## 20. 30–60 Second Interview Answer

> Command encapsulates a request as an object with `execute()`. Payment create/cancel/refund as bare method calls can't be queued or audited uniformly. `CreatePaymentCommand` holds `PaymentReceiver` and id; `CommandInvoker` queues commands and `runNext()` executes without knowing receiver internals. Demo submits create then refund for `pay-cmd-1`. Enables batch jobs, compliance replay, and optional undo by adding `undo()` to commands.

## 21. Likely Interview Follow-ups

| Question | Answer |
|----------|--------|
| Command vs Strategy? | Command encapsulates **request**; Strategy encapsulates **algorithm** |
| Undo? | Store inverse command or memento on execute |
| CQRS? | Commands as write-side messages — related idea |

**Common mistake:** Putting domain rules only in invoker — receiver owns business logic.

---

## Run

```bash
cd java-design-patterns-real-world
mvn -q exec:java -Dexec.mainClass=com.example.designpatterns.behavioral.command.PaymentCommandDemo
```
