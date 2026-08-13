package com.vibhu.shard;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/** Directory / tenant map — flexible remapping; cache in Redis in production. */
public final class DirectoryShardRouter implements ShardStrategy {
  private final Map<String, Integer> directory;
  private final int defaultShard;

  public DirectoryShardRouter(Map<String, Integer> directory, int defaultShard) {
    this.directory = new ConcurrentHashMap<>(directory);
    this.defaultShard = defaultShard;
  }

  public void put(String key, int shard) {
    directory.put(key, shard);
  }

  public void migrate(String key, int newShard) {
    directory.put(key, newShard);
  }

  @Override
  public int getShard(String key) {
    Integer s = directory.get(key);
    return s != null ? s : defaultShard;
  }

  public Map<String, Integer> snapshot() {
    return new HashMap<>(directory);
  }
}
