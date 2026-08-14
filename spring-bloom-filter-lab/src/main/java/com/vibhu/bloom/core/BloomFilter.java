package com.vibhu.bloom.core;

import java.nio.charset.StandardCharsets;
import java.util.BitSet;
import java.util.Objects;
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.locks.ReentrantReadWriteLock;
import java.util.function.Function;

/**
 * Classic Bloom filter: probabilistic set membership with possible false positives and
 * <strong>no false negatives</strong> (for elements that were successfully added and never deleted —
 * standard Bloom filters do not support deletion).
 *
 * <p>Thread-safety: this implementation uses a {@link ReentrantReadWriteLock}. Concurrent
 * {@code mightContain} calls share the read lock; {@code add} takes the write lock. For a
 * read-mostly filter loaded once at startup, you can wrap an immutable snapshot instead.
 *
 * @param <T> element type
 */
public final class BloomFilter<T> {

  private final BloomFilterConfig config;
  private final HashStrategy hashStrategy;
  private final Function<T, byte[]> encoder;
  private final BitSet bits;
  private final ReentrantReadWriteLock lock = new ReentrantReadWriteLock();
  private final AtomicLong inserted = new AtomicLong();
  private final AtomicLong lookups = new AtomicLong();
  private final AtomicLong maybeHits = new AtomicLong();
  private final AtomicLong definiteMisses = new AtomicLong();

  public BloomFilter(long expectedInsertions, double falsePositiveRate) {
    this(BloomFilterConfig.of(expectedInsertions, falsePositiveRate), new DoubleHashStrategy(), BloomFilter::defaultEncode);
  }

  public BloomFilter(BloomFilterConfig config, HashStrategy hashStrategy, Function<T, byte[]> encoder) {
    this.config = Objects.requireNonNull(config);
    this.hashStrategy = Objects.requireNonNull(hashStrategy);
    this.encoder = Objects.requireNonNull(encoder);
    this.bits = new BitSet(config.bitSize());
  }

  public void add(T value) {
    Objects.requireNonNull(value, "value");
    byte[] bytes = encoder.apply(value);
    int[] indexes = hashStrategy.indexes(bytes, config.bitSize(), config.hashCount());
    lock.writeLock().lock();
    try {
      for (int idx : indexes) {
        bits.set(idx);
      }
      inserted.incrementAndGet();
    } finally {
      lock.writeLock().unlock();
    }
  }

  /**
   * @return {@code false} ⇒ definitely not present; {@code true} ⇒ maybe present (possible FP)
   */
  public boolean mightContain(T value) {
    Objects.requireNonNull(value, "value");
    lookups.incrementAndGet();
    byte[] bytes = encoder.apply(value);
    int[] indexes = hashStrategy.indexes(bytes, config.bitSize(), config.hashCount());
    lock.readLock().lock();
    try {
      for (int idx : indexes) {
        if (!bits.get(idx)) {
          definiteMisses.incrementAndGet();
          return false;
        }
      }
      maybeHits.incrementAndGet();
      return true;
    } finally {
      lock.readLock().unlock();
    }
  }

  public BloomFilterConfig config() {
    return config;
  }

  public long insertedCount() {
    return inserted.get();
  }

  public long lookupCount() {
    return lookups.get();
  }

  public long maybeHitCount() {
    return maybeHits.get();
  }

  public long definiteMissCount() {
    return definiteMisses.get();
  }

  public int cardinality() {
    lock.readLock().lock();
    try {
      return bits.cardinality();
    } finally {
      lock.readLock().unlock();
    }
  }

  public double estimatedFalsePositiveRate() {
    return config.theoreticalFalsePositiveRate(inserted.get());
  }

  /** Replace contents — used for rebuild without swapping the bean reference. */
  public void rebuildFrom(Iterable<T> values) {
    lock.writeLock().lock();
    try {
      bits.clear();
      inserted.set(0);
      for (T value : values) {
        byte[] bytes = encoder.apply(value);
        for (int idx : hashStrategy.indexes(bytes, config.bitSize(), config.hashCount())) {
          bits.set(idx);
        }
        inserted.incrementAndGet();
      }
    } finally {
      lock.writeLock().unlock();
    }
  }

  private static byte[] defaultEncode(Object value) {
    if (value instanceof byte[] bytes) {
      return bytes;
    }
    return String.valueOf(value).getBytes(StandardCharsets.UTF_8);
  }
}
