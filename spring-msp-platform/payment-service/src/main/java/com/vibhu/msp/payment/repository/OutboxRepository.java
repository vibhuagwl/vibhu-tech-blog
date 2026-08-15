package com.vibhu.msp.payment.repository;

import com.vibhu.msp.payment.entity.OutboxEntity;
import com.vibhu.msp.payment.entity.OutboxEntity.OutboxStatus;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OutboxRepository extends JpaRepository<OutboxEntity, String> {
  List<OutboxEntity> findByStatusOrderByCreatedAtAsc(OutboxStatus status);
}
