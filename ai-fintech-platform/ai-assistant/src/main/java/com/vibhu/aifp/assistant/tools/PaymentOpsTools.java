package com.vibhu.aifp.assistant.tools;

import com.vibhu.aifp.assistant.security.UserContextHolder;
import com.vibhu.aifp.common.ApprovalRequiredException;
import com.vibhu.aifp.common.PaymentRecord;
import com.vibhu.aifp.domain.ApprovalService;
import com.vibhu.aifp.domain.PaymentService;
import com.vibhu.aifp.domain.ToolAuthorizationService;
import com.vibhu.aifp.harness.HumanApprovalGate;
import com.vibhu.aifp.harness.ToolCallRecorder;
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
  private final ToolCallRecorder toolCallRecorder;

  public PaymentOpsTools(
      PaymentService paymentService,
      ToolAuthorizationService authorizationService,
      HumanApprovalGate approvalGate,
      ApprovalService approvalService,
      ToolCallRecorder toolCallRecorder) {
    this.paymentService = paymentService;
    this.authorizationService = authorizationService;
    this.approvalGate = approvalGate;
    this.approvalService = approvalService;
    this.toolCallRecorder = toolCallRecorder;
  }

  @Tool(description = "Get payment details by PAY id. Read-only.")
  public PaymentRecord getPayment(String paymentId) {
    long t0 = System.currentTimeMillis();
    authorize("getPayment");
    PaymentRecord out = paymentService.getPayment(paymentId);
    toolCallRecorder.record(
        "getPayment", "{\"paymentId\":\"" + paymentId + "\"}", String.valueOf(out), System.currentTimeMillis() - t0, true);
    return out;
  }

  @Tool(description = "Get payment status. Read-only.")
  public String getPaymentStatus(String paymentId) {
    long t0 = System.currentTimeMillis();
    authorize("getPaymentStatus");
    String out = paymentService.getPaymentStatus(paymentId);
    toolCallRecorder.record(
        "getPaymentStatus",
        "{\"paymentId\":\"" + paymentId + "\"}",
        out,
        System.currentTimeMillis() - t0,
        true);
    return out;
  }

  @Tool(description = "Explain payment failure reason. Read-only.")
  public Map<String, String> getPaymentFailureReason(String paymentId) {
    long t0 = System.currentTimeMillis();
    authorize("getPaymentFailureReason");
    Map<String, String> out = paymentService.getPaymentFailureReason(paymentId);
    toolCallRecorder.record(
        "getPaymentFailureReason",
        "{\"paymentId\":\"" + paymentId + "\"}",
        String.valueOf(out),
        System.currentTimeMillis() - t0,
        true);
    return out;
  }

  @Tool(description = "Search payments by customer or status. Read-only.")
  public List<PaymentRecord> searchPayments(String customerId, String status) {
    long t0 = System.currentTimeMillis();
    authorize("searchPayments");
    List<PaymentRecord> out = paymentService.searchPayments(customerId, status);
    toolCallRecorder.record(
        "searchPayments",
        "{\"customerId\":\"" + customerId + "\",\"status\":\"" + status + "\"}",
        String.valueOf(out.size()),
        System.currentTimeMillis() - t0,
        true);
    return out;
  }

  @Tool(description = "Refund a payment — requires OPS approval.")
  public PaymentRecord refundPayment(String paymentId, String reason) {
    authorize("refundPayment");
    try {
      approvalGate.requireApprovalIfWrite(
          "refundPayment", Map.of("paymentId", paymentId, "reason", reason), UserContextHolder.get());
      throw new IllegalStateException("Approval gate should have thrown");
    } catch (ApprovalRequiredException ex) {
      toolCallRecorder.record(
          "refundPayment",
          "{\"paymentId\":\"" + paymentId + "\"}",
          "APPROVAL_REQUIRED:" + ex.pendingApproval().id(),
          0,
          true);
      return paymentService.getPayment(paymentId);
    }
  }

  private void authorize(String toolName) {
    authorizationService.authorize(UserContextHolder.get(), toolName);
  }
}
