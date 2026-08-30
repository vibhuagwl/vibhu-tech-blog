package com.example.flashsale.flash.infrastructure.redis;

import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

/**
 * Redis fixed-window: 100 req/s/user and 200 req/s/IP.
 * WHY: Resilience4j RateLimiter is per-JVM; this is cluster-wide.
 */
@Component
@Profile("!test")
public class RedisPurchaseRateLimiter implements PurchaseRateLimiter {

    private final InventoryRedisService inventoryRedis;

    public RedisPurchaseRateLimiter(InventoryRedisService inventoryRedis) {
        this.inventoryRedis = inventoryRedis;
    }

    @Override
    @CircuitBreaker(name = "redis", fallbackMethod = "deny")
    public boolean allow(String userId, String ip) {
        long user = inventoryRedis.rateLimitAllow("rl:user:" + userId, 100);
        long addr = inventoryRedis.rateLimitAllow("rl:ip:" + ip, 200);
        return user == 1L && addr == 1L;
    }

    @SuppressWarnings("unused")
    boolean deny(String userId, String ip, Throwable error) {
        return false;
    }
}
