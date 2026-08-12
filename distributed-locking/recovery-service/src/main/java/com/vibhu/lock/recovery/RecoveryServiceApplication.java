package com.vibhu.lock.recovery;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class RecoveryServiceApplication {
  public static void main(String[] args) {
    SpringApplication.run(RecoveryServiceApplication.class, args);
  }
}
