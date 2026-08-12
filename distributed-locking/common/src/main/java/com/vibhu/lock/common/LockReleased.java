package com.vibhu.lock.common;

import java.time.Instant;

public record LockReleased(
        String transactionId,
        String correlationId,
        String lockKey,
        LockMode mode,
        Instant timestamp
) {
}
