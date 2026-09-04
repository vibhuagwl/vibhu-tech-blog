package com.vibhu.connectionpool;

import com.vibhu.connectionpool.ConnectionPoolConfig;
import com.vibhu.connectionpool.DefaultConnectionPool;
import com.vibhu.connectionpool.PoolEventListener;
import com.vibhu.connectionpool.PoolState;
import com.vibhu.connectionpool.metrics.DefaultPoolMetrics;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

public final class ConnectionEvictor {
  private final DefaultConnectionPool pool;
  private final ConnectionPoolConfig config;
  private ScheduledExecutorService scheduler;

  public ConnectionEvictor(
      DefaultConnectionPool pool,
      ConnectionPoolConfig config,
      PoolEventListener events,
      DefaultPoolMetrics metrics) {
    this.pool = pool;
    this.config = config;
  }

  public void start() {
    if (config.evictionInterval().isZero() || config.evictionInterval().isNegative()) {
      return;
    }
    scheduler =
        Executors.newSingleThreadScheduledExecutor(
            r -> {
              Thread t = new Thread(r, "pool-evictor");
              t.setDaemon(true);
              return t;
            });
    long ms = config.evictionInterval().toMillis();
    scheduler.scheduleAtFixedRate(
        () -> {
          if (pool.state() == PoolState.RUNNING) {
            pool.evictIdle();
            // Also mark aged borrowed connections for retirement on return
            pool.allConnections().values().forEach(pool::markRetireIfAged);
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
