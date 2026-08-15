package com.vibhu.msp.order.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

@Configuration
public class WebConfig {

  @Bean
  RestClient.Builder restClientBuilder() {
    return RestClient.builder();
  }
}
