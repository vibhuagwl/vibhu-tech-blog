package com.vibhu.resilience;

import io.github.resilience4j.bulkhead.Bulkhead;
import io.github.resilience4j.bulkhead.BulkheadConfig;
import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import io.github.resilience4j.circuitbreaker.CircuitBreakerConfig;
import io.github.resilience4j.ratelimiter.RateLimiter;
import io.github.resilience4j.ratelimiter.RateLimiterConfig;
import io.github.resilience4j.retry.Retry;
import io.github.resilience4j.retry.RetryConfig;
import java.time.Duration;
import java.util.function.Supplier;

/**
 * Explicit decorator order (innermost first): Bulkhead → RateLimiter → CircuitBreaker → Retry.
 * Contrast with Spring AOP default: Retry(CircuitBreaker(RateLimiter(TimeLimiter(Bulkhead(fn))))).
 */
public final class ProgrammaticDecorators {
  private ProgrammaticDecorators() {}

  public static Supplier<PaymentResult> paymentPipeline(Supplier<PaymentResult> bankCall) {
    Bulkhead bulkhead =
        Bulkhead.of("payBh", BulkheadConfig.custom().maxConcurrentCalls(20).maxWaitDuration(Duration.ZERO).build());
    RateLimiter rateLimiter =
        RateLimiter.of(
            "payRl",
            RateLimiterConfig.custom()
                .limitForPeriod(50)
                .limitRefreshPeriod(Duration.ofSeconds(1))
                .timeoutDuration(Duration.ZERO)
                .build());
    CircuitBreaker circuitBreaker =
        CircuitBreaker.of(
            "payCb",
            CircuitBreakerConfig.custom()
                .slidingWindowSize(10)
                .minimumNumberOfCalls(5)
                .failureRateThreshold(50)
                .recordExceptions(BankUnavailableException.class)
                .ignoreExceptions(BusinessException.class)
                .build());
    Retry retry =
        Retry.of(
            "payRetry",
            RetryConfig.custom()
                .maxAttempts(3)
                .waitDuration(Duration.ofMillis(10))
                .retryExceptions(BankUnavailableException.class)
                .ignoreExceptions(BusinessException.class)
                .build());

    Supplier<PaymentResult> decorated = Bulkhead.decorateSupplier(bulkhead, bankCall);
    decorated = RateLimiter.decorateSupplier(rateLimiter, decorated);
    decorated = CircuitBreaker.decorateSupplier(circuitBreaker, decorated);
    decorated = Retry.decorateSupplier(retry, decorated);
    return decorated;
  }
}
