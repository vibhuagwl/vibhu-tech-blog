package com.example.flashsale.flash.infrastructure.redis;

public interface InventoryGate {
    /**
     * @return true if the request may proceed to Kafka/outbox
     */
    boolean tryAcquire(String productId, int quantity);

    void release(String productId, int quantity);
}
