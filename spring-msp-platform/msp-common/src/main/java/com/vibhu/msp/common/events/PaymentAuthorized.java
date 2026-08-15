package com.vibhu.msp.common.events;

import java.math.BigDecimal;

public record PaymentAuthorized(
    String orderId,
    String paymentId,
    BigDecimal amount
) {}
