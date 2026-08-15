package com.vibhu.ratelimit.store;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

import com.vibhu.ratelimit.api.RateLimitKey;
import com.vibhu.ratelimit.api.RateLimitPolicy;
import com.vibhu.ratelimit.api.RateLimitScope;
import com.vibhu.ratelimit.api.RefillPeriod;
import com.vibhu.ratelimit.api.RequestContext;
import com.vibhu.ratelimit.clock.SystemClock;
import java.time.Duration;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.testcontainers.DockerClientFactory;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

@Testcontainers(disabledWithoutDocker = true)
class RedisRateLimitStoreIT {

  @Container
  @SuppressWarnings("resource")
  static GenericContainer<?> redis =
      new GenericContainer<>(DockerImageName.parse("redis:7-alpine"))
          .withExposedPorts(6379)
          .withStartupTimeout(Duration.ofSeconds(30));

  @Test
  void luaScriptEnforcesCapacityAcrossClients() {
    assumeTrue(DockerClientFactory.instance().isDockerAvailable());
    LettuceConnectionFactory factory =
        new LettuceConnectionFactory(redis.getHost(), redis.getMappedPort(6379));
    factory.afterPropertiesSet();
    StringRedisTemplate template = new StringRedisTemplate(factory);
    template.afterPropertiesSet();
    RedisRateLimitStore store = new RedisRateLimitStore(template, new SystemClock());
    RateLimitPolicy policy =
        RateLimitPolicy.builder()
            .id("it")
            .scope(RateLimitScope.CLIENT)
            .capacity(3)
            .refillRate(3)
            .refillPeriod(RefillPeriod.HOUR)
            .build();
    RateLimitKey key =
        RateLimitKey.from(policy, RequestContext.builder().tenantId("acme").clientId("it").build());
    int allowed = 0;
    for (int i = 0; i < 5; i++) {
      if (store.consume(key, policy, 1).allowed()) {
        allowed++;
      }
    }
    assertEquals(3, allowed);
    assertTrue(store.consume(key, policy, 1).retryAfter().toMillis() > 0);
    factory.destroy();
  }
}
