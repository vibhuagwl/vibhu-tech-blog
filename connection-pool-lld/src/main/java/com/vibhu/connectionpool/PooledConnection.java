package com.vibhu.connectionpool;

import java.time.Duration;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicReference;

/**
 * Proxy / decorator around a physical {@link Connection}.
 *
 * <p>{@link #close()} means <strong>return to pool</strong>, not physical close. Physical close
 * happens via {@link #closeUnderlying()} when the pool retires/invalidates the connection.
 *
 * <p>Double-release is idempotent: second {@link #close()} is a no-op.
 */
public final class PooledConnection implements Connection {
  private final long id;
  private final Connection underlying;
  private final DefaultConnectionPool pool;
  private final AtomicReference<ConnectionState> state =
      new AtomicReference<>(ConnectionState.CREATED);
  private final AtomicBoolean returned = new AtomicBoolean(false);
  private final long createdAtNanos = System.nanoTime();
  private volatile long lastIdleAtNanos = createdAtNanos;
  private volatile long borrowedAtNanos;
  private volatile String borrowerThread;
  private volatile StackTraceElement[] borrowStack;

  PooledConnection(long id, Connection underlying, DefaultConnectionPool pool) {
    this.id = id;
    this.underlying = underlying;
    this.pool = pool;
  }

  public long id() {
    return id;
  }

  public Connection underlying() {
    return underlying;
  }

  public ConnectionState state() {
    return state.get();
  }

  long createdAtNanos() {
    return createdAtNanos;
  }

  long lastIdleAtNanos() {
    return lastIdleAtNanos;
  }

  long borrowedAtNanos() {
    return borrowedAtNanos;
  }

  String borrowerThread() {
    return borrowerThread;
  }

  StackTraceElement[] borrowStack() {
    return borrowStack;
  }

  void transition(ConnectionState from, ConnectionState to) {
    if (!state.compareAndSet(from, to)) {
      ConnectionState cur = state.get();
      if (cur == to) {
        return;
      }
      throw new IllegalStateException("Illegal transition " + cur + " -> " + to + " (expected " + from + ")");
    }
  }

  void forceState(ConnectionState to) {
    state.set(to);
  }

  void markIdle() {
    lastIdleAtNanos = System.nanoTime();
    borrowerThread = null;
    borrowStack = null;
    state.set(ConnectionState.IDLE);
  }

  void markBorrowed(boolean captureStack) {
    returned.set(false);
    borrowedAtNanos = System.nanoTime();
    borrowerThread = Thread.currentThread().getName();
    if (captureStack) {
      borrowStack = Thread.currentThread().getStackTrace();
    }
    state.set(ConnectionState.BORROWED);
  }

  void markRetireOnReturn() {
    state.compareAndSet(ConnectionState.BORROWED, ConnectionState.RETIRE_ON_RETURN);
  }

  boolean tryMarkInvalidFrom(ConnectionState expected) {
    return state.compareAndSet(expected, ConnectionState.INVALID);
  }

  boolean ageExceeded(Duration maxLifetime) {
    if (maxLifetime.isZero() || maxLifetime.isNegative()) {
      return false;
    }
    return System.nanoTime() - createdAtNanos >= maxLifetime.toNanos();
  }

  boolean idleExceeded(Duration idleTimeout) {
    if (idleTimeout.isZero() || idleTimeout.isNegative()) {
      return false;
    }
    return state.get() == ConnectionState.IDLE
        && System.nanoTime() - lastIdleAtNanos >= idleTimeout.toNanos();
  }

  boolean isReturned() {
    return returned.get();
  }

  /**
   * Linearization for double-release: only the first close() that flips returned wins.
   *
   * @return true if this call owns the return-to-pool path
   */
  boolean claimReturn() {
    return returned.compareAndSet(false, true);
  }

  @Override
  public boolean isOpen() {
    return underlying.isOpen();
  }

  /**
   * AutoCloseable contract for try-with-resources: returns the connection to the pool. Does NOT
   * close the underlying resource.
   */
  @Override
  public void close() {
    pool.release(this);
  }

  /** Physically close the underlying resource. Idempotent. */
  void closeUnderlying() {
    forceState(ConnectionState.CLOSING);
    try {
      underlying.close();
    } finally {
      forceState(ConnectionState.CLOSED);
    }
  }

  public void invalidate() {
    pool.invalidate(this);
  }

  /** Package ownership check — each wrapper belongs to exactly one pool. */
  DefaultConnectionPool pool() {
    return pool;
  }
}
