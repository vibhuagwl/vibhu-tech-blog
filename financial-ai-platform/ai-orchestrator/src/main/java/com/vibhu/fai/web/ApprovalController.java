package com.vibhu.fai.web;

import com.vibhu.fai.approval.ApprovalRequest;
import com.vibhu.fai.approval.ApprovalService;
import com.vibhu.fai.common.security.AuthContext;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/approvals")
public class ApprovalController {
  private final ApprovalService approvals;

  public ApprovalController(ApprovalService approvals) {
    this.approvals = approvals;
  }

  @PostMapping("/{id}/approve")
  public ApprovalRequest approve(
      @PathVariable Long id,
      @RequestHeader(value = "X-Tenant-Id", defaultValue = "TENANT-1") String tenantId,
      @RequestHeader(value = "X-User-Id", defaultValue = "approver-1") String userId) {
    return approvals.approve(id, new AuthContext(tenantId, userId, "APPROVER"));
  }
}
