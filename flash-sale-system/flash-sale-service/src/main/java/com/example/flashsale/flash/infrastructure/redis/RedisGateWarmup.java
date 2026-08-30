package com.example.flashsale.flash.infrastructure.redis;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Component
@Profile("local")
public class RedisGateWarmup implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(RedisGateWarmup.class);

    private final InventoryRedisService inventoryRedis;

    public RedisGateWarmup(InventoryRedisService inventoryRedis) {
        this.inventoryRedis = inventoryRedis;
    }

    @Override
    public void run(ApplicationArguments args) {
        boolean created = inventoryRedis.setGateIfAbsent("P1001", 10_000);
        log.info("inventory gate warmup P1001 created={}", created);
    }
}
