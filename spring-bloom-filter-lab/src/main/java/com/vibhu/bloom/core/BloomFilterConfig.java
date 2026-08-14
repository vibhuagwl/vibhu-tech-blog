package com.vibhu.bloom.core;

/**
 * Immutable sizing for a Bloom filter: expected insertions {@code n}, target FPP {@code p},
 * derived bit count {@code m} and hash count {@code k}.
 *
 * <pre>
 *   m = -n * ln(p) / (ln 2)^2
 *   k = (m / n) * ln 2
 * </pre>
 */
public record BloomFilterConfig(long expectedInsertions, double falsePositiveRate, int bitSize, int hashCount) {

  public BloomFilterConfig {
    if (expectedInsertions <= 0) {
      throw new IllegalArgumentException("expectedInsertions must be > 0");
    }
    if (falsePositiveRate <= 0.0 || falsePositiveRate >= 1.0) {
      throw new IllegalArgumentException("falsePositiveRate must be in (0,1)");
    }
    if (bitSize <= 0 || hashCount <= 0) {
      throw new IllegalArgumentException("bitSize and hashCount must be > 0");
    }
  }

  public static BloomFilterConfig of(long expectedInsertions, double falsePositiveRate) {
    // m = -n ln(p) / (ln2)^2
    double m = -expectedInsertions * Math.log(falsePositiveRate) / (Math.log(2) * Math.log(2));
    int bitSize = (int) Math.max(64, Math.ceil(m));
    // k = (m/n) ln 2
    int hashCount = Math.max(1, (int) Math.round((bitSize / (double) expectedInsertions) * Math.log(2)));
    return new BloomFilterConfig(expectedInsertions, falsePositiveRate, bitSize, hashCount);
  }

  /** Approximate theoretical FPP: (1 - e^{-kn/m})^k */
  public double theoreticalFalsePositiveRate(long inserted) {
    if (inserted <= 0) {
      return 0.0;
    }
    double exponent = -((double) hashCount * inserted) / bitSize;
    return Math.pow(1.0 - Math.exp(exponent), hashCount);
  }

  public long memoryBytes() {
    return (bitSize + 7L) / 8L;
  }

  @Override
  public String toString() {
    return "BloomFilterConfig{n=" + expectedInsertions
        + ", p=" + falsePositiveRate
        + ", m=" + bitSize
        + ", k=" + hashCount
        + ", bytes≈" + memoryBytes()
        + '}';
  }
}
