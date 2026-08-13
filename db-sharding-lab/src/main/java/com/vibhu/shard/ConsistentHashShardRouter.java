package com.vibhu.shard;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.NavigableMap;
import java.util.Set;
import java.util.TreeMap;

/**
 * Consistent-hash ring with virtual nodes. Adding/removing a shard moves only
 * a fraction of keys vs {@code hash % N}.
 */
public final class ConsistentHashShardRouter implements ShardStrategy {
  private final NavigableMap<Integer, Integer> ring = new TreeMap<>();
  private final int virtualNodes;
  private final Set<Integer> shards = new LinkedHashSet<>();

  public ConsistentHashShardRouter(List<Integer> shardIds, int virtualNodes) {
    if (shardIds == null || shardIds.isEmpty()) {
      throw new IllegalArgumentException("shards required");
    }
    if (virtualNodes < 1) {
      throw new IllegalArgumentException("virtualNodes must be >= 1");
    }
    this.virtualNodes = virtualNodes;
    for (int shard : shardIds) {
      addShard(shard);
    }
  }

  public void addShard(int shardId) {
    shards.add(shardId);
    for (int i = 0; i < virtualNodes; i++) {
      ring.put(vnodeHash(shardId, i), shardId);
    }
  }

  public void removeShard(int shardId) {
    shards.remove(shardId);
    for (int i = 0; i < virtualNodes; i++) {
      ring.remove(vnodeHash(shardId, i));
    }
  }

  @Override
  public int getShard(String key) {
    if (key == null || key.isBlank()) {
      throw new IllegalArgumentException("key required");
    }
    if (ring.isEmpty()) {
      throw new IllegalStateException("empty ring");
    }
    int h = mix(key.hashCode());
    var tail = ring.tailMap(h);
    Integer node = tail.isEmpty() ? ring.firstKey() : tail.firstKey();
    return ring.get(node);
  }

  public List<Integer> shardIds() {
    return new ArrayList<>(shards);
  }

  private static int vnodeHash(int shardId, int vnode) {
    return mix(("shard-" + shardId + "-vn-" + vnode).hashCode());
  }

  /** Spread bits so nearby integers do not clump on the ring. */
  private static int mix(int h) {
    h ^= (h >>> 16);
    h *= 0x85ebca6b;
    h ^= (h >>> 13);
    h *= 0xc2b2ae35;
    h ^= (h >>> 16);
    return h;
  }
}
