package com.example.designpatterns.behavioral.command;

import java.util.ArrayDeque;
import java.util.Deque;

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
