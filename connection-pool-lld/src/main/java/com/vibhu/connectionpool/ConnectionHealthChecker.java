package com.vibhu.connectionpool;

import com.vibhu.connectionpool.ConnectionPoolConfig;
import com.vibhu.connectionpool.ConnectionValidator;
import com.vibhu.connectionpool.DefaultConnectionPool;
import com.vibhu.connectionpool.PoolEventListener;
import com.vibhu.connectionpool.PoolState;
import com.vibhu.connectionpool.metrics.DefaultPoolMetrics;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

public final class ConnectionHealthChecker {
  private final DefaultConnectionPool pool;
  private final ConnectionPoolConfig config;
  private ScheduledExecutorService scheduler;

  public ConnectionHealthChecker(
      DefaultConnectionPool pool,
      ConnectionPoolConfig config,
      ConnectionValidator validator,
      PoolEventListener events,
      DefaultPoolMetrics metrics) {
    this.pool = pool;
    this.config = config;
  }

  public void start() {
    if (config.healthCheckInterval().isZero() || config.healthCheckInterval().isNegative()) {
      return;
    }
    scheduler =
        Executors.newSingleThreadScheduledExecutor(
            r -> {
              Thread t = new Thread(r, "pool-health");
              t.setDaemon(true);
              return t;
            });
    long ms = config.healthCheckInterval().toMillis();
    scheduler.scheduleAtFixedRate(
        () -> {
          if (pool.state() == PoolState.RUNNING) {
            pool.healthCheckIdle();
          }
        },
        ms,
        ms,
        TimeUnit.MILLISECONDS);
  }

  public void stop() {
    if (scheduler != null) {
      scheduler.shutdownNow();
    }
  }
}
