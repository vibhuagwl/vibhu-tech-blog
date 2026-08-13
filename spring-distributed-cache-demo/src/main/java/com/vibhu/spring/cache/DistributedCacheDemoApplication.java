package com.vibhu.spring.cache;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
@EnableCaching
public class DistributedCacheDemoApplication {
  public static void main(String[] args) {
    SpringApplication.run(DistributedCacheDemoApplication.class, args);
  }
}
