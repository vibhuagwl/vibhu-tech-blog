package com.vibhu.connectionpool;

/**
 * Underlying expensive resource (DB socket, TCP channel, Redis client, HTTP connection, …).
 * Implementations must be safe for single-threaded use while borrowed.
 */
public interface Connection extends AutoCloseable {
  /** Lightweight liveness probe used by {@link ConnectionValidator}. */
  boolean isOpen();

  /** Physically close the resource. Idempotent. */
  @Override
  void close();
}
