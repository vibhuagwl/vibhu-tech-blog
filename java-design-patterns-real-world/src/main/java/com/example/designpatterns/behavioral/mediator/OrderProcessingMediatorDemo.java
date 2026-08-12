package com.example.designpatterns.behavioral.mediator;

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
