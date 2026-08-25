package com.vibhu.ratelimit.limiter;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.vibhu.ratelimit.api.RateLimitAlgorithm;
import com.vibhu.ratelimit.api.RateLimitPolicy;
import com.vibhu.ratelimit.api.RateLimitScope;
import com.vibhu.ratelimit.api.RefillPeriod;
import com.vibhu.ratelimit.api.RequestContext;
import org.junit.jupiter.api.Test;

class RateLimiterFactoryTest {

  @Test
  void createsEachAlgorithmWithoutUnsupportedOperationException() {
    RateLimiterTestSupport.TestHarness harness = RateLimiterTestSupport.harness();
    for (RateLimitAlgorithm algorithm : RateLimitAlgorithm.values()) {
      RateLimitPolicy policy =
          RateLimitPolicy.builder()
              .id("factory-" + algorithm.name())
              .scope(RateLimitScope.CLIENT)
              .algorithm(algorithm)
              .capacity(10)
              .refillRate(10)
              .refillPeriod(RefillPeriod.SECOND)
              .build();
      PolicyBoundRateLimiter limiter =
          (PolicyBoundRateLimiter) harness.factory().createStandalone(policy);
      assertTrue(limiter.allow(labCtx(algorithm.name())).allowed());
    }
  }

  @Test
  void weightedLimiterConsumesMultiplePermits() {
    RateLimiterTestSupport.TestHarness harness = RateLimiterTestSupport.harness();
    harness.tokenBucket().clear();
    PolicyBoundRateLimiter base =
        (PolicyBoundRateLimiter)
            harness
                .factory()
                .createStandalone(
                    RateLimitPolicy.builder()
                        .id("w-base")
                        .scope(RateLimitScope.CLIENT)
                        .algorithm(RateLimitAlgorithm.TOKEN_BUCKET)
                        .capacity(10)
                        .refillRate(10)
                        .refillPeriod(RefillPeriod.HOUR)
                        .build());
    WeightedRateLimiter weighted = new WeightedRateLimiter(base, 3.0);
    RequestContext ctx = RequestContext.builder().tenantId("lab").clientId("w").cost(1).build();
    assertTrue(weighted.allow(ctx).allowed());
    assertTrue(weighted.allow(ctx).allowed());
    assertTrue(weighted.allow(ctx).allowed());
    assertFalse(weighted.allow(ctx).allowed(), "3 permits * 3 weight = 9 consumed");
  }

  private static RequestContext labCtx(String key) {
    return RequestContext.builder().tenantId("lab").clientId(key).build();
  }
}
