package com.vibhu.fai.approval;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "approvals")
public class ApprovalRequest {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;
  private String transactionId;
  private String reason;
  private String tenantId;
  private String requestedBy;

  @Enumerated(EnumType.STRING)
  private ApprovalStatus status;

  private Instant createdAt;
  private Instant decidedAt;

  public Long getId() { return id; }
  public String getTransactionId() { return transactionId; }
  public void setTransactionId(String transactionId) { this.transactionId = transactionId; }
  public String getReason() { return reason; }
  public void setReason(String reason) { this.reason = reason; }
  public String getTenantId() { return tenantId; }
  public void setTenantId(String tenantId) { this.tenantId = tenantId; }
  public String getRequestedBy() { return requestedBy; }
  public void setRequestedBy(String requestedBy) { this.requestedBy = requestedBy; }
  public ApprovalStatus getStatus() { return status; }
  public void setStatus(ApprovalStatus status) { this.status = status; }
  public Instant getCreatedAt() { return createdAt; }
  public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
  public Instant getDecidedAt() { return decidedAt; }
  public void setDecidedAt(Instant decidedAt) { this.decidedAt = decidedAt; }
}
