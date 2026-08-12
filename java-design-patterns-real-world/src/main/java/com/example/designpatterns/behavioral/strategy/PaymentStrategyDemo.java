package com.example.designpatterns.behavioral.strategy;

import java.util.Map;

public class PaymentStrategyDemo {
    public interface PaymentStrategy { String pay(int amount); }
    public static final class UpiPaymentStrategy implements PaymentStrategy { public String pay(int amount){ return "UPI:" + amount; } }
    public static final class CardPaymentStrategy implements PaymentStrategy { public String pay(int amount){ return "CARD:" + amount; } }
    public static final class PaypalPaymentStrategy implements PaymentStrategy { public String pay(int amount){ return "PAYPAL:" + amount; } }
    public static final class BankTransferStrategy implements PaymentStrategy { public String pay(int amount){ return "BANK_TRANSFER:" + amount; } }
    public static final class PaymentService {
        private final Map<String, PaymentStrategy> strategies = Map.of(
                "UPI", new UpiPaymentStrategy(),
                "CARD", new CardPaymentStrategy(),
                "PAYPAL", new PaypalPaymentStrategy(),
                "BANK_TRANSFER", new BankTransferStrategy());
        public String pay(String type, int amount){ return strategies.get(type).pay(amount); }
    }
}
