package com.vibhu.ratelimit.store;

import com.vibhu.ratelimit.api.RateLimitPolicy;
import java.time.Duration;
import java.util.ArrayDeque;
import java.util.Deque;

/**
 * Sliding-window log: store timestamps of accepted requests. Accurate but memory-heavy (O(limit)
 * per key).
 */
public final class SlidingWindowLogMath {

  private SlidingWindowLogMath() {}

  public static Decision consume(
      Deque<Long> timestamps, RateLimitPolicy policy, long nowMs, double cost) {
    if (policy.blocked()) {
      return new Decision(
          false, 0, Duration.ofHours(1), limit(policy), prune(timestamps, nowMs, policy));
    }
    long windowMs = policy.timeWindow().toMillis();
    prune(timestamps, nowMs, policy);
    long limit = limit(policy);
    int costInt = (int) Math.ceil(cost);
    boolean allowed;
    Duration retryAfter = Duration.ZERO;
    if (timestamps.size() + costInt <= limit) {
      for (int i = 0; i < costInt; i++) {
        timestamps.addLast(nowMs);
      }
      allowed = true;
    } else {
      allowed = false;
      Long oldest = timestamps.peekFirst();
      long retryMs = oldest == null ? windowMs : Math.max(windowMs - (nowMs - oldest), 1);
      retryAfter = Duration.ofMillis(retryMs);
    }
    long remaining = Math.max(0, limit - timestamps.size());
    return new Decision(allowed, remaining, retryAfter, limit, timestamps);
  }

  private static Deque<Long> prune(Deque<Long> timestamps, long nowMs, RateLimitPolicy policy) {
    long windowMs = policy.timeWindow().toMillis();
    long cutoff = nowMs - windowMs;
    while (!timestamps.isEmpty() && timestamps.peekFirst() <= cutoff) {
      timestamps.removeFirst();
    }
    return timestamps;
  }

  static long limit(RateLimitPolicy policy) {
    return policy.refillRate();
  }

  public record Decision(
      boolean allowed,
      long remaining,
      Duration retryAfter,
      long limit,
      Deque<Long> nextTimestamps) {}
}
