package com.vibhu.cache.algorithm;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import org.junit.jupiter.api.Test;

class TtlCacheTest {

  @Test
  void expiresAfterWrite() {
    MutableClock clock = new MutableClock(Instant.parse("2026-01-01T00:00:00Z"));
    TtlCache<String, String> cache = new TtlCache<>(Duration.ofSeconds(10), clock);
    cache.put("k", "v");
    assertEquals("v", cache.get("k"));
    clock.advance(Duration.ofSeconds(11));
    assertNull(cache.get("k"));
  }

  static final class MutableClock extends Clock {
    private Instant instant;

    MutableClock(Instant instant) {
      this.instant = instant;
    }

    void advance(Duration d) {
      instant = instant.plus(d);
    }

    @Override
    public ZoneOffset getZone() {
      return ZoneOffset.UTC;
    }

    @Override
    public Clock withZone(java.time.ZoneId zone) {
      return this;
    }

    @Override
    public Instant instant() {
      return instant;
    }
  }
}
