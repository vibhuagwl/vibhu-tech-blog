package com.vibhu.cache.algorithm;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/** Unbounded map — fine for demos, dangerous in production without a size bound. */
public final class SimpleCache<K, V> implements CacheStore<K, V> {

  private final Map<K, V> map = new ConcurrentHashMap<>();

  @Override
  public V get(K key) {
    return map.get(key);
  }

  @Override
  public void put(K key, V value) {
    map.put(key, value);
  }

  @Override
  public void remove(K key) {
    map.remove(key);
  }

  @Override
  public void clear() {
    map.clear();
  }

  @Override
  public int size() {
    return map.size();
  }
}
