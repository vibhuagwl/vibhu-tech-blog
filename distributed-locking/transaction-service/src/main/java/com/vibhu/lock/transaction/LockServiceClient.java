package com.vibhu.lock.transaction;

import com.vibhu.lock.common.LockMode;
import com.vibhu.lock.common.LockTimeoutException;
import com.vibhu.lock.common.LockToken;
import com.vibhu.lock.transaction.TransactionDtos.LockAcquireRequest;
import com.vibhu.lock.transaction.TransactionDtos.LockReleaseRequest;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class LockServiceClient {
  private final RestClient restClient;
  private final TransactionServiceProperties properties;

  public LockServiceClient(
      @Qualifier("lockServiceRestClient") RestClient restClient,
      TransactionServiceProperties properties
  ) {
    this.restClient = restClient;
    this.properties = properties;
  }

  public LockToken acquireExclusive(String lockKey, String ownerId) {
    LockToken token = restClient.post()
        .uri("/internal/locks/acquire")
        .body(new LockAcquireRequest(lockKey, LockMode.EXCLUSIVE.name(), ownerId, properties.getLockTtlMillis()))
        .retrieve()
        .body(LockToken.class);
    if (token == null) {
      throw new LockTimeoutException("Lock service returned no token for " + lockKey);
    }
    return token;
  }

  public void release(TransactionLockEntity lock) {
    restClient.post()
        .uri("/internal/locks/release")
        .body(new LockReleaseRequest(lock.getLockKey(), lock.getOwnerToken()))
        .retrieve()
        .toBodilessEntity();
  }
}
