package com.example.designpatterns.structural.decorator;

import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * PATTERN: Decorator
 *
 * WHEN TO IMPLEMENT
 * - You need to add responsibilities at runtime (logging, metrics, retry, encryption) without subclass explosion.
 * - Cross-cutting wrappers around a stable core interface.
 *
 * JAVA IMPLEMENTATION RULES
 * 1. Decorators implement the same interface as the component and hold a {@code delegate} reference.
 * 2. Forward calls to delegate; add behavior before/after — do not copy-paste core logic into each decorator.
 * 3. Compose decorators by nesting constructors (order matters: auth → metrics → core).
 * 4. Keep decorators single-purpose (one concern each).
 * 5. Prefer final decorator classes; make the wrapped field final.
 *
 * DO NOT USE WHEN
 * - Behavior belongs in the domain algorithm itself, or Proxy/AOP already covers the concern globally.
 */
public class PaymentDecoratorDemo {
    public interface PaymentProcessor { String process(int amount); }
    public static final class BasicPayment implements PaymentProcessor { public String process(int amount){ return "processed:" + amount; } }
    public static final class FlakyPayment implements PaymentProcessor {
        private boolean firstAttempt = true;
        public String process(int amount){
            if (firstAttempt) { firstAttempt = false; throw new IllegalStateException("temporary gateway error"); }
            return "processed-after-retry:" + amount;
        }
    }
    public abstract static class PaymentDecorator implements PaymentProcessor {
        protected final PaymentProcessor delegate;
        protected PaymentDecorator(PaymentProcessor delegate){ this.delegate = delegate; }
    }
    public static final class LoggingDecorator extends PaymentDecorator {
        private final List<String> audit;
        public LoggingDecorator(PaymentProcessor delegate, List<String> audit){ super(delegate); this.audit = audit; }
        public String process(int amount){ audit.add("log:request:" + amount); String result = delegate.process(amount); audit.add("log:result:" + result); return result; }
    }
    public static final class FraudCheckDecorator extends PaymentDecorator {
        public FraudCheckDecorator(PaymentProcessor delegate){ super(delegate); }
        public String process(int amount){ if(amount > 10000) throw new IllegalArgumentException("fraud review"); return delegate.process(amount); }
    }
    public static final class MetricsDecorator extends PaymentDecorator {
        private final AtomicInteger successCounter;
        public MetricsDecorator(PaymentProcessor delegate, AtomicInteger successCounter){ super(delegate); this.successCounter = successCounter; }
        public String process(int amount){ String result = delegate.process(amount); successCounter.incrementAndGet(); return result + ":metric"; }
    }
    public static final class RetryDecorator extends PaymentDecorator {
        private final int maxAttempts;
        public RetryDecorator(PaymentProcessor delegate, int maxAttempts){ super(delegate); this.maxAttempts = maxAttempts; }
        public String process(int amount){
            RuntimeException last = null;
            for (int attempt = 1; attempt <= maxAttempts; attempt++) {
                try { return delegate.process(amount); } catch (RuntimeException ex) { last = ex; }
            }
            throw last;
        }
    }
}
