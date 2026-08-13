package com.vibhu.security.attacks.ddos;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.rate-limit")
public record RateLimitProperties(int requestsPerWindow, int windowSeconds) {}
