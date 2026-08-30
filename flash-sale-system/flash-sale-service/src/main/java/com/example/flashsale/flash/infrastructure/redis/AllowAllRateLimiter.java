package com.example.flashsale.flash.infrastructure.redis;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Component
@Profile("test")
public class AllowAllRateLimiter implements PurchaseRateLimiter {
    @Override
    public boolean allow(String userId, String ip) {
        return true;
    }
}
