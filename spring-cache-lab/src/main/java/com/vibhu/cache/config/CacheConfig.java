package com.vibhu.cache.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import com.vibhu.cache.protection.TtlJitter;
import java.time.Duration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.cache.CacheManager;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.cache.interceptor.KeyGenerator;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

@Configuration
public class CacheConfig {

  @Bean
  @Primary
  @Profile("!redis")
  CacheManager caffeineCacheManager(
      @Value("${app.cache.caffeine.max-size:10000}") long maxSize,
      @Value("${app.cache.caffeine.ttl-seconds:60}") long ttlSeconds) {
    CaffeineCacheManager manager =
        new CaffeineCacheManager("products", "productsSynced", "productLists", "users");
    Duration ttl = TtlJitter.apply(Duration.ofSeconds(ttlSeconds), Duration.ofSeconds(5));
    manager.setCaffeine(
        Caffeine.newBuilder().maximumSize(maxSize).expireAfterWrite(ttl).recordStats());
    return manager;
  }

  @Bean
  @Primary
  @Profile("redis")
  @ConditionalOnProperty(name = "app.cache.redis-enabled", havingValue = "true")
  CacheManager redisCacheManager(RedisConnectionFactory factory) {
    RedisCacheConfiguration cfg =
        RedisCacheConfiguration.defaultCacheConfig()
            .entryTtl(Duration.ofMinutes(5))
            .prefixCacheNameWith("cache:v1:")
            .disableCachingNullValues()
            .serializeKeysWith(
                RedisSerializationContext.SerializationPair.fromSerializer(
                    new StringRedisSerializer()))
            .serializeValuesWith(
                RedisSerializationContext.SerializationPair.fromSerializer(
                    new GenericJackson2JsonRedisSerializer()));
    return RedisCacheManager.builder(factory).cacheDefaults(cfg).build();
  }

  /** Also expose Caffeine as L1-style manager when on redis profile (multi CacheManager demos). */
  @Bean(name = "caffeineCacheManager")
  @Profile("redis")
  CacheManager caffeineSecondary(
      @Value("${app.cache.caffeine.max-size:10000}") long maxSize) {
    CaffeineCacheManager manager = new CaffeineCacheManager("productsLocal");
    manager.setCaffeine(
        Caffeine.newBuilder()
            .maximumSize(maxSize)
            .expireAfterAccess(Duration.ofMinutes(2))
            .recordStats());
    return manager;
  }

  @Bean("tenantKeyGenerator")
  KeyGenerator tenantKeyGenerator() {
    return (target, method, params) -> {
      String tenant = TenantContext.getTenantId();
      StringBuilder sb = new StringBuilder(tenant).append(':').append(method.getName());
      for (Object p : params) {
        sb.append(':').append(p);
      }
      return sb.toString();
    };
  }
}
