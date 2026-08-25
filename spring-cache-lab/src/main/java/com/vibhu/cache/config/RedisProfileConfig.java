package com.vibhu.cache.config;

import org.springframework.boot.autoconfigure.data.redis.RedisAutoConfiguration;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Profile;

@Configuration
@Profile("redis")
@Import(RedisAutoConfiguration.class)
public class RedisProfileConfig {}
