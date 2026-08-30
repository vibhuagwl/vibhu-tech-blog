package com.example.flashsale.payment.infrastructure.provider;

import com.example.flashsale.payment.domain.strategy.PaymentProvider;
import com.example.flashsale.payment.domain.strategy.PaymentRequest;
import com.example.flashsale.payment.domain.strategy.PaymentResult;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

/**
 * Lab PSP. Resilience4j wraps this via {@code ResilientPaymentClient} — do not put @CircuitBreaker here
 * or the Strategy stays mixed with infrastructure.
 */
@Component
@Primary
public class MockPaymentProvider implements PaymentProvider {

    @Override
    public PaymentResult pay(PaymentRequest request) {
        if (request.orderId()
                .endsWith("fail")) {
            return new PaymentResult(false, "mock-declined");
        }
        return new PaymentResult(true, "mock-" + request.idempotencyKey());
    }

    @Override
    public String name() {
        return "mock";
    }
}
