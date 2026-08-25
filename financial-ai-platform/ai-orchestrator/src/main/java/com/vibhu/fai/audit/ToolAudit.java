package com.vibhu.fai.audit;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "tool_audit")
public class ToolAudit {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;
  private String tenantId;
  private String userId;
  private String conversationId;
  private String toolName;
  private String argumentsHash;
  private boolean success;
  private Instant createdAt;

  public Long getId() { return id; }
  public String getTenantId() { return tenantId; }
  public void setTenantId(String tenantId) { this.tenantId = tenantId; }
  public String getUserId() { return userId; }
  public void setUserId(String userId) { this.userId = userId; }
  public String getConversationId() { return conversationId; }
  public void setConversationId(String conversationId) { this.conversationId = conversationId; }
  public String getToolName() { return toolName; }
  public void setToolName(String toolName) { this.toolName = toolName; }
  public String getArgumentsHash() { return argumentsHash; }
  public void setArgumentsHash(String argumentsHash) { this.argumentsHash = argumentsHash; }
  public boolean isSuccess() { return success; }
  public void setSuccess(boolean success) { this.success = success; }
  public Instant getCreatedAt() { return createdAt; }
  public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
