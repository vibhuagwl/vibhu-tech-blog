package com.vibhu.bloom.core;

/**
 * Strategy for producing {@code k} bit indexes into a Bloom filter of size {@code m}.
 *
 * <p>Production filters rarely run {@code k} fully independent cryptographic hashes. Double hashing
 * ({@code h1 + i*h2 mod m}) is the usual practical choice.
 */
@FunctionalInterface
public interface HashStrategy {
  /**
   * @param value bytes to hash (already encoded by the filter)
   * @param m bit array length
   * @param k number of hash functions / probes
   * @return k indexes in {@code [0, m)}
   */
  int[] indexes(byte[] value, int m, int k);
}
