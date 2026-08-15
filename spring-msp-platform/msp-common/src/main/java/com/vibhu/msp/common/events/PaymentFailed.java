package com.vibhu.msp.common.events;

public record PaymentFailed(
    String orderId,
    String paymentId,
    String reason
) {}
