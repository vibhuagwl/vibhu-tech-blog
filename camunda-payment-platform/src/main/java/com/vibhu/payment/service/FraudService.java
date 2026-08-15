package com.vibhu.payment.service;

import com.vibhu.payment.entity.PaymentEntity;
import com.vibhu.payment.model.PaymentStatus;
import com.vibhu.payment.repository.PaymentRepository;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FraudService {
  private static final Logger log = LoggerFactory.getLogger(FraudService.class);

  private final PaymentRepository payments;

  public FraudService(PaymentRepository payments) {
    this.payments = payments;
  }

  /**
   * Demo rule: customerId ending with "-FRAUD" is rejected. Workers must be idempotent — re-running
   * must yield the same decision.
   */
  @Transactional
  public Map<String, Object> check(String paymentId) {
    PaymentEntity payment =
        payments
            .findById(paymentId)
            .orElseThrow(() -> new IllegalArgumentException("payment not found"));
    boolean fraud = payment.getCustomerId().toUpperCase().endsWith("-FRAUD");
    payment.setFraudDetected(fraud);
    if (fraud) {
      payment.setStatus(PaymentStatus.FRAUD_REJECTED);
      log.warn("fraud detected paymentId={}", paymentId);
    }
    return Map.of("fraudDetected", fraud, "paymentId", paymentId);
  }
}
