package com.vibhu.cache.algorithm;

import java.util.HashMap;
import java.util.Map;

/**
 * Manual LRU with HashMap + doubly linked list — classic interview implementation (O(1) get/put).
 */
public final class ManualLruCache<K, V> implements CacheStore<K, V> {

  private final int capacity;
  private final Map<K, Node> map = new HashMap<>();
  private final Node head = new Node(null, null);
  private final Node tail = new Node(null, null);

  public ManualLruCache(int capacity) {
    if (capacity < 1) {
      throw new IllegalArgumentException("capacity must be >= 1");
    }
    this.capacity = capacity;
    head.next = tail;
    tail.prev = head;
  }

  @Override
  public synchronized V get(K key) {
    Node n = map.get(key);
    if (n == null) {
      return null;
    }
    moveToHead(n);
    return n.value;
  }

  @Override
  public synchronized void put(K key, V value) {
    Node n = map.get(key);
    if (n != null) {
      n.value = value;
      moveToHead(n);
      return;
    }
    if (map.size() >= capacity) {
      Node lru = tail.prev;
      removeNode(lru);
      map.remove(lru.key);
    }
    Node created = new Node(key, value);
    addToHead(created);
    map.put(key, created);
  }

  @Override
  public synchronized void remove(K key) {
    Node n = map.remove(key);
    if (n != null) {
      removeNode(n);
    }
  }

  @Override
  public synchronized void clear() {
    map.clear();
    head.next = tail;
    tail.prev = head;
  }

  @Override
  public synchronized int size() {
    return map.size();
  }

  private void moveToHead(Node n) {
    removeNode(n);
    addToHead(n);
  }

  private void addToHead(Node n) {
    n.next = head.next;
    n.prev = head;
    head.next.prev = n;
    head.next = n;
  }

  private void removeNode(Node n) {
    n.prev.next = n.next;
    n.next.prev = n.prev;
  }

  private final class Node {
    final K key;
    V value;
    Node prev;
    Node next;

    Node(K key, V value) {
      this.key = key;
      this.value = value;
    }
  }
}
