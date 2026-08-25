package com.vibhu.ratelimit.store;

import com.vibhu.ratelimit.api.RateLimitPolicy;
import java.time.Duration;

/**
 * Sliding-window counter: blend previous and current fixed-window counts with a weight based on
 * elapsed time in the current window. Cheaper than a full log; slightly approximate.
 */
public final class SlidingWindowCounterMath {

  private SlidingWindowCounterMath() {}

  public static Decision consume(
      SlidingWindowCounterState current, RateLimitPolicy policy, long nowMs, double cost) {
    if (policy.blocked()) {
      return new Decision(
          false, 0, Duration.ofHours(1), limit(policy), SlidingWindowCounterState.empty(nowMs));
    }
    long windowMs = policy.timeWindow().toMillis();
    long currentStart = current.currentWindowStartMs();
    int currentCount = current.currentCount();
    int previousCount = current.previousCount();

    if (nowMs - currentStart >= windowMs) {
      previousCount = currentCount;
      currentCount = 0;
      currentStart = alignWindow(nowMs, windowMs);
    }

    long limit = limit(policy);
    double elapsedFraction = (double) (nowMs - currentStart) / windowMs;
    double weighted = previousCount * (1.0 - elapsedFraction) + currentCount;
    int costInt = (int) Math.ceil(cost);
    boolean allowed;
    Duration retryAfter = Duration.ZERO;

    if (weighted + costInt <= limit) {
      currentCount += costInt;
      allowed = true;
    } else {
      allowed = false;
      long windowEnd = currentStart + windowMs;
      retryAfter = Duration.ofMillis(Math.max(windowEnd - nowMs, 1));
    }

    double remainingWeighted = Math.max(0, limit - (weighted + (allowed ? costInt : 0)));
    SlidingWindowCounterState next =
        new SlidingWindowCounterState(currentStart, currentCount, previousCount);
    return new Decision(allowed, (long) Math.floor(remainingWeighted), retryAfter, limit, next);
  }

  static long limit(RateLimitPolicy policy) {
    return policy.refillRate();
  }

  private static long alignWindow(long nowMs, long windowMs) {
    return (nowMs / windowMs) * windowMs;
  }

  public record Decision(
      boolean allowed,
      long remaining,
      Duration retryAfter,
      long limit,
      SlidingWindowCounterState nextState) {}
}
