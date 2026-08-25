package com.vibhu.cache.protection;

import java.time.Duration;
import java.util.concurrent.ThreadLocalRandom;

public final class TtlJitter {

  private TtlJitter() {}

  /** Stagger expiries to reduce avalanche when many keys share a base TTL. */
  public static Duration apply(Duration base, Duration maxJitter) {
    long j = ThreadLocalRandom.current().nextLong(maxJitter.toMillis() + 1);
    return base.plusMillis(j);
  }
}
