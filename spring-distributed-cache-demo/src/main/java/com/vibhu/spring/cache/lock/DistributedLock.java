package com.vibhu.spring.cache.lock;

import java.time.Duration;

public interface DistributedLock {
  boolean tryLock(String name, String token, Duration ttl);

  void unlock(String name, String token);
}
