package com.vibhu.lock.transaction;

import com.vibhu.lock.common.TransactionState;
import java.math.BigDecimal;
import java.time.Instant;

public final class TransactionDtos {
  private TransactionDtos() {
  }

  public record TransactionView(
      String transactionId,
      String sourceAccountId,
      String destinationAccountId,
      BigDecimal amount,
      TransactionState state,
      Long fencingTokenSource,
      Long fencingTokenDest,
      String error,
      Instant createdAt,
      Instant updatedAt
  ) {
    static TransactionView from(TransactionEntity entity) {
      return new TransactionView(
          entity.getId(),
          entity.getSourceAccountId(),
          entity.getDestinationAccountId(),
          entity.getAmount(),
          entity.getState(),
          entity.getFencingSource(),
          entity.getFencingDest(),
          entity.getError(),
          entity.getCreatedAt(),
          entity.getUpdatedAt()
      );
    }
  }

  public record AccountTransferApplyRequest(
      String transactionId,
      String sourceAccountId,
      String destAccountId,
      BigDecimal amount,
      long fencingTokenSource,
      long fencingTokenDest
  ) {
  }

  public record AccountTransferApplyResponse(
      String transactionId,
      String sourceAccountId,
      BigDecimal sourceBalance,
      long sourceVersion,
      String destAccountId,
      BigDecimal destBalance,
      long destVersion
  ) {
  }

  public record LockAcquireRequest(String lockKey, String mode, String ownerId, long ttlMillis) {
  }

  public record LockReleaseRequest(String lockKey, String ownerToken) {
  }
}
