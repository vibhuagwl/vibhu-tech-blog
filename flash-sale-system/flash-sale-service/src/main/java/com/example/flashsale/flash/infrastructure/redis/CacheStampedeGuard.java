package com.example.flashsale.flash.infrastructure.redis;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.function.Supplier;

/**
 * Single-flight for expensive cache fills. Do NOT lock every GET — only the miss path.
 */
@Component
@Profile("!test")
public class CacheStampedeGuard {

    private final RedisLock redisLock;

    public CacheStampedeGuard(RedisLock redisLock) {
        this.redisLock = redisLock;
    }

    public <T> T loadOnce(String name, Supplier<T> loader) {
        String token = redisLock.tryLock("cache:" + name, Duration.ofSeconds(2));
        try {
            return loader.get();
        } finally {
            if (token != null) {
                redisLock.unlock("cache:" + name, token);
            }
        }
    }
}
