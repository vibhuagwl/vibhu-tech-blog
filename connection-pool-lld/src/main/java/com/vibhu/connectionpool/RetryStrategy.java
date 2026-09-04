package com.vibhu.connectionpool;

import java.time.Duration;
import java.util.concurrent.ThreadLocalRandom;

/** Strategy for connection-creation retries. Lives outside the pool critical section. */
public interface RetryStrategy {
  /**
   * @param attempt zero-based attempt index that just failed
   * @return delay before next attempt; empty Optional means stop retrying
   */
  java.util.Optional<Duration> nextDelay(int attempt, Throwable cause);

  static RetryStrategy exponentialWithJitter(int maxAttempts, Duration base, Duration max) {
    return (attempt, cause) -> {
      if (attempt + 1 >= maxAttempts) {
        return java.util.Optional.empty();
      }
      long exp = Math.min(max.toMillis(), base.toMillis() * (1L << Math.min(attempt, 16)));
      long jitter = ThreadLocalRandom.current().nextLong(0, Math.max(1, exp / 2));
      return java.util.Optional.of(Duration.ofMillis(exp / 2 + jitter));
    };
  }

  static RetryStrategy none() {
    return (attempt, cause) -> java.util.Optional.empty();
  }
}
