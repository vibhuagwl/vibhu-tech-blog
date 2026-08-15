package com.vibhu.lock.transaction;

import com.vibhu.lock.common.LockAcquireRequest;
import com.vibhu.lock.common.LockAcquireResponse;
import com.vibhu.lock.common.LockMode;
import com.vibhu.lock.common.LockReleaseRequest;
import com.vibhu.lock.common.LockTimeoutException;
import com.vibhu.lock.common.LockToken;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class LockServiceClient {
  private final RestClient restClient;
  private final TransactionServiceProperties properties;

  public LockServiceClient(
      @Qualifier("lockServiceRestClient") RestClient restClient,
      TransactionServiceProperties properties) {
    this.restClient = restClient;
    this.properties = properties;
  }

  public LockToken acquireExclusive(String lockKey, String ownerId) {
    LockAcquireResponse response =
        restClient
            .post()
            .uri("/internal/locks/acquire")
            .body(
                new LockAcquireRequest(
                    lockKey,
                    LockMode.EXCLUSIVE,
                    ownerId,
                    ownerId,
                    properties.getLockTtlMillis(),
                    properties.getLockTtlMillis()))
            .retrieve()
            .body(LockAcquireResponse.class);
    if (response == null || !response.acquired() || response.lockToken() == null) {
      throw new LockTimeoutException("Lock service returned no token for " + lockKey);
    }
    return response.lockToken();
  }

  public void release(TransactionLockEntity lock) {
    restClient
        .post()
        .uri("/internal/locks/release")
        .body(
            new LockReleaseRequest(
                lock.getLockKey(), lock.getMode(), lock.getOwnerToken(), lock.getTransactionId()))
        .retrieve()
        .toBodilessEntity();
  }
}
