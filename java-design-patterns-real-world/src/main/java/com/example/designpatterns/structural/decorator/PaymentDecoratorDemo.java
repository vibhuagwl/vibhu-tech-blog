package com.example.designpatterns.structural.decorator;

import java.util.ArrayList;
import java.util.List;

public class PaymentDecoratorDemo {
    public interface PaymentProcessor { String process(int amount); }
    public static final class BasicPayment implements PaymentProcessor { public String process(int amount){ return "processed:" + amount; } }
    public abstract static class PaymentDecorator implements PaymentProcessor {
        protected final PaymentProcessor delegate;
        protected PaymentDecorator(PaymentProcessor delegate){ this.delegate = delegate; }
    }
    public static final class LoggingDecorator extends PaymentDecorator {
        private final List<String> audit;
        public LoggingDecorator(PaymentProcessor delegate, List<String> audit){ super(delegate); this.audit = audit; }
        public String process(int amount){ audit.add("log:" + amount); return delegate.process(amount); }
    }
    public static final class FraudCheckDecorator extends PaymentDecorator {
        public FraudCheckDecorator(PaymentProcessor delegate){ super(delegate); }
        public String process(int amount){ if(amount > 10000) throw new IllegalArgumentException("fraud review"); return delegate.process(amount); }
    }
    public static final class MetricsDecorator extends PaymentDecorator {
        public MetricsDecorator(PaymentProcessor delegate){ super(delegate); }
        public String process(int amount){ return delegate.process(amount) + ":metric"; }
    }
}
