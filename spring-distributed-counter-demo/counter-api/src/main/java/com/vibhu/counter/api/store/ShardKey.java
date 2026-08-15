package com.vibhu.counter.api.store;

public record ShardKey(String resourceId, int shard) {
  public String redisKey() {
    return "counter:%s:shard:%d".formatted(resourceId, shard);
  }
}
