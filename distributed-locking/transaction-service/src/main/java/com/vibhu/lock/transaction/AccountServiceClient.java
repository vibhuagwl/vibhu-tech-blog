package com.vibhu.lock.transaction;

import com.vibhu.lock.transaction.TransactionDtos.AccountTransferApplyRequest;
import com.vibhu.lock.transaction.TransactionDtos.AccountTransferApplyResponse;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class AccountServiceClient {
  private final RestClient restClient;

  public AccountServiceClient(@Qualifier("accountServiceRestClient") RestClient restClient) {
    this.restClient = restClient;
  }

  public AccountTransferApplyResponse prepareTransfer(TransactionEntity transaction) {
    return post("/internal/accounts/transfer-prepare", transaction);
  }

  public AccountTransferApplyResponse applyTransfer(TransactionEntity transaction) {
    return post("/internal/accounts/transfer-apply", transaction);
  }

  private AccountTransferApplyResponse post(String path, TransactionEntity transaction) {
    AccountTransferApplyResponse response =
        restClient
            .post()
            .uri(path)
            .body(
                new AccountTransferApplyRequest(
                    transaction.getId(),
                    transaction.getSourceAccountId(),
                    transaction.getDestinationAccountId(),
                    transaction.getAmount(),
                    requireFence(transaction.getFencingSource(), "source"),
                    requireFence(transaction.getFencingDest(), "destination")))
            .retrieve()
            .body(AccountTransferApplyResponse.class);
    if (response == null) {
      throw new IllegalStateException("Account service returned an empty transfer response");
    }
    return response;
  }

  private long requireFence(Long fence, String role) {
    if (fence == null) {
      throw new IllegalStateException("Missing " + role + " fencing token");
    }
    return fence;
  }
}
