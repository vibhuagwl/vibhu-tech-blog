package com.example.flashsale.inventory.domain.repository;

import com.example.flashsale.inventory.domain.model.InventoryReservation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface InventoryReservationRepository extends JpaRepository<InventoryReservation, String> {
    Optional<InventoryReservation> findByOrderId(String orderId);

    /**
     * WHY CAS: expire, confirm, and compensate must not all observe RESERVED and all mutate inventory.
     * One UPDATE wins; losers no-op.
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(
            value =
                    """
                            UPDATE inventory_reservations
                               SET status = :toStatus, updated_at = CURRENT_TIMESTAMP
                             WHERE order_id = :orderId AND status = :fromStatus
                            """,
            nativeQuery = true)
    int casStatus(
            @Param("orderId") String orderId,
            @Param("fromStatus") String fromStatus,
            @Param("toStatus") String toStatus);

    /**
     * WHY SKIP LOCKED: many inventory pods expire without blocking each other on the same row.
     */
    @Query(
            value =
                    """
                            SELECT * FROM inventory_reservations
                             WHERE status = 'RESERVED' AND expires_at < CURRENT_TIMESTAMP
                             ORDER BY expires_at
                             LIMIT :batch
                             FOR UPDATE SKIP LOCKED
                            """,
            nativeQuery = true)
    List<InventoryReservation> lockExpiredBatch(@Param("batch") int batch);
}
