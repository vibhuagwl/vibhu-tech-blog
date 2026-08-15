package com.vibhu.msp.resilience;

import java.util.concurrent.Callable;
import java.util.concurrent.Semaphore;

/** Bulkhead — limits concurrent calls to isolate resource pools. */
public final class Bulkheads {

  private final Semaphore semaphore;

  public Bulkheads(int maxConcurrent) {
    this.semaphore = new Semaphore(maxConcurrent);
  }

  public <T> T execute(Callable<T> action) throws Exception {
    if (!semaphore.tryAcquire()) {
      throw new BulkheadFullException("Bulkhead saturated");
    }
    try {
      return action.call();
    } finally {
      semaphore.release();
    }
  }

  public int availablePermits() {
    return semaphore.availablePermits();
  }

  public static class BulkheadFullException extends RuntimeException {
    public BulkheadFullException(String message) {
      super(message);
    }
  }
}
