package com.vibhu.ratelimit.limiter;

import com.vibhu.ratelimit.api.RateLimitAlgorithm;
import com.vibhu.ratelimit.api.RateLimitPolicy;
import com.vibhu.ratelimit.api.RateLimiter;
import com.vibhu.ratelimit.metrics.RateLimitMetrics;
import com.vibhu.ratelimit.store.InMemoryRateLimitStore;
import com.vibhu.ratelimit.store.RateLimitStore;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Factory + flyweight: one {@link TokenBucketRateLimiter} per policy id.
 * Strategy pattern: algorithm enum selects the implementation. This lab's
 * production path is token bucket; other algorithms are rejected so interviews
 * stay honest about what is actually implemented.
 */
public final class RateLimiterFactory {

  private final RateLimitStore primary;
  private final InMemoryRateLimitStore localFallback;
  private final RateLimitMetrics metrics;
  private final ConcurrentHashMap<String, RateLimiter> cache = new ConcurrentHashMap<>();

  public RateLimiterFactory(
      RateLimitStore primary,
      InMemoryRateLimitStore localFallback,
      RateLimitMetrics metrics
  ) {
    this.primary = primary;
    this.localFallback = localFallback;
    this.metrics = metrics;
  }

  public RateLimiter limiterFor(RateLimitPolicy policy) {
    return cache.compute(policy.id(), (id, existing) -> {
      if (existing instanceof TokenBucketRateLimiter tb && tb.policy().equals(policy)) {
        return existing;
      }
      return create(policy);
    });
  }

  public void evict(String policyId) {
    cache.remove(policyId);
  }

  private RateLimiter create(RateLimitPolicy policy) {
    if (policy.algorithm() != RateLimitAlgorithm.TOKEN_BUCKET) {
      throw new UnsupportedOperationException(
          "Algorithm " + policy.algorithm() + " is documented in the hub but not implemented in this lab. Use TOKEN_BUCKET."
      );
    }
    return new TokenBucketRateLimiter(policy, primary, localFallback, metrics);
  }
}
