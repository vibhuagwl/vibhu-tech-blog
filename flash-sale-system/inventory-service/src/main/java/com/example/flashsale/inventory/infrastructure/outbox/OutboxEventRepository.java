package com.example.flashsale.inventory.infrastructure.outbox;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface OutboxEventRepository extends JpaRepository<OutboxEvent, Long> {

    /**
     * WHY SKIP LOCKED: multiple publisher replicas without a leader.
     * If removed, two pods publish the same NEW row.
     */
    @Query(
            value =
                    """
                            SELECT * FROM outbox_events
                             WHERE status = 'NEW'
                             ORDER BY created_at
                             LIMIT :batch
                             FOR UPDATE SKIP LOCKED
                            """,
            nativeQuery = true)
    List<OutboxEvent> lockNextBatch(@Param("batch") int batch);
}
