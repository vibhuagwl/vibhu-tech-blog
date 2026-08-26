package com.vibhu.sapi.exception;

import com.vibhu.sapi.dto.ApprovalRequest;

public class ApprovalRequiredException extends RuntimeException {
  private final ApprovalRequest pendingApproval;

  public ApprovalRequiredException(ApprovalRequest pendingApproval) {
    super("Human approval required for: " + pendingApproval.action());
    this.pendingApproval = pendingApproval;
  }

  public ApprovalRequest pendingApproval() {
    return pendingApproval;
  }
}
