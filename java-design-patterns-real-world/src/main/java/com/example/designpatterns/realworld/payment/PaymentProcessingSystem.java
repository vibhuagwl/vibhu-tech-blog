package com.example.designpatterns.realworld.payment;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class PaymentProcessingSystem {
    public record PaymentRequest(String customerId, String accountId, String method, int amount, String provider) {}
    public record PaymentResult(String status, String gatewayReference, List<String> auditTrail) {}

    public interface Validator {
        ValidationResult validate(PaymentRequest request);
    }
    public record ValidationResult(boolean ok, String reason) {
        public static ValidationResult passed(){ return new ValidationResult(true, "OK"); }
        public static ValidationResult fail(String reason){ return new ValidationResult(false, reason); }
    }
    public static final class AuthenticationValidator implements Validator {
        public ValidationResult validate(PaymentRequest request){ return request.customerId().isBlank() ? ValidationResult.fail("auth") : ValidationResult.passed(); }
    }
    public static final class AmountValidator implements Validator {
        public ValidationResult validate(PaymentRequest request){ return request.amount() <= 0 ? ValidationResult.fail("amount") : ValidationResult.passed(); }
    }
    public static final class FraudValidator implements Validator {
        public ValidationResult validate(PaymentRequest request){ return request.amount() > 20000 ? ValidationResult.fail("fraud-review") : ValidationResult.passed(); }
    }

    public interface PaymentStrategy { String execute(PaymentRequest request, PaymentGateway gateway); }
    public static final class CardStrategy implements PaymentStrategy {
        public String execute(PaymentRequest request, PaymentGateway gateway){ return gateway.charge("CARD", request.amount()); }
    }
    public static final class UpiStrategy implements PaymentStrategy {
        public String execute(PaymentRequest request, PaymentGateway gateway){ return gateway.charge("UPI", request.amount()); }
    }

    public interface PaymentGateway { String charge(String channel, int amount); }
    public static final class StripeGateway implements PaymentGateway { public String charge(String channel, int amount){ return "stripe-" + channel + "-" + amount; } }
    public static final class AdyenGateway implements PaymentGateway { public String charge(String channel, int amount){ return "adyen-" + channel + "-" + amount; } }
    public static final class LegacyGatewayApi { String send(String flow, int amount){ return "legacy-" + flow + "-" + amount; } }
    public static final class LegacyGatewayAdapter implements PaymentGateway {
        private final LegacyGatewayApi legacy = new LegacyGatewayApi();
        public String charge(String channel, int amount){ return legacy.send(channel, amount); }
    }
    public static final class GatewayFactory {
        public PaymentGateway create(String provider){
            return switch (provider) {
                case "STRIPE" -> new StripeGateway();
                case "ADYEN" -> new AdyenGateway();
                case "LEGACY" -> new LegacyGatewayAdapter();
                default -> throw new IllegalArgumentException("provider");
            };
        }
    }

    public interface Processor { String process(PaymentRequest request); }
    public static final class CoreProcessor implements Processor {
        private final PaymentStrategy strategy; private final PaymentGateway gateway;
        public CoreProcessor(PaymentStrategy strategy, PaymentGateway gateway){ this.strategy = strategy; this.gateway = gateway; }
        public String process(PaymentRequest request){ return strategy.execute(request, gateway); }
    }
    public abstract static class ProcessorDecorator implements Processor {
        protected final Processor delegate; protected final List<String> auditTrail;
        protected ProcessorDecorator(Processor delegate, List<String> auditTrail){ this.delegate = delegate; this.auditTrail = auditTrail; }
    }
    public static final class LoggingDecorator extends ProcessorDecorator {
        public LoggingDecorator(Processor delegate, List<String> auditTrail){ super(delegate, auditTrail); }
        public String process(PaymentRequest request){ auditTrail.add("log"); return delegate.process(request); }
    }
    public static final class MetricsDecorator extends ProcessorDecorator {
        public MetricsDecorator(Processor delegate, List<String> auditTrail){ super(delegate, auditTrail); }
        public String process(PaymentRequest request){ auditTrail.add("metric"); return delegate.process(request); }
    }
    public static final class RetryDecorator extends ProcessorDecorator {
        public RetryDecorator(Processor delegate, List<String> auditTrail){ super(delegate, auditTrail); }
        public String process(PaymentRequest request){ auditTrail.add("retry-policy"); return delegate.process(request); }
    }

    public interface PaymentObserver { void afterPayment(String reference, List<String> auditTrail); }
    public static final class NotificationObserver implements PaymentObserver { public void afterPayment(String reference, List<String> auditTrail){ auditTrail.add("notify:" + reference); } }
    public static final class AuditObserver implements PaymentObserver { public void afterPayment(String reference, List<String> auditTrail){ auditTrail.add("audit:" + reference); } }
    public static final class ReportingObserver implements PaymentObserver { public void afterPayment(String reference, List<String> auditTrail){ auditTrail.add("report:" + reference); } }

    public interface PaymentState { PaymentState next(); String name(); }
    public static final class Created implements PaymentState { public PaymentState next(){ return new Authorized(); } public String name(){ return "CREATED"; } }
    public static final class Authorized implements PaymentState { public PaymentState next(){ return new Captured(); } public String name(){ return "AUTHORIZED"; } }
    public static final class Captured implements PaymentState { public PaymentState next(){ return new Completed(); } public String name(){ return "CAPTURED"; } }
    public static final class Completed implements PaymentState { public PaymentState next(){ return this; } public String name(){ return "COMPLETED"; } }

    public static final class PaymentFacade {
        private final List<Validator> validators = List.of(new AuthenticationValidator(), new AmountValidator(), new FraudValidator());
        private final Map<String, PaymentStrategy> strategies = Map.of("CARD", new CardStrategy(), "UPI", new UpiStrategy());
        private final GatewayFactory gatewayFactory = new GatewayFactory();
        private final List<PaymentObserver> observers = List.of(new NotificationObserver(), new AuditObserver(), new ReportingObserver());
        public PaymentResult process(PaymentRequest request){
            List<String> trail = new ArrayList<>();
            for (Validator validator : validators) {
                ValidationResult result = validator.validate(request);
                trail.add("validate:" + result.reason());
                if (!result.ok()) return new PaymentResult("REJECTED", result.reason(), trail);
            }
            Processor processor = new RetryDecorator(
                    new MetricsDecorator(
                            new LoggingDecorator(
                                    new CoreProcessor(strategies.get(request.method()), gatewayFactory.create(request.provider())), trail), trail), trail);
            PaymentState state = new Created();
            trail.add("state:" + state.name());
            state = state.next(); trail.add("state:" + state.name());
            String reference = processor.process(request);
            state = state.next(); trail.add("state:" + state.name());
            state = state.next(); trail.add("state:" + state.name());
            observers.forEach(o -> o.afterPayment(reference, trail));
            return new PaymentResult("SUCCESS", reference, trail);
        }
    }

    public static String interviewAnswer() {
        return "I use a PaymentFacade as the entry point, run a validation chain, choose the payment strategy by method, create the gateway through a factory, adapt legacy gateways behind a common interface, layer logging/metrics/retry with decorators, move the payment through state transitions, and finally fan out audit, notification, and reporting through observers.";
    }
}
