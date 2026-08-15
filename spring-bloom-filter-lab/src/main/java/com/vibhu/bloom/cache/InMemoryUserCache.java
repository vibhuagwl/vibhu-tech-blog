package com.vibhu.bloom.cache;

import com.vibhu.bloom.user.UserEntity;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import org.springframework.stereotype.Component;

/**
 * In-process stand-in for Redis. Keys are user ids. Demonstrates cache penetration when attackers
 * query missing ids — without a Bloom filter every miss hits the DB.
 */
@Component
public class InMemoryUserCache {

  private final Map<String, UserEntity> map = new ConcurrentHashMap<>();
  private final AtomicLong hits = new AtomicLong();
  private final AtomicLong misses = new AtomicLong();

  public Optional<UserEntity> get(String userId) {
    UserEntity value = map.get(userId);
    if (value == null) {
      misses.incrementAndGet();
      return Optional.empty();
    }
    hits.incrementAndGet();
    return Optional.of(value);
  }

  public void put(UserEntity user) {
    map.put(user.getId(), user);
  }

  public void evict(String userId) {
    map.remove(userId);
  }

  public void clear() {
    map.clear();
  }

  public long hitCount() {
    return hits.get();
  }

  public long missCount() {
    return misses.get();
  }

  public int size() {
    return map.size();
  }
}
