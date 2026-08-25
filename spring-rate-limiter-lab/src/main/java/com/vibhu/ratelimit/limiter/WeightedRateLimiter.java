package com.vibhu.ratelimit.limiter;

import com.vibhu.ratelimit.api.RateLimitPolicy;
import com.vibhu.ratelimit.api.RateLimitResult;
import com.vibhu.ratelimit.api.RequestContext;

/**
 * Multiplies request cost before delegating — useful for weighted endpoints (e.g. batch APIs cost
 * N permits).
 */
public final class WeightedRateLimiter implements PolicyBoundRateLimiter {

  private final PolicyBoundRateLimiter delegate;
  private final double weight;

  public WeightedRateLimiter(PolicyBoundRateLimiter delegate, double weight) {
    if (weight <= 0) {
      throw new IllegalArgumentException("weight must be > 0");
    }
    this.delegate = delegate;
    this.weight = weight;
  }

  @Override
  public RateLimitPolicy policy() {
    return delegate.policy();
  }

  @Override
  public RateLimitResult allow(RequestContext request) {
    RequestContext weighted =
        RequestContext.builder()
            .userId(request.userId())
            .clientId(request.clientId())
            .tenantId(request.tenantId())
            .ipAddress(request.ipAddress())
            .apiPath(request.apiPath())
            .httpMethod(request.httpMethod())
            .serviceName(request.serviceName())
            .cost(request.effectiveCost() * weight)
            .build();
    return delegate.allow(weighted);
  }
}
