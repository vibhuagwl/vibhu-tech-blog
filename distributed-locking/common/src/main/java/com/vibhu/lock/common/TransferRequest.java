package com.vibhu.lock.common;

import java.math.BigDecimal;

public record TransferRequest(
        String fromAccountId,
        String toAccountId,
        BigDecimal amount,
        String idempotencyKey,
        String correlationId
) {
}
package com.vibhu.lock.common;

import java.math.BigDecimal;

public record TransferRequest(
    String sourceAccountId,
    String destinationAccountId,
    BigDecimal amount,
    String idempotencyKey
) {
}
