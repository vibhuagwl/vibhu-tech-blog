package com.vibhu.msp.payment.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "outbox")
public class OutboxEntity {
  @Id private String id;
  @Column(name = "aggregate_type") private String aggregateType;
  @Column(name = "aggregate_id") private String aggregateId;
  @Column(name = "event_type") private String eventType;
  @Column private String payload;
  @Enumerated(EnumType.STRING) private OutboxStatus status;
  @Column(name = "created_at") private Instant createdAt;
  @Column(name = "published_at") private Instant publishedAt;

  public enum OutboxStatus { PENDING, PUBLISHED, FAILED }

  public String getId() { return id; }
  public void setId(String id) { this.id = id; }
  public String getAggregateType() { return aggregateType; }
  public void setAggregateType(String aggregateType) { this.aggregateType = aggregateType; }
  public String getAggregateId() { return aggregateId; }
  public void setAggregateId(String aggregateId) { this.aggregateId = aggregateId; }
  public String getEventType() { return eventType; }
  public void setEventType(String eventType) { this.eventType = eventType; }
  public String getPayload() { return payload; }
  public void setPayload(String payload) { this.payload = payload; }
  public OutboxStatus getStatus() { return status; }
  public void setStatus(OutboxStatus status) { this.status = status; }
  public Instant getCreatedAt() { return createdAt; }
  public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
  public Instant getPublishedAt() { return publishedAt; }
  public void setPublishedAt(Instant publishedAt) { this.publishedAt = publishedAt; }
}
