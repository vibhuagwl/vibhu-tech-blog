package com.vibhu.lock.account;

import java.math.BigDecimal;

public final class AccountDtos {
  private AccountDtos() {
  }

  public record CreateAccountRequest(String accountId, BigDecimal initialBalance) {
  }

  public record TransferApplyRequest(
      String transactionId,
      String sourceAccountId,
      String destAccountId,
      BigDecimal amount,
      long fencingTokenSource,
      long fencingTokenDest
  ) {
  }

  public record TransferApplyResponse(
      String transactionId,
      String sourceAccountId,
      BigDecimal sourceBalance,
      long sourceVersion,
      String destAccountId,
      BigDecimal destBalance,
      long destVersion
  ) {
  }
}
