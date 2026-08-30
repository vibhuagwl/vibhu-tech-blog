package com.example.flashsale.flash.infrastructure.redis;

import org.springframework.context.annotation.Profile;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.List;
import java.util.UUID;

/**
 * SET key token NX PX + Lua unlock by token.
 * Use for cache stampede / admin restock — NEVER around every purchase (hot-SKU mutex).
 */
@Component
@Profile("!test")
public class RedisLock {

    private final StringRedisTemplate redis;
    private final InventoryLuaScript scripts;

    public RedisLock(StringRedisTemplate redis, InventoryLuaScript scripts) {
        this.redis = redis;
        this.scripts = scripts;
    }

    public String tryLock(String name, Duration ttl) {
        String token = UUID.randomUUID()
                .toString();
        Boolean ok = redis.opsForValue()
                .setIfAbsent("lock:" + name, token, ttl);
        return Boolean.TRUE.equals(ok) ? token : null;
    }

    public void unlock(String name, String token) {
        redis.execute(scripts.unlock(), List.of("lock:" + name), token);
    }
}
