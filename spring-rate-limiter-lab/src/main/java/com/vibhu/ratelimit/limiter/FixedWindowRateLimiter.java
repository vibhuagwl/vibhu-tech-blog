package com.vibhu.ratelimit.limiter;

import com.vibhu.ratelimit.api.RateLimitPolicy;
import com.vibhu.ratelimit.metrics.RateLimitMetrics;
import com.vibhu.ratelimit.store.RateLimitStore;

/** Fixed-window counter rate limiter. Boundary bursts at window edges are a known trade-off. */
public final class FixedWindowRateLimiter extends AbstractStoreBackedRateLimiter {

  public FixedWindowRateLimiter(
      RateLimitPolicy policy,
      RateLimitStore store,
      RateLimitStore localFallback,
      RateLimitMetrics metrics) {
    super(policy, store, localFallback, metrics);
  }
}
