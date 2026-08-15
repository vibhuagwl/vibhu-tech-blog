package com.vibhu.msp.cache;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Supplier;

/** Cache-aside — application manages cache read/write. Maps to curriculum Part 10. */
public final class CacheAside<K, V> {

  private final Map<K, V> cache = new ConcurrentHashMap<>();
  private final Supplier<V> loader;
  private final K key;

  public CacheAside(K key, Supplier<V> loader) {
    this.key = key;
    this.loader = loader;
  }

  public V get() {
    return cache.computeIfAbsent(key, k -> loader.get());
  }

  public void invalidate() {
    cache.remove(key);
  }

  public boolean isCached() {
    return cache.containsKey(key);
  }
}
