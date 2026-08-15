package com.vibhu.msp.id;

import org.junit.jupiter.api.Test;

import java.util.Collections;
import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class SnowflakeIdGeneratorConcurrencyTest {

  @Test
  void generatesUniqueIdsUnderConcurrentLoad() throws InterruptedException {
    SnowflakeIdGenerator gen = new SnowflakeIdGenerator(1, 1);
    int threads = 16;
    int idsPerThread = 500;
    Set<Long> ids = ConcurrentHashMap.newKeySet();
    CountDownLatch start = new CountDownLatch(1);
    CountDownLatch done = new CountDownLatch(threads);

    try (ExecutorService pool = Executors.newFixedThreadPool(threads)) {
      for (int t = 0; t < threads; t++) {
        pool.submit(() -> {
          try {
            start.await();
            for (int i = 0; i < idsPerThread; i++) {
              assertTrue(ids.add(gen.nextId()));
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

    assertEquals(threads * idsPerThread, ids.size());
  }

  @Test
  void distinctWorkersProduceUniqueIdsAcrossThreads() throws InterruptedException {
    int workers = 8;
    Set<Long> allIds = Collections.synchronizedSet(new HashSet<>());
    CountDownLatch done = new CountDownLatch(workers);

    try (ExecutorService pool = Executors.newFixedThreadPool(workers)) {
      for (int w = 0; w < workers; w++) {
        int workerId = w;
        pool.submit(() -> {
          SnowflakeIdGenerator gen = new SnowflakeIdGenerator(workerId, 1);
          for (int i = 0; i < 200; i++) {
            allIds.add(gen.nextId());
          }
          done.countDown();
        });
      }
      assertTrue(done.await(30, TimeUnit.SECONDS));
    }

    assertEquals(workers * 200, allIds.size());
  }
}
