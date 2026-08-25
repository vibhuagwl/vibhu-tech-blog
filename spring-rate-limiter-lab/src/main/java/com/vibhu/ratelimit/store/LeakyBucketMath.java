package com.vibhu.ratelimit.store;

import com.vibhu.ratelimit.api.RateLimitPolicy;
import java.time.Duration;

/**
 * Leaky-bucket: requests add water; the bucket leaks at a constant rate. Overflow (level + cost >
 * capacity) is rejected — smooth output rate with bounded queue depth.
 */
public final class LeakyBucketMath {

  private LeakyBucketMath() {}

  public static Decision consume(
      LeakyBucketState current, RateLimitPolicy policy, long nowMs, double cost) {
    if (policy.blocked()) {
      return new Decision(
          false, 0, Duration.ofHours(1), policy.capacity(), LeakyBucketState.empty(nowMs));
    }
    double level = current.level();
    long lastLeak = current.lastLeakMs();
    long elapsed = nowMs - lastLeak;
    if (elapsed < 0) {
      elapsed = 0;
    }
    double leakRate = policy.refillRate() / (double) policy.refillPeriod().toMillis();
    level = Math.max(0.0, level - elapsed * leakRate);
    long capacity = policy.capacity();
    boolean allowed;
    Duration retryAfter = Duration.ZERO;
    if (level + cost <= capacity) {
      level += cost;
      allowed = true;
    } else {
      allowed = false;
      double needed = level + cost - capacity;
      long retryMs = (long) Math.ceil(needed / leakRate);
      retryAfter = Duration.ofMillis(Math.max(retryMs, 1));
    }
    long remaining = (long) Math.floor(Math.max(0, capacity - level));
    return new Decision(
        allowed, remaining, retryAfter, capacity, new LeakyBucketState(level, nowMs));
  }

  public record Decision(
      boolean allowed,
      long remaining,
      Duration retryAfter,
      long limit,
      LeakyBucketState nextState) {}
}
