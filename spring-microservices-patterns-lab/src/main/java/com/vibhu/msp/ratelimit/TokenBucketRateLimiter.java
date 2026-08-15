package com.vibhu.msp.ratelimit;

import java.time.Duration;
import java.util.concurrent.atomic.AtomicLong;

/** In-memory token bucket rate limiter. Maps to curriculum Part 09 (rate limiting). */
public final class TokenBucketRateLimiter {

  private final long capacity;
  private final double refillRatePerSecond;
  private final AtomicLong tokensMicros;
  private volatile long lastRefillNanos;

  public TokenBucketRateLimiter(long capacity, double refillRatePerSecond) {
    if (capacity <= 0 || refillRatePerSecond <= 0) {
      throw new IllegalArgumentException("capacity and refillRate must be positive");
    }
    this.capacity = capacity;
    this.refillRatePerSecond = refillRatePerSecond;
    this.tokensMicros = new AtomicLong(capacity * 1_000_000L);
    this.lastRefillNanos = System.nanoTime();
  }

  public boolean tryAcquire() {
    return tryAcquire(1);
  }

  public boolean tryAcquire(long cost) {
    refill();
    while (true) {
      long currentMicros = tokensMicros.get();
      long costMicros = cost * 1_000_000L;
      if (currentMicros < costMicros) {
        return false;
      }
      if (tokensMicros.compareAndSet(currentMicros, currentMicros - costMicros)) {
        return true;
      }
    }
  }

  public long availableTokens() {
    refill();
    return tokensMicros.get() / 1_000_000L;
  }

  private void refill() {
    long now = System.nanoTime();
    long elapsedNanos = now - lastRefillNanos;
    if (elapsedNanos <= 0) {
      return;
    }
    double added = (elapsedNanos / 1_000_000_000.0) * refillRatePerSecond;
    long addedMicros = (long) (added * 1_000_000L);
    if (addedMicros > 0) {
      tokensMicros.updateAndGet(current -> Math.min(capacity * 1_000_000L, current + addedMicros));
      lastRefillNanos = now;
    }
  }

  public Duration estimatedWait() {
    refill();
    long deficitMicros = 1_000_000L - tokensMicros.get();
    if (deficitMicros <= 0) {
      return Duration.ZERO;
    }
    long waitMs = (long) Math.ceil((deficitMicros / 1_000_000.0) / refillRatePerSecond * 1000);
    return Duration.ofMillis(Math.max(waitMs, 1));
  }
}
