package com.vibhu.cache;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.data.redis.RedisAutoConfiguration;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication(exclude = RedisAutoConfiguration.class)
@EnableCaching
public class CacheLabApplication {

  public static void main(String[] args) {
    SpringApplication.run(CacheLabApplication.class, args);
  }
}
