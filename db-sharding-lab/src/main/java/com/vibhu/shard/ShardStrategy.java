package com.vibhu.shard;

/** Selects a shard index for a routing key (customerId, tenantId, …). */
public interface ShardStrategy {
  int getShard(String key);
}
