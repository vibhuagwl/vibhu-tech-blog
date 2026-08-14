package com.vibhu.ratelimit.api;

import java.time.Duration;

public enum RefillPeriod {
  SECOND(Duration.ofSeconds(1)),
  MINUTE(Duration.ofMinutes(1)),
  HOUR(Duration.ofHours(1)),
  DAY(Duration.ofDays(1));

  private final Duration duration;

  RefillPeriod(Duration duration) {
    this.duration = duration;
  }

  public Duration duration() {
    return duration;
  }

  public long toMillis() {
    return duration.toMillis();
  }
}
