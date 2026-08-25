package com.vibhu.aifp.common;

import java.math.BigDecimal;
import java.time.Instant;

public record TransactionRecord(
    String transactionId,
    String paymentId,
    String customerId,
    String type,
    BigDecimal amount,
    String status,
    Instant timestamp) {}
