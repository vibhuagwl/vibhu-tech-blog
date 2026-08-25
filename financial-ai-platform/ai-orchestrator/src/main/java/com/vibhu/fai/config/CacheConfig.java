package com.vibhu.fai.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import java.time.Duration;
import org.springframework.cache.CacheManager;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.cache.interceptor.CacheErrorHandler;
import org.springframework.cache.interceptor.SimpleCacheErrorHandler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

@Configuration
public class CacheConfig {

  @Bean
  @Primary
  CacheManager caffeineCacheManager() {
    CaffeineCacheManager cm = new CaffeineCacheManager("payments", "prices", "policies");
    cm.setCaffeine(
        Caffeine.newBuilder()
            .maximumSize(10_000)
            .expireAfterWrite(Duration.ofMinutes(5))
            .recordStats());
    return cm;
  }

  @Bean
  CacheErrorHandler cacheErrorHandler() {
    // Fail-open: log and continue to method/DB
    return new SimpleCacheErrorHandler();
  }
}
