package com.vibhu.fai.web;

import com.vibhu.fai.common.dto.PaymentView;
import com.vibhu.fai.common.security.AuthContext;
import com.vibhu.fai.payment.PaymentService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {
  private final PaymentService payments;

  public PaymentController(PaymentService payments) {
    this.payments = payments;
  }

  @GetMapping("/{transactionId}")
  public PaymentView get(
      @PathVariable String transactionId,
      @RequestHeader(value = "X-Tenant-Id", defaultValue = "TENANT-1") String tenantId,
      @RequestHeader(value = "X-User-Id", defaultValue = "user-demo") String userId) {
    return payments.getPayment(transactionId, new AuthContext(tenantId, userId, "ANALYST"));
  }
}
