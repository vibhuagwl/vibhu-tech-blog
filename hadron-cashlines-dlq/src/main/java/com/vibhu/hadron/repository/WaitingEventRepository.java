package com.vibhu.hadron.repository;

import com.vibhu.hadron.entity.WaitingEventEntity;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WaitingEventRepository extends JpaRepository<WaitingEventEntity, Long> {

  Optional<WaitingEventEntity> findByEventId(String eventId);

  List<WaitingEventEntity> findByCashLineIdAndSequenceNumber(String cashLineId, int sequenceNumber);

  List<WaitingEventEntity> findByCashLineIdOrderBySequenceNumberAsc(String cashLineId);
}
