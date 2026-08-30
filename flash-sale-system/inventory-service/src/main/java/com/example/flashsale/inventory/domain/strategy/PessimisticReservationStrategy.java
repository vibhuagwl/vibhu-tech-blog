package com.example.flashsale.inventory.domain.strategy;

import com.example.flashsale.inventory.domain.model.Inventory;
import com.example.flashsale.inventory.domain.repository.InventoryRepository;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/**
 * Approach 2 — {@code SELECT … FOR UPDATE}. Correct, serializes writers on the hot row.
 * Prefer atomic SQL: same correctness, one round-trip, no lock held across Java.
 */
@Component
@ConditionalOnProperty(name = "app.inventory.reservation-strategy", havingValue = "pessimistic")
public class PessimisticReservationStrategy implements ReservationStrategy {

    private final InventoryRepository inventoryRepository;

    public PessimisticReservationStrategy(InventoryRepository inventoryRepository) {
        this.inventoryRepository = inventoryRepository;
    }

    @Override
    public boolean tryReserve(String productId, int qty) {
        Inventory inventory = inventoryRepository.lockByProductId(productId)
                .orElseThrow();
        try {
            inventory.applyReserve(qty);
        } catch (IllegalStateException insufficient) {
            return false;
        }
        inventoryRepository.save(inventory);
        return true;
    }

    @Override
    public String name() {
        return "pessimistic";
    }
}
