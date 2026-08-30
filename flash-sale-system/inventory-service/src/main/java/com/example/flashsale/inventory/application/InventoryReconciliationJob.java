package com.example.flashsale.inventory.application;

import com.example.flashsale.inventory.domain.model.Inventory;
import com.example.flashsale.inventory.domain.repository.InventoryRepository;
import io.micrometer.core.instrument.MeterRegistry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * WHY: Redis, expiry, and compensation can drift. This job is an ops invariant, not a fix-up.
 * If removed, negative stock or orphan reserved units stay silent until the next sale.
 */
@Component
public class InventoryReconciliationJob {

    private static final Logger log = LoggerFactory.getLogger(InventoryReconciliationJob.class);

    private final InventoryRepository inventoryRepository;
    private final MeterRegistry meterRegistry;

    public InventoryReconciliationJob(InventoryRepository inventoryRepository, MeterRegistry meterRegistry) {
        this.inventoryRepository = inventoryRepository;
        this.meterRegistry = meterRegistry;
    }

    @Scheduled(fixedDelayString = "${app.reconciliation-ms:60000}")
    public void reconcile() {
        for (Inventory inventory : inventoryRepository.findAll()) {
            int sum = inventory.getAvailableQuantity() + inventory.getReservedQuantity() + inventory.getSoldQuantity();
            if (sum != inventory.getInitialQuantity() || inventory.getAvailableQuantity() < 0) {
                log.error("inventory_reconciliation_mismatch productId={} available={} reserved={} sold={} initial={}",
                        inventory.getProductId(),
                        inventory.getAvailableQuantity(),
                        inventory.getReservedQuantity(),
                        inventory.getSoldQuantity(),
                        inventory.getInitialQuantity());
                meterRegistry.counter("inventory_reconciliation_mismatch")
                        .increment();
            }
        }
    }
}
