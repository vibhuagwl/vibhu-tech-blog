package com.vibhu.ratelimit.store;

/**
 * Mutable token-bucket snapshot stored per key. {@code tokens} is a double so fractional refill
 * between whole seconds is not lost.
 */
public record TokenBucketState(double tokens, long lastRefillEpochMs) {

  public static TokenBucketState full(long capacity, long nowMs) {
    return new TokenBucketState(capacity, nowMs);
  }
}
