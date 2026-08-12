package com.example.designpatterns.behavioral.state;

import java.util.ArrayList;
import java.util.List;

public class PaymentStateDemo {
    public interface PaymentState {
        PaymentState authorize();
        PaymentState capture();
        PaymentState settle();
        PaymentState complete();
        PaymentState fail(String reason);
        String name();
    }
    public static final class CreatedState implements PaymentState {
        public PaymentState authorize(){ return new AuthorizedState(); }
        public PaymentState capture(){ throw new IllegalStateException("authorize first"); }
        public PaymentState settle(){ throw new IllegalStateException("authorize first"); }
        public PaymentState complete(){ throw new IllegalStateException("authorize first"); }
        public PaymentState fail(String reason){ return new FailedState(reason); }
        public String name(){ return "CREATED"; }
    }
    public static final class AuthorizedState implements PaymentState {
        public PaymentState authorize(){ throw new IllegalStateException("already authorized"); }
        public PaymentState capture(){ return new CapturedState(); }
        public PaymentState settle(){ throw new IllegalStateException("capture first"); }
        public PaymentState complete(){ throw new IllegalStateException("settle first"); }
        public PaymentState fail(String reason){ return new FailedState(reason); }
        public String name(){ return "AUTHORIZED"; }
    }
    public static final class CapturedState implements PaymentState {
        public PaymentState authorize(){ throw new IllegalStateException("already captured"); }
        public PaymentState capture(){ throw new IllegalStateException("already captured"); }
        public PaymentState settle(){ return new SettledState(); }
        public PaymentState complete(){ throw new IllegalStateException("settle first"); }
        public PaymentState fail(String reason){ return new FailedState(reason); }
        public String name(){ return "CAPTURED"; }
    }
    public static final class SettledState implements PaymentState {
        public PaymentState authorize(){ throw new IllegalStateException("done"); }
        public PaymentState capture(){ throw new IllegalStateException("done"); }
        public PaymentState settle(){ throw new IllegalStateException("done"); }
        public PaymentState complete(){ return new CompletedState(); }
        public PaymentState fail(String reason){ throw new IllegalStateException("cannot fail after settlement"); }
        public String name(){ return "SETTLED"; }
    }
    public static final class CompletedState implements PaymentState {
        public PaymentState authorize(){ throw new IllegalStateException("done"); }
        public PaymentState capture(){ throw new IllegalStateException("done"); }
        public PaymentState settle(){ throw new IllegalStateException("done"); }
        public PaymentState complete(){ throw new IllegalStateException("done"); }
        public PaymentState fail(String reason){ throw new IllegalStateException("done"); }
        public String name(){ return "COMPLETED"; }
    }
    public static final class FailedState implements PaymentState {
        private final String reason;
        public FailedState(String reason){ this.reason = reason; }
        public PaymentState authorize(){ throw new IllegalStateException("failed:" + reason); }
        public PaymentState capture(){ throw new IllegalStateException("failed:" + reason); }
        public PaymentState settle(){ throw new IllegalStateException("failed:" + reason); }
        public PaymentState complete(){ throw new IllegalStateException("failed:" + reason); }
        public PaymentState fail(String ignored){ throw new IllegalStateException("already failed"); }
        public String name(){ return "FAILED(" + reason + ")"; }
    }
    public static final class Payment {
        private PaymentState state = new CreatedState();
        private final List<String> timeline = new ArrayList<>(List.of(state.name()));
        public void authorize(){ state = state.authorize(); timeline.add(state.name()); }
        public void capture(){ state = state.capture(); timeline.add(state.name()); }
        public void settle(){ state = state.settle(); timeline.add(state.name()); }
        public void complete(){ state = state.complete(); timeline.add(state.name()); }
        public void fail(String reason){ state = state.fail(reason); timeline.add(state.name()); }
        public String state(){ return state.name(); }
        public List<String> timeline(){ return timeline; }
    }
}
