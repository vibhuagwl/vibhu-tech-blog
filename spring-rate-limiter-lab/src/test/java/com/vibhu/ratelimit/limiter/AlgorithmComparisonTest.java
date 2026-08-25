package com.vibhu.ratelimit.limiter;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.vibhu.ratelimit.api.RateLimitAlgorithm;
import com.vibhu.ratelimit.api.RateLimitPolicy;
import com.vibhu.ratelimit.api.RateLimitScope;
import com.vibhu.ratelimit.api.RefillPeriod;
import com.vibhu.ratelimit.api.RequestContext;
import java.time.Duration;
import org.junit.jupiter.api.Test;

class AlgorithmComparisonTest {

  @Test
  void fixedWindowAllowsMoreThanSlidingLogAtBoundary() {
    RateLimiterTestSupport.TestHarness harness = RateLimiterTestSupport.harness();
    harness.fixedWindow().clear();
    harness.slidingLog().clear();

    PolicyBoundRateLimiter fixed =
        policyLimiter(harness, RateLimitAlgorithm.FIXED_WINDOW, "fixed");
    PolicyBoundRateLimiter sliding =
        policyLimiter(harness, RateLimitAlgorithm.SLIDING_WINDOW_LOG, "sliding");

    RequestContext fixedCtx = ctx("fixed-key");
    RequestContext slidingCtx = ctx("sliding-key");

    harness.clock().set(999);
    for (int i = 0; i < 5; i++) {
      assertTrue(fixed.allow(fixedCtx).allowed());
      assertTrue(sliding.allow(slidingCtx).allowed());
    }

    harness.clock().set(1000);

    int fixedAllowed = 0;
    int slidingAllowed = 0;
    for (int i = 0; i < 5; i++) {
      if (fixed.allow(fixedCtx).allowed()) {
        fixedAllowed++;
      }
      if (sliding.allow(slidingCtx).allowed()) {
        slidingAllowed++;
      }
    }

    assertEquals(5, fixedAllowed, "fixed window resets at boundary — full limit again");
    assertEquals(
        0,
        slidingAllowed,
        "sliding log still sees events from t=999ms inside the 1s window");
  }

  private static PolicyBoundRateLimiter policyLimiter(
      RateLimiterTestSupport.TestHarness harness, RateLimitAlgorithm algorithm, String id) {
    return (PolicyBoundRateLimiter)
        harness
            .factory()
            .createStandalone(
                RateLimitPolicy.builder()
                    .id(id)
                    .scope(RateLimitScope.CLIENT)
                    .algorithm(algorithm)
                    .capacity(10)
                    .refillRate(5)
                    .refillPeriod(RefillPeriod.SECOND)
                    .timeWindow(Duration.ofSeconds(1))
                    .build());
  }

  private static RequestContext ctx(String key) {
    return RequestContext.builder().tenantId("lab").clientId(key).build();
  }
}
