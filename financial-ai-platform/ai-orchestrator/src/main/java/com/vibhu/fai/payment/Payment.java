package com.vibhu.fai.payment;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "payments")
public class Payment {

  @Id private String transactionId;
  private BigDecimal amount;
  private String currency;

  @Enumerated(EnumType.STRING)
  private PaymentStatus status;

  private String bankResponseCode;
  private String failureReason;
  private String accountId;
  private String tenantId;
  private Instant createdAt;

  public Payment() {}

  public Payment(
      String transactionId,
      BigDecimal amount,
      String currency,
      PaymentStatus status,
      String bankResponseCode,
      String failureReason,
      String accountId,
      String tenantId,
      Instant createdAt) {
    this.transactionId = transactionId;
    this.amount = amount;
    this.currency = currency;
    this.status = status;
    this.bankResponseCode = bankResponseCode;
    this.failureReason = failureReason;
    this.accountId = accountId;
    this.tenantId = tenantId;
    this.createdAt = createdAt;
  }

  public String getTransactionId() { return transactionId; }
  public BigDecimal getAmount() { return amount; }
  public String getCurrency() { return currency; }
  public PaymentStatus getStatus() { return status; }
  public String getBankResponseCode() { return bankResponseCode; }
  public String getFailureReason() { return failureReason; }
  public String getAccountId() { return accountId; }
  public String getTenantId() { return tenantId; }
  public Instant getCreatedAt() { return createdAt; }

  public void setStatus(PaymentStatus status) { this.status = status; }
  public void setFailureReason(String failureReason) { this.failureReason = failureReason; }
}
