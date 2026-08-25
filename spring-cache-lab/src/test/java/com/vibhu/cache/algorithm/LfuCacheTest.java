package com.vibhu.cache.algorithm;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import org.junit.jupiter.api.Test;

class LfuCacheTest {

  @Test
  void evictsLeastFrequent() {
    LfuCache<String, String> cache = new LfuCache<>(2);
    cache.put("A", "a");
    cache.put("B", "b");
    cache.get("A");
    cache.get("A");
    cache.put("C", "c"); // should evict B (freq 1) not A (freq 3)
    assertNull(cache.get("B"));
    assertEquals("a", cache.get("A"));
    assertEquals("c", cache.get("C"));
  }
}
