package com.example.flashsale.flash.configuration;

import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;

import java.time.Duration;
import java.util.concurrent.ThreadLocalRandom;

/**
 * Cache-aside for sale metadata. TTL jitter reduces stampedes when 10k keys expire together.
 * Do NOT lock every cache get — that serializes the catalog under the lock key.
 */
@Configuration
@EnableCaching
@Profile("!test")
public class CacheConfig {

    @Bean
    RedisCacheManager cacheManager(RedisConnectionFactory connectionFactory) {
        int jitterSeconds = ThreadLocalRandom.current()
                .nextInt(15);
        RedisCacheConfiguration config = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofSeconds(30 + jitterSeconds))
                .disableCachingNullValues();
        return RedisCacheManager.builder(connectionFactory)
                .cacheDefaults(config)
                .build();
    }
}
