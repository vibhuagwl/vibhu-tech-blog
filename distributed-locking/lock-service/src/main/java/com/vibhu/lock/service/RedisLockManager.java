package com.vibhu.lock.service;

import com.vibhu.lock.common.LockMode;
import com.vibhu.lock.common.LockToken;
import java.time.Duration;
import java.util.Optional;
import org.springframework.stereotype.Component;

/** Alias facade matching the LockManager naming used in the design docs. */
@Component
public class RedisLockManager implements LockManager {
  private final RedisDistributedLockManager delegate;

  public RedisLockManager(RedisDistributedLockManager delegate) {
    this.delegate = delegate;
  }

  @Override
  public LockToken acquire(String lockKey, LockMode mode, String ownerId, String transactionId, Duration wait, Duration lease) {
    return delegate.tryAcquire(lockKey, mode, ownerId, transactionId, wait, lease);
  }

  @Override
  public boolean renew(String lockKey, String ownerToken, Duration lease) {
    return delegate.renew(lockKey, ownerToken, lease);
  }

  @Override
  public boolean release(String lockKey, LockMode mode, String ownerToken) {
    return delegate.unlock(lockKey, mode, ownerToken);
  }

  @Override
  public Optional<LockStateView> describe(String lockKey) {
    return Optional.of(delegate.describe(lockKey));
  }
}
