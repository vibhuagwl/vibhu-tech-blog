package com.vibhu.aifp.harness;

import com.vibhu.aifp.common.ApprovalRequiredException;
import com.vibhu.aifp.common.ApprovalRequest;
import com.vibhu.aifp.common.UserContext;
import com.vibhu.aifp.domain.ApprovalService;
import com.vibhu.aifp.domain.ToolAuthorizationService;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class HumanApprovalGate {

  private final ApprovalService approvalService;
  private final ToolAuthorizationService toolAuthorizationService;

  public HumanApprovalGate(
      ApprovalService approvalService, ToolAuthorizationService toolAuthorizationService) {
    this.approvalService = approvalService;
    this.toolAuthorizationService = toolAuthorizationService;
  }

  public void requireApprovalIfWrite(String toolName, Map<String, Object> payload, UserContext user) {
    if (!toolAuthorizationService.isWriteTool(toolName)) {
      return;
    }
    toolAuthorizationService.authorize(user, toolName);
    ApprovalRequest pending = approvalService.propose(toolName, payload, user);
    throw new ApprovalRequiredException(
        "Write tool " + toolName + " requires approval: " + pending.id(), pending);
  }
}
