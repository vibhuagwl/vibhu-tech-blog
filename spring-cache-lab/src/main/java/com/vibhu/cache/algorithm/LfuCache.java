package com.vibhu.cache.algorithm;

import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.Map;

/**
 * LFU: evict least-frequently-used key. O(1) get/put with freq buckets + LinkedHashSet (FIFO within
 * same frequency).
 */
public final class LfuCache<K, V> implements CacheStore<K, V> {

  private final int capacity;
  private final Map<K, Node> nodes = new HashMap<>();
  private final Map<Integer, LinkedHashSet<K>> freqBuckets = new HashMap<>();
  private int minFreq = 0;

  public LfuCache(int capacity) {
    if (capacity < 1) {
      throw new IllegalArgumentException("capacity must be >= 1");
    }
    this.capacity = capacity;
  }

  @Override
  public synchronized V get(K key) {
    Node node = nodes.get(key);
    if (node == null) {
      return null;
    }
    bump(node);
    return node.value;
  }

  @Override
  public synchronized void put(K key, V value) {
    if (capacity == 0) {
      return;
    }
    Node existing = nodes.get(key);
    if (existing != null) {
      existing.value = value;
      bump(existing);
      return;
    }
    if (nodes.size() >= capacity) {
      LinkedHashSet<K> bucket = freqBuckets.get(minFreq);
      K evict = bucket.iterator().next();
      bucket.remove(evict);
      nodes.remove(evict);
    }
    Node node = new Node(key, value, 1);
    nodes.put(key, node);
    freqBuckets.computeIfAbsent(1, f -> new LinkedHashSet<>()).add(key);
    minFreq = 1;
  }

  @Override
  public synchronized void remove(K key) {
    Node node = nodes.remove(key);
    if (node == null) {
      return;
    }
    LinkedHashSet<K> bucket = freqBuckets.get(node.freq);
    if (bucket != null) {
      bucket.remove(key);
    }
  }

  @Override
  public synchronized void clear() {
    nodes.clear();
    freqBuckets.clear();
    minFreq = 0;
  }

  @Override
  public synchronized int size() {
    return nodes.size();
  }

  private void bump(Node node) {
    int old = node.freq;
    LinkedHashSet<K> oldBucket = freqBuckets.get(old);
    oldBucket.remove(node.key);
    if (old == minFreq && oldBucket.isEmpty()) {
      minFreq++;
    }
    node.freq++;
    freqBuckets.computeIfAbsent(node.freq, f -> new LinkedHashSet<>()).add(node.key);
  }

  private final class Node {
    final K key;
    V value;
    int freq;

    Node(K key, V value, int freq) {
      this.key = key;
      this.value = value;
      this.freq = freq;
    }
  }
}
