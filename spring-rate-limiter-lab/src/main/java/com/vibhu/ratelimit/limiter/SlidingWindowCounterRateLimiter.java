package com.vibhu.ratelimit.limiter;

import com.vibhu.ratelimit.api.RateLimitPolicy;
import com.vibhu.ratelimit.metrics.RateLimitMetrics;
import com.vibhu.ratelimit.store.RateLimitStore;

/** Sliding-window counter — weighted blend of previous and current fixed windows. */
public final class SlidingWindowCounterRateLimiter extends AbstractStoreBackedRateLimiter {

  public SlidingWindowCounterRateLimiter(
      RateLimitPolicy policy,
      RateLimitStore store,
      RateLimitStore localFallback,
      RateLimitMetrics metrics) {
    super(policy, store, localFallback, metrics);
  }
}
