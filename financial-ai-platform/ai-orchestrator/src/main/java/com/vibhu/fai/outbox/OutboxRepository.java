package com.vibhu.fai.outbox;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OutboxRepository extends JpaRepository<OutboxEvent, Long> {
  List<OutboxEvent> findByPublishedFalseOrderByIdAsc();
}
