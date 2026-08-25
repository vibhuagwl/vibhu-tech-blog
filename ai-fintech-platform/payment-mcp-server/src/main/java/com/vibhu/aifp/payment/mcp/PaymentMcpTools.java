package com.vibhu.aifp.payment.mcp;

import com.vibhu.aifp.common.PaymentRecord;
import com.vibhu.aifp.domain.PaymentService;
import java.util.List;
import java.util.Map;
import org.springaicommunity.mcp.annotation.McpPrompt;
import org.springaicommunity.mcp.annotation.McpResource;
import org.springaicommunity.mcp.annotation.McpTool;
import org.springaicommunity.mcp.annotation.McpToolParam;
import org.springframework.stereotype.Component;

@Component
public class PaymentMcpTools {

  private final PaymentService paymentService;

  public PaymentMcpTools(PaymentService paymentService) {
    this.paymentService = paymentService;
  }

  @McpTool(name = "getPayment", description = "Get payment by PAY id")
  public PaymentRecord getPayment(
      @McpToolParam(description = "Payment id e.g. PAY-123", required = true) String paymentId) {
    return paymentService.getPayment(paymentId);
  }

  @McpTool(name = "getPaymentStatus", description = "Get payment status")
  public String getPaymentStatus(
      @McpToolParam(description = "Payment id", required = true) String paymentId) {
    return paymentService.getPaymentStatus(paymentId);
  }

  @McpTool(name = "getPaymentFailureReason", description = "Explain payment failure")
  public Map<String, String> getPaymentFailureReason(
      @McpToolParam(description = "Payment id", required = true) String paymentId) {
    return paymentService.getPaymentFailureReason(paymentId);
  }

  @McpTool(name = "searchPayments", description = "Search payments by customer or status")
  public List<PaymentRecord> searchPayments(
      @McpToolParam(description = "Customer id", required = false) String customerId,
      @McpToolParam(description = "Status filter", required = false) String status) {
    return paymentService.searchPayments(customerId, status);
  }

  @McpResource(
      uri = "payment://policies/retry",
      name = "payment-retry-policy",
      description = "Retry policy summary for failed HSBC payments")
  public String retryPolicyResource() {
    return "BANK_TIMEOUT on HSBC may be retried when retryAllowed=true (max 3 attempts).";
  }

  @McpPrompt(name = "investigate-payment", description = "Prompt template for payment failure investigation")
  public String investigatePrompt(
      @McpToolParam(description = "Payment id", required = true) String paymentId) {
    return "Investigate why payment " + paymentId + " failed using getPayment and getPaymentFailureReason.";
  }
}
