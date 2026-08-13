package com.vibhu.resilience;

import io.github.resilience4j.bulkhead.annotation.Bulkhead;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.ratelimiter.annotation.RateLimiter;
import io.github.resilience4j.retry.annotation.Retry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * Payment facade. Retry is for transient bank errors only; fallback never returns CAPTURED.
 * Idempotency key must be supplied by the caller for safe retries.
 */
@Service
public class PaymentGatewayClient {
  private static final Logger log = LoggerFactory.getLogger(PaymentGatewayClient.class);
  private final PaymentBankStub bank;

  public PaymentGatewayClient(PaymentBankStub bank) {
    this.bank = bank;
  }

  @RateLimiter(name = "paymentApi")
  @Bulkhead(name = "payment")
  @CircuitBreaker(name = "payment", fallbackMethod = "pendingFallback")
  @Retry(name = "payment")
  public PaymentResult charge(PayRequest request) {
    log.info("charging key={} customer={}", request.idempotencyKey(), request.customerId());
    return bank.charge(request);
  }

  @SuppressWarnings("unused")
  private PaymentResult pendingFallback(PayRequest request, Throwable t) {
    log.warn("payment degraded key={} reason={}", request.idempotencyKey(), t.toString());
    return PaymentResult.pending(request.idempotencyKey(), t.getClass().getSimpleName());
  }
}
