package com.vibhu.lock.service;

public record LockRenewRequest(
        String lockKey,
        String ownerToken,
        Long leaseMs
) {
}
