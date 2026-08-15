package com.vibhu.msp.inventory.repository;

import com.vibhu.msp.inventory.entity.OutboxEntity;
import com.vibhu.msp.inventory.entity.OutboxEntity.OutboxStatus;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OutboxRepository extends JpaRepository<OutboxEntity, String> {
  List<OutboxEntity> findByStatusOrderByCreatedAtAsc(OutboxStatus status);
}
