package com.vibhu.lock.service;

import com.vibhu.lock.common.LockMode;
import com.vibhu.lock.common.LockToken;
import java.time.Duration;
import java.util.Optional;

public interface LockManager {
  LockToken acquire(
      String lockKey,
      LockMode mode,
      String ownerId,
      String transactionId,
      Duration wait,
      Duration lease);

  boolean renew(String lockKey, String ownerToken, Duration lease);

  boolean release(String lockKey, LockMode mode, String ownerToken);

  Optional<LockStateView> describe(String lockKey);
}
