package com.vibhu.connectionpool;

import com.vibhu.connectionpool.metrics.PoolMetrics;
import java.time.Duration;

public interface ConnectionPool extends AutoCloseable {
  PooledConnection borrow();

  PooledConnection borrow(Duration timeout);

  void release(PooledConnection connection);

  void invalidate(PooledConnection connection);

  void shutdown();

  PoolMetrics metrics();

  PoolState state();

  @Override
  default void close() {
    shutdown();
  }
}
