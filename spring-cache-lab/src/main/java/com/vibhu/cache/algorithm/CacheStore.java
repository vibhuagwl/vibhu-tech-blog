package com.vibhu.cache.algorithm;

/** Minimal cache contract — learn this before Spring annotations. */
public interface CacheStore<K, V> {

  V get(K key);

  void put(K key, V value);

  void remove(K key);

  void clear();

  int size();
}
