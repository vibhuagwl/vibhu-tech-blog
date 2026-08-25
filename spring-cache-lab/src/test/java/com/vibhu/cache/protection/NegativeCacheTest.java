package com.vibhu.cache.protection;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.Duration;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.Test;

class NegativeCacheTest {

  @Test
  void cachesAbsence() {
    AtomicInteger loads = new AtomicInteger();
    NegativeCache<Long, String> cache =
        new NegativeCache<>(
            Duration.ofMinutes(1),
            id -> {
              loads.incrementAndGet();
              return Optional.empty();
            });
    assertTrue(cache.get(1L).isEmpty());
    assertTrue(cache.get(1L).isEmpty());
    assertEquals(1, loads.get());
  }
}
