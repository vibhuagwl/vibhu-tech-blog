package com.vibhu.ratelimit.store;

public record LeakyBucketState(double level, long lastLeakMs) {

  static LeakyBucketState empty(long nowMs) {
    return new LeakyBucketState(0.0, nowMs);
  }
}
