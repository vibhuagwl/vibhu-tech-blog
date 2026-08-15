package com.vibhu.ratelimit.store;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.vibhu.ratelimit.api.RateLimitKey;
import com.vibhu.ratelimit.api.RateLimitPolicy;
import com.vibhu.ratelimit.api.RateLimitResult;
import com.vibhu.ratelimit.api.RateLimitScope;
import com.vibhu.ratelimit.api.RefillPeriod;
import com.vibhu.ratelimit.api.RequestContext;
import com.vibhu.ratelimit.clock.MutableClock;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class TokenBucketRateLimiterStoreTest {

  private MutableClock clock;
  private InMemoryRateLimitStore store;
  private RateLimitPolicy policy;
  private RequestContext ctx;
  private RateLimitKey key;

  @BeforeEach
  void setUp() {
    clock = new MutableClock(1_000_000L);
    store = new InMemoryRateLimitStore(clock);
    policy =
        RateLimitPolicy.builder()
            .id("client-api")
            .scope(RateLimitScope.CLIENT_API)
            .capacity(5)
            .refillRate(5)
            .refillPeriod(RefillPeriod.MINUTE)
            .clientId("client-123")
            .apiPath("/payments")
            .build();
    ctx =
        RequestContext.builder()
            .tenantId("acme")
            .clientId("client-123")
            .userId("u-1")
            .apiPath("/payments")
            .httpMethod("POST")
            .build();
    key = RateLimitKey.from(policy, ctx);
  }

  @Test
  void requestsWithinLimitAreAllowed() {
    for (int i = 0; i < 5; i++) {
      RateLimitResult result = store.consume(key, policy, 1);
      assertTrue(result.allowed(), "request " + i);
      assertEquals(4 - i, result.remainingTokens());
      assertEquals(5, result.limit());
    }
  }

  @Test
  void requestsExceedingLimitAreRejectedWithRetryAfter() {
    for (int i = 0; i < 5; i++) {
      assertTrue(store.consume(key, policy, 1).allowed());
    }
    RateLimitResult rejected = store.consume(key, policy, 1);
    assertFalse(rejected.allowed());
    assertEquals(0, rejected.remainingTokens());
    assertTrue(rejected.retryAfter().toMillis() > 0);
  }

  @Test
  void tokensRefillOverTime() {
    for (int i = 0; i < 5; i++) {
      assertTrue(store.consume(key, policy, 1).allowed());
    }
    assertFalse(store.consume(key, policy, 1).allowed());
    clock.advance(policy.refillPeriod().toMillis());
    RateLimitResult after = store.consume(key, policy, 1);
    assertTrue(after.allowed());
    assertEquals(4, after.remainingTokens());
  }

  @Test
  void burstUsesCapacityAboveSustainedRefill() {
    RateLimitPolicy bursty =
        RateLimitPolicy.builder()
            .id("burst")
            .scope(RateLimitScope.CLIENT_API)
            .capacity(20)
            .refillRate(10)
            .refillPeriod(RefillPeriod.SECOND)
            .clientId("client-123")
            .apiPath("/payments")
            .build();
    RateLimitKey burstKey = RateLimitKey.from(bursty, ctx);
    int allowed = 0;
    for (int i = 0; i < 25; i++) {
      if (store.consume(burstKey, bursty, 1).allowed()) {
        allowed++;
      }
    }
    assertEquals(20, allowed);
  }

  @Test
  void multipleClientsHaveIndependentBuckets() {
    RequestContext other =
        RequestContext.builder()
            .tenantId("acme")
            .clientId("client-999")
            .apiPath("/payments")
            .build();
    RateLimitPolicy otherPolicy =
        RateLimitPolicy.builder()
            .id("other")
            .scope(RateLimitScope.CLIENT_API)
            .capacity(2)
            .refillRate(2)
            .refillPeriod(RefillPeriod.MINUTE)
            .clientId("client-999")
            .apiPath("/payments")
            .build();
    RateLimitPolicy small =
        RateLimitPolicy.builder()
            .id("small")
            .scope(RateLimitScope.CLIENT_API)
            .capacity(2)
            .refillRate(2)
            .refillPeriod(RefillPeriod.MINUTE)
            .clientId("client-123")
            .apiPath("/payments")
            .build();
    RateLimitKey a = RateLimitKey.from(small, ctx);
    RateLimitKey b = RateLimitKey.from(otherPolicy, other);
    assertTrue(store.consume(a, small, 1).allowed());
    assertTrue(store.consume(a, small, 1).allowed());
    assertFalse(store.consume(a, small, 1).allowed());
    assertTrue(store.consume(b, otherPolicy, 1).allowed());
  }

  @Test
  void multipleTenantsHaveIndependentBuckets() {
    RateLimitPolicy tenantPolicy =
        RateLimitPolicy.builder()
            .id("tenant")
            .scope(RateLimitScope.TENANT)
            .capacity(1)
            .refillRate(1)
            .refillPeriod(RefillPeriod.HOUR)
            .build();
    RequestContext acme = RequestContext.builder().tenantId("acme").build();
    RequestContext globex = RequestContext.builder().tenantId("globex").build();
    assertTrue(store.consume(RateLimitKey.from(tenantPolicy, acme), tenantPolicy, 1).allowed());
    assertFalse(store.consume(RateLimitKey.from(tenantPolicy, acme), tenantPolicy, 1).allowed());
    assertTrue(store.consume(RateLimitKey.from(tenantPolicy, globex), tenantPolicy, 1).allowed());
  }

  @Test
  void expiredIdleBucketIsRebuiltAtCapacity() {
    assertTrue(store.consume(key, policy, 1).allowed());
    store.delete(key);
    RateLimitResult fresh = store.consume(key, policy, 1);
    assertTrue(fresh.allowed());
    assertEquals(4, fresh.remainingTokens());
  }

  @Test
  void blockedPolicyRejectsImmediately() {
    RateLimitPolicy blocked =
        RateLimitPolicy.builder()
            .id("block")
            .scope(RateLimitScope.CLIENT)
            .capacity(100)
            .refillRate(100)
            .refillPeriod(RefillPeriod.MINUTE)
            .blocked(true)
            .build();
    RateLimitResult result = store.consume(RateLimitKey.from(blocked, ctx), blocked, 1);
    assertFalse(result.allowed());
  }
}
