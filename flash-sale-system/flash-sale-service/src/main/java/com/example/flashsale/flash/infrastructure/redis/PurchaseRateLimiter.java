package com.example.flashsale.flash.infrastructure.redis;

public interface PurchaseRateLimiter {
    boolean allow(String userId, String ip);
}
