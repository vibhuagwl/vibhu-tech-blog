package com.vibhu.resilience;

import java.time.Duration;
import org.springframework.boot.http.client.ClientHttpRequestFactoryBuilder;
import org.springframework.boot.http.client.ClientHttpRequestFactorySettings;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.ClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

/**
 * Socket timeouts are mandatory even with Resilience4j TimeLimiter. Connect 200ms / read 1500ms —
 * TimeLimiter is an extra async bound, not a replacement.
 */
@Configuration
public class RestClientConfig {

  @Bean
  RestClient paymentRestClient() {
    ClientHttpRequestFactorySettings settings =
        ClientHttpRequestFactorySettings.defaults()
            .withConnectTimeout(Duration.ofMillis(200))
            .withReadTimeout(Duration.ofMillis(1_500));
    ClientHttpRequestFactory factory = ClientHttpRequestFactoryBuilder.detect().build(settings);
    return RestClient.builder().requestFactory(factory).baseUrl("http://127.0.0.1:9").build();
  }
}
