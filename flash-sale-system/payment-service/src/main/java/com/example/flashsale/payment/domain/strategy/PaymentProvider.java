package com.example.flashsale.payment.domain.strategy;

public interface PaymentProvider {
    PaymentResult pay(PaymentRequest request);

    String name();
}
