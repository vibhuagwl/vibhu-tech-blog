package com.example.flashsale.payment.domain.strategy;

public record PaymentRequest(String orderId, String idempotencyKey) {
}
