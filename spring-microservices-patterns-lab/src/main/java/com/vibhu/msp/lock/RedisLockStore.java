package com.vibhu.msp.lock;

import java.time.Duration;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import org.springframework.data.redis.core.StringRedisTemplate;

/**
 * Redis-backed lock store using SET NX PX semantics. Fencing token maxima are tracked in-process
 * (production would use a durable store).
 */
public final class RedisLockStore {

  private final StringRedisTemplate redis;
  private final ConcurrentMap<String, Long> maxFencingToken = new ConcurrentHashMap<>();

  public RedisLockStore(StringRedisTemplate redis) {
    this.redis = redis;
  }

  public Optional<String> tryAcquire(String lockKey, Duration ttl) {
    String token = FencingToken.next();
    Boolean acquired = redis.opsForValue().setIfAbsent(lockKey, token, ttl);
    if (Boolean.TRUE.equals(acquired)) {
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
    String current = redis.opsForValue().get(lockKey);
    if (token.equals(current)) {
      redis.delete(lockKey);
      return true;
    }
    return false;
  }
}
