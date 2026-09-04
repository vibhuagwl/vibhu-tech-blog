package com.vibhu.connectionpool.metrics;

import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.LongAdder;

public final class DefaultPoolMetrics implements PoolMetrics {
  private final LongAdder totalCreated = new LongAdder();
  private final LongAdder totalClosed = new LongAdder();
  private final LongAdder totalBorrowed = new LongAdder();
  private final LongAdder totalReleased = new LongAdder();
  private final LongAdder totalTimedOut = new LongAdder();
  private final LongAdder totalValidationFailures = new LongAdder();
  private final LongAdder totalCreationFailures = new LongAdder();
  private final LongAdder totalLeaksDetected = new LongAdder();
  private final LongAdder totalEvicted = new LongAdder();
  private final AtomicInteger active = new AtomicInteger();
  private final AtomicInteger idle = new AtomicInteger();
  private final AtomicInteger waiting = new AtomicInteger();
  private final AtomicInteger total = new AtomicInteger();

  public void incCreated() {
    totalCreated.increment();
  }

  public void incClosed() {
    totalClosed.increment();
  }

  public void incBorrowed() {
    totalBorrowed.increment();
  }

  public void incReleased() {
    totalReleased.increment();
  }

  public void incTimedOut() {
    totalTimedOut.increment();
  }

  public void incValidationFailures() {
    totalValidationFailures.increment();
  }

  public void incCreationFailures() {
    totalCreationFailures.increment();
  }

  public void incLeaks() {
    totalLeaksDetected.increment();
  }

  public void incEvicted() {
    totalEvicted.increment();
  }

  public void setActive(int v) {
    active.set(v);
  }

  public void setIdle(int v) {
    idle.set(v);
  }

  public void setWaiting(int v) {
    waiting.set(v);
  }

  public void setTotal(int v) {
    total.set(v);
  }

  @Override
  public long totalCreated() {
    return totalCreated.sum();
  }

  @Override
  public long totalClosed() {
    return totalClosed.sum();
  }

  @Override
  public long totalBorrowed() {
    return totalBorrowed.sum();
  }

  @Override
  public long totalReleased() {
    return totalReleased.sum();
  }

  @Override
  public long totalTimedOut() {
    return totalTimedOut.sum();
  }

  @Override
  public long totalValidationFailures() {
    return totalValidationFailures.sum();
  }

  @Override
  public long totalCreationFailures() {
    return totalCreationFailures.sum();
  }

  @Override
  public long totalLeaksDetected() {
    return totalLeaksDetected.sum();
  }

  @Override
  public long totalEvicted() {
    return totalEvicted.sum();
  }

  @Override
  public long activeConnections() {
    return active.get();
  }

  @Override
  public long idleConnections() {
    return idle.get();
  }

  @Override
  public long waitingThreads() {
    return waiting.get();
  }

  @Override
  public long totalConnections() {
    return total.get();
  }
}
