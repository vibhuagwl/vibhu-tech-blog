package com.vibhu.ratelimit.config;

import com.vibhu.ratelimit.api.RateLimitPolicy;
import java.time.Instant;

/** Admin/config DTO wrapping a policy plus audit timestamp. */
public record RateLimitConfig(String key, RateLimitPolicy policy, Instant updatedAt) {
  public static RateLimitConfig of(RateLimitPolicy policy) {
    return new RateLimitConfig(policy.id(), policy, Instant.now());
  }
}
