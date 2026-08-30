package com.example.flashsale.flash.infrastructure.redis;

import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

/**
 * Fast reject layer. Redis is NOT the source of truth.
 * Circuit breaker: if Redis is down, fail CLOSED (reject) so Kafka/DB are not flooded.
 */
@Component
@Profile("!test")
public class RedisInventoryGate implements InventoryGate {

    private static final Logger log = LoggerFactory.getLogger(RedisInventoryGate.class);

    private final InventoryRedisService inventoryRedis;

    public RedisInventoryGate(InventoryRedisService inventoryRedis) {
        this.inventoryRedis = inventoryRedis;
    }

    @Override
    @CircuitBreaker(name = "redis", fallbackMethod = "failClosed")
    public boolean tryAcquire(String productId, int quantity) {
        long result = inventoryRedis.tryDecrement(productId, quantity);
        if (result == -1L) {
            log.warn("inventory gate key missing productId={} — fail closed until warmup SET", productId);
            return false;
        }
        return result == 1L;
    }

    @Override
    @CircuitBreaker(name = "redis", fallbackMethod = "skipRelease")
    public void release(String productId, int quantity) {
        inventoryRedis.increment(productId, quantity);
    }

    /**
     * Redis outage / open circuit: do not admit traffic. Postgres cannot absorb T-0.
     */
    @SuppressWarnings("unused")
    boolean failClosed(String productId, int quantity, Throwable error) {
        log.warn("redis circuit open — rejecting productId={}", productId, error);
        return false;
    }

    @SuppressWarnings("unused")
    void skipRelease(String productId, int quantity, Throwable error) {
        log.warn("redis circuit open — skip gate refund productId={} (DB still authoritative)", productId, error);
    }
}
