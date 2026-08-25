package com.vibhu.aifp.common;

import java.math.BigDecimal;
import java.time.Instant;

public record PaymentRecord(
    String paymentId,
    String customerId,
    BigDecimal amount,
    String currency,
    String status,
    String bank,
    String failureCode,
    boolean retryAllowed,
    Instant createdAt) {}
