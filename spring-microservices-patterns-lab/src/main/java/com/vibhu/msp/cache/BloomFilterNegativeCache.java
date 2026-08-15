package com.vibhu.msp.cache;

import java.nio.charset.StandardCharsets;
import java.util.BitSet;
import java.util.function.Function;

/**
 * Bloom-filter negative cache — cheap "definitely not present" checks to reduce
 * cache penetration on hot missing keys. False positives are possible; false negatives are not.
 */
public final class BloomFilterNegativeCache {

  private final BitSet bits;
  private final int bitSize;
  private final int hashFunctions;

  public BloomFilterNegativeCache(int expectedInsertions, double falsePositiveRate) {
    this.bitSize = optimalBitSize(expectedInsertions, falsePositiveRate);
    this.hashFunctions = optimalHashFunctions(bitSize, expectedInsertions);
    this.bits = new BitSet(bitSize);
  }

  public void add(String key) {
    for (int i = 0; i < hashFunctions; i++) {
      bits.set(index(key, i));
    }
  }

  public boolean mightContain(String key) {
    for (int i = 0; i < hashFunctions; i++) {
      if (!bits.get(index(key, i))) {
        return false;
      }
    }
    return true;
  }

  /**
   * Cache-aside with bloom guard: skip backend lookup when bloom says key was never seen.
   */
  public <T> T getOrLoad(String key, Function<String, T> loader) {
    if (!mightContain(key)) {
      return null;
    }
    return loader.apply(key);
  }

  private int index(String key, int seed) {
    long hash = hash(key, seed);
    return (int) (Math.floorMod(hash, bitSize));
  }

  private static long hash(String key, int seed) {
    long h = seed;
    for (byte b : key.getBytes(StandardCharsets.UTF_8)) {
      h = 31 * h + b;
    }
    return h;
  }

  private static int optimalBitSize(int n, double p) {
    return (int) Math.ceil(-n * Math.log(p) / (Math.log(2) * Math.log(2)));
  }

  private static int optimalHashFunctions(int m, int n) {
    return Math.max(1, (int) Math.round((double) m / n * Math.log(2)));
  }
}
