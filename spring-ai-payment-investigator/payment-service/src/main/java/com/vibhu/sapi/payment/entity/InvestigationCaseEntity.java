package com.vibhu.sapi.payment.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "investigation_cases")
public class InvestigationCaseEntity {

  @Id
  @Column(length = 32)
  private String caseId;

  @Column(nullable = false, length = 32)
  private String paymentId;

  @Column(nullable = false, length = 16)
  private String status;

  @Column(nullable = false, length = 512)
  private String reason;

  @Column(nullable = false)
  private Instant createdAt;

  public String getCaseId() {
    return caseId;
  }

  public void setCaseId(String caseId) {
    this.caseId = caseId;
  }

  public String getPaymentId() {
    return paymentId;
  }

  public void setPaymentId(String paymentId) {
    this.paymentId = paymentId;
  }

  public String getStatus() {
    return status;
  }

  public void setStatus(String status) {
    this.status = status;
  }

  public String getReason() {
    return reason;
  }

  public void setReason(String reason) {
    this.reason = reason;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(Instant createdAt) {
    this.createdAt = createdAt;
  }
}
