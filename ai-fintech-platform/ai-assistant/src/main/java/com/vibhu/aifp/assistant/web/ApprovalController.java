package com.vibhu.aifp.assistant.web;

import com.vibhu.aifp.assistant.security.UserContextHolder;
import com.vibhu.aifp.common.ApprovalRequest;
import com.vibhu.aifp.domain.ApprovalService;
import java.util.Map;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/approvals")
public class ApprovalController {

  private final ApprovalService approvalService;

  public ApprovalController(ApprovalService approvalService) {
    this.approvalService = approvalService;
  }

  @PostMapping("/{approvalId}/approve")
  public ApprovalRequest approve(@PathVariable String approvalId) {
    return approvalService.approve(approvalId, UserContextHolder.get());
  }

  @PostMapping("/{approvalId}")
  public Map<String, Object> get(@PathVariable String approvalId) {
    ApprovalRequest request = approvalService.get(approvalId);
    return Map.of("id", request.id(), "status", request.status(), "toolName", request.toolName());
  }
}
