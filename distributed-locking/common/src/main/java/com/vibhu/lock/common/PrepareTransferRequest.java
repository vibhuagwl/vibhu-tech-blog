package com.vibhu.lock.common;

import java.math.BigDecimal;

public record PrepareTransferRequest(
        String transactionId,
        String correlationId,
        String fromAccountId,
        String toAccountId,
        BigDecimal amount,
        LockToken fromAccountLock,
        LockToken toAccountLock
) {
}
