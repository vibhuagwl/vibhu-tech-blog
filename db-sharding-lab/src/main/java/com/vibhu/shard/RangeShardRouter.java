package com.vibhu.shard;

import java.util.NavigableMap;
import java.util.TreeMap;

/** Inclusive range map: customerId (parsed as long) → shard. */
public final class RangeShardRouter implements ShardStrategy {
  private final NavigableMap<Long, Integer> upperBoundToShard = new TreeMap<>();

  /**
   * @param ranges successive exclusive upper bounds with shard ids, e.g.
   *               (1_000_000→0), (2_000_000→1), (3_000_000→2)
   */
  public RangeShardRouter(NavigableMap<Long, Integer> ranges) {
    if (ranges == null || ranges.isEmpty()) {
      throw new IllegalArgumentException("ranges required");
    }
    upperBoundToShard.putAll(ranges);
  }

  public static RangeShardRouter ofMillionBands(int bands) {
    NavigableMap<Long, Integer> m = new TreeMap<>();
    for (int i = 0; i < bands; i++) {
      m.put((i + 1L) * 1_000_000L, i);
    }
    return new RangeShardRouter(m);
  }

  @Override
  public int getShard(String key) {
    long id = Long.parseLong(key);
    var entry = upperBoundToShard.ceilingEntry(id);
    if (entry == null) {
      throw new IllegalArgumentException("customerId out of range: " + key);
    }
    return entry.getValue();
  }
}
