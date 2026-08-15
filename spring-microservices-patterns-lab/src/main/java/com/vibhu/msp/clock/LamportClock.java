package com.vibhu.msp.clock;

import java.util.concurrent.atomic.AtomicLong;

/** Lamport logical clock — causal ordering without wall clock. Maps to curriculum Part 20. */
public final class LamportClock {

  private final AtomicLong counter = new AtomicLong(0);

  public long tick() {
    return counter.incrementAndGet();
  }

  public long update(long received) {
    long current;
    long next;
    do {
      current = counter.get();
      next = Math.max(current, received) + 1;
    } while (!counter.compareAndSet(current, next));
    return next;
  }

  public long now() {
    return counter.get();
  }
}
