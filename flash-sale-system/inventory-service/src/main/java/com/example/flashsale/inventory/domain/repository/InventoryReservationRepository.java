package com.example.flashsale.inventory.domain.repository;

import com.example.flashsale.inventory.domain.model.InventoryReservation;
import com.example.flashsale.inventory.domain.model.ReservationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface InventoryReservationRepository extends JpaRepository<InventoryReservation, String> {
    Optional<InventoryReservation> findByOrderId(String orderId);

    @Query(
            """
                    SELECT r FROM InventoryReservation r
                     WHERE r.status = :status AND r.expiresAt < :now
                    """)
    List<InventoryReservation> findExpired(
            @Param("status") ReservationStatus status, @Param("now") Instant now);
}
