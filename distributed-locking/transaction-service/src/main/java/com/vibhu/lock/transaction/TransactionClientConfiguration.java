package com.vibhu.lock.transaction;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

@Configuration
@EnableConfigurationProperties(TransactionServiceProperties.class)
public class TransactionClientConfiguration {
  @Bean
  RestClient lockServiceRestClient(RestClient.Builder builder, TransactionServiceProperties properties) {
    return builder.baseUrl(properties.getLockServiceUrl()).build();
  }

  @Bean
  RestClient accountServiceRestClient(RestClient.Builder builder, TransactionServiceProperties properties) {
    return builder.baseUrl(properties.getAccountServiceUrl()).build();
  }
}
