package com.vibhu.counter.api;

import com.vibhu.counter.api.config.CounterProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties(CounterProperties.class)
public class CounterApiApplication {
  public static void main(String[] args) {
    SpringApplication.run(CounterApiApplication.class, args);
  }
}
