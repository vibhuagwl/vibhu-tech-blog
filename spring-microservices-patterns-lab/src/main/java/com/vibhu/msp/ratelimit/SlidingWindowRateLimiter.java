package com.vibhu.msp.ratelimit;

import java.time.Duration;
import java.util.Deque;
import java.util.concurrent.ConcurrentLinkedDeque;

/** Sliding-window log rate limiter — precise per-request timestamps. */
public final class SlidingWindowRateLimiter {

  private final long maxRequests;
  private final Duration window;
  private final Deque<Long> requestTimestamps = new ConcurrentLinkedDeque<>();

  public SlidingWindowRateLimiter(long maxRequests, Duration window) {
    if (maxRequests <= 0) {
      throw new IllegalArgumentException("maxRequests must be positive");
    }
    this.maxRequests = maxRequests;
    this.window = window;
  }

  public synchronized boolean tryAcquire() {
    long now = System.currentTimeMillis();
    long windowStart = now - window.toMillis();
    while (!requestTimestamps.isEmpty() && requestTimestamps.peekFirst() < windowStart) {
      requestTimestamps.pollFirst();
    }
    if (requestTimestamps.size() >= maxRequests) {
      return false;
    }
    requestTimestamps.addLast(now);
    return true;
  }

  public synchronized long remaining() {
    long now = System.currentTimeMillis();
    long windowStart = now - window.toMillis();
    requestTimestamps.removeIf(ts -> ts < windowStart);
    return Math.max(0, maxRequests - requestTimestamps.size());
  }

  public Duration window() {
    return window;
  }
}
