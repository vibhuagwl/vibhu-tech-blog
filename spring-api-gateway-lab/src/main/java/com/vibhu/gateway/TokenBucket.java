package com.vibhu.gateway;

/** Simple token bucket for interview demos. Production uses Redis / AWS usage plans. */
public final class TokenBucket {
  private final long capacity;
  private final double refillPerSec;
  private double tokens;
  private long lastNanos;

  public TokenBucket(long capacity, double refillPerSec) {
    if (capacity < 1 || refillPerSec <= 0) {
      throw new IllegalArgumentException("invalid bucket config");
    }
    this.capacity = capacity;
    this.refillPerSec = refillPerSec;
    this.tokens = capacity;
    this.lastNanos = System.nanoTime();
  }

  public synchronized boolean tryConsume() {
    long now = System.nanoTime();
    tokens = Math.min(capacity, tokens + (now - lastNanos) / 1_000_000_000.0 * refillPerSec);
    lastNanos = now;
    if (tokens < 1.0) {
      return false;
    }
    tokens -= 1.0;
    return true;
  }

  public synchronized double tokens() {
    return tokens;
  }
}
