package com.vibhu.msp.id;

/** Twitter Snowflake-style 64-bit ID generator. Maps to curriculum Part 20. */
public final class SnowflakeIdGenerator {

  private static final long EPOCH = 1_704_067_200_000L; // 2024-01-01 UTC
  private static final long WORKER_BITS = 5L;
  private static final long DATACENTER_BITS = 5L;
  private static final long SEQUENCE_BITS = 12L;

  private static final long MAX_WORKER = ~(-1L << WORKER_BITS);
  private static final long MAX_DATACENTER = ~(-1L << DATACENTER_BITS);
  private static final long SEQUENCE_MASK = ~(-1L << SEQUENCE_BITS);

  private static final long WORKER_SHIFT = SEQUENCE_BITS;
  private static final long DATACENTER_SHIFT = SEQUENCE_BITS + WORKER_BITS;
  private static final long TIMESTAMP_SHIFT = SEQUENCE_BITS + WORKER_BITS + DATACENTER_BITS;

  private final long workerId;
  private final long datacenterId;
  private long sequence = 0L;
  private long lastTimestamp = -1L;

  public SnowflakeIdGenerator(long workerId, long datacenterId) {
    if (workerId > MAX_WORKER || workerId < 0) {
      throw new IllegalArgumentException("Worker ID out of range");
    }
    if (datacenterId > MAX_DATACENTER || datacenterId < 0) {
      throw new IllegalArgumentException("Datacenter ID out of range");
    }
    this.workerId = workerId;
    this.datacenterId = datacenterId;
  }

  public synchronized long nextId() {
    long timestamp = currentMillis();
    if (timestamp < lastTimestamp) {
      throw new IllegalStateException("Clock moved backwards");
    }
    if (timestamp == lastTimestamp) {
      sequence = (sequence + 1) & SEQUENCE_MASK;
      if (sequence == 0) {
        timestamp = waitNextMillis(lastTimestamp);
      }
    } else {
      sequence = 0L;
    }
    lastTimestamp = timestamp;
    return ((timestamp - EPOCH) << TIMESTAMP_SHIFT)
        | (datacenterId << DATACENTER_SHIFT)
        | (workerId << WORKER_SHIFT)
        | sequence;
  }

  private long waitNextMillis(long last) {
    long ts = currentMillis();
    while (ts <= last) {
      ts = currentMillis();
    }
    return ts;
  }

  private long currentMillis() {
    return System.currentTimeMillis();
  }
}
