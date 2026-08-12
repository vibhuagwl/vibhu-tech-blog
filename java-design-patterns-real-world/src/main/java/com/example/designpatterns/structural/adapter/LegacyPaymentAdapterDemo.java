package com.example.designpatterns.structural.adapter;

public class LegacyPaymentAdapterDemo {
    public interface ModernPaymentService { String pay(String customerId, int amount); }
    public static final class LegacyPaymentApi { String submitLegacy(String account, int cents) { return "legacy:" + account + ":" + cents; } }
    public static final class PaymentAdapter implements ModernPaymentService {
        private final LegacyPaymentApi legacy;
        public PaymentAdapter(LegacyPaymentApi legacy) { this.legacy = legacy; }
        public String pay(String customerId, int amount) { return legacy.submitLegacy(customerId, amount * 100); }
    }
}
