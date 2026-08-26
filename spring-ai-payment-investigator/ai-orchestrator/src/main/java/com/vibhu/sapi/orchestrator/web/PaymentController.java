package com.vibhu.sapi.orchestrator.web;

import com.vibhu.sapi.dto.PaymentView;
import com.vibhu.sapi.payment.service.PaymentApplicationService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

  private final PaymentApplicationService paymentService;

  public PaymentController(PaymentApplicationService paymentService) {
    this.paymentService = paymentService;
  }

  @GetMapping("/{id}")
  public PaymentView getPayment(@PathVariable String id) {
    return paymentService.getPayment(id);
  }
}
