package com.vibhu.resilience;

import org.springframework.stereotype.Service;

@Service
public class OrderService {
    private final PaymentGatewayClient payments;
    private final IdempotencyStore idempotency;
    private final FraudCheckClient fraud;

    public OrderService(PaymentGatewayClient payments, IdempotencyStore idempotency, FraudCheckClient fraud) {
        this.payments = payments;
        this.idempotency = idempotency;
        this.fraud = fraud;
    }

    public PaymentResult placeOrder(PayRequest request) {
        if (request.idempotencyKey() == null || request.idempotencyKey()
                .isBlank()) {
            throw new IllegalArgumentException("idempotencyKey required");
        }
        fraud.screen(request.customerId());
        return idempotency.once(request.idempotencyKey(), () -> payments.charge(request));
    }
}
