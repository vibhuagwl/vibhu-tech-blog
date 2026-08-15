package com.vibhu.resilience;

import io.github.resilience4j.bulkhead.annotation.Bulkhead;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.ratelimiter.annotation.RateLimiter;
import io.github.resilience4j.retry.annotation.Retry;
import io.github.resilience4j.timelimiter.annotation.TimeLimiter;
import java.util.concurrent.CompletableFuture;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * Payment facade. Retry is for transient bank errors only; fallback never returns CAPTURED.
 *
 * <p>Spring AOP default nesting (independent of annotation order on the method): Retry (outer) →
 * CircuitBreaker → RateLimiter → TimeLimiter → Bulkhead (inner) → method. See Resilience4j Spring
 * Boot docs (aspect order). TimeLimiter applies only to {@link #chargeAsync}.
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
    log.info(
        "charging keyHash={} customerHash={}",
        hash(request.idempotencyKey()),
        hash(request.customerId()));
    return bank.charge(request);
  }

  @TimeLimiter(name = "payment")
  @CircuitBreaker(name = "payment", fallbackMethod = "pendingAsyncFallback")
  public CompletableFuture<PaymentResult> chargeAsync(PayRequest request) {
    return CompletableFuture.supplyAsync(() -> bank.charge(request));
  }

  @SuppressWarnings("unused")
  private PaymentResult pendingFallback(PayRequest request, Throwable t) {
    if (t instanceof BusinessException biz) {
      throw biz;
    }
    log.warn(
        "payment degraded keyHash={} reason={}",
        hash(request.idempotencyKey()),
        t.getClass().getSimpleName());
    return PaymentResult.pending(request.idempotencyKey(), t.getClass().getSimpleName());
  }

  @SuppressWarnings("unused")
  private CompletableFuture<PaymentResult> pendingAsyncFallback(PayRequest request, Throwable t) {
    if (t instanceof BusinessException biz) {
      return CompletableFuture.failedFuture(biz);
    }
    return CompletableFuture.completedFuture(
        PaymentResult.pending(request.idempotencyKey(), t.getClass().getSimpleName()));
  }

  static int hash(String value) {
    return value == null ? 0 : value.hashCode();
  }
}
