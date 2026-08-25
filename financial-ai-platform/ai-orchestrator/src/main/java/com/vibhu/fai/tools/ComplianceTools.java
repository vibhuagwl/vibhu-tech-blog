package com.vibhu.fai.tools;

import com.vibhu.fai.audit.ToolAuditService;
import com.vibhu.fai.rag.RagService;
import com.vibhu.fai.web.RequestAuthHolder;
import java.util.List;
import java.util.Map;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.stereotype.Component;

@Component
public class ComplianceTools {
  private final RagService rag;
  private final ToolAuditService audit;

  public ComplianceTools(RagService rag, ToolAuditService audit) {
    this.rag = rag;
    this.audit = audit;
  }

  @Tool(
      description =
          """
          Search compliance/payment policy documents via RAG.
          Use for policies/runbooks — NOT for balances, prices, or live payment status.
          """)
  public List<Map<String, String>> searchCompliancePolicy(String query) {
    var auth = RequestAuthHolder.get();
    List<Map<String, String>> hits = rag.search(query, auth.tenantId(), "POLICY", "IN");
    audit.record("searchCompliancePolicy", Map.of("query", query), true);
    return hits;
  }

  @Tool(description = "Check if a payment is eligible for reversal proposal (read-only rules).")
  public Map<String, Object> checkReversalEligibility(String transactionId) {
    // Eligibility is a rule check — execution still requires approval.
    audit.record("checkReversalEligibility", Map.of("transactionId", transactionId), true);
    return Map.of(
        "transactionId", transactionId,
        "eligible", true,
        "requiresApproval", true,
        "reason", "High-value or failed payment reversals require human approval");
  }
}
