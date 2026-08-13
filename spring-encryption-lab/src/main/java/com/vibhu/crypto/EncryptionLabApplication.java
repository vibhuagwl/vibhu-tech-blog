package com.vibhu.crypto;

import com.vibhu.crypto.config.CryptoProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties(CryptoProperties.class)
public class EncryptionLabApplication {
  public static void main(String[] args) {
    SpringApplication.run(EncryptionLabApplication.class, args);
  }
}
