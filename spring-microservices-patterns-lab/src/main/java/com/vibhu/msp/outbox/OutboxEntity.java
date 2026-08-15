package com.vibhu.msp.outbox;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "outbox_events")
public class OutboxEntity {

  public enum Status {
    PENDING,
    PUBLISHED,
    FAILED
  }

  @Id private String id;

  @Column(nullable = false)
  private String aggregateType;

  @Column(nullable = false)
  private String aggregateId;

  @Column(nullable = false)
  private String eventType;

  @Column(nullable = false, length = 4000)
  private String payload;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private Status status = Status.PENDING;

  @Column(nullable = false)
  private Instant createdAt = Instant.now();

  protected OutboxEntity() {}

  public OutboxEntity(
      String id, String aggregateType, String aggregateId, String eventType, String payload) {
    this.id = id;
    this.aggregateType = aggregateType;
    this.aggregateId = aggregateId;
    this.eventType = eventType;
    this.payload = payload;
  }

  public String getId() {
    return id;
  }

  public String getAggregateType() {
    return aggregateType;
  }

  public String getAggregateId() {
    return aggregateId;
  }

  public String getEventType() {
    return eventType;
  }

  public String getPayload() {
    return payload;
  }

  public Status getStatus() {
    return status;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public void markPublished() {
    this.status = Status.PUBLISHED;
  }

  public void markFailed() {
    this.status = Status.FAILED;
  }
}
