package com.example.designpatterns.behavioral.command;

import java.util.ArrayDeque;
import java.util.Deque;

/**
 * PATTERN: Command
 *
 * WHEN TO IMPLEMENT
 * - You need to queue, log, undo/redo, or schedule operations as first-class objects.
 * - Decouple invoker (UI/API/job) from the receiver that performs the work.
 *
 * JAVA IMPLEMENTATION RULES
 * 1. Command interface with {@code execute()} (and {@code undo()} when required).
 * 2. Concrete commands hold receiver + parameters; invoker only calls execute.
 * 3. Prefer immutable command data; capture enough state for undo.
 * 4. Store executed commands on a stack for undo; clear policy on failed execute.
 * 5. Do not put domain rules only inside the invoker — receiver owns business mutation.
 *
 * DO NOT USE WHEN
 * - You only need a single direct method call with no queue/undo/audit requirements.
 */
public class PaymentCommandDemo {
    public interface Command { String execute(); }
    public static final class PaymentReceiver {
        public String create(String id){ return "created:" + id; }
        public String cancel(String id){ return "cancelled:" + id; }
        public String refund(String id){ return "refunded:" + id; }
        public String retry(String id){ return "retried:" + id; }
    }
    public record CreatePaymentCommand(PaymentReceiver receiver, String id) implements Command { public String execute(){ return receiver.create(id); } }
    public record CancelPaymentCommand(PaymentReceiver receiver, String id) implements Command { public String execute(){ return receiver.cancel(id); } }
    public record RefundPaymentCommand(PaymentReceiver receiver, String id) implements Command { public String execute(){ return receiver.refund(id); } }
    public record RetryPaymentCommand(PaymentReceiver receiver, String id) implements Command { public String execute(){ return receiver.retry(id); } }
    public static final class CommandInvoker {
        private final Deque<Command> queue = new ArrayDeque<>();
        public void submit(Command command){ queue.add(command); }
        public String runNext(){ return queue.removeFirst().execute(); }
    }
}
