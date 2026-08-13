package com.vibhu.hadron.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(
    name = "processed_events",
    indexes = {@Index(name = "idx_processed_cashline", columnList = "cashlineId")})
public class ProcessedEventEntity {

  @Id
  @Column(name = "event_id", length = 128)
  private String eventId;

  @Column(nullable = false, length = 64)
  private String cashLineId;

  @Column(nullable = false, length = 64)
  private String eventType;

  @Column(nullable = false)
  private int sequenceNumber;

  @Column(nullable = false)
  private Instant processedAt = Instant.now();

  @Column(nullable = false, length = 32)
  private String status = "PROCESSED";

  @Column(nullable = false)
  private int version;

  public String getEventId() {
    return eventId;
  }

  public void setEventId(String eventId) {
    this.eventId = eventId;
  }

  public String getCashLineId() {
    return cashLineId;
  }

  public void setCashLineId(String cashLineId) {
    this.cashLineId = cashLineId;
  }

  public String getEventType() {
    return eventType;
  }

  public void setEventType(String eventType) {
    this.eventType = eventType;
  }

  public int getSequenceNumber() {
    return sequenceNumber;
  }

  public void setSequenceNumber(int sequenceNumber) {
    this.sequenceNumber = sequenceNumber;
  }

  public Instant getProcessedAt() {
    return processedAt;
  }

  public void setProcessedAt(Instant processedAt) {
    this.processedAt = processedAt;
  }

  public String getStatus() {
    return status;
  }

  public void setStatus(String status) {
    this.status = status;
  }

  public int getVersion() {
    return version;
  }

  public void setVersion(int version) {
    this.version = version;
  }
}
