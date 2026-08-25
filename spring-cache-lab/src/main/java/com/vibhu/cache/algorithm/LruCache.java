package com.vibhu.cache.algorithm;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * LRU via LinkedHashMap(accessOrder=true). Evicts least-recently-used when capacity exceeded.
 *
 * <p>Interview: get/put amortized O(1). Spring Cache does NOT implement this — providers do.
 */
public final class LruCache<K, V> implements CacheStore<K, V> {

  private final int capacity;
  private final Map<K, V> map;

  public LruCache(int capacity) {
    if (capacity < 1) {
      throw new IllegalArgumentException("capacity must be >= 1");
    }
    this.capacity = capacity;
    this.map =
        new LinkedHashMap<>(capacity, 0.75f, true) {
          @Override
          protected boolean removeEldestEntry(Map.Entry<K, V> eldest) {
            return size() > LruCache.this.capacity;
          }
        };
  }

  @Override
  public synchronized V get(K key) {
    return map.get(key);
  }

  @Override
  public synchronized void put(K key, V value) {
    map.put(key, value);
  }

  @Override
  public synchronized void remove(K key) {
    map.remove(key);
  }

  @Override
  public synchronized void clear() {
    map.clear();
  }

  @Override
  public synchronized int size() {
    return map.size();
  }
}
