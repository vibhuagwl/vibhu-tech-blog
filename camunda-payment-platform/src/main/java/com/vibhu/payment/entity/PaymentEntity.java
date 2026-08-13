package com.vibhu.payment.entity;

import com.vibhu.payment.model.PaymentStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "payment")
public class PaymentEntity {
  @Id
  @Column(name = "payment_id", length = 50)
  private String paymentId;

  @Column(name = "customer_id", nullable = false, length = 50)
  private String customerId;

  @Column(nullable = false, precision = 18, scale = 2)
  private BigDecimal amount;

  @Column(nullable = false, length = 3)
  private String currency;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 30)
  private PaymentStatus status;

  @Column(name = "process_instance_key", length = 64)
  private String processInstanceKey;

  @Column(name = "fraud_detected")
  private boolean fraudDetected;

  @Column(name = "bank_reference", length = 100)
  private String bankReference;

  @Column(name = "created_at", nullable = false)
  private Instant createdAt = Instant.now();

  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt = Instant.now();

  public String getPaymentId() {
    return paymentId;
  }

  public void setPaymentId(String paymentId) {
    this.paymentId = paymentId;
  }

  public String getCustomerId() {
    return customerId;
  }

  public void setCustomerId(String customerId) {
    this.customerId = customerId;
  }

  public BigDecimal getAmount() {
    return amount;
  }

  public void setAmount(BigDecimal amount) {
    this.amount = amount;
  }

  public String getCurrency() {
    return currency;
  }

  public void setCurrency(String currency) {
    this.currency = currency;
  }

  public PaymentStatus getStatus() {
    return status;
  }

  public void setStatus(PaymentStatus status) {
    this.status = status;
    this.updatedAt = Instant.now();
  }

  public String getProcessInstanceKey() {
    return processInstanceKey;
  }

  public void setProcessInstanceKey(String processInstanceKey) {
    this.processInstanceKey = processInstanceKey;
  }

  public boolean isFraudDetected() {
    return fraudDetected;
  }

  public void setFraudDetected(boolean fraudDetected) {
    this.fraudDetected = fraudDetected;
  }

  public String getBankReference() {
    return bankReference;
  }

  public void setBankReference(String bankReference) {
    this.bankReference = bankReference;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public Instant getUpdatedAt() {
    return updatedAt;
  }
}
