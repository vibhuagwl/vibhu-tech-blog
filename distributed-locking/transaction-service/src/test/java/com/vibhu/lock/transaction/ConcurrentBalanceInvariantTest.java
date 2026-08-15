package com.vibhu.lock.transaction;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.Test;

/**
 * Pure concurrency invariant used by the E2E script: total money conserved and never negative when
 * exclusive serialization is applied (models Redis+DB locking).
 */
class ConcurrentBalanceInvariantTest {
  @Test
  void oneHundredSerializedDebitsConserveBalance() throws Exception {
    AtomicReference<BigDecimal> source = new AtomicReference<>(new BigDecimal("10000"));
    AtomicReference<BigDecimal> sink = new AtomicReference<>(BigDecimal.ZERO);
    Object lock = new Object();

    ExecutorService pool = Executors.newFixedThreadPool(32);
    List<Callable<Boolean>> tasks = new ArrayList<>();
    for (int i = 0; i < 100; i++) {
      tasks.add(
          () -> {
            synchronized (lock) {
              BigDecimal amount = new BigDecimal("50");
              if (source.get().compareTo(amount) < 0) {
                return false;
              }
              source.set(source.get().subtract(amount));
              sink.set(sink.get().add(amount));
              return true;
            }
          });
    }
    List<Future<Boolean>> futures = pool.invokeAll(tasks);
    pool.shutdown();
    long success = 0;
    for (Future<Boolean> f : futures) {
      if (f.get()) {
        success++;
      }
    }
    assertEquals(100, success);
    assertEquals(0, source.get().compareTo(new BigDecimal("5000")));
    assertEquals(0, sink.get().compareTo(new BigDecimal("5000")));
    assertTrue(source.get().signum() >= 0);
  }

  @Test
  void twoDepletingTransfersOnlyOneSucceeds() {
    AtomicReference<BigDecimal> a = new AtomicReference<>(new BigDecimal("10000"));
    Object lock = new Object();
    boolean t1;
    boolean t2;
    synchronized (lock) {
      t1 = tryDebit(a, new BigDecimal("7000"));
    }
    synchronized (lock) {
      t2 = tryDebit(a, new BigDecimal("6000"));
    }
    assertTrue(t1 ^ t2 || (t1 && !t2));
    assertTrue(a.get().signum() >= 0);
    assertTrue(a.get().compareTo(new BigDecimal("10000")) < 0);
  }

  private static boolean tryDebit(AtomicReference<BigDecimal> balance, BigDecimal amount) {
    if (balance.get().compareTo(amount) < 0) {
      return false;
    }
    balance.set(balance.get().subtract(amount));
    return true;
  }
}
