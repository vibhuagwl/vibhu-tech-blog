package com.vibhu.ratelimit.store;

import com.vibhu.ratelimit.api.RateLimitKey;
import com.vibhu.ratelimit.api.RateLimitPolicy;
import com.vibhu.ratelimit.api.RateLimitResult;
import com.vibhu.ratelimit.clock.Clock;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.List;
import java.util.Objects;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;

/**
 * Distributed token bucket via a single-key Lua script. Redis runs refill + consume atomically, so
 * two app servers cannot spend the same token.
 */
public final class RedisRateLimitStore implements RateLimitStore {

  static final String SCRIPT_RESOURCE = "/lua/token_bucket.lua";

  private final StringRedisTemplate redis;
  private final DefaultRedisScript<List> script;
  private final Clock clock;

  public RedisRateLimitStore(StringRedisTemplate redis, Clock clock) {
    this.redis = Objects.requireNonNull(redis, "redis");
    this.clock = Objects.requireNonNull(clock, "clock");
    this.script = new DefaultRedisScript<>();
    this.script.setScriptText(loadScript());
    this.script.setResultType(List.class);
  }

  RedisRateLimitStore(StringRedisTemplate redis, Clock clock, String scriptText) {
    this.redis = redis;
    this.clock = clock;
    this.script = new DefaultRedisScript<>();
    this.script.setScriptText(scriptText);
    this.script.setResultType(List.class);
  }

  @Override
  @SuppressWarnings("unchecked")
  public RateLimitResult consume(RateLimitKey key, RateLimitPolicy policy, double cost) {
    String redisKey = key.redisKey();
    if (policy.blocked()) {
      return RateLimitResult.blocked(redisKey, policy.id());
    }
    List<Long> raw =
        (List<Long>)
            redis.execute(
                script,
                List.of(redisKey),
                String.valueOf(policy.capacity()),
                String.valueOf(policy.refillRate()),
                String.valueOf(policy.refillPeriod().toMillis()),
                String.valueOf(clock.millis()),
                String.valueOf((long) Math.ceil(cost)),
                String.valueOf(policy.ttlMillis()));
    if (raw == null || raw.size() < 4) {
      throw new IllegalStateException("token-bucket Lua returned unexpected payload: " + raw);
    }
    boolean allowed = toLong(raw.get(0)) == 1L;
    long remaining = toLong(raw.get(1));
    long retryMs = toLong(raw.get(2));
    long limit = toLong(raw.get(3));
    if (allowed) {
      return RateLimitResult.allow(remaining, limit, redisKey, policy.id());
    }
    return RateLimitResult.reject(
        remaining, Duration.ofMillis(Math.max(retryMs, 1)), limit, redisKey, policy.id());
  }

  @Override
  public void delete(RateLimitKey key) {
    redis.delete(key.redisKey());
  }

  public static String loadScript() {
    try (InputStream in = RedisRateLimitStore.class.getResourceAsStream(SCRIPT_RESOURCE)) {
      if (in == null) {
        throw new IllegalStateException("Missing classpath resource " + SCRIPT_RESOURCE);
      }
      return new String(in.readAllBytes(), StandardCharsets.UTF_8);
    } catch (IOException e) {
      throw new IllegalStateException("Unable to load " + SCRIPT_RESOURCE, e);
    }
  }

  private static long toLong(Object value) {
    if (value instanceof Number n) {
      return n.longValue();
    }
    return Long.parseLong(String.valueOf(value));
  }
}
