package com.example.designpatterns.behavioral.state;

public class PaymentStateDemo {
    public interface PaymentState { PaymentState authorize(); PaymentState capture(); PaymentState settle(); PaymentState complete(); String name(); }
    public static final class CreatedState implements PaymentState {
        public PaymentState authorize(){ return new AuthorizedState(); }
        public PaymentState capture(){ throw new IllegalStateException("authorize first"); }
        public PaymentState settle(){ throw new IllegalStateException("authorize first"); }
        public PaymentState complete(){ throw new IllegalStateException("authorize first"); }
        public String name(){ return "CREATED"; }
    }
    public static final class AuthorizedState implements PaymentState {
        public PaymentState authorize(){ throw new IllegalStateException("already authorized"); }
        public PaymentState capture(){ return new CapturedState(); }
        public PaymentState settle(){ throw new IllegalStateException("capture first"); }
        public PaymentState complete(){ throw new IllegalStateException("settle first"); }
        public String name(){ return "AUTHORIZED"; }
    }
    public static final class CapturedState implements PaymentState {
        public PaymentState authorize(){ throw new IllegalStateException("already captured"); }
        public PaymentState capture(){ throw new IllegalStateException("already captured"); }
        public PaymentState settle(){ return new SettledState(); }
        public PaymentState complete(){ throw new IllegalStateException("settle first"); }
        public String name(){ return "CAPTURED"; }
    }
    public static final class SettledState implements PaymentState {
        public PaymentState authorize(){ throw new IllegalStateException("done"); }
        public PaymentState capture(){ throw new IllegalStateException("done"); }
        public PaymentState settle(){ throw new IllegalStateException("done"); }
        public PaymentState complete(){ return new CompletedState(); }
        public String name(){ return "SETTLED"; }
    }
    public static final class CompletedState implements PaymentState {
        public PaymentState authorize(){ throw new IllegalStateException("done"); }
        public PaymentState capture(){ throw new IllegalStateException("done"); }
        public PaymentState settle(){ throw new IllegalStateException("done"); }
        public PaymentState complete(){ throw new IllegalStateException("done"); }
        public String name(){ return "COMPLETED"; }
    }
    public static final class Payment {
        private PaymentState state = new CreatedState();
        public void authorize(){ state = state.authorize(); }
        public void capture(){ state = state.capture(); }
        public void settle(){ state = state.settle(); }
        public void complete(){ state = state.complete(); }
        public String state(){ return state.name(); }
    }
}
