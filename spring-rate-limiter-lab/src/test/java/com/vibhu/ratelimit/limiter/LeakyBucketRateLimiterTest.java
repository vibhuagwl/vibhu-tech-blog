package com.vibhu.ratelimit.limiter;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.vibhu.ratelimit.api.RateLimitAlgorithm;
import com.vibhu.ratelimit.api.RateLimitPolicy;
import com.vibhu.ratelimit.api.RateLimitScope;
import com.vibhu.ratelimit.api.RefillPeriod;
import com.vibhu.ratelimit.api.RequestContext;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class LeakyBucketRateLimiterTest {

  private RateLimiterTestSupport.TestHarness harness;
  private PolicyBoundRateLimiter limiter;

  @BeforeEach
  void setUp() {
    harness = RateLimiterTestSupport.harness();
    harness.leakyBucket().clear();
    limiter =
        (PolicyBoundRateLimiter)
            harness
                .factory()
                .createStandalone(
                    RateLimitPolicy.builder()
                        .id("lb")
                        .scope(RateLimitScope.CLIENT)
                        .algorithm(RateLimitAlgorithm.LEAKY_BUCKET)
                        .capacity(5)
                        .refillRate(5)
                        .refillPeriod(RefillPeriod.SECOND)
                        .build());
  }

  @Test
  void allowsUntilCapacityThenRejectsOverflow() {
    RequestContext ctx = ctx("a");
    for (int i = 0; i < 5; i++) {
      assertTrue(limiter.allow(ctx).allowed());
    }
    assertFalse(limiter.allow(ctx).allowed());
  }

  @Test
  void leaksAndAllowsAfterDrain() {
    RequestContext ctx = ctx("drain");
    for (int i = 0; i < 5; i++) {
      limiter.allow(ctx);
    }
    assertFalse(limiter.allow(ctx).allowed());
    harness.clock().advance(1000);
    assertTrue(limiter.allow(ctx).allowed());
  }

  @Test
  void concurrentRequestsRespectCapacity() throws Exception {
    FixedWindowRateLimiterTest.runConcurrent(limiter, 100, 10, 5);
  }

  private static RequestContext ctx(String key) {
    return RequestContext.builder().tenantId("lab").clientId(key).build();
  }
}
