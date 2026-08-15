package com.vibhu.security.authserver.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class PasswordConfig {

  @Bean
  PasswordEncoder passwordEncoder() {
    // DelegatingPasswordEncoder — stores {bcrypt}... never plaintext
    return PasswordEncoderFactories.createDelegatingPasswordEncoder();
  }
}
