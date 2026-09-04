package com.vibhu.connectionpool;

import com.vibhu.connectionpool.ConnectionPoolConfig;
import com.vibhu.connectionpool.DefaultConnectionPool;
import com.vibhu.connectionpool.PooledConnection;
import com.vibhu.connectionpool.PoolEventListener;
import com.vibhu.connectionpool.PoolState;
import com.vibhu.connectionpool.metrics.DefaultPoolMetrics;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

/** Optional leak detector — logs/metrics only; does not kill connections by default. */
public final class ConnectionLeakDetector {
  private final DefaultConnectionPool pool;
  private final ConnectionPoolConfig config;
  private final PoolEventListener events;
  private final DefaultPoolMetrics metrics;
  private ScheduledExecutorService scheduler;

  public ConnectionLeakDetector(
      DefaultConnectionPool pool,
      ConnectionPoolConfig config,
      PoolEventListener events,
      DefaultPoolMetrics metrics) {
    this.pool = pool;
    this.config = config;
    this.events = events;
    this.metrics = metrics;
  }

  public void start() {
    if (config.leakDetectionThreshold().isZero() || config.leakDetectionThreshold().isNegative()) {
      return;
    }
    scheduler =
        Executors.newSingleThreadScheduledExecutor(
            r -> {
              Thread t = new Thread(r, "pool-leak-detector");
              t.setDaemon(true);
              return t;
            });
    long periodMs = Math.max(1000, config.leakDetectionThreshold().toMillis() / 2);
    scheduler.scheduleAtFixedRate(this::scan, periodMs, periodMs, TimeUnit.MILLISECONDS);
  }

  public void stop() {
    if (scheduler != null) {
      scheduler.shutdownNow();
    }
  }

  private void scan() {
    if (pool.state() != PoolState.RUNNING) {
      return;
    }
    long thresholdNanos = config.leakDetectionThreshold().toNanos();
    long now = System.nanoTime();
    for (PooledConnection pc : pool.allConnections().values()) {
      if (pc.state() == com.vibhu.connectionpool.ConnectionState.BORROWED
          || pc.state() == com.vibhu.connectionpool.ConnectionState.RETIRE_ON_RETURN) {
        long borrowedFor = now - pc.borrowedAtNanos();
        if (borrowedFor >= thresholdNanos) {
          metrics.incLeaks();
          events.onLeakDetected(
              pc.id(),
              pc.borrowerThread() == null ? "?" : pc.borrowerThread(),
              TimeUnit.NANOSECONDS.toMillis(borrowedFor));
        }
      }
    }
  }
}
