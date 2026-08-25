package com.vibhu.fai.outbox;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "outbox_events")
public class OutboxEvent {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;
  private String aggregateType;
  private String aggregateId;
  private String eventType;
  private String payload;
  private boolean published;
  private Instant createdAt;

  public Long getId() { return id; }
  public String getAggregateType() { return aggregateType; }
  public void setAggregateType(String aggregateType) { this.aggregateType = aggregateType; }
  public String getAggregateId() { return aggregateId; }
  public void setAggregateId(String aggregateId) { this.aggregateId = aggregateId; }
  public String getEventType() { return eventType; }
  public void setEventType(String eventType) { this.eventType = eventType; }
  public String getPayload() { return payload; }
  public void setPayload(String payload) { this.payload = payload; }
  public boolean isPublished() { return published; }
  public void setPublished(boolean published) { this.published = published; }
  public Instant getCreatedAt() { return createdAt; }
  public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
