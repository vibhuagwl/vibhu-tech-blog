package com.vibhu.msp.ratelimit;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

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
