package com.vibhu.lock.transaction;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "transaction_events")
public class TransactionEventEntity {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "transaction_id", nullable = false, length = 36)
  private String transactionId;

  @Column(name = "type", nullable = false, length = 64)
  private String type;

  @Lob
  @Column(name = "payload", nullable = false)
  private String payload;

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt;

  protected TransactionEventEntity() {}

  public TransactionEventEntity(String transactionId, String type, String payload) {
    this.transactionId = transactionId;
    this.type = type;
    this.payload = payload;
  }

  @PrePersist
  void prePersist() {
    createdAt = Instant.now();
  }
}
