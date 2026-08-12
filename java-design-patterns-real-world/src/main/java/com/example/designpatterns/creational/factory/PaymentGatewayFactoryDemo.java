package com.example.designpatterns.creational.factory;

public class PaymentGatewayFactoryDemo {
    public enum Provider { STRIPE, PAYPAL, ADYEN }
    public interface PaymentGateway { String charge(int amount); }
    public static final class StripeGateway implements PaymentGateway { public String charge(int amount) { return "Stripe charged " + amount; } }
    public static final class PaypalGateway implements PaymentGateway { public String charge(int amount) { return "PayPal charged " + amount; } }
    public static final class AdyenGateway implements PaymentGateway { public String charge(int amount) { return "Adyen charged " + amount; } }
    public static final class PaymentGatewayFactory {
        public PaymentGateway create(Provider provider) {
            return switch (provider) {
                case STRIPE -> new StripeGateway();
                case PAYPAL -> new PaypalGateway();
                case ADYEN -> new AdyenGateway();
            };
        }
    }
}
