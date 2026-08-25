package com.vibhu.ratelimit.limiter;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.vibhu.ratelimit.api.RateLimitAlgorithm;
import com.vibhu.ratelimit.api.RateLimitPolicy;
import com.vibhu.ratelimit.api.RateLimitScope;
import com.vibhu.ratelimit.api.RateLimitResult;
import com.vibhu.ratelimit.api.RefillPeriod;
import com.vibhu.ratelimit.api.RequestContext;
import java.time.Duration;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class FixedWindowRateLimiterTest {

  private RateLimiterTestSupport.TestHarness harness;
  private PolicyBoundRateLimiter limiter;

  @BeforeEach
  void setUp() {
    harness = RateLimiterTestSupport.harness();
    harness.fixedWindow().clear();
    limiter =
        (PolicyBoundRateLimiter)
            harness
                .factory()
                .createStandalone(
                    RateLimitPolicy.builder()
                        .id("fw")
                        .scope(RateLimitScope.CLIENT)
                        .algorithm(RateLimitAlgorithm.FIXED_WINDOW)
                        .capacity(10)
                        .refillRate(5)
                        .refillPeriod(RefillPeriod.SECOND)
                        .timeWindow(Duration.ofSeconds(1))
                        .build());
  }

  @Test
  void allowsUntilLimitThenRejects() {
    RequestContext ctx = labCtx("a");
    for (int i = 0; i < 5; i++) {
      assertTrue(limiter.allow(ctx).allowed());
    }
    assertFalse(limiter.allow(ctx).allowed());
  }

  @Test
  void boundaryBurstAllowsDoubleTrafficAtWindowEdge() {
    RequestContext ctx = labCtx("burst");
    for (int i = 0; i < 5; i++) {
      assertTrue(limiter.allow(ctx).allowed());
    }
    harness.clock().advance(1000);
    int allowedInSecondWindow = 0;
    for (int i = 0; i < 5; i++) {
      if (limiter.allow(ctx).allowed()) {
        allowedInSecondWindow++;
      }
    }
    assertEquals(5, allowedInSecondWindow);
    // Fixed window at boundary: 5 at end of window 1 + 5 at start of window 2 = 10 in 1s span
    assertTrue(allowedInSecondWindow == 5, "second window grants full limit again");
  }

  @Test
  void concurrentRequestsRespectLimit() throws Exception {
    runConcurrent(limiter, 100, 10, 5);
  }

  static void runConcurrent(
      PolicyBoundRateLimiter limiter, int threads, int perThread, long expectedAllowed)
      throws Exception {
    ExecutorService pool = Executors.newFixedThreadPool(threads);
    CountDownLatch start = new CountDownLatch(1);
    CountDownLatch done = new CountDownLatch(threads);
    AtomicInteger allowed = new AtomicInteger();
    RequestContext ctx = labCtx("conc");
    for (int t = 0; t < threads; t++) {
      pool.submit(
          () -> {
            try {
              start.await();
              for (int i = 0; i < perThread; i++) {
                if (limiter.allow(ctx).allowed()) {
                  allowed.incrementAndGet();
                }
              }
            } catch (InterruptedException e) {
              Thread.currentThread().interrupt();
            } finally {
              done.countDown();
            }
          });
    }
    start.countDown();
    assertTrue(done.await(15, TimeUnit.SECONDS));
    pool.shutdownNow();
    assertEquals(expectedAllowed, allowed.get());
  }

  private static RequestContext labCtx(String key) {
    return RequestContext.builder().tenantId("lab").clientId(key).build();
  }
}
