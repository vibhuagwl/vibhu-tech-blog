package com.vibhu.spring.cache.lock;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/** In-process lock for local/demo tests — mirrors Redis NX semantics. */
@Component
@ConditionalOnProperty(name = "app.cache.redis-enabled", havingValue = "false", matchIfMissing = true)
public class InMemoryDistributedLock implements DistributedLock {
  private final Map<String, LockEntry> locks = new ConcurrentHashMap<>();

  @Override
  public synchronized boolean tryLock(String name, String token, Duration ttl) {
    long now = System.currentTimeMillis();
    LockEntry existing = locks.get(name);
    if (existing != null && existing.expiresAtMs() > now) {
      return false;
    }
    locks.put(name, new LockEntry(token, now + ttl.toMillis()));
    return true;
  }

  @Override
  public synchronized void unlock(String name, String token) {
    LockEntry existing = locks.get(name);
    if (existing != null && existing.token().equals(token)) {
      locks.remove(name);
    }
  }

  private record LockEntry(String token, long expiresAtMs) {}
}
