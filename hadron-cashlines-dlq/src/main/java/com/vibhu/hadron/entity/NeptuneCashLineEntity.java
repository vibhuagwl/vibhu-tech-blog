package com.vibhu.hadron.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(
    name = "neptune_cash_lines",
    indexes = {@Index(name = "idx_neptune_cursor", columnList = "updatedAt,id")})
public class NeptuneCashLineEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, length = 64)
  private String cashLineId;

  @Column(nullable = false, length = 64)
  private String participantId;

  @Column(nullable = false, length = 64)
  private String accountId;

  @Column(nullable = false, length = 3)
  private String currency;

  @Column(nullable = false, precision = 18, scale = 4)
  private BigDecimal amount;

  @Column(nullable = false, length = 64)
  private String eventType;

  @Column(nullable = false)
  private int sequenceNumber;

  @Column(nullable = false)
  private int version = 1;

  @Column(nullable = false)
  private boolean deleted;

  @Column(nullable = false)
  private Instant updatedAt = Instant.now();

  public Long getId() {
    return id;
  }

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

  public int getVersion() {
    return version;
  }

  public void setVersion(int version) {
    this.version = version;
  }

  public boolean isDeleted() {
    return deleted;
  }

  public void setDeleted(boolean deleted) {
    this.deleted = deleted;
  }

  public Instant getUpdatedAt() {
    return updatedAt;
  }

  public void setUpdatedAt(Instant updatedAt) {
    this.updatedAt = updatedAt;
  }
}
