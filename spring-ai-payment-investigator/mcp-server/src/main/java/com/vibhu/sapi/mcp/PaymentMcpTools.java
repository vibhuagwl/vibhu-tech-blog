package com.vibhu.sapi.mcp;

import com.vibhu.sapi.dto.PaymentView;
import com.vibhu.sapi.payment.service.PaymentApplicationService;
import org.springaicommunity.mcp.annotation.McpTool;
import org.springaicommunity.mcp.annotation.McpToolParam;
import org.springframework.stereotype.Component;

@Component
public class PaymentMcpTools {

  private final PaymentApplicationService paymentService;

  public PaymentMcpTools(PaymentApplicationService paymentService) {
    this.paymentService = paymentService;
  }

  @McpTool(name = "getPayment", description = "Get payment by TXN id")
  public PaymentView getPayment(
      @McpToolParam(description = "Payment id e.g. TXN-1001", required = true) String paymentId) {
    return paymentService.getPayment(paymentId);
  }
}
