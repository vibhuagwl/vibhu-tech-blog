package com.vibhu.lock.common;

import java.time.Duration;

public record LockLease(
    String lockKey, String ownerToken, long fencingToken, Duration ttl, long acquiredAtEpochMs) {}
