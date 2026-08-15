package com.vibhu.shard;

/**
 * Naive modulo hash sharding. Even distribution for fixed N, but changing {@code shardCount} remaps
 * most keys — prefer {@link ConsistentHashShardRouter}.
 */
public final class HashShardRouter implements ShardStrategy {
  private final int shardCount;

  public HashShardRouter(int shardCount) {
    if (shardCount < 1) {
      throw new IllegalArgumentException("shardCount must be >= 1");
    }
    this.shardCount = shardCount;
  }

  @Override
  public int getShard(String key) {
    if (key == null || key.isBlank()) {
      throw new IllegalArgumentException("key required");
    }
    return Math.floorMod(key.hashCode(), shardCount);
  }

  public int shardCount() {
    return shardCount;
  }
}
