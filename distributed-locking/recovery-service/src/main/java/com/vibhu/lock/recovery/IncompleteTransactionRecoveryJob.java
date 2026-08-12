package com.vibhu.lock.recovery;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class IncompleteTransactionRecoveryJob {
  private static final Logger log = LoggerFactory.getLogger(IncompleteTransactionRecoveryJob.class);

  private final RestClient restClient;
  private final RecoveryProperties properties;
  private final Counter recoveryRuns;

  public IncompleteTransactionRecoveryJob(
      RestClient transactionServiceRestClient,
      RecoveryProperties properties,
      MeterRegistry meterRegistry
  ) {
    this.restClient = transactionServiceRestClient;
    this.properties = properties;
    this.recoveryRuns = meterRegistry.counter("transaction_recovery_total");
  }

  @Scheduled(fixedDelayString = "${distributed-locking.poll-interval-ms:10000}")
  public void recoverStale() {
    try {
      @SuppressWarnings("unchecked")
      Map<String, Object> body = restClient.post()
          .uri(uriBuilder -> uriBuilder
              .path("/internal/recovery/run")
              .queryParam("staleSeconds", properties.getStaleSeconds())
              .build())
          .retrieve()
          .body(Map.class);
      recoveryRuns.increment();
      log.info("Recovery sweep completed: {}", body);
    } catch (RuntimeException ex) {
      log.warn("Recovery sweep failed: {}", ex.getMessage());
    }
  }
}
