package com.vibhu.locking;

import org.junit.jupiter.api.Test;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.CyclicBarrier;
import java.util.concurrent.Semaphore;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;

class CoordinationTest {

  @Test
  void semaphoreLimitsConcurrency() throws Exception {
    Semaphore sem = new Semaphore(3);
    AtomicInteger inFlight = new AtomicInteger();
    AtomicInteger max = new AtomicInteger();
    Thread[] threads = new Thread[20];
    for (int i = 0; i < threads.length; i++) {
      threads[i] = new Thread(() -> {
        try {
          sem.acquire();
          int now = inFlight.incrementAndGet();
          max.accumulateAndGet(now, Math::max);
          Thread.sleep(20);
          inFlight.decrementAndGet();
        } catch (InterruptedException e) {
          Thread.currentThread().interrupt();
        } finally {
          sem.release();
        }
      });
      threads[i].start();
    }
    for (Thread t : threads) {
      t.join();
    }
    assertThat(max.get()).isLessThanOrEqualTo(3);
  }

  @Test
  void latchOpensOnce() throws Exception {
    CountDownLatch latch = new CountDownLatch(2);
    latch.countDown();
    latch.countDown();
    assertThat(latch.await(1, TimeUnit.SECONDS)).isTrue();
  }

  @Test
  void barrierReleasesAllParties() throws Exception {
    int n = 4;
    CyclicBarrier barrier = new CyclicBarrier(n);
    AtomicInteger after = new AtomicInteger();
    Thread[] threads = new Thread[n];
    for (int i = 0; i < n; i++) {
      threads[i] = new Thread(() -> {
        try {
          barrier.await(2, TimeUnit.SECONDS);
          after.incrementAndGet();
        } catch (Exception e) {
          Thread.currentThread().interrupt();
        }
      });
      threads[i].start();
    }
    for (Thread t : threads) {
      t.join();
    }
    assertThat(after.get()).isEqualTo(n);
  }
}
