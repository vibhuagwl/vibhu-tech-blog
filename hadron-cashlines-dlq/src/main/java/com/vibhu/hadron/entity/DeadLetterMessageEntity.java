package com.vibhu.hadron.entity;

import com.vibhu.hadron.domain.DlqStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.persistence.Version;
import java.time.Instant;

@Entity
@Table(
    name = "dead_letter_messages",
    uniqueConstraints = {
      @UniqueConstraint(name = "uk_dlq_event", columnNames = "event_id"),
      @UniqueConstraint(
          name = "uk_dlq_tpo",
          columnNames = {"topic", "partition_no", "offset_no"})
    },
    indexes = {
      @Index(name = "idx_dlq_cashline", columnList = "cashlineId"),
      @Index(name = "idx_dlq_message_id", columnList = "messageId"),
      @Index(name = "idx_dlq_status", columnList = "status"),
      @Index(name = "idx_dlq_created_at", columnList = "createdAt")
    })
public class DeadLetterMessageEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, length = 128)
  private String messageId;

  @Column(name = "event_id", nullable = false, length = 128)
  private String eventId;

  @Column(nullable = false, length = 64)
  private String cashLineId;

  @Column(length = 64)
  private String eventType;

  @Column(nullable = false, length = 128)
  private String topic;

  @Column(name = "partition_no", nullable = false)
  private int partitionNo;

  @Column(name = "offset_no", nullable = false)
  private long offsetNo;

  @Column(length = 128)
  private String messageKey;

  @Column(nullable = false, columnDefinition = "TEXT")
  private String payload;

  @Column(columnDefinition = "TEXT")
  private String headers;

  @Column(nullable = false, length = 256)
  private String exceptionType;

  @Column(length = 2000)
  private String exceptionMessage;

  @Column(nullable = false, length = 64)
  private String failureReason;

  @Column(nullable = false)
  private int retryCount;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 32)
  private DlqStatus status = DlqStatus.FAILED;

  @Column(nullable = false)
  private Instant firstFailedAt = Instant.now();

  @Column(nullable = false)
  private Instant lastFailedAt = Instant.now();

  private Instant resolvedAt;
  private Instant replayedAt;

  @Column(nullable = false)
  private int replayCount;

  @Column(length = 128)
  private String replayActor;

  @Column(length = 128)
  private String correlationId;

  @Version private int version;

  @Column(nullable = false)
  private Instant createdAt = Instant.now();

  @Column(nullable = false)
  private Instant updatedAt = Instant.now();

  public Long getId() {
    return id;
  }

  public String getMessageId() {
    return messageId;
  }

  public void setMessageId(String messageId) {
    this.messageId = messageId;
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

  public String getEventType() {
    return eventType;
  }

  public void setEventType(String eventType) {
    this.eventType = eventType;
  }

  public String getTopic() {
    return topic;
  }

  public void setTopic(String topic) {
    this.topic = topic;
  }

  public int getPartitionNo() {
    return partitionNo;
  }

  public void setPartitionNo(int partitionNo) {
    this.partitionNo = partitionNo;
  }

  public long getOffsetNo() {
    return offsetNo;
  }

  public void setOffsetNo(long offsetNo) {
    this.offsetNo = offsetNo;
  }

  public String getMessageKey() {
    return messageKey;
  }

  public void setMessageKey(String messageKey) {
    this.messageKey = messageKey;
  }

  public String getPayload() {
    return payload;
  }

  public void setPayload(String payload) {
    this.payload = payload;
  }

  public String getHeaders() {
    return headers;
  }

  public void setHeaders(String headers) {
    this.headers = headers;
  }

  public String getExceptionType() {
    return exceptionType;
  }

  public void setExceptionType(String exceptionType) {
    this.exceptionType = exceptionType;
  }

  public String getExceptionMessage() {
    return exceptionMessage;
  }

  public void setExceptionMessage(String exceptionMessage) {
    this.exceptionMessage = exceptionMessage;
  }

  public String getFailureReason() {
    return failureReason;
  }

  public void setFailureReason(String failureReason) {
    this.failureReason = failureReason;
  }

  public int getRetryCount() {
    return retryCount;
  }

  public void setRetryCount(int retryCount) {
    this.retryCount = retryCount;
  }

  public DlqStatus getStatus() {
    return status;
  }

  public void setStatus(DlqStatus status) {
    this.status = status;
  }

  public Instant getFirstFailedAt() {
    return firstFailedAt;
  }

  public void setFirstFailedAt(Instant firstFailedAt) {
    this.firstFailedAt = firstFailedAt;
  }

  public Instant getLastFailedAt() {
    return lastFailedAt;
  }

  public void setLastFailedAt(Instant lastFailedAt) {
    this.lastFailedAt = lastFailedAt;
  }

  public Instant getResolvedAt() {
    return resolvedAt;
  }

  public void setResolvedAt(Instant resolvedAt) {
    this.resolvedAt = resolvedAt;
  }

  public Instant getReplayedAt() {
    return replayedAt;
  }

  public void setReplayedAt(Instant replayedAt) {
    this.replayedAt = replayedAt;
  }

  public int getReplayCount() {
    return replayCount;
  }

  public void setReplayCount(int replayCount) {
    this.replayCount = replayCount;
  }

  public String getReplayActor() {
    return replayActor;
  }

  public void setReplayActor(String replayActor) {
    this.replayActor = replayActor;
  }

  public String getCorrelationId() {
    return correlationId;
  }

  public void setCorrelationId(String correlationId) {
    this.correlationId = correlationId;
  }

  public int getVersion() {
    return version;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(Instant createdAt) {
    this.createdAt = createdAt;
  }

  public Instant getUpdatedAt() {
    return updatedAt;
  }

  public void setUpdatedAt(Instant updatedAt) {
    this.updatedAt = updatedAt;
  }
}
