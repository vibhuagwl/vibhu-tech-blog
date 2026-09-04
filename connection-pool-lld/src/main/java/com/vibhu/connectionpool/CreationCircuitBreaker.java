package com.vibhu.connectionpool;

import java.time.Duration;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Simple consecutive-failure circuit for connection creation.
 * Prevents thundering herd against a downed backend.
 */
public final class CreationCircuitBreaker {
  private final int failureThreshold;
  private final long openDurationNanos;
  private final AtomicInteger consecutiveFailures = new AtomicInteger();
  private final AtomicLong openUntilNanos = new AtomicLong();

  public CreationCircuitBreaker(int failureThreshold, Duration openDuration) {
    this.failureThreshold = failureThreshold;
    this.openDurationNanos = openDuration.toNanos();
  }

  public boolean allowRequest() {
    long until = openUntilNanos.get();
    if (until == 0) {
      return true;
    }
    if (System.nanoTime() >= until) {
      openUntilNanos.compareAndSet(until, 0);
      consecutiveFailures.set(0);
      return true;
    }
    return false;
  }

  public void recordSuccess() {
    consecutiveFailures.set(0);
    openUntilNanos.set(0);
  }

  public void recordFailure() {
    int f = consecutiveFailures.incrementAndGet();
    if (f >= failureThreshold) {
      openUntilNanos.set(System.nanoTime() + openDurationNanos);
    }
  }
}
