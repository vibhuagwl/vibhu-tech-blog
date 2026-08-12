package com.vibhu.counter.api.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "counter")
public record CounterProperties(int shardCount) {
    public CounterProperties {
        if (shardCount <= 0) {
            shardCount = 16;
        }
    }
}
