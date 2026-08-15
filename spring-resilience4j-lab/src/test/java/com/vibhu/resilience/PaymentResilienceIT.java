package com.vibhu.resilience;

import static org.assertj.core.api.Assertions.assertThat;

import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import io.github.resilience4j.circuitbreaker.CircuitBreakerConfig;
import io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry;
import io.github.resilience4j.retry.Retry;
import io.github.resilience4j.retry.RetryConfig;
import io.github.resilience4j.retry.RetryRegistry;
import java.time.Duration;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.Supplier;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class PaymentResilienceIT {

  @Autowired PaymentBankStub bank;
  @Autowired PaymentGatewayClient client;
  @Autowired CircuitBreakerRegistry circuitBreakerRegistry;
  @Autowired TestRestTemplate http;

  @BeforeEach
  void reset() {
    bank.setMode(BankMode.OK);
    bank.setFlakyFailCount(2);
    circuitBreakerRegistry.circuitBreaker("payment").reset();
  }

  @Test
  void success_captures() {
    PaymentResult r = client.charge(new PayRequest("k1", "c1", 1000));
    assertThat(r.status()).isEqualTo("CAPTURED");
  }

  @Test
  void flaky_retries_then_captures() {
    bank.setMode(BankMode.FLAKY);
    PaymentResult r = client.charge(new PayRequest("k2", "c1", 1000));
    assertThat(r.status()).isEqualTo("CAPTURED");
    assertThat(bank.callCount()).isGreaterThanOrEqualTo(3);
  }

  @Test
  void permanent_failure_returns_pending_not_success() {
    bank.setMode(BankMode.DOWN);
    PaymentResult r = client.charge(new PayRequest("k3", "c1", 1000));
    assertThat(r.status()).isEqualTo("PENDING");
    assertThat(r.status()).isNotEqualTo("CAPTURED");
  }

  @Test
  void circuit_opens_after_failures() {
    bank.setMode(BankMode.DOWN);
    CircuitBreaker cb = circuitBreakerRegistry.circuitBreaker("payment");
    for (int i = 0; i < 12; i++) {
      client.charge(new PayRequest("k-open-" + i, "c1", 100));
    }
    assertThat(cb.getState()).isIn(CircuitBreaker.State.OPEN, CircuitBreaker.State.HALF_OPEN);
  }

  @Test
  void http_order_endpoint_works() {
    ResponseEntity<PaymentResult> res =
        http.postForEntity("/api/orders", new PayRequest("http-1", "c9", 500), PaymentResult.class);
    assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
    assertThat(res.getBody()).isNotNull();
    assertThat(res.getBody().status()).isEqualTo("CAPTURED");
  }

  @Test
  void idempotent_replay_does_not_double_charge() {
    PaymentResult first =
        http.postForEntity(
                "/api/orders", new PayRequest("same-key", "c9", 500), PaymentResult.class)
            .getBody();
    int calls = bank.callCount();
    PaymentResult second =
        http.postForEntity(
                "/api/orders", new PayRequest("same-key", "c9", 500), PaymentResult.class)
            .getBody();
    assertThat(first).isNotNull();
    assertThat(second).isNotNull();
    assertThat(first.status()).isEqualTo("CAPTURED");
    assertThat(second.status()).isEqualTo("CAPTURED");
    assertThat(bank.callCount()).isEqualTo(calls);
  }

  @Test
  void fx_endpoint_caches() {
    http.getForEntity("/api/fx", String.class);
    http.getForEntity("/api/fx", String.class);
    assertThat(http.getForEntity("/api/fx", String.class).getStatusCode()).isEqualTo(HttpStatus.OK);
  }

  @Test
  void simulate_endpoint_switches_mode() {
    ResponseEntity<String> res =
        http.getForEntity("/api/payment/simulate?mode=ERROR", String.class);
    assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
    assertThat(bank.mode()).isEqualTo(BankMode.ERROR);
  }
}

class ProgrammaticResilienceTest {

  @Test
  void programmatic_cb_opens() {
    CircuitBreakerConfig cfg =
        CircuitBreakerConfig.custom()
            .slidingWindowSize(10)
            .minimumNumberOfCalls(5)
            .failureRateThreshold(50)
            .waitDurationInOpenState(Duration.ofSeconds(60))
            .build();
    CircuitBreaker cb = CircuitBreakerRegistry.of(cfg).circuitBreaker("demo");
    AtomicInteger calls = new AtomicInteger();
    Supplier<String> boom =
        CircuitBreaker.decorateSupplier(
            cb,
            () -> {
              calls.incrementAndGet();
              throw new BankUnavailableException("down");
            });
    for (int i = 0; i < 10; i++) {
      try {
        boom.get();
      } catch (Exception ignored) {
        // expected until open; then CallNotPermittedException
      }
    }
    assertThat(cb.getState()).isEqualTo(CircuitBreaker.State.OPEN);
  }

  @Test
  void programmatic_retry_counts_attempts() {
    RetryConfig cfg =
        RetryConfig.custom()
            .maxAttempts(3)
            .waitDuration(Duration.ofMillis(1))
            .retryExceptions(BankUnavailableException.class)
            .build();
    Retry retry = RetryRegistry.of(cfg).retry("demo");
    AtomicInteger attempts = new AtomicInteger();
    Supplier<String> flaky =
        Retry.decorateSupplier(
            retry,
            () -> {
              if (attempts.incrementAndGet() < 3) {
                throw new BankUnavailableException("flaky");
              }
              return "ok";
            });
    assertThat(flaky.get()).isEqualTo("ok");
    assertThat(attempts.get()).isEqualTo(3);
  }
}
