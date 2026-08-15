package com.vibhu.gateway.live.payment;

import java.math.BigDecimal;
import java.time.Instant;

public record PaymentRecord(
    String paymentId,
    String idempotencyKey,
    long fromAccountId,
    long toAccountId,
    BigDecimal amount,
    PaymentStatus status,
    BigDecimal fromBalanceAfter,
    String message,
    Instant createdAt) {}
