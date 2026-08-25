package com.vibhu.aifp.kafka.mcp;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackages = "com.vibhu.aifp")
public class KafkaMcpServerApplication {
  public static void main(String[] args) {
    SpringApplication.run(KafkaMcpServerApplication.class, args);
  }
}
