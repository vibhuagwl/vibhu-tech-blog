package com.vibhu.cache.protection;

import com.vibhu.cache.algorithm.TtlCache;
import java.time.Duration;
import java.util.Objects;
import java.util.Optional;
import java.util.function.Function;

/**
 * Negative caching: remember "missing" for a short TTL so random ids do not hammer DB.
 */
public final class NegativeCache<K, V> {

  private final TtlCache<K, Optional<V>> store;
  private final Function<K, Optional<V>> loader;

  public NegativeCache(Duration negativeTtl, Function<K, Optional<V>> loader) {
    this.store = new TtlCache<>(negativeTtl);
    this.loader = Objects.requireNonNull(loader);
  }

  public Optional<V> get(K key) {
    Optional<V> cached = store.get(key);
    if (cached != null) {
      return cached; // may be Optional.empty()
    }
    Optional<V> loaded = loader.apply(key);
    store.put(key, loaded);
    return loaded;
  }
}
