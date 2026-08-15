package com.vibhu.lock.common;

import java.math.BigDecimal;

public record ApplyTransferRequest(
    String transactionId,
    String correlationId,
    String fromAccountId,
    String toAccountId,
    BigDecimal amount,
    long fromAccountFence,
    long toAccountFence) {}
