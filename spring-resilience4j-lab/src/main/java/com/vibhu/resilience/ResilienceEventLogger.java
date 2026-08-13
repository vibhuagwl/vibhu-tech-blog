package com.vibhu.resilience;

import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry;
import io.github.resilience4j.retry.RetryRegistry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Logs state / retry events. Never log PAN, JWT, passwords, or full payment payloads.
 */
@Component
public class ResilienceEventLogger {
  private static final Logger log = LoggerFactory.getLogger(ResilienceEventLogger.class);

  public ResilienceEventLogger(CircuitBreakerRegistry circuitBreakers, RetryRegistry retries) {
    circuitBreakers
        .getEventPublisher()
        .onEntryAdded(
            added -> subscribe(added.getAddedEntry()));
    circuitBreakers.getAllCircuitBreakers().forEach(this::subscribe);
    retries
        .getEventPublisher()
        .onEntryAdded(
            added ->
                added
                    .getAddedEntry()
                    .getEventPublisher()
                    .onRetry(
                        event ->
                            log.info(
                                "RETRY name={} attempt={}",
                                event.getName(),
                                event.getNumberOfRetryAttempts())));
  }

  private void subscribe(CircuitBreaker breaker) {
    breaker
        .getEventPublisher()
        .onStateTransition(
            event ->
                log.info(
                    "CIRCUIT_{} name={} {}→{}",
                    event.getStateTransition().getToState(),
                    event.getCircuitBreakerName(),
                    event.getStateTransition().getFromState(),
                    event.getStateTransition().getToState()))
        .onCallNotPermitted(
            event -> log.warn("CIRCUIT_OPEN_REJECT name={}", event.getCircuitBreakerName()));
  }
}
