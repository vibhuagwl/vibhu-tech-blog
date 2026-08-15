package com.vibhu.msp.clock;

import java.util.Arrays;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/** Vector clock — detects concurrent events. Maps to curriculum Part 20. */
public final class VectorClock {

  private final String nodeId;
  private final Map<String, Long> vector = new ConcurrentHashMap<>();

  public VectorClock(String nodeId) {
    this.nodeId = nodeId;
    vector.put(nodeId, 0L);
  }

  public synchronized VectorClock tick() {
    vector.merge(nodeId, 1L, Long::sum);
    return copy();
  }

  public synchronized VectorClock update(VectorClock other) {
    for (Map.Entry<String, Long> entry : other.vector.entrySet()) {
      vector.merge(entry.getKey(), entry.getValue(), Math::max);
    }
    vector.merge(nodeId, 1L, Long::sum);
    return copy();
  }

  public enum Relation { BEFORE, AFTER, CONCURRENT, EQUAL }

  public Relation compare(VectorClock other) {
    long[] a = flatten(this);
    long[] b = flatten(other);
    boolean aLessOrEqual = true;
    boolean bLessOrEqual = true;
    for (int i = 0; i < a.length; i++) {
      if (a[i] > b[i]) aLessOrEqual = false;
      if (b[i] > a[i]) bLessOrEqual = false;
    }
    if (Arrays.equals(a, b)) return Relation.EQUAL;
    if (aLessOrEqual) return Relation.BEFORE;
    if (bLessOrEqual) return Relation.AFTER;
    return Relation.CONCURRENT;
  }

  private static long[] flatten(VectorClock clock) {
    return clock.vector.values().stream().mapToLong(Long::longValue).toArray();
  }

  private VectorClock copy() {
    VectorClock copy = new VectorClock(nodeId);
    copy.vector.putAll(this.vector);
    return copy;
  }

  public Map<String, Long> asMap() {
    return Map.copyOf(vector);
  }
}
