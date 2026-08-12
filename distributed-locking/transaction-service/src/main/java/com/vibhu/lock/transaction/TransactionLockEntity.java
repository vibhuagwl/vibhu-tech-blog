package com.vibhu.lock.transaction;

import com.vibhu.lock.common.LockMode;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "transaction_locks")
public class TransactionLockEntity {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "transaction_id", nullable = false, length = 36)
  private String transactionId;

  @Column(name = "lock_key", nullable = false, length = 128)
  private String lockKey;

  @Enumerated(EnumType.STRING)
  @Column(name = "mode", nullable = false, length = 16)
  private LockMode mode;

  @Column(name = "owner_token", nullable = false, length = 128)
  private String ownerToken;

  @Column(name = "fencing_token", nullable = false)
  private long fencingToken;

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt;

  protected TransactionLockEntity() {
  }

  public TransactionLockEntity(
      String transactionId,
      String lockKey,
      LockMode mode,
      String ownerToken,
      long fencingToken
  ) {
    this.transactionId = transactionId;
    this.lockKey = lockKey;
    this.mode = mode;
    this.ownerToken = ownerToken;
    this.fencingToken = fencingToken;
  }

  @PrePersist
  void prePersist() {
    createdAt = Instant.now();
  }

  public String getTransactionId() {
    return transactionId;
  }

  public String getLockKey() {
    return lockKey;
  }

  public LockMode getMode() {
    return mode;
  }

  public String getOwnerToken() {
    return ownerToken;
  }

  public long getFencingToken() {
    return fencingToken;
  }
}
