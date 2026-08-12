package com.vibhu.lock.common;

import java.time.Instant;

public record LockToken(
        String lockKey,
        String ownerToken,
        long fencingToken,
        LockMode mode,
        long leaseMillis,
        Instant acquiredAt
) {
}
package com.vibhu.lock.common;

import java.time.Instant;

public record LockToken(
    String lockKey,
    LockMode mode,
    String ownerToken,
    long fencingToken,
    Instant expiresAt
) {
}
