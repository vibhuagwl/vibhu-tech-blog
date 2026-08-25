package com.vibhu.fai.outbox;

import java.time.Instant;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * ============================================================
 * INTERVIEW NOTES — Transactional Outbox
 * ============================================================
 * Payment SUCCESS must not roll back because Notification is down.
 * Write payment + outbox row in ONE DB transaction.
 * Relay publishes to Kafka asynchronously.
 * Memory: payment = business txn; notification = side effect.
 * ============================================================
 */
@Service
public class OutboxService {
  private final OutboxRepository repo;

  public OutboxService(OutboxRepository repo) {
    this.repo = repo;
  }

  @Transactional
  public OutboxEvent enqueue(String aggregateType, String aggregateId, String eventType, String payload) {
    OutboxEvent e = new OutboxEvent();
    e.setAggregateType(aggregateType);
    e.setAggregateId(aggregateId);
    e.setEventType(eventType);
    e.setPayload(payload);
    e.setPublished(false);
    e.setCreatedAt(Instant.now());
    return repo.save(e);
  }
}
