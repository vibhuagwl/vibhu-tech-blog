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
import java.time.Duration;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.RedisScript;

class RedisFixedWindowStoreTest {

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
            anyString()))
        .thenReturn(List.of(1L, 4L, 0L, 5L));
    RedisFixedWindowStore store =
        new RedisFixedWindowStore(redis, new MutableClock(0), "return {1,4,0,5}");
    RateLimitResult result = store.consume(key(), policy(), 1);
    assertTrue(result.allowed());
    assertTrue(result.remainingTokens() == 4);
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
            anyString()))
        .thenReturn(List.of(0L, 0L, 500L, 5L));
    RedisFixedWindowStore store =
        new RedisFixedWindowStore(redis, new MutableClock(0), "return {0,0,500,5}");
    RateLimitResult result = store.consume(key(), policy(), 1);
    assertFalse(result.allowed());
    assertTrue(result.retryAfter().toMillis() >= 500);
  }

  @Test
  void loadScriptContainsAtomicHset() {
    String script = RedisFixedWindowStore.loadScript();
    assertTrue(script.contains("HMGET"));
    assertTrue(script.contains("HSET"));
    assertTrue(script.contains("PEXPIRE"));
  }

  private static RateLimitPolicy policy() {
    return RateLimitPolicy.builder()
        .id("r")
        .scope(RateLimitScope.CLIENT)
        .capacity(10)
        .refillRate(5)
        .refillPeriod(RefillPeriod.SECOND)
        .timeWindow(Duration.ofSeconds(1))
        .build();
  }

  private static RateLimitKey key() {
    return RateLimitKey.from(
        policy(), RequestContext.builder().tenantId("acme").clientId("c").build());
  }
}
