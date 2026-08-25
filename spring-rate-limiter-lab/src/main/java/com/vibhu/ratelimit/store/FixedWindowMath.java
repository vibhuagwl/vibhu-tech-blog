package com.vibhu.ratelimit.store;

import com.vibhu.ratelimit.api.RateLimitPolicy;
import java.time.Duration;

/**
 * Fixed-window counter math. Each window resets the counter to zero — boundary bursts are possible
 * when traffic straddles two windows (see lab tests).
 */
public final class FixedWindowMath {

  private FixedWindowMath() {}

  public static Decision consume(
      FixedWindowState current, RateLimitPolicy policy, long nowMs, double cost) {
    if (policy.blocked()) {
      return new Decision(
          false, 0, Duration.ofHours(1), limit(policy), new FixedWindowState(nowMs, 0));
    }
    long windowMs = policy.timeWindow().toMillis();
    long windowStart = current.windowStartMs();
    int count = current.count();
    if (nowMs - windowStart >= windowMs) {
      windowStart = alignWindow(nowMs, windowMs);
      count = 0;
    }
    long limit = limit(policy);
    int costInt = (int) Math.ceil(cost);
    boolean allowed;
    Duration retryAfter = Duration.ZERO;
    if (count + costInt <= limit) {
      count += costInt;
      allowed = true;
    } else {
      allowed = false;
      long windowEnd = windowStart + windowMs;
      retryAfter = Duration.ofMillis(Math.max(windowEnd - nowMs, 1));
    }
    long remaining = Math.max(0, limit - count);
    return new Decision(
        allowed, remaining, retryAfter, limit, new FixedWindowState(windowStart, count));
  }

  static long limit(RateLimitPolicy policy) {
    return policy.refillRate();
  }

  static long alignWindow(long nowMs, long windowMs) {
    return (nowMs / windowMs) * windowMs;
  }

  public static FixedWindowState initialState(long nowMs, long windowMs) {
    return new FixedWindowState(alignWindow(nowMs, windowMs), 0);
  }

  public record Decision(
      boolean allowed,
      long remaining,
      Duration retryAfter,
      long limit,
      FixedWindowState nextState) {}
}
