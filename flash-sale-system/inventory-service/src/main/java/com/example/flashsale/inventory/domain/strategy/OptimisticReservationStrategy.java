package com.example.flashsale.inventory.domain.strategy;

import com.example.flashsale.inventory.domain.model.Inventory;
import com.example.flashsale.inventory.domain.repository.InventoryRepository;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.stereotype.Component;

/**
 * Approach 1 — {@code @Version}. Safe, but a hot SKU produces version collisions and retry storms.
 * Bounded to 3 attempts. If removed, lost updates silently oversell.
 */
@Component
@ConditionalOnProperty(name = "app.inventory.reservation-strategy", havingValue = "optimistic")
public class OptimisticReservationStrategy implements ReservationStrategy {

    private static final int MAX_ATTEMPTS = 3;
    private final InventoryRepository inventoryRepository;

    public OptimisticReservationStrategy(InventoryRepository inventoryRepository) {
        this.inventoryRepository = inventoryRepository;
    }

    @Override
    public boolean tryReserve(String productId, int qty) {
        for (int attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
            try {
                Inventory inventory = inventoryRepository.findById(productId)
                        .orElseThrow();
                inventory.applyReserve(qty);
                inventoryRepository.saveAndFlush(inventory);
                return true;
            } catch (IllegalStateException insufficient) {
                return false;
            } catch (ObjectOptimisticLockingFailureException collision) {
                if (attempt == MAX_ATTEMPTS) {
                    return false;
                }
            }
        }
        return false;
    }

    @Override
    public String name() {
        return "optimistic";
    }
}
