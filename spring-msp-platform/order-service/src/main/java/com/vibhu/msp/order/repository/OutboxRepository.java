package com.vibhu.msp.order.repository;

import com.vibhu.msp.order.entity.OutboxEntity;
import com.vibhu.msp.order.entity.OutboxEntity.OutboxStatus;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OutboxRepository extends JpaRepository<OutboxEntity, String> {
  List<OutboxEntity> findByStatusOrderByCreatedAtAsc(OutboxStatus status);
}
