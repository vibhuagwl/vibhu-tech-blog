package com.vibhu.msp.resilience;

import java.util.concurrent.Semaphore;
import java.util.concurrent.atomic.AtomicInteger;

/** Load shedder — rejects requests when system is overloaded. */
public final class LoadShedder {

  private final int maxInflight;
  private final Semaphore inflight;
  private final AtomicInteger rejected = new AtomicInteger(0);

  public LoadShedder(int maxInflight) {
    this.maxInflight = maxInflight;
    this.inflight = new Semaphore(maxInflight);
  }

  public <T> T execute(java.util.concurrent.Callable<T> action) throws Exception {
    if (!inflight.tryAcquire()) {
      rejected.incrementAndGet();
      throw new OverloadException("Load shed — too many inflight requests");
    }
    try {
      return action.call();
    } finally {
      inflight.release();
    }
  }

  public int rejectedCount() {
    return rejected.get();
  }

  public static class OverloadException extends RuntimeException {
    public OverloadException(String message) {
      super(message);
    }
  }
}
