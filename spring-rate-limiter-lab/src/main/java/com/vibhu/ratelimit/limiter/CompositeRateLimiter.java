package com.vibhu.ratelimit.limiter;

import com.vibhu.ratelimit.api.RateLimitPolicy;
import com.vibhu.ratelimit.api.RateLimitResult;
import com.vibhu.ratelimit.api.RateLimiter;
import com.vibhu.ratelimit.api.RequestContext;
import com.vibhu.ratelimit.config.RateLimitConfigProvider;
import com.vibhu.ratelimit.metrics.RateLimitMetrics;
import com.vibhu.ratelimit.store.RateLimitStore;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

/**
 * Evaluates every matching policy in order (global → tenant → client → user → API).
 * A request is allowed only if every applicable bucket grants a token.
 *
 * <p>Checks are sequential, not one multi-key Redis transaction: Cluster hash
 * slots would otherwise force CROSSSLOT errors. Fail-fast on the first reject
 * so we do not spend tokens on inner buckets after an outer reject. That is a
 * trade-off (outer reject "wastes" no inner tokens; a later retry may see a
 * slightly different inner remaining count).
 */
public final class CompositeRateLimiter implements RateLimiter {

  private final RateLimitConfigProvider configs;
  private final RateLimiterFactory factory;
  private final RateLimitMetrics metrics;

  public CompositeRateLimiter(
      RateLimitConfigProvider configs,
      RateLimiterFactory factory,
      RateLimitMetrics metrics
  ) {
    this.configs = configs;
    this.factory = factory;
    this.metrics = metrics;
  }

  @Override
  public RateLimitResult allow(RequestContext request) {
    List<RateLimitPolicy> policies = configs.policiesFor(request);
    if (policies.isEmpty()) {
      metrics.recordUnconfigured();
      return RateLimitResult.allow(Long.MAX_VALUE, Long.MAX_VALUE, "unconfigured", "none");
    }
    RateLimitResult tightestAllow = null;
    for (RateLimitPolicy policy : policies) {
      RateLimiter limiter = factory.limiterFor(policy);
      RateLimitResult result = limiter.allow(request);
      if (!result.allowed()) {
        return result;
      }
      tightestAllow = minRemaining(tightestAllow, result);
    }
    return tightestAllow == null
        ? RateLimitResult.allow(Long.MAX_VALUE, Long.MAX_VALUE, "empty", "none")
        : tightestAllow;
  }

  /**
   * Variant that still evaluates remaining policies after a reject — useful for
   * diagnostics, not the hot path.
   */
  public List<RateLimitResult> evaluateAll(RequestContext request) {
    List<RateLimitResult> out = new ArrayList<>();
    for (RateLimitPolicy policy : configs.policiesFor(request)) {
      out.add(factory.limiterFor(policy).allow(request));
    }
    return List.copyOf(out);
  }

  private static RateLimitResult minRemaining(RateLimitResult a, RateLimitResult b) {
    if (a == null) {
      return b;
    }
    if (b.remainingTokens() < a.remainingTokens()) {
      return b;
    }
    Duration ra = a.retryAfter();
    Duration rb = b.retryAfter();
    if (rb.compareTo(ra) > 0) {
      return b;
    }
    return a;
  }
}
