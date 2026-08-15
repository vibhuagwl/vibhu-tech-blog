package com.vibhu.whatsapp.messageservice.model;

import java.time.Instant;

/*
 * In a database-backed service this record would be inserted in the same
 * transaction as MessageRecord, then drained asynchronously to Kafka. This demo
 * stores it in memory and publishes immediately after persistence so the HLD's
 * outbox boundary is visible without requiring a database.
 */
public record OutboxRecord(
    String outboxId,
    String aggregateId,
    String eventType,
    Object payload,
    Instant createdAt,
    boolean published) {
  public OutboxRecord markPublished() {
    return new OutboxRecord(outboxId, aggregateId, eventType, payload, createdAt, true);
  }
}
