package com.example.flashsale.inventory.application;

import com.example.flashsale.inventory.domain.model.InventoryReservation;
import com.example.flashsale.inventory.domain.repository.InventoryReservationRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Backstop of chapter 2. If payment never writes an ending, the unit walks back to the shelf.
 * {@code SKIP LOCKED} lets many pods expire without fighting. CAS inside expire() loses to confirm.
 */
@Component
public class ReservationExpiryJob {

    private final InventoryReservationRepository reservations;
    private final ReserveInventoryService reserveInventoryService;

    public ReservationExpiryJob(
            InventoryReservationRepository reservations, ReserveInventoryService reserveInventoryService) {
        this.reservations = reservations;
        this.reserveInventoryService = reserveInventoryService;
    }

    @Scheduled(fixedDelayString = "${app.reservation-expiry-ms:15000}")
    @Transactional
    public void expire() {
        List<InventoryReservation> batch = reservations.lockExpiredBatch(100);
        for (InventoryReservation r : batch) {
            reserveInventoryService.expire(r.getOrderId(), "expiry-" + r.getReservationId());
        }
    }
}
