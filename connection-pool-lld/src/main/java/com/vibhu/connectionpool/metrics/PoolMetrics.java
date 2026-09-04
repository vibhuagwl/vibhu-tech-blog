package com.vibhu.connectionpool.metrics;

/** Snapshot-oriented metrics view — counters use LongAdder under the hood. */
public interface PoolMetrics {
  long totalCreated();

  long totalClosed();

  long totalBorrowed();

  long totalReleased();

  long totalTimedOut();

  long totalValidationFailures();

  long totalCreationFailures();

  long totalLeaksDetected();

  long totalEvicted();

  long activeConnections();

  long idleConnections();

  long waitingThreads();

  long totalConnections();
}
