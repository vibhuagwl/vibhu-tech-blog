package com.vibhu.msp.outbox;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OutboxRepository extends JpaRepository<OutboxEntity, String> {
  List<OutboxEntity> findByStatusOrderByCreatedAtAsc(OutboxEntity.Status status);
}
