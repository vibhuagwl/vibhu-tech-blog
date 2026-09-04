package com.example.designpatterns.creational.factory;

/**
 * PATTERN: Factory Method
 *
 * <p>PROBLEM (without this pattern) - Checkout and refund services hard-code `new StripeGateway()`
 * or `new PaypalGateway()`. - Adding Adyen or switching default provider forces edits across every
 * caller. - Provider-specific construction (API keys, region) leaks into business logic.
 *
 * <p>HOW THIS PATTERN SOLVES IT - PaymentGatewayFactory centralizes the switch on Provider enum. -
 * Callers depend on PaymentGateway interface; factory returns the right concrete type. - New
 * providers are added in one place without touching charge flows.
 *
 * <p>WHEN TO IMPLEMENT - Callers need one of several implementations but must not hard-code
 * concrete classes (if/switch of {@code new}). - Creation logic may grow (credentials, region,
 * feature flags) while the product interface stays stable.
 *
 * <p>JAVA IMPLEMENTATION RULES 1. Define a product interface (or abstract class); factories return
 * that type, never leak concrete classes to callers. 2. Put creation branching in one factory (or
 * factory method); keep payment/business logic out of the factory. 3. Prefer enum/map registries
 * over deep if-else when providers are added often. 4. Fail fast on unknown keys
 * (IllegalArgumentException) — silent null returns hide misconfiguration. 5. Keep factory methods
 * pure of side effects beyond construction (no network I/O inside {@code create()}).
 *
 * <p>DO NOT USE WHEN - There is only one implementation forever, or Spring already selects beans
 * via @Qualifier / profiles.
 */
public class PaymentGatewayFactoryDemo {
    public enum Provider {
        STRIPE, PAYPAL, ADYEN
    }

    public interface PaymentGateway {
        String charge(int amount);
    }

    public static final class StripeGateway implements PaymentGateway {
        public String charge(int amount) {
            return "Stripe charged " + amount;
        }
    }

    public static final class PaypalGateway implements PaymentGateway {
        public String charge(int amount) {
            return "PayPal charged " + amount;
        }
    }

    public static final class AdyenGateway implements PaymentGateway {
        public String charge(int amount) {
            return "Adyen charged " + amount;
        }
    }

    public static final class PaymentGatewayFactory {
        public PaymentGateway create(Provider provider) {
            return switch (provider) {
                case STRIPE -> new StripeGateway();
                case PAYPAL -> new PaypalGateway();
                case ADYEN -> new AdyenGateway();
            };
        }
    }

    public static void run() {
        System.out.println("=== Factory Method — PaymentGatewayFactoryDemo ===");
        System.out.println("PROBLEM: Callers hard-code new StripeGateway() or PaypalGateway(); adding Adyen means" + " editing every checkout and refund path.");
        System.out.println("SOLUTION: PaymentGatewayFactory.create(Provider) returns the right PaymentGateway" + " implementation from one branch so callers never instantiate concrete gateways.");
        System.out.println("STEP 1: Create PaymentGatewayFactory (centralizes provider branching)");
        var factory = new PaymentGatewayFactory();
        System.out.println("STEP 2: Request STRIPE gateway without hard-coding new StripeGateway()");
        var gateway = factory.create(Provider.STRIPE);
        System.out.println("STEP 3: Charge amount through the product interface");
        System.out.println("  Result: " + gateway.charge(100));
    }

    public static void main(String[] args) {
        run();
    }
}
