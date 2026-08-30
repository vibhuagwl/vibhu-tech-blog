package com.example.flashsale.payment.infrastructure.provider;

import com.example.flashsale.payment.domain.strategy.PaymentProvider;
import com.example.flashsale.payment.domain.strategy.PaymentRequest;
import com.example.flashsale.payment.domain.strategy.PaymentResult;
import org.springframework.stereotype.Component;

/**
 * Adapter only — wire Stripe SDK here. Not hard-coded inside PaymentService.
 */
@Component
public class StripePaymentProvider implements PaymentProvider {
    @Override
    public PaymentResult pay(PaymentRequest request) {
        throw new UnsupportedOperationException("Configure Stripe keys in a real environment");
    }

    @Override
    public String name() {
        return "stripe";
    }
}
