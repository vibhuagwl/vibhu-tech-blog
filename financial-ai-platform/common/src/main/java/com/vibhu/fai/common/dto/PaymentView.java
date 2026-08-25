package com.vibhu.fai.common.dto;

import java.math.BigDecimal;
import java.time.Instant;

public record PaymentView(
    String transactionId,
    BigDecimal amount,
    String currency,
    String status,
    String bankResponseCode,
    String failureReason,
    String accountId,
    Instant createdAt) {}
