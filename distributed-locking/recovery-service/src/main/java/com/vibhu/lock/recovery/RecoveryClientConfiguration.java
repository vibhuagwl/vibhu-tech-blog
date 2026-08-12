package com.vibhu.lock.recovery;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

@Configuration
@EnableConfigurationProperties(RecoveryProperties.class)
public class RecoveryClientConfiguration {
  @Bean
  RestClient transactionServiceRestClient(RestClient.Builder builder, RecoveryProperties properties) {
    return builder.baseUrl(properties.getTransactionServiceUrl()).build();
  }
}
