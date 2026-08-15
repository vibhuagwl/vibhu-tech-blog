# Command — Interview Explanation Board

> **Demo:** `PaymentCommandDemo` — `src/main/java/com/example/designpatterns/behavioral/command/PaymentCommandDemo.java`

## 1. Pattern Identification

| Field | Value |
|-------|-------|
| **Name** | Command |
| **Category** | Behavioral |
| **One-line definition** | Encapsulate a request as an object so you can parameterize clients, queue operations, log executions, and support undo — decoupling the invoker from the receiver that performs the work. |
| **Problem class** | Payment create, cancel, refund, and retry are bare method calls with no audit trail; batch jobs cannot queue operations; compliance replay needs structured records of what ran. |

## 2. Problem We Are Solving

A payment operations API must support **multiple actions** on the same payment entity:

- **Create** — `created:pay-cmd-1`
- **Cancel** — `cancelled:pay-cmd-1`
- **Refund** — `refunded:pay-cmd-1`
- **Retry** — `retried:pay-cmd-1`

Example batch scenario:

```text
Queue:
  1. CreatePaymentCommand(receiver, "pay-cmd-1")
  2. RefundPaymentCommand(receiver, "pay-cmd-1")

Invoker runs FIFO → "created:pay-cmd-1" then "refunded:pay-cmd-1"
```

The painful questions:

> How do we queue refund for later execution without the API layer calling `receiver.refund()` directly?

> How do we audit **what** operation ran, with **which** parameters, for compliance replay?

Relationships that make this hard:

- **Invoker** — API, job scheduler, or CLI; should not know payment domain internals
- **Receiver** — `PaymentReceiver` owns actual create/cancel/refund/retry logic
- **Operation** — must become a first-class object (not just a method name string)
- **Queue** — batch and async execution need deferred `execute()`

## 3. What Happens Without the Pattern

Naive API calls receiver methods directly:

```java
public class PaymentApi {
    private final PaymentReceiver receiver = new PaymentReceiver();

    public void handleBatch() {
        receiver.create("pay-cmd-1");
        receiver.refund("pay-cmd-1");
        // no queue, no log of operations as objects
    }
}
```

Concrete pains:

1. **No audit trail** — logs say "refund called" but not structured command history
2. **Cannot queue** — batch jobs need serializable operation list for retry
3. **Invoker coupled to receiver** — API imports every payment method signature
4. **No undo/redo** — reversing refund requires ad hoc compensating logic
5. **Macro / composite actions** — "create then refund" duplicated as imperative scripts

SOLID hits: **DIP** (invoker depends on concrete receiver), **OCP** (new operation edits all callers).

## 4. How the Pattern Solves It

Conceptual chain:

1. **Problem** — direct `receiver.create()` / `refund()` calls; no queue or structured audit
2. **Naive pain** — invoker knows receiver API surface; batch logic is imperative glue
3. **Pattern introduces** — `Command` interface with `execute()`
4. **Concrete commands** — `CreatePaymentCommand`, `CancelPaymentCommand`, `RefundPaymentCommand`, `RetryPaymentCommand` (records holding receiver + id)
5. **Receiver** — `PaymentReceiver` performs domain mutation; commands delegate to it
6. **Invoker** — `CommandInvoker` with `Deque<Command>`; `submit()` enqueues, `runNext()` dequeues and `execute()`
7. **Client** — submits commands without knowing receiver method names at call site

Operations become **objects** the invoker can queue, log, and replay.

## 5. Pattern → Code Mapping

| Pattern role | Demo class / type | Why this role |
|--------------|-------------------|---------------|
| **Command** | `Command` (interface) | `execute()` contract — uniform operation object |
| **Concrete Command** | `CreatePaymentCommand`, `CancelPaymentCommand`, `RefundPaymentCommand`, `RetryPaymentCommand` | Encapsulate receiver + parameters (`id`) |
| **Receiver** | `PaymentReceiver` | Knows how to create/cancel/refund/retry; domain logic lives here |
| **Invoker** | `CommandInvoker` | Queue (`ArrayDeque`); `submit()` / `runNext()` — no receiver knowledge |
| **Client** | `PaymentCommandDemo.run()` | Submits create + refund; invoker executes in order |

## 6. Important Code Lines

| Code | Design significance |
|------|---------------------|
| `interface Command { String execute(); }` | Operation as object — invoker calls uniform method |
| `record CreatePaymentCommand(PaymentReceiver receiver, String id)` | Immutable command captures receiver + params |
| `CreatePaymentCommand.execute() → receiver.create(id)` | Command delegates; does not duplicate domain rules |
| `PaymentReceiver.create(id) → "created:" + id` | Receiver owns mutation semantics |
| `Deque<Command> queue = new ArrayDeque<>()` | FIFO queue for deferred execution |
| `submit(Command command) → queue.add(command)` | Decouple submission time from execution time |
| `runNext() → queue.removeFirst().execute()` | Invoker runs next without knowing command type |
| Four command records share same shape | Easy to add `VoidPaymentCommand` as new record |

## 7. Object/Class Diagram

```text
                    ┌─────────────────────────┐
                    │   CommandInvoker        │
                    │   (Invoker)             │
                    │ - queue: Deque<Command> │
                    │ + submit(command)       │
                    │ + runNext()             │
                    └───────────┬─────────────┘
                                │ execute()
                                ▼
                    ┌─────────────────────────┐
                    │  <<interface>>        │
                    │  Command              │
                    │  + execute(): String  │
                    └───────────┬─────────────┘
                                │
        ┌───────────┬───────────┼───────────┬───────────┐
        ▼           ▼           ▼           ▼           │
 CreatePayment  CancelPayment RefundPayment RetryPayment │
 Command        Command       Command       Command     │
        │           │           │           │           │
        └───────────┴───────────┴───────────┘           │
                        │ delegates                       │
                        ▼                                 │
              ┌─────────────────────┐                     │
              │  PaymentReceiver    │                     │
              │  (Receiver)         │                     │
              │  + create(id)       │                     │
              │  + cancel(id)       │                     │
              │  + refund(id)       │                     │
              │  + retry(id)        │                     │
              └─────────────────────┘                     │
```

## 8. Runtime Execution Flow

From `PaymentCommandDemo.run()`:

```text
STEP 1 — Setup:
  receiver = new PaymentReceiver()
  invoker = new CommandInvoker()

STEP 2 — Submit commands (queued, not executed):
  invoker.submit(new CreatePaymentCommand(receiver, "pay-cmd-1"))
  invoker.submit(new RefundPaymentCommand(receiver, "pay-cmd-1"))

STEP 3 — Execute FIFO:
  invoker.runNext()
    → CreatePaymentCommand.execute()
    → receiver.create("pay-cmd-1")
    → "created:pay-cmd-1"

  invoker.runNext()
    → RefundPaymentCommand.execute()
    → receiver.refund("pay-cmd-1")
    → "refunded:pay-cmd-1"

Output:
  Execute #1: created:pay-cmd-1
  Execute #2: refunded:pay-cmd-1

Test path (PaymentCommandDemoTest):
  submit(RefundPaymentCommand(receiver, "p1"))
  runNext() → "refunded:p1"
```

Invoker never branches on create vs refund — polymorphic `execute()`.

## 9. What the Client Doesn't Need to Know

- How `PaymentReceiver` implements refund internally
- Which concrete command class is at queue head
- That commands are Java `record` types
- Queue implementation (`ArrayDeque` vs `LinkedList`)
- Return string format unless parsing results

Client mental model: **build command objects, submit to invoker, call `runNext()`**.

## 10. Before vs After

### Without Command

```text
API / Job
  │
  ├── receiver.create("pay-cmd-1")
  └── receiver.refund("pay-cmd-1")
```

Invoker **calls receiver methods directly**.

### With Command

```text
API / Job
  │
  ├── submit(CreatePaymentCommand)
  ├── submit(RefundPaymentCommand)
  │
  └── invoker.runNext() → command.execute() → receiver
```

**Invoker knows only `Command`; receiver reached through command object.**

## 11. SOLID / Design Principles

| Principle | How Command applies |
|-----------|-------------------|
| **Open/Closed** | New operation = new `Command` class; invoker unchanged |
| **Single Responsibility** | `RefundPaymentCommand` encapsulates refund request; receiver executes |
| **Dependency Inversion** | Invoker depends on `Command` interface, not `PaymentReceiver` |
| **Decoupling** | Core benefit — invoker scheduled when; command knows what |
| **Records for commands** | Immutable parameter capture for audit/replay |

## 12. Extensibility

| Change | Approach | Trade-off |
|--------|----------|-----------|
| Undo | Add `undo()` to `Command`; stack executed commands | Must capture reversible state |
| Macro command | `CompositeCommand(List<Command>)` executes children | Transaction boundary across children |
| Remote execution | Serialize command DTO; worker deserializes + execute | Versioning of command schema |
| Priority queue | `PriorityQueue<Command>` instead of FIFO | Ordering semantics change |
| Idempotent execute | Command checks idempotency key before receiver call | Receiver or command owns policy |

Demo has **no undo** — common interview extension.

## 13. Advantages

- Operations are first-class — log, queue, replay, serialize
- Invoker decoupled from receiver API surface
- Batch and async job friendly (`submit` now, `runNext` later)
- Natural fit for undo/redo (text editor, transaction compensations)
- Add new payment operation without editing invoker

## 14. Disadvantages

- Class per operation — four commands for four methods here
- Indirection — harder to trace than direct call for trivial CRUD
- Undo complexity — must store enough state to reverse
- Command explosion if every API endpoint gets a class — consider generic command with enum op
- Domain rules must stay in **receiver** — empty command antipattern

## 15. When to Use

1. Queue payment operations for batch processing (this demo)
2. Undo/redo in editors or configurable UIs
3. Audit and compliance replay of structured actions
4. Macro recording — user action history as command list
5. Remote procedure as object (job payload)

## 16. When NOT to Use

1. Single direct method call with no queue, undo, or audit needs
2. Read-only queries — use query object or direct call, not command mutation
3. High-frequency hot path where allocation per command is costly
4. Simple CRUD with no deferred execution — YAGNI

## 17. Edge Cases / Production Concerns

| Concern | In this demo | Production note |
|---------|--------------|-----------------|
| **Failed execute** | No error handling | Pop queue only on success; or dead-letter failed command |
| **Empty queue** | `removeFirst()` throws | `Optional<String> runNext()` or `poll()` |
| **Thread safety** | Single-threaded deque | `BlockingQueue` for worker pool |
| **Idempotency** | Not shown | Command carries idempotency key to receiver |
| **Serialization** | Records in-memory | JSON command log for event sourcing |
| **Receiver lifetime** | Command holds receiver reference | Inject receiver from DI scope per execute |
| **Ordering** | FIFO | Document if LIFO undo stack separate from job queue |

## 18. Possible Code Improvements

### Required (correctness)

- Handle empty queue in `runNext()` — return `Optional.empty()` instead of throw
- On `execute()` failure, do not lose command — retry policy or DLQ

### Optional (clarity / prod)

- `undo()` on commands that support reversal
- `CommandHistory` logs executed commands with timestamp
- Separate invoker interface from queue implementation
- `CompositeCommand` for "create then capture" saga step

## 19. Mental Model

**Formula:**

```text
Problem:  Direct receiver calls → no queue, no audit object, tight coupling
Solution: Command object wraps action + params → Invoker.execute() dispatches
Benefit:  Submit now, run later; log commands as structured history
```

Memory trick: **"Restaurant order ticket."** Waiter (invoker) writes order (command); kitchen (receiver) fulfills — waiter does not cook, ticket can queue.

## 20. 30–60 Second Interview Answer

> **Command** encapsulates a request as an object. Our problem is payment create, cancel, refund, and retry as bare `PaymentReceiver` method calls — no queue, audit trail, or replay. `Command` interface has `execute()`. Each action is a record — `CreatePaymentCommand`, `RefundPaymentCommand` — holding `PaymentReceiver` and payment `id`. `CommandInvoker` queues commands in `ArrayDeque`; `submit()` adds, `runNext()` removes and executes. Demo submits create then refund; outputs `created:pay-cmd-1` and `refunded:pay-cmd-1`. Invoker never knows receiver details — only calls `command.execute()`. Extend with `undo()` for compensating transactions. Differs from **Strategy**: Command is a **request object** with optional queue; Strategy is **runtime algorithm selection**.

## 21. Likely Interview Follow-ups

| Question | Answer sketch |
|----------|---------------|
| Command vs Strategy? | Command encapsulates **request** (create/refund) for queue/undo; Strategy encapsulates **algorithm** (UPI vs CARD) |
| Where do domain rules live? | **Receiver** — command is thin delegate |
| How implement undo? | `undo()` on command + stack of executed commands; capture prior state |
| Command vs Event? | Command imperatively triggers action; event notifies something already happened |
| CQRS? | Commands are write side in CQRS; queries are separate |

**Common mistake:** Putting business logic only in invoker — receiver must own mutation rules.

---

## Run

```bash
cd java-design-patterns-real-world
mvn -q exec:java -Dexec.mainClass=com.example.designpatterns.behavioral.command.PaymentCommandDemo
```
