package com.vibhu.lock.service;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

/**
 * Monotonic fencing tokens via Redis INCR fence:{lockKey}. Tokens are embedded into lock values by
 * {@link RedisDistributedLockManager}.
 */
@Service
public class FencingTokenService {
  private final StringRedisTemplate redis;

  public FencingTokenService(StringRedisTemplate redis) {
    this.redis = redis;
  }

  public long nextToken(String lockKey) {
    Long value = redis.opsForValue().increment("fence:" + lockKey);
    if (value == null) {
      throw new IllegalStateException("Failed to allocate fencing token for " + lockKey);
    }
    return value;
  }

  public long currentToken(String lockKey) {
    String raw = redis.opsForValue().get("fence:" + lockKey);
    if (raw == null || raw.isBlank()) {
      return 0L;
    }
    return Long.parseLong(raw);
  }
}
