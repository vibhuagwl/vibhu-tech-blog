package com.example.designpatterns.structural.facade;

public class PaymentFacadeDemo {
    public static final class FraudService { boolean ok(int amount){ return amount < 5000; } }
    public static final class AccountService { boolean hasBalance(String account){ return !account.isBlank(); } }
    public static final class PaymentService { String charge(String account, int amount){ return "charged:" + account + ":" + amount; } }
    public static final class NotificationService { String notifyCustomer(String account){ return "notified:" + account; } }
    public static final class AuditService { String audit(String account){ return "audit:" + account; } }
    public static final class PaymentFacade {
        private final FraudService fraud = new FraudService();
        private final AccountService account = new AccountService();
        private final PaymentService payment = new PaymentService();
        private final NotificationService notification = new NotificationService();
        private final AuditService audit = new AuditService();
        public String processPayment(String accountId, int amount) {
            if (!fraud.ok(amount)) return "rejected:fraud";
            if (!account.hasBalance(accountId)) return "rejected:account";
            payment.charge(accountId, amount);
            notification.notifyCustomer(accountId);
            audit.audit(accountId);
            return "success";
        }
    }
}
