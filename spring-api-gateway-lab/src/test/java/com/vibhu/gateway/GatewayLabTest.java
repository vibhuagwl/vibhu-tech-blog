package com.vibhu.gateway;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class GatewayLabTest {

  @Test
  void tokenBucket_allowsBurstThenRejects() {
    TokenBucket bucket = new TokenBucket(3, 1000); // fast refill for later
    assertThat(bucket.tryConsume()).isTrue();
    assertThat(bucket.tryConsume()).isTrue();
    assertThat(bucket.tryConsume()).isTrue();
    assertThat(bucket.tryConsume()).isFalse();
  }

  @Test
  void correlation_propagatesExisting() {
    assertThat(CorrelationIdPropagator.resolve("abc-123")).isEqualTo("abc-123");
    String minted = CorrelationIdPropagator.resolve(null);
    assertThat(minted).isNotBlank();
    assertThat(CorrelationIdPropagator.resolve("  ")).isNotBlank();
  }

  @Test
  void routePredicate_pathAndMethod() {
    RoutePredicate payments = new RoutePredicate("/api/payments/**", "GET");
    assertThat(payments.matches("/api/payments/1", "GET")).isTrue();
    assertThat(payments.matches("/api/payments/1", "POST")).isFalse();
    assertThat(payments.matches("/api/accounts/1", "GET")).isFalse();
  }
}
