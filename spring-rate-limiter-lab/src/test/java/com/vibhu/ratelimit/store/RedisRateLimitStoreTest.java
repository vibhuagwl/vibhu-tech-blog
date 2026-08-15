package com.vibhu.ratelimit.store;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.vibhu.ratelimit.api.RateLimitKey;
import com.vibhu.ratelimit.api.RateLimitPolicy;
import com.vibhu.ratelimit.api.RateLimitResult;
import com.vibhu.ratelimit.api.RateLimitScope;
import com.vibhu.ratelimit.api.RefillPeriod;
import com.vibhu.ratelimit.api.RequestContext;
import com.vibhu.ratelimit.clock.MutableClock;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.RedisScript;

class RedisRateLimitStoreTest {

  @Test
  void luaAllowPayloadMapsToAllowResult() {
    StringRedisTemplate redis = mock(StringRedisTemplate.class);
    when(redis.execute(
            any(RedisScript.class),
            anyList(),
            anyString(),
            anyString(),
            anyString(),
            anyString(),
            anyString(),
            anyString()))
        .thenReturn(List.of(1L, 9L, 0L, 10L));
    RedisRateLimitStore store =
        new RedisRateLimitStore(redis, new MutableClock(0), "return {1,9,0,10}");
    RateLimitResult result = store.consume(key(), policy(), 1);
    assertTrue(result.allowed());
    assertTrue(result.remainingTokens() == 9);
  }

  @Test
  void luaRejectPayloadMapsToRejectResult() {
    StringRedisTemplate redis = mock(StringRedisTemplate.class);
    when(redis.execute(
            any(RedisScript.class),
            anyList(),
            anyString(),
            anyString(),
            anyString(),
            anyString(),
            anyString(),
            anyString()))
        .thenReturn(List.of(0L, 0L, 1500L, 10L));
    RedisRateLimitStore store =
        new RedisRateLimitStore(redis, new MutableClock(0), "return {0,0,1500,10}");
    RateLimitResult result = store.consume(key(), policy(), 1);
    assertFalse(result.allowed());
    assertTrue(result.retryAfter().toMillis() >= 1500);
  }

  @Test
  void loadScriptContainsAtomicHset() {
    String script = RedisRateLimitStore.loadScript();
    assertTrue(script.contains("HMGET"));
    assertTrue(script.contains("HSET"));
    assertTrue(script.contains("PEXPIRE"));
  }

  private static RateLimitPolicy policy() {
    return RateLimitPolicy.builder()
        .id("r")
        .scope(RateLimitScope.CLIENT)
        .capacity(10)
        .refillRate(10)
        .refillPeriod(RefillPeriod.MINUTE)
        .build();
  }

  private static RateLimitKey key() {
    return RateLimitKey.from(
        policy(), RequestContext.builder().tenantId("acme").clientId("c").build());
  }
}
