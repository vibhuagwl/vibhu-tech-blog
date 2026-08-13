package com.vibhu.spring.cache.lock;

import java.time.Duration;
import java.util.Collections;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "app.cache.redis-enabled", havingValue = "true")
public class RedisDistributedLock implements DistributedLock {
  private static final DefaultRedisScript<Long> UNLOCK =
      new DefaultRedisScript<>(
          """
          if redis.call('get', KEYS[1]) == ARGV[1] then
            return redis.call('del', KEYS[1])
          else
            return 0
          end
          """,
          Long.class);

  private final StringRedisTemplate redis;

  public RedisDistributedLock(StringRedisTemplate redis) {
    this.redis = redis;
  }

  @Override
  public boolean tryLock(String name, String token, Duration ttl) {
    Boolean ok = redis.opsForValue().setIfAbsent(key(name), token, ttl);
    return Boolean.TRUE.equals(ok);
  }

  @Override
  public void unlock(String name, String token) {
    redis.execute(UNLOCK, Collections.singletonList(key(name)), token);
  }

  private static String key(String name) {
    return "lock:" + name;
  }
}
