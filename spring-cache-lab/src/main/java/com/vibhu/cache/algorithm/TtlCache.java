package com.vibhu.cache.algorithm;

import java.time.Clock;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/** TTL cache: expireAfterWrite semantics (lazy eviction on get). */
public final class TtlCache<K, V> implements CacheStore<K, V> {

  private final Duration ttl;
  private final Clock clock;
  private final Map<K, Entry<V>> map = new ConcurrentHashMap<>();

  public TtlCache(Duration ttl) {
    this(ttl, Clock.systemUTC());
  }

  public TtlCache(Duration ttl, Clock clock) {
    this.ttl = ttl;
    this.clock = clock;
  }

  @Override
  public V get(K key) {
    Entry<V> e = map.get(key);
    if (e == null) {
      return null;
    }
    if (clock.millis() >= e.expireAtMs) {
      map.remove(key, e);
      return null;
    }
    return e.value;
  }

  @Override
  public void put(K key, V value) {
    map.put(key, new Entry<>(value, clock.millis() + ttl.toMillis()));
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

  private record Entry<V>(V value, long expireAtMs) {}
}
