package com.example.flashsale.payment.infrastructure.resilience;

import com.example.flashsale.common.error.ErrorCode;
import com.example.flashsale.common.error.TransientException;
import com.example.flashsale.payment.domain.strategy.PaymentProvider;
import com.example.flashsale.payment.domain.strategy.PaymentRequest;
import com.example.flashsale.payment.domain.strategy.PaymentResult;
import io.github.resilience4j.bulkhead.annotation.Bulkhead;
import io.github.resilience4j.circuitbreaker.CallNotPermittedException;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.ratelimiter.annotation.RateLimiter;
import io.github.resilience4j.retry.annotation.Retry;
import io.github.resilience4j.timelimiter.annotation.TimeLimiter;
import jakarta.annotation.PreDestroy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * All Resilience4j policies around the payment provider live here — not inside PaymentService.
 *
 * <pre>
 * Retry → CircuitBreaker → RateLimiter → Bulkhead → TimeLimiter → Stripe/Mock
 * </pre>
 * <p>
 * Circuit OPEN returns a failed PaymentResult so the saga can release inventory.
 * Timeouts stay transient so Kafka retries with the same PSP idempotency key.
 */
@Component
public class ResilientPaymentClient {

    private static final Logger log = LoggerFactory.getLogger(ResilientPaymentClient.class);

    private final PaymentProvider provider;
    private final ResilientPaymentClient self;
    private final ExecutorService paymentPool = Executors.newFixedThreadPool(40, r -> {
        Thread t = new Thread(r, "payment-psp");
        t.setDaemon(true);
        return t;
    });

    public ResilientPaymentClient(PaymentProvider provider, @Lazy ResilientPaymentClient self) {
        this.provider = provider;
        this.self = self;
    }

    public PaymentResult charge(PaymentRequest request) {
        try {
            return self.chargeAsync(request)
                    .join();
        } catch (CompletionException ex) {
            Throwable cause = ex.getCause() == null ? ex : ex.getCause();
            throw new TransientException(ErrorCode.SERVICE_UNAVAILABLE, "payment provider: " + cause.getMessage());
        }
    }

    @Retry(name = "payment")
    @CircuitBreaker(name = "payment", fallbackMethod = "openCircuit")
    @RateLimiter(name = "payment")
    @Bulkhead(name = "payment")
    @TimeLimiter(name = "payment")
    public CompletableFuture<PaymentResult> chargeAsync(PaymentRequest request) {
        return CompletableFuture.supplyAsync(() -> provider.pay(request), paymentPool);
    }

    @SuppressWarnings("unused")
    CompletableFuture<PaymentResult> openCircuit(PaymentRequest request, Throwable error) {
        if (isCircuitOpen(error)) {
            log.warn("payment circuit open orderId={}", request.orderId());
            return CompletableFuture.completedFuture(new PaymentResult(false, "circuit-open"));
        }
        log.warn("payment provider unavailable orderId={} cause={}", request.orderId(), error.toString());
        return CompletableFuture.failedFuture(error);
    }

    @PreDestroy
    void shutdown() {
        paymentPool.shutdown();
    }

    private static boolean isCircuitOpen(Throwable error) {
        Throwable cursor = error;
        while (cursor != null) {
            if (cursor instanceof CallNotPermittedException) {
                return true;
            }
            cursor = cursor.getCause();
        }
        return false;
    }
}
