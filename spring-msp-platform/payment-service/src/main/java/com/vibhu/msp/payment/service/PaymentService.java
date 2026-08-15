package com.vibhu.msp.payment.service;

import com.vibhu.msp.common.EventEnvelope;
import com.vibhu.msp.common.events.EventTypes;
import com.vibhu.msp.common.events.PaymentAuthorized;
import com.vibhu.msp.common.events.PaymentFailed;
import com.vibhu.msp.payment.entity.PaymentEntity;
import com.vibhu.msp.payment.entity.PaymentEntity.PaymentStatus;
import com.vibhu.msp.payment.repository.PaymentRepository;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PaymentService {

  private static final Logger log = LoggerFactory.getLogger(PaymentService.class);

  private final PaymentRepository paymentRepository;
  private final OutboxService outboxService;
  private final BigDecimal failThreshold;

  public PaymentService(
      PaymentRepository paymentRepository,
      OutboxService outboxService,
      @Value("${msp.payment.fail-threshold:10000}") BigDecimal failThreshold) {
    this.paymentRepository = paymentRepository;
    this.outboxService = outboxService;
    this.failThreshold = failThreshold;
  }

  @Transactional
  public void processOrderPayment(
      String orderId, String customerId, BigDecimal amount, String correlationId) {
    String paymentId = UUID.randomUUID().toString();
    PaymentEntity payment = new PaymentEntity();
    payment.setId(paymentId);
    payment.setOrderId(orderId);
    payment.setAmount(amount);
    payment.setCreatedAt(Instant.now());

    boolean shouldFail = customerId.contains("fail") || amount.compareTo(failThreshold) > 0;
    if (shouldFail) {
      payment.setStatus(PaymentStatus.FAILED);
      payment.setFailureReason("Payment declined: limit or customer flag");
      paymentRepository.save(payment);
      EventEnvelope<PaymentFailed> envelope =
          EventEnvelope.of(
              EventTypes.PAYMENT_FAILED,
              correlationId,
              new PaymentFailed(orderId, paymentId, payment.getFailureReason()));
      outboxService.enqueue("Payment", paymentId, EventTypes.PAYMENT_FAILED, envelope);
      log.warn("Payment failed orderId={} paymentId={}", orderId, paymentId);
    } else {
      payment.setStatus(PaymentStatus.AUTHORIZED);
      paymentRepository.save(payment);
      EventEnvelope<PaymentAuthorized> envelope =
          EventEnvelope.of(
              EventTypes.PAYMENT_AUTHORIZED,
              correlationId,
              new PaymentAuthorized(orderId, paymentId, amount));
      outboxService.enqueue("Payment", paymentId, EventTypes.PAYMENT_AUTHORIZED, envelope);
      log.info("Payment authorized orderId={} paymentId={}", orderId, paymentId);
    }
  }
}
