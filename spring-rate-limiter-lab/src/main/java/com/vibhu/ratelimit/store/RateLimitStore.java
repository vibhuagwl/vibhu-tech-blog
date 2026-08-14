package com.vibhu.ratelimit.store;

import com.vibhu.ratelimit.api.RateLimitKey;
import com.vibhu.ratelimit.api.RateLimitPolicy;
import com.vibhu.ratelimit.api.RateLimitResult;

/**
 * Repository for rate-limit counters. Implementations must make consume+update
 * atomic for a given key (Lua on Redis, {@code compute} on a ConcurrentHashMap).
 */
public interface RateLimitStore {

  RateLimitResult consume(RateLimitKey key, RateLimitPolicy policy, double cost);

  default void delete(RateLimitKey key) {
    // optional
  }
}
