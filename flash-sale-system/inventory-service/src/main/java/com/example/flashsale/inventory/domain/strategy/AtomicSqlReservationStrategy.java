package com.example.flashsale.inventory.domain.strategy;

import com.example.flashsale.inventory.domain.repository.InventoryRepository;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "app.inventory.reservation-strategy", havingValue = "atomic", matchIfMissing = true)
public class AtomicSqlReservationStrategy implements ReservationStrategy {

    private final InventoryRepository inventoryRepository;

    public AtomicSqlReservationStrategy(InventoryRepository inventoryRepository) {
        this.inventoryRepository = inventoryRepository;
    }

    @Override
    public boolean tryReserve(String productId, int qty) {
        return inventoryRepository.decrementIfAvailable(productId, qty) == 1;
    }

    @Override
    public String name() {
        return "atomic";
    }
}
