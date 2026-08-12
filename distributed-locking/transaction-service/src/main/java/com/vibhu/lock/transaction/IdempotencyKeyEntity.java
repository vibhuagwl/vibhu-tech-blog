package com.vibhu.lock.transaction;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "idempotency_keys")
public class IdempotencyKeyEntity {
  @Id
  @Column(name = "idempotency_key", nullable = false, length = 128)
  private String idempotencyKey;

  @Column(name = "transaction_id", nullable = false, length = 36)
  private String transactionId;

  @Lob
  @Column(name = "response_json", nullable = false)
  private String responseJson;

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt;

  protected IdempotencyKeyEntity() {
  }

  public IdempotencyKeyEntity(String idempotencyKey, String transactionId, String responseJson) {
    this.idempotencyKey = idempotencyKey;
    this.transactionId = transactionId;
    this.responseJson = responseJson;
  }

  @PrePersist
  void prePersist() {
    createdAt = Instant.now();
  }

  public String getResponseJson() {
    return responseJson;
  }
}
