package com.vibhu.lock.transaction;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "distributed-locking")
public class TransactionServiceProperties {
  private String lockServiceUrl = "http://localhost:8081";
  private String accountServiceUrl = "http://localhost:8082";
  private long lockTtlMillis = 30_000L;

  public String getLockServiceUrl() {
    return lockServiceUrl;
  }

  public void setLockServiceUrl(String lockServiceUrl) {
    this.lockServiceUrl = lockServiceUrl;
  }

  public String getAccountServiceUrl() {
    return accountServiceUrl;
  }

  public void setAccountServiceUrl(String accountServiceUrl) {
    this.accountServiceUrl = accountServiceUrl;
  }

  public long getLockTtlMillis() {
    return lockTtlMillis;
  }

  public void setLockTtlMillis(long lockTtlMillis) {
    this.lockTtlMillis = lockTtlMillis;
  }
}
