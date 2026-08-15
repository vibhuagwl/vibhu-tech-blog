package com.vibhu.shard;

import java.util.concurrent.atomic.AtomicLong;

/**
 * Minimal Snowflake-style ID: timestamp | shardId | sequence. Not Twitter-compatible bit layout —
 * interview-friendly and collision-free across shards when shardId differs.
 */
public final class SnowflakeIdGenerator {
  private static final int SHARD_BITS = 10;
  private static final int SEQ_BITS = 12;
  private static final long MAX_SHARD = (1L << SHARD_BITS) - 1;
  private static final long MAX_SEQ = (1L << SEQ_BITS) - 1;

  private final long shardId;
  private final long epochMs;
  private final AtomicLong lastTs = new AtomicLong(-1);
  private long sequence;

  public SnowflakeIdGenerator(int shardId) {
    this(shardId, 1_700_000_000_000L);
  }

  public SnowflakeIdGenerator(int shardId, long epochMs) {
    if (shardId < 0 || shardId > MAX_SHARD) {
      throw new IllegalArgumentException("shardId out of range");
    }
    this.shardId = shardId;
    this.epochMs = epochMs;
  }

  public synchronized long nextId() {
    long now = System.currentTimeMillis();
    long last = lastTs.get();
    if (now < last) {
      throw new IllegalStateException("clock moved backwards");
    }
    if (now == last) {
      sequence = (sequence + 1) & MAX_SEQ;
      if (sequence == 0) {
        now = waitNextMillis(last);
      }
    } else {
      sequence = 0;
    }
    lastTs.set(now);
    long ts = now - epochMs;
    return (ts << (SHARD_BITS + SEQ_BITS)) | (shardId << SEQ_BITS) | sequence;
  }

  public static int extractShard(long id) {
    return (int) ((id >> SEQ_BITS) & MAX_SHARD);
  }

  private static long waitNextMillis(long last) {
    long now = System.currentTimeMillis();
    while (now <= last) {
      now = System.currentTimeMillis();
    }
    return now;
  }
}
