package com.vibhu.lock.account;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "accounts")
public class AccountEntity {
  @Id
  @Column(name = "id", nullable = false, length = 64)
  private String id;

  @Column(name = "balance", nullable = false, precision = 19, scale = 2)
  private BigDecimal balance;

  @Version
  @Column(name = "version", nullable = false)
  private long version;

  @Column(name = "status", nullable = false, length = 32)
  private String status;

  @Column(name = "last_applied_fence", nullable = false)
  private long lastAppliedFence;

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt;

  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt;

  protected AccountEntity() {}

  public AccountEntity(String id, BigDecimal balance, String status) {
    this.id = id;
    this.balance = balance;
    this.status = status;
    this.lastAppliedFence = 0L;
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

  public String getId() {
    return id;
  }

  public BigDecimal getBalance() {
    return balance;
  }

  public void setBalance(BigDecimal balance) {
    this.balance = balance;
  }

  public long getVersion() {
    return version;
  }

  public String getStatus() {
    return status;
  }

  public long getLastAppliedFence() {
    return lastAppliedFence;
  }

  public void setLastAppliedFence(long lastAppliedFence) {
    this.lastAppliedFence = lastAppliedFence;
  }
}
