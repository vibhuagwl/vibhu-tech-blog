package com.vibhu.locking;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.LongAdder;
import org.junit.jupiter.api.Test;

class AtomicAndChmTest {

  @Test
  void atomicIntegerCountsExactly() throws Exception {
    AtomicInteger hits = new AtomicInteger();
    ExecutorService ex = Executors.newFixedThreadPool(16);
    for (int i = 0; i < 1000; i++) {
      ex.submit(hits::incrementAndGet);
    }
    ex.shutdown();
    ex.awaitTermination(3, TimeUnit.SECONDS);
    assertThat(hits.get()).isEqualTo(1000);
  }

  @Test
  void longAdderCountsExactly() throws Exception {
    LongAdder hits = new LongAdder();
    ExecutorService ex = Executors.newFixedThreadPool(32);
    for (int i = 0; i < 10_000; i++) {
      ex.submit(hits::increment);
    }
    ex.shutdown();
    ex.awaitTermination(5, TimeUnit.SECONDS);
    assertThat(hits.sum()).isEqualTo(10_000);
  }

  @Test
  void computeIfAbsentLoadsOnce() throws Exception {
    ConcurrentHashMap<String, String> cache = new ConcurrentHashMap<>();
    AtomicInteger loads = new AtomicInteger();
    ExecutorService ex = Executors.newFixedThreadPool(8);
    for (int i = 0; i < 8; i++) {
      ex.submit(
          () ->
              cache.computeIfAbsent(
                  "user-1",
                  k -> {
                    loads.incrementAndGet();
                    return "session";
                  }));
    }
    ex.shutdown();
    ex.awaitTermination(2, TimeUnit.SECONDS);
    assertThat(cache.get("user-1")).isEqualTo("session");
    assertThat(loads.get()).isEqualTo(1);
  }
}
