package com.example.flashsale.inventory.application;

import com.example.flashsale.inventory.domain.model.ReservationStatus;
import com.example.flashsale.inventory.domain.repository.InventoryReservationRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Component
public class ReservationExpiryJob {

    private final InventoryReservationRepository reservations;
    private final ReserveInventoryService reserveInventoryService;

    public ReservationExpiryJob(InventoryReservationRepository reservations,
            ReserveInventoryService reserveInventoryService) {
        this.reservations = reservations;
        this.reserveInventoryService = reserveInventoryService;
    }

    /**
     * WHY: payment never came back. Idempotent — already RELEASED/EXPIRED is a no-op.
     */
    @Scheduled(fixedDelayString = "${app.reservation-expiry-ms:15000}")
    @Transactional
    public void expire() {
        reservations.findExpired(ReservationStatus.RESERVED, Instant.now())
                .forEach(r -> reserveInventoryService.expire(r.getOrderId(), "expiry-" + r.getReservationId()));
    }
}
