package com.example.flashsale.payment.infrastructure.resilience;

import com.example.flashsale.payment.domain.strategy.PaymentProvider;
import com.example.flashsale.payment.domain.strategy.PaymentRequest;
import com.example.flashsale.payment.domain.strategy.PaymentResult;
import io.github.resilience4j.bulkhead.annotation.Bulkhead;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.ratelimiter.annotation.RateLimiter;
import io.github.resilience4j.retry.annotation.Retry;
import io.github.resilience4j.timelimiter.annotation.TimeLimiter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.concurrent.CompletableFuture;

/**
 * All Resilience4j policies around the payment provider live here — not inside PaymentService.
 *
 * <pre>
 * Retry → CircuitBreaker → RateLimiter → Bulkhead → TimeLimiter → Stripe/Mock
 * </pre>
 * <p>
 * Circuit OPEN returns a failed PaymentResult so the saga can release inventory.
 * TimeLimiter requires a {@link CompletableFuture} in Spring.
 */
@Component
public class ResilientPaymentClient {

    private static final Logger log = LoggerFactory.getLogger(ResilientPaymentClient.class);

    private final PaymentProvider provider;

    public ResilientPaymentClient(PaymentProvider provider) {
        this.provider = provider;
    }

    public PaymentResult charge(PaymentRequest request) {
        return chargeAsync(request).join();
    }

    @Retry(name = "payment")
    @CircuitBreaker(name = "payment", fallbackMethod = "openCircuit")
    @RateLimiter(name = "payment")
    @Bulkhead(name = "payment")
    @TimeLimiter(name = "payment")
    public CompletableFuture<PaymentResult> chargeAsync(PaymentRequest request) {
        return CompletableFuture.supplyAsync(() -> provider.pay(request));
    }

    @SuppressWarnings("unused")
    CompletableFuture<PaymentResult> openCircuit(PaymentRequest request, Throwable error) {
        log.warn("payment resilience fallback orderId={} cause={}", request.orderId(), error.toString());
        return CompletableFuture.completedFuture(
                new PaymentResult(false,
                        "resilience-" + error.getClass()
                                .getSimpleName()));
    }
}
