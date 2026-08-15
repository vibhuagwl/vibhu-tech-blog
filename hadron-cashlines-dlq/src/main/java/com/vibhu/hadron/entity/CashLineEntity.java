package com.vibhu.hadron.entity;

import com.vibhu.hadron.domain.CashLineStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "cash_lines")
public class CashLineEntity {

  @Id
  @Column(name = "cashline_id", length = 64)
  private String cashLineId;

  @Column(nullable = false, length = 64)
  private String participantId;

  @Column(nullable = false, length = 64)
  private String accountId;

  @Column(nullable = false, length = 3)
  private String currency;

  @Column(nullable = false, precision = 18, scale = 4)
  private BigDecimal amount;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 32)
  private CashLineStatus status = CashLineStatus.NEW;

  @Column(length = 128)
  private String lastEventId;

  @Column(nullable = false)
  private int lastSequence;

  @Version private int version;

  @Column(nullable = false)
  private Instant createdAt = Instant.now();

  @Column(nullable = false)
  private Instant updatedAt = Instant.now();

  public String getCashLineId() {
    return cashLineId;
  }

  public void setCashLineId(String cashLineId) {
    this.cashLineId = cashLineId;
  }

  public String getParticipantId() {
    return participantId;
  }

  public void setParticipantId(String participantId) {
    this.participantId = participantId;
  }

  public String getAccountId() {
    return accountId;
  }

  public void setAccountId(String accountId) {
    this.accountId = accountId;
  }

  public String getCurrency() {
    return currency;
  }

  public void setCurrency(String currency) {
    this.currency = currency;
  }

  public BigDecimal getAmount() {
    return amount;
  }

  public void setAmount(BigDecimal amount) {
    this.amount = amount;
  }

  public CashLineStatus getStatus() {
    return status;
  }

  public void setStatus(CashLineStatus status) {
    this.status = status;
  }

  public String getLastEventId() {
    return lastEventId;
  }

  public void setLastEventId(String lastEventId) {
    this.lastEventId = lastEventId;
  }

  public int getLastSequence() {
    return lastSequence;
  }

  public void setLastSequence(int lastSequence) {
    this.lastSequence = lastSequence;
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
