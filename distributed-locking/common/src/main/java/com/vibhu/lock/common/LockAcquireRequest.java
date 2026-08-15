package com.vibhu.lock.common;

public record LockAcquireRequest(
    String lockKey,
    LockMode mode,
    String ownerId,
    String transactionId,
    Long waitTimeoutMs,
    Long leaseMs) {}
