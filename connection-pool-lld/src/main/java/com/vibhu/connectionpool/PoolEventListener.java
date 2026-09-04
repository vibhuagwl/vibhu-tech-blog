package com.vibhu.connectionpool;

/** Observer hooks — keep implementations cheap; never block the pool. */
public interface PoolEventListener {
  default void onCreated(long connectionId) {}

  default void onBorrowed(long connectionId) {}

  default void onReleased(long connectionId) {}

  default void onInvalidated(long connectionId, String reason) {}

  default void onValidationFailed(long connectionId) {}

  default void onCreationFailed(String reason) {}

  default void onTimeout() {}

  default void onLeakDetected(long connectionId, String borrowerThread, long borrowedMillis) {}

  default void onEvicted(long connectionId, String reason) {}

  default void onShutdown() {}
}
