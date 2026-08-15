package com.vibhu.msp.payment.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vibhu.msp.payment.entity.OutboxEntity;
import com.vibhu.msp.payment.entity.OutboxEntity.OutboxStatus;
import com.vibhu.msp.payment.repository.OutboxRepository;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OutboxService {
  private final OutboxRepository outboxRepository;
  private final ObjectMapper objectMapper;

  public OutboxService(OutboxRepository outboxRepository, ObjectMapper objectMapper) {
    this.outboxRepository = outboxRepository;
    this.objectMapper = objectMapper;
  }

  @Transactional
  public OutboxEntity enqueue(
      String aggregateType, String aggregateId, String eventType, Object payload) {
    try {
      OutboxEntity entity = new OutboxEntity();
      entity.setId(UUID.randomUUID().toString());
      entity.setAggregateType(aggregateType);
      entity.setAggregateId(aggregateId);
      entity.setEventType(eventType);
      entity.setPayload(objectMapper.writeValueAsString(payload));
      entity.setStatus(OutboxStatus.PENDING);
      entity.setCreatedAt(Instant.now());
      return outboxRepository.save(entity);
    } catch (Exception ex) {
      throw new IllegalStateException("Failed to serialize outbox payload", ex);
    }
  }

  public List<OutboxEntity> findPending() {
    return outboxRepository.findByStatusOrderByCreatedAtAsc(OutboxStatus.PENDING);
  }

  @Transactional
  public void markPublished(String id) {
    outboxRepository
        .findById(id)
        .ifPresent(
            entity -> {
              entity.setStatus(OutboxStatus.PUBLISHED);
              entity.setPublishedAt(Instant.now());
              outboxRepository.save(entity);
            });
  }
}
