package com.vibhu.lock.common;

import java.time.Instant;

public record LockAcquired(
    String transactionId,
    String correlationId,
    String lockKey,
    LockMode mode,
    long fencingToken,
    Instant timestamp) {}
