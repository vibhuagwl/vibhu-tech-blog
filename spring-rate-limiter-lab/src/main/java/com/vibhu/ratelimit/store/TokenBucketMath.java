package com.vibhu.ratelimit.store;

import com.vibhu.ratelimit.api.RateLimitPolicy;
import java.time.Duration;

/**
 * Pure token-bucket math shared by the in-memory store and documented as the
 * contract the Redis Lua script must match. Keep this lock-free and allocation-light.
 */
public final class TokenBucketMath {

  private TokenBucketMath() {}

  public static Decision consume(TokenBucketState current, RateLimitPolicy policy, long nowMs, double cost) {
    if (policy.blocked()) {
      return new Decision(false, 0, Duration.ofHours(1), policy.capacity(), TokenBucketState.full(0, nowMs));
    }
    double tokens = current.tokens();
    long ts = current.lastRefillEpochMs();
    long elapsed = nowMs - ts;
    if (elapsed < 0) {
      elapsed = 0;
    }
    double refill = (elapsed / (double) policy.refillPeriod().toMillis()) * policy.refillRate();
    tokens = Math.min(policy.capacity(), tokens + refill);
    boolean allowed;
    Duration retryAfter = Duration.ZERO;
    if (tokens >= cost) {
      tokens -= cost;
      allowed = true;
    } else {
      allowed = false;
      double needed = cost - tokens;
      long retryMs = (long) Math.ceil((needed / (double) policy.refillRate()) * policy.refillPeriod().toMillis());
      retryAfter = Duration.ofMillis(Math.max(retryMs, 1));
    }
    TokenBucketState next = new TokenBucketState(tokens, nowMs);
    return new Decision(allowed, (long) Math.floor(tokens), retryAfter, policy.capacity(), next);
  }

  public record Decision(
      boolean allowed,
      long remaining,
      Duration retryAfter,
      long limit,
      TokenBucketState nextState
  ) {}
}
