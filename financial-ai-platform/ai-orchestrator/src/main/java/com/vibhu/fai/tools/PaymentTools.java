package com.vibhu.fai.tools;

import com.vibhu.fai.audit.ToolAuditService;
import com.vibhu.fai.common.dto.PaymentView;
import com.vibhu.fai.common.security.AuthContext;
import com.vibhu.fai.payment.PaymentRootCauseAnalyzer;
import com.vibhu.fai.payment.PaymentService;
import com.vibhu.fai.web.RequestAuthHolder;
import java.util.List;
import java.util.Map;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.stereotype.Component;

/**
 * ============================================================
 * INTERVIEW NOTES — @Tool vs MCP vs REST
 * ============================================================
 * @Tool = in-process Java capability exposed to the model.
 * MCP = protocol-level discovery across process boundary.
 * REST = traditional service API for humans/services.
 * Model never touches DB/Redis/Kafka directly — only tools.
 * ============================================================
 */
@Component
public class PaymentTools {

  private final PaymentService payments;
  private final PaymentRootCauseAnalyzer analyzer;
  private final ToolAuditService audit;

  public PaymentTools(
      PaymentService payments, PaymentRootCauseAnalyzer analyzer, ToolAuditService audit) {
    this.payments = payments;
    this.analyzer = analyzer;
    this.audit = audit;
  }

  @Tool(
      description =
          """
          Get payment details using transactionId. Read-only.
          Use when investigating payment status or failure.
          """)
  public PaymentView getPayment(String transactionId) {
    AuthContext auth = RequestAuthHolder.get();
    PaymentView view = payments.getPayment(transactionId, auth);
    audit.record("getPayment", Map.of("transactionId", transactionId), true);
    return view;
  }

  @Tool(description = "Get recent payment history for an accountId. Read-only.")
  public List<PaymentView> getPaymentHistory(String accountId) {
    AuthContext auth = RequestAuthHolder.get();
    List<PaymentView> hist = payments.history(accountId, auth);
    audit.record("getPaymentHistory", Map.of("accountId", accountId), true);
    return hist;
  }

  @Tool(description = "Get bank response explanation fields already stored on the payment. Read-only.")
  public Map<String, String> getBankResponse(String transactionId) {
    PaymentView p = getPayment(transactionId);
    return Map.of(
        "bankResponseCode", String.valueOf(p.bankResponseCode()),
        "failureReason", String.valueOf(p.failureReason()),
        "status", p.status());
  }

  @Tool(
      description =
          """
          Deterministic Java root-cause analysis for a failed payment.
          Do NOT invent bank code meanings — call this tool.
          """)
  public PaymentRootCauseAnalyzer.RootCause analyzePaymentFailure(String transactionId, String policyEvidenceId) {
    PaymentView p = getPayment(transactionId);
    var rc = analyzer.analyze(p, policyEvidenceId);
    audit.record("analyzePaymentFailure", Map.of("transactionId", transactionId), true);
    return rc;
  }
}
