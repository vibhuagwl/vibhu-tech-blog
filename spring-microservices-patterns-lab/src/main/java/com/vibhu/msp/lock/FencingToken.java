package com.vibhu.msp.lock;

import java.util.concurrent.atomic.AtomicLong;

/** Monotonic fencing tokens — stale lock holders cannot corrupt shared state. */
public final class FencingToken {

  private static final AtomicLong SEQUENCE = new AtomicLong(1);

  private FencingToken() {}

  public static String next() {
    return String.valueOf(SEQUENCE.getAndIncrement());
  }

  public static long parse(String token) {
    return Long.parseLong(token);
  }

  public static void resetForTests() {
    SEQUENCE.set(1);
  }
}
