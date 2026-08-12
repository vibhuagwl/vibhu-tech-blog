package com.vibhu.lock.service;

import com.vibhu.lock.common.LockMode;
import com.vibhu.lock.common.LockToken;
import java.time.Duration;
import org.springframework.stereotype.Service;

@Service
public class DistributedLockService {
  private final RedisDistributedLockManager lockManager;

  public DistributedLockService(RedisDistributedLockManager lockManager) {
    this.lockManager = lockManager;
  }

  public LockToken acquireExclusive(String lockKey, String ownerId, String transactionId, Duration wait, Duration lease) {
    return lockManager.tryAcquire(lockKey, LockMode.EXCLUSIVE, ownerId, transactionId, wait, lease);
  }

  public LockToken acquireShared(String lockKey, String ownerId, String transactionId, Duration wait, Duration lease) {
    return lockManager.tryAcquire(lockKey, LockMode.SHARED, ownerId, transactionId, wait, lease);
  }

  public boolean renew(String lockKey, String ownerToken, Duration lease) {
    return lockManager.renew(lockKey, ownerToken, lease);
  }

  public boolean release(String lockKey, LockMode mode, String ownerToken) {
    return lockManager.unlock(lockKey, mode, ownerToken);
  }
}
