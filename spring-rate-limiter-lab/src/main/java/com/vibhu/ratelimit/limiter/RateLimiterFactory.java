package com.vibhu.ratelimit.limiter;

import com.vibhu.ratelimit.api.RateLimitAlgorithm;
import com.vibhu.ratelimit.api.RateLimitPolicy;
import com.vibhu.ratelimit.api.RateLimiter;
import com.vibhu.ratelimit.metrics.RateLimitMetrics;
import com.vibhu.ratelimit.store.InMemoryFixedWindowStore;
import com.vibhu.ratelimit.store.InMemoryLeakyBucketStore;
import com.vibhu.ratelimit.store.InMemoryRateLimitStore;
import com.vibhu.ratelimit.store.InMemorySlidingWindowCounterStore;
import com.vibhu.ratelimit.store.InMemorySlidingWindowLogStore;
import com.vibhu.ratelimit.store.RateLimitStore;
import com.vibhu.ratelimit.store.RedisFixedWindowStore;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Factory + flyweight: one limiter per policy id. Strategy pattern selects algorithm implementation.
 */
public final class RateLimiterFactory {

  private final RateLimitStore tokenBucketPrimary;
  private final InMemoryRateLimitStore tokenBucketLocal;
  private final InMemoryFixedWindowStore fixedWindowLocal;
  private final InMemorySlidingWindowLogStore slidingLogLocal;
  private final InMemorySlidingWindowCounterStore slidingCounterLocal;
  private final InMemoryLeakyBucketStore leakyBucketLocal;
  private final Optional<RedisFixedWindowStore> redisFixedWindow;
  private final RateLimitMetrics metrics;
  private final ConcurrentHashMap<String, RateLimiter> cache = new ConcurrentHashMap<>();

  public RateLimiterFactory(
      RateLimitStore tokenBucketPrimary,
      InMemoryRateLimitStore tokenBucketLocal,
      InMemoryFixedWindowStore fixedWindowLocal,
      InMemorySlidingWindowLogStore slidingLogLocal,
      InMemorySlidingWindowCounterStore slidingCounterLocal,
      InMemoryLeakyBucketStore leakyBucketLocal,
      Optional<RedisFixedWindowStore> redisFixedWindow,
      RateLimitMetrics metrics) {
    this.tokenBucketPrimary = tokenBucketPrimary;
    this.tokenBucketLocal = tokenBucketLocal;
    this.fixedWindowLocal = fixedWindowLocal;
    this.slidingLogLocal = slidingLogLocal;
    this.slidingCounterLocal = slidingCounterLocal;
    this.leakyBucketLocal = leakyBucketLocal;
    this.redisFixedWindow = redisFixedWindow;
    this.metrics = metrics;
  }

  public RateLimiter limiterFor(RateLimitPolicy policy) {
    return cache.compute(
        policy.id(),
        (id, existing) -> {
          if (existing instanceof PolicyBoundRateLimiter bound && bound.policy().equals(policy)) {
            return existing;
          }
          return create(policy);
        });
  }

  public void evict(String policyId) {
    cache.remove(policyId);
  }

  public RateLimiter createStandalone(RateLimitPolicy policy) {
    return create(policy);
  }

  private RateLimiter create(RateLimitPolicy policy) {
    return switch (policy.algorithm()) {
      case TOKEN_BUCKET ->
          new TokenBucketRateLimiter(policy, tokenBucketPrimary, tokenBucketLocal, metrics);
      case FIXED_WINDOW -> {
        RateLimitStore primary =
            redisFixedWindow.isPresent() ? redisFixedWindow.get() : fixedWindowLocal;
        yield new FixedWindowRateLimiter(policy, primary, fixedWindowLocal, metrics);
      }
      case SLIDING_WINDOW_LOG ->
          new SlidingWindowLogRateLimiter(policy, slidingLogLocal, slidingLogLocal, metrics);
      case SLIDING_WINDOW_COUNTER ->
          new SlidingWindowCounterRateLimiter(
              policy, slidingCounterLocal, slidingCounterLocal, metrics);
      case LEAKY_BUCKET ->
          new LeakyBucketRateLimiter(policy, leakyBucketLocal, leakyBucketLocal, metrics);
    };
  }

  public static String algorithmLabel(RateLimitAlgorithm algorithm) {
    return algorithm.name();
  }
}
