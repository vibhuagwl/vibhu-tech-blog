package com.vibhu.bloom.core;

import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.util.Objects;

/**
 * Kirsch–Mitzenmacher double hashing: {@code index(i) = |h1 + i * h2| mod m}.
 *
 * <p>Two 64-bit mixes (from Murmur-like finalizers on UTF-8 bytes) generate {@code k} probes
 * without calling {@code k} independent hash algorithms. Collision behavior is good enough for
 * Bloom filters when {@code m} and {@code k} are chosen from the classic formulas.
 */
public final class DoubleHashStrategy implements HashStrategy {

  @Override
  public int[] indexes(byte[] value, int m, int k) {
    Objects.requireNonNull(value, "value");
    if (m <= 0 || k <= 0) {
      throw new IllegalArgumentException("m and k must be positive");
    }
    long h1 = mix64(fnv1a64(value));
    long h2 = mix64(murmurish(value) | 1L); // force odd so i*h2 covers residues better
    int[] out = new int[k];
    for (int i = 0; i < k; i++) {
      long combined = h1 + (long) i * h2;
      // Math.floorMod handles negatives from long overflow cleanly
      out[i] = (int) Math.floorMod(combined, m);
    }
    return out;
  }

  /** Stable encoding helper for demos/tests. */
  public static byte[] utf8(String s) {
    return s.getBytes(StandardCharsets.UTF_8);
  }

  private static long fnv1a64(byte[] data) {
    long hash = 0xcbf29ce484222325L;
    for (byte b : data) {
      hash ^= (b & 0xffL);
      hash *= 0x100000001b3L;
    }
    return hash;
  }

  private static long murmurish(byte[] data) {
    // Lightweight 64-bit mix over 8-byte chunks — not crypto, intentional for speed.
    long h = 0x736f6d6570736575L ^ data.length;
    int i = 0;
    while (i + 8 <= data.length) {
      long k = ByteBuffer.wrap(data, i, 8).getLong();
      k *= 0xff51afd7ed558ccdL;
      k = Long.rotateLeft(k, 31);
      k *= 0xc4ceb9fe1a85ec53L;
      h ^= k;
      h = Long.rotateLeft(h, 27) * 5 + 0x52dce729L;
      i += 8;
    }
    long tail = 0;
    for (int j = data.length - 1; j >= i; j--) {
      tail = (tail << 8) | (data[j] & 0xffL);
    }
    h ^= tail;
    return mix64(h);
  }

  private static long mix64(long z) {
    z = (z ^ (z >>> 33)) * 0xff51afd7ed558ccdL;
    z = (z ^ (z >>> 33)) * 0xc4ceb9fe1a85ec53L;
    return z ^ (z >>> 33);
  }
}
