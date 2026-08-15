package com.vibhu.lock.common;

public record LockReleaseRequest(
    String lockKey, LockMode mode, String ownerToken, String transactionId) {}
