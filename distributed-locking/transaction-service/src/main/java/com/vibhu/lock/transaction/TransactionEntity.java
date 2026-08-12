package com.vibhu.lock.transaction;

import com.vibhu.lock.common.TransactionState;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "transactions")
public class TransactionEntity {
  @Id
  @Column(name = "id", nullable = false, length = 36)
  private String id;

  @Column(name = "source", nullable = false, length = 64)
  private String sourceAccountId;

  @Column(name = "dest", nullable = false, length = 64)
  private String destinationAccountId;

  @Column(name = "amount", nullable = false, precision = 19, scale = 2)
  private BigDecimal amount;

  @Enumerated(EnumType.STRING)
  @Column(name = "state", nullable = false, length = 32)
  private TransactionState state;

  @Column(name = "status", nullable = false, length = 32)
  private String status;

  @Column(name = "fencing_source")
  private Long fencingSource;

  @Column(name = "fencing_dest")
  private Long fencingDest;

  @Column(name = "error")
  private String error;

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt;

  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt;

  protected TransactionEntity() {
  }

  public TransactionEntity(String id, String sourceAccountId, String destinationAccountId, BigDecimal amount) {
    this.id = id;
    this.sourceAccountId = sourceAccountId;
    this.destinationAccountId = destinationAccountId;
    this.amount = amount;
    transitionTo(TransactionState.ACTIVE);
  }

  @PrePersist
  void prePersist() {
    Instant now = Instant.now();
    createdAt = now;
    updatedAt = now;
  }

  @PreUpdate
  void preUpdate() {
    updatedAt = Instant.now();
  }

  public void transitionTo(TransactionState newState) {
    if (this.state != null && this.state != newState && !isAllowed(this.state, newState)) {
      throw new IllegalStateException("Illegal 3PL transition " + this.state + " -> " + newState);
    }
    this.state = newState;
    this.status = newState.name();
  }

  private static boolean isAllowed(TransactionState from, TransactionState to) {
    return switch (from) {
      case ACTIVE -> to == TransactionState.LOCKING || to == TransactionState.ABORTING || to == TransactionState.ABORTED;
      case LOCKING -> to == TransactionState.PRE_COMMIT
          || to == TransactionState.ABORTING
          || to == TransactionState.ABORTED
          || to == TransactionState.TIMED_OUT;
      case PRE_COMMIT -> to == TransactionState.COMMIT_READY
          || to == TransactionState.ABORTING
          || to == TransactionState.ABORTED;
      case COMMIT_READY -> to == TransactionState.COMMITTED
          || to == TransactionState.ABORTING
          || to == TransactionState.ABORTED;
      case COMMITTED -> to == TransactionState.RELEASED;
      case ABORTING -> to == TransactionState.ABORTED;
      case ABORTED -> to == TransactionState.RELEASED;
      case TIMED_OUT -> to == TransactionState.ABORTING || to == TransactionState.ABORTED || to == TransactionState.RELEASED;
      case RELEASED -> false;
    };
  }

  public String getId() {
    return id;
  }

  public String getSourceAccountId() {
    return sourceAccountId;
  }

  public String getDestinationAccountId() {
    return destinationAccountId;
  }

  public BigDecimal getAmount() {
    return amount;
  }

  public TransactionState getState() {
    return state;
  }

  public String getStatus() {
    return status;
  }

  public Long getFencingSource() {
    return fencingSource;
  }

  public void setFencingSource(Long fencingSource) {
    this.fencingSource = fencingSource;
  }

  public Long getFencingDest() {
    return fencingDest;
  }

  public void setFencingDest(Long fencingDest) {
    this.fencingDest = fencingDest;
  }

  public String getError() {
    return error;
  }

  public void setError(String error) {
    this.error = error;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public Instant getUpdatedAt() {
    return updatedAt;
  }
}
