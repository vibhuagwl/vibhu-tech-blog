package com.vibhu.resilience;

import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import io.github.resilience4j.circuitbreaker.CircuitBreakerConfig;
import io.github.resilience4j.reactor.circuitbreaker.operator.CircuitBreakerOperator;
import io.github.resilience4j.reactor.retry.RetryOperator;
import io.github.resilience4j.retry.Retry;
import io.github.resilience4j.retry.RetryConfig;
import java.time.Duration;
import reactor.core.publisher.Mono;

/** WebFlux operators — do not block the event loop with Thread.sleep in real services. */
public final class BankReactiveClient {
  private BankReactiveClient() {}

  public static Mono<String> charge(Mono<String> bankCall) {
    CircuitBreaker cb =
        CircuitBreaker.of(
            "reactivePay",
            CircuitBreakerConfig.custom()
                .slidingWindowSize(10)
                .minimumNumberOfCalls(5)
                .failureRateThreshold(50)
                .build());
    Retry retry =
        Retry.of(
            "reactivePay",
            RetryConfig.custom().maxAttempts(3).waitDuration(Duration.ofMillis(10)).build());
    return bankCall
        .transformDeferred(CircuitBreakerOperator.of(cb))
        .transformDeferred(RetryOperator.of(retry))
        .timeout(Duration.ofSeconds(1))
        .onErrorReturn("PENDING");
  }
}
