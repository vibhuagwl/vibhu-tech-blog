package com.vibhu.msp.ratelimit;

import org.junit.jupiter.api.Test;

import java.time.Duration;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class TokenBucketRateLimiterTest {

  @Test
  void allowsBurstThenRejects() {
    TokenBucketRateLimiter limiter = new TokenBucketRateLimiter(3, 1);
    assertTrue(limiter.tryAcquire());
    assertTrue(limiter.tryAcquire());
    assertTrue(limiter.tryAcquire());
    assertFalse(limiter.tryAcquire());
  }

  @Test
  void refillsOverTime() throws InterruptedException {
    TokenBucketRateLimiter limiter = new TokenBucketRateLimiter(1, 10);
    assertTrue(limiter.tryAcquire());
    assertFalse(limiter.tryAcquire());
    Thread.sleep(150);
    assertTrue(limiter.tryAcquire());
  }
}
