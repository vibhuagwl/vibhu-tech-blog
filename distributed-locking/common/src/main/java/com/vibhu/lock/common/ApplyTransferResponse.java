package com.vibhu.lock.common;

import java.time.Instant;

public record ApplyTransferResponse(
        String transactionId,
        String correlationId,
        TransferStatus status,
        AccountView fromAccount,
        AccountView toAccount,
        String message,
        Instant appliedAt
) {
}
