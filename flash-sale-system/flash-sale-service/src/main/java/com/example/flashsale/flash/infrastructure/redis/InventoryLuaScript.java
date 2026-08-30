package com.example.flashsale.flash.infrastructure.redis;

import org.springframework.core.io.ClassPathResource;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Component;
import org.springframework.util.StreamUtils;

import java.nio.charset.StandardCharsets;

/**
 * Loads Redis Lua from {@code classpath:redis/*.lua}.
 * WHY a file not a string: interviewers can open the script; ops can review it in git.
 */
@Component
public class InventoryLuaScript {

    private final DefaultRedisScript<Long> inventoryGate = load("redis/inventory-gate.lua");
    private final DefaultRedisScript<Long> rateLimit = load("redis/rate-limit.lua");
    private final DefaultRedisScript<Long> unlock = load("redis/unlock.lua");

    public DefaultRedisScript<Long> inventoryGate() {
        return inventoryGate;
    }

    public DefaultRedisScript<Long> rateLimit() {
        return rateLimit;
    }

    public DefaultRedisScript<Long> unlock() {
        return unlock;
    }

    private static DefaultRedisScript<Long> load(String classpath) {
        try {
            String lua = StreamUtils.copyToString(
                    new ClassPathResource(classpath).getInputStream(), StandardCharsets.UTF_8);
            return new DefaultRedisScript<>(lua, Long.class);
        } catch (Exception e) {
            throw new IllegalStateException("Missing Lua script " + classpath, e);
        }
    }
}
