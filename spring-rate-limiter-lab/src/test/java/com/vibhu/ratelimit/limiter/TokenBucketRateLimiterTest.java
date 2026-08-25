package com.vibhu.ratelimit.limiter;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.vibhu.ratelimit.api.FailPolicy;
import com.vibhu.ratelimit.api.RateLimitKey;
import com.vibhu.ratelimit.api.RateLimitPolicy;
import com.vibhu.ratelimit.api.RateLimitResult;
import com.vibhu.ratelimit.api.RateLimitScope;
import com.vibhu.ratelimit.api.RefillPeriod;
import com.vibhu.ratelimit.api.RequestContext;
import com.vibhu.ratelimit.clock.MutableClock;
import com.vibhu.ratelimit.config.InMemoryRateLimitConfigProvider;
import com.vibhu.ratelimit.metrics.RateLimitMetrics;
import com.vibhu.ratelimit.store.InMemoryRateLimitStore;
import com.vibhu.ratelimit.store.RateLimitStore;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.Test;

class TokenBucketRateLimiterTest {

  private final RateLimiterTestSupport.TestHarness harness = RateLimiterTestSupport.harness();
  private final InMemoryRateLimitStore store = harness.tokenBucket();
  private final RateLimitMetrics metrics = new RateLimitMetrics(new SimpleMeterRegistry());

  @Test
  void failOpenAllowsWhenStoreThrows() {
    RateLimitPolicy policy = policy(FailPolicy.FAIL_OPEN);
    TokenBucketRateLimiter limiter =
        new TokenBucketRateLimiter(policy, failingStore(), store, metrics);
    RateLimitResult result = limiter.allow(ctx());
    assertTrue(result.allowed());
    assertTrue(result.degraded());
  }

  @Test
  void failClosedRejectsWhenStoreThrows() {
    RateLimitPolicy policy = policy(FailPolicy.FAIL_CLOSED);
    TokenBucketRateLimiter limiter =
        new TokenBucketRateLimiter(policy, failingStore(), store, metrics);
    RateLimitResult result = limiter.allow(ctx());
    assertFalse(result.allowed());
    assertTrue(result.degraded());
  }

  @Test
  void localFallbackEnforcesInProcessBucket() {
    RateLimitPolicy policy =
        RateLimitPolicy.builder()
            .id("fb")
            .scope(RateLimitScope.CLIENT)
            .capacity(1)
            .refillRate(1)
            .refillPeriod(RefillPeriod.HOUR)
            .failPolicy(FailPolicy.LOCAL_FALLBACK)
            .build();
    TokenBucketRateLimiter limiter =
        new TokenBucketRateLimiter(policy, failingStore(), store, metrics);
    assertTrue(limiter.allow(ctx()).allowed());
    assertFalse(limiter.allow(ctx()).allowed());
  }

  @Test
  void concurrentRequestsNeverExceedCapacity() throws Exception {
    RateLimitPolicy policy =
        RateLimitPolicy.builder()
            .id("conc")
            .scope(RateLimitScope.USER)
            .capacity(50)
            .refillRate(1)
            .refillPeriod(RefillPeriod.DAY)
            .build();
    TokenBucketRateLimiter limiter = new TokenBucketRateLimiter(policy, store, store, metrics);
    int threads = 32;
    int perThread = 10;
    ExecutorService pool = Executors.newFixedThreadPool(threads);
    CountDownLatch start = new CountDownLatch(1);
    CountDownLatch done = new CountDownLatch(threads);
    AtomicInteger allowed = new AtomicInteger();
    RequestContext ctx = ctx();
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
    assertTrue(done.await(10, TimeUnit.SECONDS));
    pool.shutdownNow();
    assertEquals(50, allowed.get(), "capacity must be a hard ceiling under contention");
  }

  @Test
  void configurationChangeAppliesOnNextRequest() {
    InMemoryRateLimitConfigProvider provider = new InMemoryRateLimitConfigProvider();
    provider.findAll().forEach(p -> provider.delete(p.id()));
    RateLimitPolicy tight =
        RateLimitPolicy.builder()
            .id("live")
            .scope(RateLimitScope.CLIENT)
            .capacity(1)
            .refillRate(1)
            .refillPeriod(RefillPeriod.HOUR)
            .build();
    provider.upsert(tight);
    RateLimiterFactory factory = harness.factory();
    CompositeRateLimiter composite = new CompositeRateLimiter(provider, factory, metrics);
    RequestContext ctx = ctx();
    assertTrue(composite.allow(ctx).allowed());
    assertFalse(composite.allow(ctx).allowed());
    provider.upsert(
        RateLimitPolicy.builder()
            .id("live")
            .scope(RateLimitScope.CLIENT)
            .capacity(10)
            .refillRate(10)
            .refillPeriod(RefillPeriod.HOUR)
            .build());
    factory.evict("live");
    harness.clock().advance(java.time.Duration.ofHours(1).toMillis());
    assertTrue(composite.allow(ctx).allowed());
  }

  @Test
  void compositeRejectsIfAnyLevelFails() {
    InMemoryRateLimitConfigProvider provider = new InMemoryRateLimitConfigProvider();
    provider.findAll().forEach(p -> provider.delete(p.id()));
    provider.upsert(
        RateLimitPolicy.builder()
            .id("global")
            .scope(RateLimitScope.GLOBAL)
            .capacity(100)
            .refillRate(100)
            .refillPeriod(RefillPeriod.HOUR)
            .build());
    provider.upsert(
        RateLimitPolicy.builder()
            .id("user")
            .scope(RateLimitScope.USER)
            .capacity(1)
            .refillRate(1)
            .refillPeriod(RefillPeriod.MINUTE)
            .build());
    CompositeRateLimiter composite =
        new CompositeRateLimiter(provider, RateLimiterTestSupport.harness().factory(), metrics);
    RequestContext ctx = ctx();
    assertTrue(composite.allow(ctx).allowed());
    RateLimitResult second = composite.allow(ctx);
    assertFalse(second.allowed());
    assertEquals("user", second.policyId());
  }

  private static RateLimitPolicy policy(FailPolicy fail) {
    return RateLimitPolicy.builder()
        .id("p")
        .scope(RateLimitScope.CLIENT)
        .capacity(10)
        .refillRate(10)
        .refillPeriod(RefillPeriod.MINUTE)
        .failPolicy(fail)
        .build();
  }

  private static RequestContext ctx() {
    return RequestContext.builder()
        .tenantId("acme")
        .clientId("client-123")
        .userId("u-1")
        .apiPath("/api/payments")
        .httpMethod("POST")
        .ipAddress("10.0.0.1")
        .build();
  }

  private static RateLimitStore failingStore() {
    return (RateLimitKey key, RateLimitPolicy policy, double cost) -> {
      throw new IllegalStateException("redis down");
    };
  }
}
