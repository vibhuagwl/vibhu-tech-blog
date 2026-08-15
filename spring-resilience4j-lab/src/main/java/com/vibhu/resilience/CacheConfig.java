package com.vibhu.resilience;

import com.github.benmanes.caffeine.cache.Caffeine;
import java.time.Duration;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Production cache is Caffeine/Redis — not Resilience4j Cache (that module wraps javax.cache). Same
 * idea: do not ask the bank the FX question 1000 times.
 */
@Configuration
@EnableCaching
public class CacheConfig {

  @Bean
  CacheManager cacheManager() {
    CaffeineCacheManager manager = new CaffeineCacheManager("fxRates");
    manager.setCaffeine(
        Caffeine.newBuilder().maximumSize(1_000).expireAfterWrite(Duration.ofSeconds(30)));
    return manager;
  }
}
