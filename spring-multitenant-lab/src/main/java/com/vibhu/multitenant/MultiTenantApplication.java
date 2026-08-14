package com.vibhu.multitenant;

import com.vibhu.multitenant.config.MultiTenantProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
@EnableConfigurationProperties(MultiTenantProperties.class)
public class MultiTenantApplication {

  public static void main(String[] args) {
    SpringApplication.run(MultiTenantApplication.class, args);
  }
}
