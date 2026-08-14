package com.vibhu.ratelimit.config;

import com.vibhu.ratelimit.clock.Clock;
import com.vibhu.ratelimit.clock.SystemClock;
import com.vibhu.ratelimit.limiter.CompositeRateLimiter;
import com.vibhu.ratelimit.limiter.RateLimiterFactory;
import com.vibhu.ratelimit.metrics.RateLimitMetrics;
import com.vibhu.ratelimit.store.InMemoryRateLimitStore;
import com.vibhu.ratelimit.store.RateLimitStore;
import com.vibhu.ratelimit.store.RedisRateLimitStore;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.data.redis.connection.RedisStandaloneConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.StringRedisTemplate;

@Configuration
public class RateLimitBeans {

  @Bean
  Clock rateLimitClock() {
    return new SystemClock();
  }

  @Bean
  InMemoryRateLimitStore inMemoryRateLimitStore(Clock clock) {
    return new InMemoryRateLimitStore(clock);
  }

  @Bean
  InMemoryRateLimitConfigProvider rateLimitConfigProvider() {
    return new InMemoryRateLimitConfigProvider();
  }

  @Bean
  RateLimitMetrics rateLimitMetrics(MeterRegistry registry) {
    return new RateLimitMetrics(registry);
  }

  @Bean
  @Primary
  @ConditionalOnProperty(name = "rate-limit.store", havingValue = "memory", matchIfMissing = true)
  RateLimitStore memoryPrimaryStore(InMemoryRateLimitStore inMemory) {
    return inMemory;
  }

  @Bean
  @ConditionalOnProperty(name = "rate-limit.store", havingValue = "redis")
  LettuceConnectionFactory redisConnectionFactory(RateLimitProperties props) {
    RedisStandaloneConfiguration cfg = new RedisStandaloneConfiguration(props.redis().host(), props.redis().port());
    return new LettuceConnectionFactory(cfg);
  }

  @Bean
  @ConditionalOnProperty(name = "rate-limit.store", havingValue = "redis")
  StringRedisTemplate stringRedisTemplate(LettuceConnectionFactory factory) {
    return new StringRedisTemplate(factory);
  }

  @Bean
  @Primary
  @ConditionalOnProperty(name = "rate-limit.store", havingValue = "redis")
  RateLimitStore redisPrimaryStore(StringRedisTemplate template, Clock clock) {
    return new RedisRateLimitStore(template, clock);
  }

  @Bean
  RateLimiterFactory rateLimiterFactory(
      RateLimitStore primaryStore,
      InMemoryRateLimitStore inMemoryRateLimitStore,
      RateLimitMetrics metrics
  ) {
    return new RateLimiterFactory(primaryStore, inMemoryRateLimitStore, metrics);
  }

  @Bean
  @Primary
  CompositeRateLimiter compositeRateLimiter(
      RateLimitConfigProvider configs,
      RateLimiterFactory factory,
      RateLimitMetrics metrics
  ) {
    return new CompositeRateLimiter(configs, factory, metrics);
  }
}
