package com.vibhu.msp.lock;

import java.time.Duration;
import java.util.Optional;
import java.util.function.Supplier;

/** Redis-style distributed lock with fencing token validation. */
public final class RedisStyleLock {

  private final InMemoryLockStore store;
  private final String lockKey;
  private final Duration ttl;

  public RedisStyleLock(InMemoryLockStore store, String lockKey, Duration ttl) {
    this.store = store;
    this.lockKey = lockKey;
    this.ttl = ttl;
  }

  public Optional<LockHandle> tryLock() {
    return store.tryAcquire(lockKey, ttl).map(LockHandle::new);
  }

  public <T> Optional<T> withLock(Supplier<T> action) {
    Optional<LockHandle> handle = tryLock();
    if (handle.isEmpty()) {
      return Optional.empty();
    }
    try {
      return Optional.of(action.get());
    } finally {
      handle.get().release();
    }
  }

  public final class LockHandle {
    private final String token;

    private LockHandle(String token) {
      this.token = token;
    }

    public long fencingToken() {
      return FencingToken.parse(token);
    }

    public void release() {
      store.release(lockKey, token);
    }

    public boolean validateWrite(long writeToken) {
      return store.validateWrite(lockKey, writeToken);
    }
  }
}
