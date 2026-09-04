package com.example.flashsale.flash.infrastructure.redis;

import org.springframework.context.annotation.Profile;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Redis inventory operations. Performance layer only — PostgreSQL remains authority.
 * If this class is removed, every request hits Kafka/DB and the sale melts.
 */
@Service
@Profile("!test")
public class InventoryRedisService {

    public static String gateKey(String productId) {
        return "inv:gate:" + productId;
    }

    private final StringRedisTemplate redis;
    private final InventoryLuaScript scripts;

    public InventoryRedisService(StringRedisTemplate redis, InventoryLuaScript scripts) {
        this.redis = redis;
        this.scripts = scripts;
    }

    /**
     * @return 1 acquired, 0 sold out, -1 missing key
     */
    public long tryDecrement(String productId, int quantity) {
        return redis.execute(scripts.inventoryGate(), List.of(gateKey(productId)), String.valueOf(quantity));
    }

    public void increment(String productId, int quantity) {
        redis.opsForValue()
                .increment(gateKey(productId), quantity);
    }

    public boolean setGateIfAbsent(String productId, int quantity) {
        return Boolean.TRUE.equals(redis.opsForValue()
                .setIfAbsent(gateKey(productId), String.valueOf(quantity)));
    }

    public long rateLimitAllow(String key, int maxPerSecond) {
        Long result = redis.execute(scripts.rateLimit(), List.of(key), String.valueOf(maxPerSecond));
        return result;
    }
}
