package com.vibhu.msp.cache;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.Test;

class BloomFilterNegativeCacheTest {

  @Test
  void definitelyAbsentForNeverSeenKey() {
    BloomFilterNegativeCache bloom = new BloomFilterNegativeCache(1000, 0.01);
    assertFalse(bloom.mightContain("missing-key"));
  }

  @Test
  void mightContainAfterAdd() {
    BloomFilterNegativeCache bloom = new BloomFilterNegativeCache(1000, 0.01);
    bloom.add("user:42");
    assertTrue(bloom.mightContain("user:42"));
  }

  @Test
  void getOrLoadSkipsBackendWhenDefinitelyAbsent() {
    BloomFilterNegativeCache bloom = new BloomFilterNegativeCache(1000, 0.01);
    Map<String, String> backend = new HashMap<>();
    AtomicInteger loads = new AtomicInteger();

    assertNull(
        bloom.getOrLoad(
            "ghost",
            k -> {
              loads.incrementAndGet();
              return backend.get(k);
            }));
    assertEquals(0, loads.get());
  }

  @Test
  void getOrLoadHitsBackendWhenBloomSaysMaybe() {
    BloomFilterNegativeCache bloom = new BloomFilterNegativeCache(1000, 0.01);
    bloom.add("user:7");
    AtomicInteger loads = new AtomicInteger();

    String value =
        bloom.getOrLoad(
            "user:7",
            k -> {
              loads.incrementAndGet();
              return "cached-value";
            });

    assertEquals("cached-value", value);
    assertEquals(1, loads.get());
  }
}
