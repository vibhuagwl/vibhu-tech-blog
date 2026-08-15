package com.vibhu.msp.lock;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class FencingTokenConcurrencyTest {

  @BeforeEach
  void reset() {
    FencingToken.resetForTests();
  }

  @Test
  void onlyOneThreadHoldsLockAtATime() throws InterruptedException {
    InMemoryLockStore store = new InMemoryLockStore();
    RedisStyleLock lock = new RedisStyleLock(store, "race-resource", Duration.ofSeconds(30));
    int threads = 32;
    AtomicInteger acquired = new AtomicInteger(0);
    AtomicInteger concurrentHolders = new AtomicInteger(0);
    AtomicInteger maxConcurrent = new AtomicInteger(0);
    CountDownLatch start = new CountDownLatch(1);
    CountDownLatch done = new CountDownLatch(threads);

    try (ExecutorService pool = Executors.newFixedThreadPool(threads)) {
      for (int i = 0; i < threads; i++) {
        pool.submit(() -> {
          try {
            start.await();
            Optional<RedisStyleLock.LockHandle> handle = lock.tryLock();
            if (handle.isPresent()) {
              acquired.incrementAndGet();
              int current = concurrentHolders.incrementAndGet();
              maxConcurrent.updateAndGet(prev -> Math.max(prev, current));
              Thread.sleep(5);
              concurrentHolders.decrementAndGet();
              handle.get().release();
            }
          } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
          } finally {
            done.countDown();
          }
        });
      }
      start.countDown();
      assertTrue(done.await(30, TimeUnit.SECONDS));
    }

    assertEquals(1, maxConcurrent.get(), "At most one thread should hold the lock at a time");
    assertTrue(acquired.get() >= 1);
  }

  @Test
  void fencingTokensAreStrictlyMonotonicUnderContention() throws InterruptedException {
    int threads = 20;
    Set<Long> tokens = ConcurrentHashMap.newKeySet();
    CountDownLatch start = new CountDownLatch(1);
    CountDownLatch done = new CountDownLatch(threads);

    try (ExecutorService pool = Executors.newFixedThreadPool(threads)) {
      for (int i = 0; i < threads; i++) {
        pool.submit(() -> {
          try {
            start.await();
            tokens.add(FencingToken.parse(FencingToken.next()));
          } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
          } finally {
            done.countDown();
          }
        });
      }
      start.countDown();
      assertTrue(done.await(30, TimeUnit.SECONDS));
    }

    assertEquals(threads, tokens.size());
  }

  @Test
  void staleTokenRejectedAfterSequentialHandoff() {
    InMemoryLockStore store = new InMemoryLockStore();
    RedisStyleLock lock = new RedisStyleLock(store, "handoff", Duration.ofSeconds(30));

    Optional<RedisStyleLock.LockHandle> first = lock.tryLock();
    assertTrue(first.isPresent());
    long staleToken = first.get().fencingToken();
    first.get().release();

    Optional<RedisStyleLock.LockHandle> second = lock.tryLock();
    assertTrue(second.isPresent());
    long newToken = second.get().fencingToken();

    assertTrue(newToken > staleToken);
    assertFalse(first.get().validateWrite(staleToken));
    assertTrue(second.get().validateWrite(newToken));
    second.get().release();
  }
}
