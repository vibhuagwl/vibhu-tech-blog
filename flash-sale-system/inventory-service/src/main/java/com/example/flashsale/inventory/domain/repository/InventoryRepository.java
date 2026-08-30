package com.example.flashsale.inventory.domain.repository;

import com.example.flashsale.inventory.domain.model.Inventory;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface InventoryRepository extends JpaRepository<Inventory, String> {

    /**
     * WHY native CAS: one statement, no Java read-modify-write window. rows==1 means we own the units.
     * If removed and replaced with get+set, two threads both sell the last item.
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(
            value =
                    """
                            UPDATE inventory
                               SET available_quantity = available_quantity - :qty,
                                   reserved_quantity = reserved_quantity + :qty,
                                   updated_at = CURRENT_TIMESTAMP
                             WHERE product_id = :productId
                               AND available_quantity >= :qty
                            """,
            nativeQuery = true)
    int decrementIfAvailable(@Param("productId") String productId, @Param("qty") int qty);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(
            value =
                    """
                            UPDATE inventory
                               SET available_quantity = available_quantity + :qty,
                                   reserved_quantity = reserved_quantity - :qty,
                                   updated_at = CURRENT_TIMESTAMP
                             WHERE product_id = :productId
                               AND reserved_quantity >= :qty
                            """,
            nativeQuery = true)
    int incrementOnRelease(@Param("productId") String productId, @Param("qty") int qty);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(
            value =
                    """
                            UPDATE inventory
                               SET reserved_quantity = reserved_quantity - :qty,
                                   sold_quantity = sold_quantity + :qty,
                                   updated_at = CURRENT_TIMESTAMP
                             WHERE product_id = :productId
                               AND reserved_quantity >= :qty
                            """,
            nativeQuery = true)
    int confirmSold(@Param("productId") String productId, @Param("qty") int qty);

    /**
     * Approach 2 — serializes writers. Do not call Kafka inside this lock.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT i FROM Inventory i WHERE i.productId = :productId")
    Optional<Inventory> lockByProductId(@Param("productId") String productId);
}
