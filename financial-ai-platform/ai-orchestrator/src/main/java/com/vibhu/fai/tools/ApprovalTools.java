package com.vibhu.fai.tools;

import com.vibhu.fai.approval.ApprovalService;
import com.vibhu.fai.audit.ToolAuditService;
import com.vibhu.fai.web.RequestAuthHolder;
import java.util.Map;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.stereotype.Component;

@Component
public class ApprovalTools {

  private final ApprovalService approvals;
  private final ToolAuditService audit;

  public ApprovalTools(ApprovalService approvals, ToolAuditService audit) {
    this.approvals = approvals;
    this.audit = audit;
  }

  @Tool(
      description =
          """
          Propose a payment reversal. Does NOT execute money movement.
          Creates an ApprovalRequest for a human approver.
          """)
  public Map<String, Object> proposeReversal(String transactionId, String reason) {
    // SECURITY RULE:
    // LLM can PROPOSE financial actions.
    // LLM must NEVER directly execute unrestricted money movement.
    // READ  -> AI can call automatically
    // WRITE -> approval required
    var auth = RequestAuthHolder.get();
    var req = approvals.proposeReversal(transactionId, reason, auth);
    audit.record("proposeReversal", Map.of("transactionId", transactionId), true);
    return Map.of(
        "approvalId", req.getId(),
        "status", req.getStatus().name(),
        "message", "Reversal proposed — awaiting human approval");
  }
}
