package com.vibhu.ratelimit.limiter;

import com.vibhu.ratelimit.api.RateLimitPolicy;
import com.vibhu.ratelimit.metrics.RateLimitMetrics;
import com.vibhu.ratelimit.store.RateLimitStore;

/** Leaky-bucket — smooth output rate with bounded queue depth; overflow rejects. */
public final class LeakyBucketRateLimiter extends AbstractStoreBackedRateLimiter {

  public LeakyBucketRateLimiter(
      RateLimitPolicy policy,
      RateLimitStore store,
      RateLimitStore localFallback,
      RateLimitMetrics metrics) {
    super(policy, store, localFallback, metrics);
  }
}
