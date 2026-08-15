package com.vibhu.msp.resilience;

import java.time.Duration;
import java.util.concurrent.Callable;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

/** Timeout policy — fail fast when downstream exceeds budget. */
public final class TimeoutPolicy {

  private final Duration timeout;
  private final Executor executor;

  public TimeoutPolicy(Duration timeout) {
    this(timeout, Executors.newVirtualThreadPerTaskExecutor());
  }

  public TimeoutPolicy(Duration timeout, Executor executor) {
    this.timeout = timeout;
    this.executor = executor;
  }

  public <T> T execute(Callable<T> action) throws Exception {
    CompletableFuture<T> future =
        CompletableFuture.supplyAsync(
            () -> {
              try {
                return action.call();
              } catch (Exception e) {
                throw new RuntimeException(e);
              }
            },
            executor);
    try {
      return future.get(timeout.toMillis(), TimeUnit.MILLISECONDS);
    } catch (TimeoutException e) {
      future.cancel(true);
      throw new TimeoutException("Operation exceeded " + timeout);
    } catch (java.util.concurrent.ExecutionException e) {
      Throwable cause = e.getCause();
      if (cause instanceof RuntimeException re && re.getCause() instanceof Exception ex) {
        throw ex;
      }
      throw e;
    }
  }
}
