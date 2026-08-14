package com.vibhu.bloom;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class BloomFilterApplication {
  public static void main(String[] args) {
    SpringApplication.run(BloomFilterApplication.class, args);
  }
}
