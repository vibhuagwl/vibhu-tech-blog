package com.vibhu.aifp.assistant;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackages = "com.vibhu.aifp")
public class AiAssistantApplication {
  public static void main(String[] args) {
    SpringApplication.run(AiAssistantApplication.class, args);
  }
}
