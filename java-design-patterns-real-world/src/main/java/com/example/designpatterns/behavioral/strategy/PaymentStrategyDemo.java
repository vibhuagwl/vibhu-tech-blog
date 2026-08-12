package com.example.designpatterns.behavioral.strategy;

import java.util.EnumMap;
import java.util.Map;

public class PaymentStrategyDemo {
    public enum PaymentMethod { UPI, CARD, PAYPAL, BANK_TRANSFER }
    public record PaymentRequest(String customerId, int amount, String currency, boolean recurring) {}
    public record PaymentReceipt(PaymentMethod method, String provider, String message) {}
    public interface PaymentStrategy {
        PaymentReceipt pay(PaymentRequest request);
        boolean supportsRecurring();
    }
    public static final class UpiPaymentStrategy implements PaymentStrategy {
        public PaymentReceipt pay(PaymentRequest request){ return new PaymentReceipt(PaymentMethod.UPI, "Razorpay-UPI", "UPI success for " + request.amount()); }
        public boolean supportsRecurring(){ return false; }
    }
    public static final class CardPaymentStrategy implements PaymentStrategy {
        public PaymentReceipt pay(PaymentRequest request){ return new PaymentReceipt(PaymentMethod.CARD, "Stripe", "CARD success for " + request.amount()); }
        public boolean supportsRecurring(){ return true; }
    }
    public static final class PaypalPaymentStrategy implements PaymentStrategy {
        public PaymentReceipt pay(PaymentRequest request){ return new PaymentReceipt(PaymentMethod.PAYPAL, "PayPal", "PAYPAL success for " + request.amount()); }
        public boolean supportsRecurring(){ return true; }
    }
    public static final class BankTransferStrategy implements PaymentStrategy {
        public PaymentReceipt pay(PaymentRequest request){ return new PaymentReceipt(PaymentMethod.BANK_TRANSFER, "SWIFT", "BANK_TRANSFER success for " + request.amount()); }
        public boolean supportsRecurring(){ return false; }
    }
    public static final class PaymentMethodRouter {
        private final Map<PaymentMethod, PaymentStrategy> strategies = new EnumMap<>(PaymentMethod.class);
        public PaymentMethodRouter() {
            strategies.put(PaymentMethod.UPI, new UpiPaymentStrategy());
            strategies.put(PaymentMethod.CARD, new CardPaymentStrategy());
            strategies.put(PaymentMethod.PAYPAL, new PaypalPaymentStrategy());
            strategies.put(PaymentMethod.BANK_TRANSFER, new BankTransferStrategy());
        }
        public PaymentStrategy resolve(PaymentMethod method) { return strategies.get(method); }
    }
    public static final class PaymentService {
        private final PaymentMethodRouter router = new PaymentMethodRouter();
        public String pay(String type, int amount){
            PaymentReceipt receipt = process(PaymentMethod.valueOf(type), new PaymentRequest("cust-demo", amount, "USD", false));
            return receipt.method() + ":" + amount;
        }
        public PaymentReceipt process(PaymentMethod method, PaymentRequest request) {
            PaymentStrategy strategy = router.resolve(method);
            if (request.recurring() && !strategy.supportsRecurring()) {
                throw new IllegalArgumentException(method + " does not support recurring payments");
            }
            return strategy.pay(request);
        }
    }
}
