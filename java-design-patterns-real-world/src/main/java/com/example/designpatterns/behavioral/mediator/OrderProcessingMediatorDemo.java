package com.example.designpatterns.behavioral.mediator;

/**
 * PATTERN: Mediator
 *
 * WHEN TO IMPLEMENT
 * - Many colleagues (payment, inventory, shipping) chatter in a mesh of dependencies.
 * - You want one coordinator so services do not reference each other directly.
 *
 * JAVA IMPLEMENTATION RULES
 * 1. Colleagues talk only to Mediator; Mediator invokes colleagues — no peer-to-peer calls.
 * 2. Keep mediator orchestration-focused; do not dump all domain logic into it (avoid god mediator).
 * 3. Define clear messages/events the mediator understands.
 * 4. Inject colleagues into mediator for tests; avoid static service locators.
 * 5. Distinguish Mediator (coordinate peers) from Facade (simplify subsystem for outsiders).
 *
 * DO NOT USE WHEN
 * - Only two components interact — a direct dependency is enough.
 */
public class OrderProcessingMediatorDemo {
    public interface Mediator { String placeOrder(String orderId); }
    public static final class PaymentService { String authorize(String orderId){ return "payment-ok:" + orderId; } }
    public static final class InventoryService { String reserve(String orderId){ return "inventory-ok:" + orderId; } }
    public static final class NotificationService { String notifyCustomer(String orderId){ return "notified:" + orderId; } }
    public static final class OrderProcessingMediator implements Mediator {
        private final PaymentService payment = new PaymentService();
        private final InventoryService inventory = new InventoryService();
        private final NotificationService notification = new NotificationService();
        public String placeOrder(String orderId){ payment.authorize(orderId); inventory.reserve(orderId); notification.notifyCustomer(orderId); return "order-complete:" + orderId; }
    }
}
