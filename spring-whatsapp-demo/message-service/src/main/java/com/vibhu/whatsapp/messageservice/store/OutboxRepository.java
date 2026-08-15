package com.vibhu.whatsapp.messageservice.store;

import com.vibhu.whatsapp.messageservice.model.OutboxRecord;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import org.springframework.stereotype.Repository;

@Repository
public class OutboxRepository {
  private final ConcurrentMap<String, OutboxRecord> outboxById = new ConcurrentHashMap<>();

  public OutboxRecord save(OutboxRecord outboxRecord) {
    outboxById.put(outboxRecord.outboxId(), outboxRecord);
    return outboxRecord;
  }

  public Optional<OutboxRecord> findById(String outboxId) {
    return Optional.ofNullable(outboxById.get(outboxId));
  }

  public void markPublished(String outboxId) {
    outboxById.computeIfPresent(outboxId, (ignored, record) -> record.markPublished());
  }
}
