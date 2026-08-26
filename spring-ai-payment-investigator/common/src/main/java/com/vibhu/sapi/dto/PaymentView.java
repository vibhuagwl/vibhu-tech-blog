package com.vibhu.sapi.dto;

import java.math.BigDecimal;
import java.time.Instant;

public record PaymentView(
    String paymentId,
    String customerId,
    BigDecimal amount,
    String currency,
    String rail,
    String bank,
    String status,
    String failureCode,
    String failureReason,
    int retryCount,
    boolean retryAllowed,
    Instant createdAt,
    Instant updatedAt) {}
