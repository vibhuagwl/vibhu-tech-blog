package com.vibhu.cache.algorithm;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import org.junit.jupiter.api.Test;

class LruCacheTest {

  @Test
  void evictsLeastRecentlyUsed() {
    LruCache<String, String> cache = new LruCache<>(3);
    cache.put("A", "a");
    cache.put("B", "b");
    cache.put("C", "c");
    cache.get("A"); // order B C A
    cache.put("D", "d"); // evict B
    assertNull(cache.get("B"));
    assertEquals("a", cache.get("A"));
    assertEquals("c", cache.get("C"));
    assertEquals("d", cache.get("D"));
  }
}
