package com.example.flashsale.inventory.domain.strategy;

/**
 * Three interview approaches. Production default is {@code atomic}: one SQL predicate, no lock
 * lease, no version retry storm on the hot SKU.
 */
public interface ReservationStrategy {

    /**
     * @return true if this caller now owns {@code qty} units
     */
    boolean tryReserve(String productId, int qty);

    String name();
}
