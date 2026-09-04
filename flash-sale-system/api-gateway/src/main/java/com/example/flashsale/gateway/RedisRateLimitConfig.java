package com.example.flashsale.gateway;

import org.springframework.cloud.gateway.filter.ratelimit.KeyResolver;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import reactor.core.publisher.Mono;

@Configuration
public class RedisRateLimitConfig {

    /**
     * Cluster-wide token bucket keyed by user (or IP). Requires Redis.
     */
    @Bean
    KeyResolver userKeyResolver() {
        return exchange -> {
            String user = exchange.getRequest()
                    .getHeaders()
                    .getFirst("X-User-Id");
            if (user != null && !user.isBlank()) {
                return Mono.just(user);
            }
            String ip = exchange.getRequest()
                    .getHeaders()
                    .getFirst("X-Forwarded-For");
            if (ip == null || ip.isBlank()) {
                ip = exchange.getRequest()
                        .getRemoteAddress() == null ? "unknown" : exchange.getRequest()
                        .getRemoteAddress()
                        .getAddress()
                        .getHostAddress();
            }
            return Mono.just(ip.split(",")[0].trim());
        };
    }
}
