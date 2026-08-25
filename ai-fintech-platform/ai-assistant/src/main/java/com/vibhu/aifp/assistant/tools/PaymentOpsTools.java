package com.vibhu.aifp.assistant.tools;

import com.vibhu.aifp.assistant.security.UserContextHolder;
import com.vibhu.aifp.common.ApprovalRequiredException;
import com.vibhu.aifp.common.PaymentRecord;
import com.vibhu.aifp.domain.ApprovalService;
import com.vibhu.aifp.domain.PaymentService;
import com.vibhu.aifp.domain.ToolAuthorizationService;
import com.vibhu.aifp.harness.HumanApprovalGate;
import java.util.List;
import java.util.Map;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.stereotype.Component;

@Component
public class PaymentOpsTools {

  private final PaymentService paymentService;
  private final ToolAuthorizationService authorizationService;
  private final HumanApprovalGate approvalGate;
  private final ApprovalService approvalService;

  public PaymentOpsTools(
      PaymentService paymentService,
      ToolAuthorizationService authorizationService,
      HumanApprovalGate approvalGate,
      ApprovalService approvalService) {
    this.paymentService = paymentService;
    this.authorizationService = authorizationService;
    this.approvalGate = approvalGate;
    this.approvalService = approvalService;
  }

  @Tool(description = "Get payment details by PAY id. Read-only.")
  public PaymentRecord getPayment(String paymentId) {
    authorize("getPayment");
    return paymentService.getPayment(paymentId);
  }

  @Tool(description = "Get payment status. Read-only.")
  public String getPaymentStatus(String paymentId) {
    authorize("getPaymentStatus");
    return paymentService.getPaymentStatus(paymentId);
  }

  @Tool(description = "Explain payment failure reason. Read-only.")
  public Map<String, String> getPaymentFailureReason(String paymentId) {
    authorize("getPaymentFailureReason");
    return paymentService.getPaymentFailureReason(paymentId);
  }

  @Tool(description = "Search payments by customer or status. Read-only.")
  public List<PaymentRecord> searchPayments(String customerId, String status) {
    authorize("searchPayments");
    return paymentService.searchPayments(customerId, status);
  }

  @Tool(description = "Refund a payment — requires OPS approval.")
  public PaymentRecord refundPayment(String paymentId, String reason) {
    authorize("refundPayment");
    try {
      approvalGate.requireApprovalIfWrite(
          "refundPayment", Map.of("paymentId", paymentId, "reason", reason), UserContextHolder.get());
      throw new IllegalStateException("Approval gate should have thrown");
    } catch (ApprovalRequiredException ex) {
      return paymentService.getPayment(paymentId);
    }
  }

  private void authorize(String toolName) {
    authorizationService.authorize(UserContextHolder.get(), toolName);
  }
}
