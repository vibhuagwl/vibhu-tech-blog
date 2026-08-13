package com.vibhu.payment.service;

import com.vibhu.payment.config.PaymentProperties;
import com.vibhu.payment.exception.BusinessPaymentException;
import com.vibhu.payment.exception.RetryablePaymentException;
import com.vibhu.payment.model.PaymentStatus;
import com.vibhu.payment.repository.PaymentRepository;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BankService {
  private static final Logger log = LoggerFactory.getLogger(BankService.class);

  private final PaymentRepository payments;
  private final PaymentProperties properties;

  public BankService(PaymentRepository payments, PaymentProperties properties) {
    this.payments = payments;
    this.properties = properties;
  }

  @Transactional
  public Map<String, Object> validateAccount(String paymentId) {
    payments
        .findById(paymentId)
        .orElseThrow(() -> new IllegalArgumentException("payment not found"));
    // Demo: account numbers derived from customer — always OK unless CUST-CLOSED
    return Map.of("accountValid", true, "paymentId", paymentId);
  }

  @Transactional
  public Map<String, Object> creditCheck(String paymentId) {
    return Map.of("creditOk", true, "paymentId", paymentId);
  }

  /**
   * Technical failures throw RetryablePaymentException (Camunda retries).
   * Hard declines throw BusinessPaymentException → BPMN error BANK_DECLINED.
   */
  @Transactional
  public Map<String, Object> processWithBank(String paymentId) {
    var payment =
        payments
            .findById(paymentId)
            .orElseThrow(() -> new IllegalArgumentException("payment not found"));
    payment.setStatus(PaymentStatus.PROCESSING);

    if (payment.getCustomerId().toUpperCase().endsWith("-DECLINE")) {
      throw new BusinessPaymentException("BANK_DECLINED", "bank declined payment");
    }

    double failRate = properties.getBank().getFailRate();
    if (failRate > 0 && ThreadLocalRandom.current().nextDouble() < failRate) {
      throw new RetryablePaymentException("transient bank 5xx / network failure");
    }

    try {
      Thread.sleep(Math.min(properties.getBank().getTimeoutMs(), 50));
    } catch (InterruptedException e) {
      Thread.currentThread().interrupt();
      throw new RetryablePaymentException("bank call interrupted", e);
    }

    String bankRef = "BNK-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    payment.setStatus(PaymentStatus.AWAITING_BANK);
    payment.setBankReference(bankRef);
    log.info("bank accepted paymentId={} bankRef={}", paymentId, bankRef);
    return Map.of(
        "bankReference", bankRef,
        "paymentId", paymentId,
        "bankAccepted", true);
  }
}
