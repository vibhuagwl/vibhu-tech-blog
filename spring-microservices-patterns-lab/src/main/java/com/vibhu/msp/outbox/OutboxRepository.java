package com.vibhu.msp.outbox;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OutboxRepository extends JpaRepository<OutboxEntity, String> {
  List<OutboxEntity> findByStatusOrderByCreatedAtAsc(OutboxEntity.Status status);
}
