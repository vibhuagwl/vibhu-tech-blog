package com.vibhu.aifp.common;

public class ApprovalRequiredException extends RuntimeException {
  private final ApprovalRequest pendingApproval;

  public ApprovalRequiredException(String message, ApprovalRequest pendingApproval) {
    super(message);
    this.pendingApproval = pendingApproval;
  }

  public ApprovalRequest pendingApproval() {
    return pendingApproval;
  }
}
