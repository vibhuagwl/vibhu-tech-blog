package com.vibhu.bloom.core;

import java.nio.charset.StandardCharsets;
import java.util.Objects;
import java.util.concurrent.atomic.AtomicIntegerArray;
import java.util.function.Function;

/**
 * Counting Bloom filter: each "bit" is a small counter so {@link #remove} is possible.
 *
 * <p>Trade-off: ~4–8× memory of a classic Bloom filter (here: 32-bit counters for clarity).
 * Counters can still saturate; this lab clamps at {@link Integer#MAX_VALUE}.
 */
public final class CountingBloomFilter<T> {

  private final BloomFilterConfig config;
  private final HashStrategy hashStrategy;
  private final Function<T, byte[]> encoder;
  private final AtomicIntegerArray counters;

  public CountingBloomFilter(long expectedInsertions, double falsePositiveRate) {
    this(
        BloomFilterConfig.of(expectedInsertions, falsePositiveRate),
        new DoubleHashStrategy(),
        v -> String.valueOf(v).getBytes(StandardCharsets.UTF_8));
  }

  public CountingBloomFilter(
      BloomFilterConfig config, HashStrategy hashStrategy, Function<T, byte[]> encoder) {
    this.config = Objects.requireNonNull(config);
    this.hashStrategy = Objects.requireNonNull(hashStrategy);
    this.encoder = Objects.requireNonNull(encoder);
    this.counters = new AtomicIntegerArray(config.bitSize());
  }

  public void add(T value) {
    for (int idx : indexes(value)) {
      counters.updateAndGet(idx, c -> c == Integer.MAX_VALUE ? c : c + 1);
    }
  }

  /**
   * Decrements counters for {@code value}. Unsafe if the value was never added — can corrupt
   * membership for other keys that share counters (same classic reason classic BF cannot delete).
   */
  public void remove(T value) {
    for (int idx : indexes(value)) {
      counters.updateAndGet(idx, c -> c > 0 ? c - 1 : 0);
    }
  }

  public boolean mightContain(T value) {
    for (int idx : indexes(value)) {
      if (counters.get(idx) <= 0) {
        return false;
      }
    }
    return true;
  }

  public BloomFilterConfig config() {
    return config;
  }

  public int counterAt(int index) {
    return counters.get(index);
  }

  private int[] indexes(T value) {
    Objects.requireNonNull(value, "value");
    return hashStrategy.indexes(encoder.apply(value), config.bitSize(), config.hashCount());
  }
}
