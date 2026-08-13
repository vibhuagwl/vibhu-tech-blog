package com.vibhu.hadron.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(
    name = "waiting_events",
    indexes = {@Index(name = "idx_waiting_cashline_seq", columnList = "cashLineId,sequenceNumber")})
public class WaitingEventEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, unique = true, length = 128)
  private String eventId;

  @Column(nullable = false, length = 64)
  private String cashLineId;

  @Column(nullable = false)
  private int sequenceNumber;

  @Column(nullable = false, length = 64)
  private String eventType;

  @Column(nullable = false, columnDefinition = "TEXT")
  private String payload;

  @Column(nullable = false)
  private int expectedSequence;

  @Column(nullable = false)
  private Instant createdAt = Instant.now();

  public Long getId() {
    return id;
  }

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

  public int getSequenceNumber() {
    return sequenceNumber;
  }

  public void setSequenceNumber(int sequenceNumber) {
    this.sequenceNumber = sequenceNumber;
  }

  public String getEventType() {
    return eventType;
  }

  public void setEventType(String eventType) {
    this.eventType = eventType;
  }

  public String getPayload() {
    return payload;
  }

  public void setPayload(String payload) {
    this.payload = payload;
  }

  public int getExpectedSequence() {
    return expectedSequence;
  }

  public void setExpectedSequence(int expectedSequence) {
    this.expectedSequence = expectedSequence;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }
}
