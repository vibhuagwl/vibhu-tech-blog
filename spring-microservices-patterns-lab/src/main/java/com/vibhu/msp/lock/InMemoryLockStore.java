package com.vibhu.msp.lock;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

/** In-memory lock store mimicking Redis SET NX PX semantics. Maps to curriculum Part 11. */
public final class InMemoryLockStore {

  private final Map<String, LockEntry> locks = new ConcurrentHashMap<>();
  private final Map<String, Long> maxFencingToken = new ConcurrentHashMap<>();

  private record LockEntry(String token, Instant expiresAt) {
    boolean expired() {
      return Instant.now().isAfter(expiresAt);
    }
  }

  public Optional<String> tryAcquire(String lockKey, Duration ttl) {
    String token = FencingToken.next();
    Instant expiresAt = Instant.now().plus(ttl);
    LockEntry newEntry = new LockEntry(token, expiresAt);

    LockEntry existing = locks.get(lockKey);
    if (existing != null && !existing.expired()) {
      return Optional.empty();
    }
    LockEntry previous = locks.putIfAbsent(lockKey, newEntry);
    if (previous == null || previous.expired()) {
      locks.put(lockKey, newEntry);
      long fencing = FencingToken.parse(token);
      maxFencingToken.merge(lockKey, fencing, Math::max);
      return Optional.of(token);
    }
    return Optional.empty();
  }

  public boolean validateWrite(String lockKey, long writeToken) {
    return writeToken >= maxFencingToken.getOrDefault(lockKey, 0L);
  }

  public boolean release(String lockKey, String token) {
    LockEntry entry = locks.get(lockKey);
    if (entry != null && entry.token().equals(token)) {
      locks.remove(lockKey, entry);
      return true;
    }
    return false;
  }

  public boolean isHeld(String lockKey) {
    LockEntry entry = locks.get(lockKey);
    return entry != null && !entry.expired();
  }
}
