package com.vibhu.ratelimit.clock;

public final class SystemClock implements Clock {
  @Override
  public long millis() {
    return System.currentTimeMillis();
  }
}
