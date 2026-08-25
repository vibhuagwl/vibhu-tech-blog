package com.vibhu.ratelimit.limiter;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.vibhu.ratelimit.api.RateLimitAlgorithm;
import com.vibhu.ratelimit.api.RateLimitPolicy;
import com.vibhu.ratelimit.api.RateLimitScope;
import com.vibhu.ratelimit.api.RefillPeriod;
import com.vibhu.ratelimit.api.RequestContext;
import java.time.Duration;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class SlidingWindowCounterRateLimiterTest {

  private RateLimiterTestSupport.TestHarness harness;
  private PolicyBoundRateLimiter limiter;

  @BeforeEach
  void setUp() {
    harness = RateLimiterTestSupport.harness();
    harness.slidingCounter().clear();
    limiter =
        (PolicyBoundRateLimiter)
            harness
                .factory()
                .createStandalone(
                    RateLimitPolicy.builder()
                        .id("swc")
                        .scope(RateLimitScope.CLIENT)
                        .algorithm(RateLimitAlgorithm.SLIDING_WINDOW_COUNTER)
                        .capacity(10)
                        .refillRate(10)
                        .refillPeriod(RefillPeriod.SECOND)
                        .timeWindow(Duration.ofSeconds(1))
                        .build());
  }

  @Test
  void allowsUntilLimitThenRejects() {
    RequestContext ctx = ctx("a");
    for (int i = 0; i < 10; i++) {
      assertTrue(limiter.allow(ctx).allowed());
    }
    assertFalse(limiter.allow(ctx).allowed());
  }

  @Test
  void concurrentRequestsRespectLimit() throws Exception {
    FixedWindowRateLimiterTest.runConcurrent(limiter, 100, 10, 10);
  }

  private static RequestContext ctx(String key) {
    return RequestContext.builder().tenantId("lab").clientId(key).build();
  }
}
