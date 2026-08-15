package com.example.designpatterns.behavioral.command;

import java.util.ArrayDeque;
import java.util.Deque;

/**
 * PATTERN: Command
 *
 * <p>PROBLEM (without this pattern) - Create, cancel, refund, and retry are direct method calls
 * with no audit trail. - Batch jobs cannot queue operations for later execution. - Undo and
 * compliance replay need structured records of what ran.
 *
 * <p>HOW THIS PATTERN SOLVES IT - Each action is a Command object (CreatePaymentCommand,
 * RefundPaymentCommand). - CommandInvoker queues commands and calls execute without knowing
 * receiver details. - Operations become first-class objects suitable for logging, retry, and undo.
 *
 * <p>WHEN TO IMPLEMENT - You need to queue, log, undo/redo, or schedule operations as first-class
 * objects. - Decouple invoker (UI/API/job) from the receiver that performs the work.
 *
 * <p>JAVA IMPLEMENTATION RULES 1. Command interface with {@code execute()} (and {@code undo()} when
 * required). 2. Concrete commands hold receiver + parameters; invoker only calls execute. 3. Prefer
 * immutable command data; capture enough state for undo. 4. Store executed commands on a stack for
 * undo; clear policy on failed execute. 5. Do not put domain rules only inside the invoker —
 * receiver owns business mutation.
 *
 * <p>DO NOT USE WHEN - You only need a single direct method call with no queue/undo/audit
 * requirements.
 */
public class PaymentCommandDemo {
  public interface Command {
    String execute();
  }

  public static final class PaymentReceiver {
    public String create(String id) {
      return "created:" + id;
    }

    public String cancel(String id) {
      return "cancelled:" + id;
    }

    public String refund(String id) {
      return "refunded:" + id;
    }

    public String retry(String id) {
      return "retried:" + id;
    }
  }

  public record CreatePaymentCommand(PaymentReceiver receiver, String id) implements Command {
    public String execute() {
      return receiver.create(id);
    }
  }

  public record CancelPaymentCommand(PaymentReceiver receiver, String id) implements Command {
    public String execute() {
      return receiver.cancel(id);
    }
  }

  public record RefundPaymentCommand(PaymentReceiver receiver, String id) implements Command {
    public String execute() {
      return receiver.refund(id);
    }
  }

  public record RetryPaymentCommand(PaymentReceiver receiver, String id) implements Command {
    public String execute() {
      return receiver.retry(id);
    }
  }

  public static final class CommandInvoker {
    private final Deque<Command> queue = new ArrayDeque<>();

    public void submit(Command command) {
      queue.add(command);
    }

    public String runNext() {
      return queue.removeFirst().execute();
    }
  }

  public static void run() {
    System.out.println("=== Command — PaymentCommandDemo ===");
    System.out.println(
        "PROBLEM: Payment create, cancel, refund, and retry are bare method calls that cannot be"
            + " queued, audited, or replayed as structured operations.");
    System.out.println(
        "SOLUTION: Command objects encapsulate each action; CommandInvoker queues and executes them"
            + " without coupling to PaymentReceiver internals.");
    System.out.println("STEP 1: Create PaymentReceiver and CommandInvoker queue");
    var receiver = new PaymentReceiver();
    var invoker = new CommandInvoker();
    System.out.println("STEP 2: Submit CreatePaymentCommand and RefundPaymentCommand");
    invoker.submit(new CreatePaymentCommand(receiver, "pay-cmd-1"));
    invoker.submit(new RefundPaymentCommand(receiver, "pay-cmd-1"));
    System.out.println("STEP 3: Invoker executes commands without knowing receiver details");
    System.out.println("  Execute #1: " + invoker.runNext());
    System.out.println("  Execute #2: " + invoker.runNext());
  }

  public static void main(String[] args) {
    run();
  }
}
