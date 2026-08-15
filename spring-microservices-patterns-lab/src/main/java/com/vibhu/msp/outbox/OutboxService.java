package com.vibhu.msp.outbox;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.function.Consumer;

@Service
public class OutboxService {

  private final OutboxRepository repository;

  public OutboxService(OutboxRepository repository) {
    this.repository = repository;
  }

  @Transactional
  public OutboxEntity saveInSameTransaction(String id, String aggregateType, String aggregateId,
                                            String eventType, String payload,
                                            Runnable businessWrite) {
    businessWrite.run();
    OutboxEntity entity = new OutboxEntity(id, aggregateType, aggregateId, eventType, payload);
    return repository.save(entity);
  }

  public List<OutboxEntity> findPending() {
    return repository.findByStatusOrderByCreatedAtAsc(OutboxEntity.Status.PENDING);
  }

  @Transactional
  public void markPublished(String id) {
    repository.findById(id).ifPresent(entity -> {
      entity.markPublished();
      repository.save(entity);
    });
  }
}
