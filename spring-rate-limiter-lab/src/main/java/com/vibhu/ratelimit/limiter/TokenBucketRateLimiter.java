package com.vibhu.ratelimit.limiter;

import com.vibhu.ratelimit.api.FailPolicy;
import com.vibhu.ratelimit.api.RateLimitKey;
import com.vibhu.ratelimit.api.RateLimitPolicy;
import com.vibhu.ratelimit.api.RateLimitResult;
import com.vibhu.ratelimit.api.RateLimiter;
import com.vibhu.ratelimit.api.RequestContext;
import com.vibhu.ratelimit.metrics.RateLimitMetrics;
import com.vibhu.ratelimit.store.RateLimitStore;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Primary algorithm: token bucket over a {@link RateLimitStore}. Fail-open / fail-closed /
 * local-fallback is applied when the store throws.
 */
public final class TokenBucketRateLimiter implements RateLimiter {

  private static final Logger log = LoggerFactory.getLogger(TokenBucketRateLimiter.class);

  private final RateLimitPolicy policy;
  private final RateLimitStore store;
  private final RateLimitStore localFallback;
  private final RateLimitMetrics metrics;

  public TokenBucketRateLimiter(
      RateLimitPolicy policy,
      RateLimitStore store,
      RateLimitStore localFallback,
      RateLimitMetrics metrics) {
    this.policy = policy;
    this.store = store;
    this.localFallback = localFallback;
    this.metrics = metrics;
  }

  public RateLimitPolicy policy() {
    return policy;
  }

  @Override
  public RateLimitResult allow(RequestContext request) {
    RateLimitKey key = RateLimitKey.from(policy, request);
    long start = System.nanoTime();
    try {
      RateLimitResult result = store.consume(key, policy, 1.0);
      metrics.recordDecision(policy, result, System.nanoTime() - start);
      return result;
    } catch (RuntimeException ex) {
      metrics.recordStoreError(policy, ex);
      log.warn(
          "rate-limit store failed key={} policy={} failPolicy={}: {}",
          key.redisKey(),
          policy.id(),
          policy.failPolicy(),
          ex.toString());
      return degrade(key, ex);
    }
  }

  private RateLimitResult degrade(RateLimitKey key, RuntimeException ex) {
    FailPolicy fail = policy.failPolicy();
    return switch (fail) {
      case FAIL_OPEN ->
          RateLimitResult.failOpen(
              key.redisKey(), policy.id(), policy.capacity(), "store_unavailable_fail_open");
      case FAIL_CLOSED ->
          RateLimitResult.failClosed(key.redisKey(), policy.id(), "store_unavailable_fail_closed");
      case LOCAL_FALLBACK -> {
        if (localFallback == null) {
          yield RateLimitResult.failClosed(key.redisKey(), policy.id(), "no_local_fallback");
        }
        RateLimitResult local = localFallback.consume(key, policy, 1.0);
        yield new RateLimitResult(
            local.allowed(),
            local.remainingTokens(),
            local.retryAfter(),
            local.limit(),
            local.key(),
            local.policyId(),
            true,
            "local_fallback:" + ex.getClass().getSimpleName());
      }
    };
  }
}
