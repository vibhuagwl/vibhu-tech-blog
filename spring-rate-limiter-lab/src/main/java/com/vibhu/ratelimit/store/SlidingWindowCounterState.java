package com.vibhu.ratelimit.store;

public record SlidingWindowCounterState(long currentWindowStartMs, int currentCount, int previousCount) {

  static SlidingWindowCounterState empty(long nowMs) {
    return new SlidingWindowCounterState(nowMs, 0, 0);
  }
}
