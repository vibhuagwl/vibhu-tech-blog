package com.vibhu.hadron;

import com.vibhu.hadron.config.HadronProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
@EnableConfigurationProperties(HadronProperties.class)
public class HadronCashlinesDlqApplication {

  public static void main(String[] args) {
    SpringApplication.run(HadronCashlinesDlqApplication.class, args);
  }
}
