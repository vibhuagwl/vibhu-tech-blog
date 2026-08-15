package com.vibhu.lock.common;

import java.time.Instant;

public record LockToken(
    String lockKey,
    String ownerToken,
    long fencingToken,
    LockMode mode,
    long leaseMillis,
    Instant acquiredAt) {}
