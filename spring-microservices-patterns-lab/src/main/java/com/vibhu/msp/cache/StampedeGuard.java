package com.vibhu.msp.cache;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.locks.ReentrantLock;
import java.util.function.Supplier;

/** Stampede guard — only one thread loads while others wait. Maps to curriculum Part 10. */
public final class StampedeGuard<K, V> {

  private final Map<K, V> cache = new ConcurrentHashMap<>();
  private final Map<K, ReentrantLock> locks = new ConcurrentHashMap<>();

  public V get(K key, Supplier<V> loader) {
    V cached = cache.get(key);
    if (cached != null) {
      return cached;
    }
    ReentrantLock lock = locks.computeIfAbsent(key, k -> new ReentrantLock());
    lock.lock();
    try {
      cached = cache.get(key);
      if (cached != null) {
        return cached;
      }
      V loaded = loader.get();
      cache.put(key, loaded);
      return loaded;
    } finally {
      lock.unlock();
    }
  }

  public void invalidate(K key) {
    cache.remove(key);
  }
}
