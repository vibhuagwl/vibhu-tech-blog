package com.vibhu.lock.common;

import java.time.Instant;

public record TransferResponse(
        String transactionId,
        String correlationId,
        TransferStatus status,
        AccountView fromAccount,
        AccountView toAccount,
        String message,
        Instant completedAt
) {
}
package com.vibhu.lock.common;

public record TransferResponse(
    String transactionId,
    TransactionState status
) {
}
