package com.vibhu.msp.ratelimit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.Duration;
import org.junit.jupiter.api.Test;

class SlidingWindowRateLimiterTest {

  @Test
  void enforcesWindowLimit() {
    SlidingWindowRateLimiter limiter = new SlidingWindowRateLimiter(3, Duration.ofSeconds(1));
    assertTrue(limiter.tryAcquire());
    assertTrue(limiter.tryAcquire());
    assertTrue(limiter.tryAcquire());
    assertFalse(limiter.tryAcquire());
    assertEquals(0, limiter.remaining());
  }

  @Test
  void allowsAfterWindowSlides() throws InterruptedException {
    SlidingWindowRateLimiter limiter = new SlidingWindowRateLimiter(2, Duration.ofMillis(100));
    assertTrue(limiter.tryAcquire());
    assertTrue(limiter.tryAcquire());
    assertFalse(limiter.tryAcquire());
    Thread.sleep(120);
    assertTrue(limiter.tryAcquire());
  }
}
