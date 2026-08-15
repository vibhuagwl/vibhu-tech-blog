package com.vibhu.msp.order.client;

import io.github.resilience4j.bulkhead.annotation.Bulkhead;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class PaymentClient {

  private final RestClient restClient;

  public PaymentClient(RestClient.Builder builder,
                       @Value("${msp.payment.base-url}") String baseUrl) {
    this.restClient = builder.baseUrl(baseUrl).build();
  }

  @CircuitBreaker(name = "payment", fallbackMethod = "pingFallback")
  @Retry(name = "payment")
  @Bulkhead(name = "payment")
  public String ping() {
    return restClient.get()
        .uri("/api/payments/health")
        .retrieve()
        .body(String.class);
  }

  @SuppressWarnings("unused")
  private String pingFallback(Exception ex) {
    return "payment-unavailable";
  }
}
