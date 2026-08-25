package com.vibhu.ratelimit.limiter;

import com.vibhu.ratelimit.api.FailPolicy;
import com.vibhu.ratelimit.api.RateLimitKey;
import com.vibhu.ratelimit.api.RateLimitPolicy;
import com.vibhu.ratelimit.api.RateLimitResult;
import com.vibhu.ratelimit.api.RequestContext;
import com.vibhu.ratelimit.metrics.RateLimitMetrics;
import com.vibhu.ratelimit.store.RateLimitStore;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Shared fail-open / fail-closed / local-fallback handling for store-backed algorithms.
 */
abstract class AbstractStoreBackedRateLimiter implements PolicyBoundRateLimiter {

  private static final Logger log = LoggerFactory.getLogger(AbstractStoreBackedRateLimiter.class);

  private final RateLimitPolicy policy;
  private final RateLimitStore store;
  private final RateLimitStore localFallback;
  private final RateLimitMetrics metrics;

  AbstractStoreBackedRateLimiter(
      RateLimitPolicy policy,
      RateLimitStore store,
      RateLimitStore localFallback,
      RateLimitMetrics metrics) {
    this.policy = policy;
    this.store = store;
    this.localFallback = localFallback;
    this.metrics = metrics;
  }

  @Override
  public RateLimitPolicy policy() {
    return policy;
  }

  @Override
  public RateLimitResult allow(RequestContext request) {
    RateLimitKey key = RateLimitKey.from(policy, request);
    double cost = request.effectiveCost();
    long start = System.nanoTime();
    try {
      RateLimitResult result = store.consume(key, policy, cost);
      metrics.recordDecision(policy, result, System.nanoTime() - start);
      return result;
    } catch (RuntimeException ex) {
      metrics.recordStoreError(policy, ex);
      log.warn(
          "rate-limit store failed key={} policy={} algorithm={} failPolicy={}: {}",
          key.redisKey(),
          policy.id(),
          policy.algorithm(),
          policy.failPolicy(),
          ex.toString());
      return degrade(key, cost, ex);
    }
  }

  private RateLimitResult degrade(RateLimitKey key, double cost, RuntimeException ex) {
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
        RateLimitResult local = localFallback.consume(key, policy, cost);
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
