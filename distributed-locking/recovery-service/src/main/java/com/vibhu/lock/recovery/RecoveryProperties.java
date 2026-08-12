package com.vibhu.lock.recovery;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "distributed-locking")
public class RecoveryProperties {
  private String transactionServiceUrl = "http://localhost:8083";
  private long staleSeconds = 30;
  private long pollIntervalMs = 10_000;

  public String getTransactionServiceUrl() {
    return transactionServiceUrl;
  }

  public void setTransactionServiceUrl(String transactionServiceUrl) {
    this.transactionServiceUrl = transactionServiceUrl;
  }

  public long getStaleSeconds() {
    return staleSeconds;
  }

  public void setStaleSeconds(long staleSeconds) {
    this.staleSeconds = staleSeconds;
  }

  public long getPollIntervalMs() {
    return pollIntervalMs;
  }

  public void setPollIntervalMs(long pollIntervalMs) {
    this.pollIntervalMs = pollIntervalMs;
  }
}
