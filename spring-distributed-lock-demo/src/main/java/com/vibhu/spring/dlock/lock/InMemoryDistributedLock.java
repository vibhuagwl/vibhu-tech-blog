package com.vibhu.spring.dlock.lock;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "app.lock.redis-enabled", havingValue = "false", matchIfMissing = true)
public class InMemoryDistributedLock implements DistributedLock {
  private final Map<String, Entry> locks = new ConcurrentHashMap<>();

  @Override
  public synchronized boolean tryLock(String name, String token, Duration ttl) {
    long now = System.currentTimeMillis();
    Entry cur = locks.get(name);
    if (cur != null && cur.expiresAt() > now) {
      return false;
    }
    locks.put(name, new Entry(token, now + ttl.toMillis()));
    return true;
  }

  @Override
  public synchronized void unlock(String name, String token) {
    Entry cur = locks.get(name);
    if (cur != null && cur.token().equals(token)) {
      locks.remove(name);
    }
  }

  private record Entry(String token, long expiresAt) {}
}
