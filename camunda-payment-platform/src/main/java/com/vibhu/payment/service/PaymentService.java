package com.vibhu.payment.service;

import com.vibhu.payment.config.PaymentProperties;
import com.vibhu.payment.entity.PaymentEntity;
import com.vibhu.payment.exception.BusinessPaymentException;
import com.vibhu.payment.exception.PaymentException;
import com.vibhu.payment.model.PaymentRequest;
import com.vibhu.payment.model.PaymentStatus;
import com.vibhu.payment.repository.PaymentRepository;
import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PaymentService {
  private static final Logger log = LoggerFactory.getLogger(PaymentService.class);

  private final PaymentRepository payments;
  private final PaymentProperties properties;

  public PaymentService(PaymentRepository payments, PaymentProperties properties) {
    this.payments = payments;
    this.properties = properties;
  }

  @Transactional
  public PaymentEntity createStarted(PaymentRequest request) {
    if (payments.existsById(request.paymentId())) {
      throw new PaymentException("duplicate paymentId: " + request.paymentId());
    }
    PaymentEntity entity = new PaymentEntity();
    entity.setPaymentId(request.paymentId());
    entity.setCustomerId(request.customerId());
    entity.setAmount(request.amount());
    entity.setCurrency(request.currency().toUpperCase());
    entity.setStatus(PaymentStatus.STARTED);
    return payments.save(entity);
  }

  @Transactional
  public void attachProcessInstance(String paymentId, String processInstanceKey) {
    PaymentEntity entity = require(paymentId);
    entity.setProcessInstanceKey(processInstanceKey);
  }

  @Transactional(readOnly = true)
  public PaymentEntity require(String paymentId) {
    return payments
        .findById(paymentId)
        .orElseThrow(() -> new PaymentException("payment not found: " + paymentId));
  }

  /** Idempotent validation — safe under Camunda job retries. */
  @Transactional
  public Map<String, Object> validate(String paymentId) {
    PaymentEntity payment = require(paymentId);
    if (payment.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
      throw new BusinessPaymentException("INVALID_AMOUNT", "amount must be positive");
    }
    if (!"INR".equals(payment.getCurrency()) && !"USD".equals(payment.getCurrency())) {
      throw new BusinessPaymentException("INVALID_CURRENCY", "unsupported currency");
    }
    payment.setStatus(PaymentStatus.VALIDATED);
    boolean requiresApproval =
        payment.getAmount().compareTo(properties.getHighValueThreshold()) > 0;
    log.info(
        "payment validated paymentId={} requiresApproval={}", paymentId, requiresApproval);
    Map<String, Object> vars = new LinkedHashMap<>();
    vars.put("paymentId", paymentId);
    vars.put("customerId", payment.getCustomerId());
    vars.put("amount", payment.getAmount());
    vars.put("currency", payment.getCurrency());
    vars.put("requiresApproval", requiresApproval);
    return vars;
  }

  @Transactional
  public void markStatus(String paymentId, PaymentStatus status) {
    require(paymentId).setStatus(status);
  }

  @Transactional
  public void complete(String paymentId, String bankReference) {
    PaymentEntity payment = require(paymentId);
    payment.setBankReference(bankReference);
    payment.setStatus(PaymentStatus.COMPLETED);
  }
}
