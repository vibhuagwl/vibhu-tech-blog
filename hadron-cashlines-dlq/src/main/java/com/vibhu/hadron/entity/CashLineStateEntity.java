package com.vibhu.hadron.entity;

import com.vibhu.hadron.domain.CashLineStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.time.Instant;

@Entity
@Table(name = "cashline_state")
public class CashLineStateEntity {

  @Id
  @Column(name = "cashline_id", length = 64)
  private String cashLineId;

  @Column(nullable = false)
  private int lastProcessedSequence;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 32)
  private CashLineStatus status = CashLineStatus.NEW;

  @Column(length = 64)
  private String blockedReason;

  @Version
  private int version;

  @Column(nullable = false)
  private Instant updatedAt = Instant.now();

  public String getCashLineId() {
    return cashLineId;
  }

  public void setCashLineId(String cashLineId) {
    this.cashLineId = cashLineId;
  }

  public int getLastProcessedSequence() {
    return lastProcessedSequence;
  }

  public void setLastProcessedSequence(int lastProcessedSequence) {
    this.lastProcessedSequence = lastProcessedSequence;
  }

  public CashLineStatus getStatus() {
    return status;
  }

  public void setStatus(CashLineStatus status) {
    this.status = status;
  }

  public String getBlockedReason() {
    return blockedReason;
  }

  public void setBlockedReason(String blockedReason) {
    this.blockedReason = blockedReason;
  }

  public int getVersion() {
    return version;
  }

  public Instant getUpdatedAt() {
    return updatedAt;
  }

  public void setUpdatedAt(Instant updatedAt) {
    this.updatedAt = updatedAt;
  }
}
