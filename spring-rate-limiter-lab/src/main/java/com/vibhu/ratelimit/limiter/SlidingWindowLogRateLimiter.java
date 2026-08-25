package com.vibhu.ratelimit.limiter;

import com.vibhu.ratelimit.api.RateLimitPolicy;
import com.vibhu.ratelimit.metrics.RateLimitMetrics;
import com.vibhu.ratelimit.store.RateLimitStore;

/** Sliding-window log — accurate per-request timestamps, higher memory per key. */
public final class SlidingWindowLogRateLimiter extends AbstractStoreBackedRateLimiter {

  public SlidingWindowLogRateLimiter(
      RateLimitPolicy policy,
      RateLimitStore store,
      RateLimitStore localFallback,
      RateLimitMetrics metrics) {
    super(policy, store, localFallback, metrics);
  }
}
