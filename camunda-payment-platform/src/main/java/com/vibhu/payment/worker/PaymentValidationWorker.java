package com.vibhu.payment.worker;

import com.vibhu.payment.service.PaymentService;
import io.camunda.zeebe.spring.client.annotation.JobWorker;
import io.camunda.zeebe.spring.client.annotation.Variable;
import java.util.Map;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "payment.orchestration-mode", havingValue = "zeebe")
public class PaymentValidationWorker {
  private final PaymentService payments;

  public PaymentValidationWorker(PaymentService payments) {
    this.payments = payments;
  }

  @JobWorker(type = "validate-payment")
  public Map<String, Object> validatePayment(@Variable String paymentId) {
    return payments.validate(paymentId);
  }
}
