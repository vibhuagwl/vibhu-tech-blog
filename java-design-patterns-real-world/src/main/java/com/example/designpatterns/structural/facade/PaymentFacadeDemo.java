package com.example.designpatterns.structural.facade;

import java.util.ArrayList;
import java.util.List;

/**
 * PATTERN: Facade
 *
 * WHEN TO IMPLEMENT
 * - Clients need a simple entry point over a noisy subsystem (fraud, ledger, gateway, notify).
 * - You want to hide orchestration details from controllers / use-cases.
 *
 * JAVA IMPLEMENTATION RULES
 * 1. Facade exposes a small, intention-revealing API; internally coordinates subsystem types.
 * 2. Do not put all business rules inside the facade — orchestrate; keep domain logic in collaborators.
 * 3. Prefer constructor injection of dependencies for testing.
 * 4. Map subsystem failures to one coherent application-level error model.
 * 5. Facades may be stateful for a use-case session, but avoid becoming a singleton god service.
 *
 * DO NOT USE WHEN
 * - There is only one class behind the call — no subsystem complexity to hide.
 */
public class PaymentFacadeDemo {
    public record PaymentOutcome(String status, String reference, List<String> steps) {}
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
        public String processPayment(String accountId, int amount) { return processDetailed(accountId, amount).status(); }
        public PaymentOutcome processDetailed(String accountId, int amount) {
            List<String> steps = new ArrayList<>();
            steps.add("fraud-check");
            if (!fraud.ok(amount)) return new PaymentOutcome("rejected:fraud", "", steps);
            steps.add("account-check");
            if (!account.hasBalance(accountId)) return new PaymentOutcome("rejected:account", "", steps);
            steps.add("charge");
            String reference = payment.charge(accountId, amount);
            steps.add(notification.notifyCustomer(accountId));
            steps.add(audit.audit(accountId));
            return new PaymentOutcome("success", reference, steps);
        }
    }
}
