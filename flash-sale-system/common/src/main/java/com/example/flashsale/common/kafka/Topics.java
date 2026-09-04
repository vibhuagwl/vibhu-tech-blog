package com.example.flashsale.common.kafka;

public final class Topics {
    public static final String ORDER_REQUESTED = "flash-sale.order-requested";
    public static final String INVENTORY_RESERVED = "flash-sale.inventory-reserved";
    public static final String INVENTORY_REJECTED = "flash-sale.inventory-rejected";
    public static final String INVENTORY_RELEASED = "flash-sale.inventory-released";
    public static final String PAYMENT_REQUESTED = "flash-sale.payment-requested";
    public static final String PAYMENT_SUCCEEDED = "flash-sale.payment-succeeded";
    public static final String PAYMENT_FAILED = "flash-sale.payment-failed";
    public static final String ORDER_CONFIRMED = "flash-sale.order-confirmed";
    public static final String ORDER_CANCELLED = "flash-sale.order-cancelled";
    public static final String INVENTORY_RELEASE_REQUESTED = "flash-sale.inventory-release-requested";
    public static final String NOTIFICATION_REQUESTED = "flash-sale.notification-requested";

    private Topics() {
    }

    public static String retry(String topic) {
        return topic + ".retry";
    }

    public static String dlq(String topic) {
        return topic + ".dlq";
    }
}
