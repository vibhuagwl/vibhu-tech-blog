package com.vibhu.ratelimit.clock;

import java.util.concurrent.atomic.AtomicLong;

public final class MutableClock implements Clock {

  private final AtomicLong now;

  public MutableClock(long startEpochMs) {
    this.now = new AtomicLong(startEpochMs);
  }

  public void advance(long millis) {
    now.addAndGet(millis);
  }

  public void set(long epochMs) {
    now.set(epochMs);
  }

  @Override
  public long millis() {
    return now.get();
  }
}
