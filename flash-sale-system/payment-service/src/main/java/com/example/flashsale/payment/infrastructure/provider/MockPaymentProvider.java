package com.example.flashsale.payment.infrastructure.provider;

import com.example.flashsale.payment.domain.strategy.PaymentProvider;
import com.example.flashsale.payment.domain.strategy.PaymentRequest;
import com.example.flashsale.payment.domain.strategy.PaymentResult;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

import java.util.concurrent.ConcurrentHashMap;

/**
 * Lab PSP. Resilience4j wraps this via {@code ResilientPaymentClient}.
 * Cached by idempotency key so a timeout retry cannot double-charge.
 */
@Component
@Primary
public class MockPaymentProvider implements PaymentProvider {

    private final ConcurrentHashMap<String, PaymentResult> byIdempotencyKey = new ConcurrentHashMap<>();

    @Override
    public PaymentResult pay(PaymentRequest request) {
        return byIdempotencyKey.computeIfAbsent(request.idempotencyKey(), key -> {
            if (request.orderId()
                    .endsWith("fail")) {
                return new PaymentResult(false, "mock-declined");
            }
            return new PaymentResult(true, "mock-" + key);
        });
    }

    @Override
    public String name() {
        return "mock";
    }
}
