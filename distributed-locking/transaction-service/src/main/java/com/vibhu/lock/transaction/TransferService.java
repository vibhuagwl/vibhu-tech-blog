package com.vibhu.lock.transaction;

import com.vibhu.lock.common.TransferRequest;
import com.vibhu.lock.common.TransferResponse;
import com.vibhu.lock.common.TransactionState;
import com.vibhu.lock.transaction.TransactionDtos.TransactionView;
import jakarta.persistence.EntityNotFoundException;
import java.util.EnumSet;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TransferService {
  private static final Logger log = LoggerFactory.getLogger(TransferService.class);
  private static final EnumSet<TransactionState> TERMINAL_STATES = EnumSet.of(
      TransactionState.COMMITTED,
      TransactionState.ABORTED,
      TransactionState.RELEASED,
      TransactionState.TIMED_OUT
  );

  private final TransactionRepository transactionRepository;
  private final IdempotencyService idempotencyService;
  private final ThreePhaseTransactionManager transactionManager;

  public TransferService(
      TransactionRepository transactionRepository,
      IdempotencyService idempotencyService,
      ThreePhaseTransactionManager transactionManager
  ) {
    this.transactionRepository = transactionRepository;
    this.idempotencyService = idempotencyService;
    this.transactionManager = transactionManager;
  }

  public TransferResponse transfer(TransferRequest request, String headerIdempotencyKey) {
    validate(request);
    String idempotencyKey = firstNonBlank(headerIdempotencyKey, request.idempotencyKey());
    if (idempotencyKey != null) {
      TransferResponse existing = idempotencyService.claimOrGet(idempotencyKey);
      if (existing != null) {
        return existing;
      }
    }

    TransactionEntity transaction = null;
    try {
      transaction = transactionManager.begin(request);
      MDC.put("transactionId", transaction.getId());
      MDC.put("accountId", transaction.getSourceAccountId());
      log.info("Transfer started source={} dest={} amount={}",
          transaction.getSourceAccountId(),
          transaction.getDestinationAccountId(),
          transaction.getAmount());

      transaction = transactionManager.acquireLocks(transaction);
      MDC.put("fencingToken", String.valueOf(transaction.getFencingSource()));
      MDC.put("lockKey", TwoPhaseLockingManager.lockKey(transaction.getSourceAccountId()));

      transaction = transactionManager.prepare(transaction);
      transaction = transactionManager.preCommit(transaction);
      transaction = transactionManager.commit(transaction);
      transaction = transactionManager.releaseLocks(transaction);

      TransferResponse response = new TransferResponse(transaction.getId(), transaction.getState());
      idempotencyService.store(idempotencyKey, response);
      return response;
    } catch (RuntimeException ex) {
      rollbackAndRelease(transaction, ex);
      throw ex;
    } finally {
      MDC.remove("transactionId");
      MDC.remove("accountId");
      MDC.remove("fencingToken");
      MDC.remove("lockKey");
    }
  }

  @Transactional(readOnly = true)
  public TransactionView get(String transactionId) {
    return transactionRepository.findById(transactionId)
        .map(TransactionView::from)
        .orElseThrow(() -> new EntityNotFoundException("Transaction not found: " + transactionId));
  }

  public TransactionView cancel(String transactionId) {
    TransactionEntity transaction = transactionRepository.findById(transactionId)
        .orElseThrow(() -> new EntityNotFoundException("Transaction not found: " + transactionId));
    if (TERMINAL_STATES.contains(transaction.getState())) {
      throw new IllegalStateException("Transaction " + transactionId + " is already " + transaction.getState());
    }
    TransactionEntity aborted = transactionManager.rollback(transaction, "Cancelled by request");
    return TransactionView.from(transactionManager.releaseLocks(aborted));
  }

  private void validate(TransferRequest request) {
    if (request == null) {
      throw new IllegalArgumentException("request is required");
    }
    if (isBlank(request.sourceAccountId()) || isBlank(request.destinationAccountId())) {
      throw new IllegalArgumentException("sourceAccountId and destinationAccountId are required");
    }
    if (request.amount() == null || request.amount().signum() <= 0) {
      throw new IllegalArgumentException("amount must be greater than zero");
    }
  }

  private void rollbackAndRelease(TransactionEntity transaction, RuntimeException cause) {
    if (transaction == null) {
      return;
    }
    try {
      TransactionEntity aborted = transactionManager.rollback(transaction, cause.getMessage());
      transactionManager.releaseLocks(aborted);
    } catch (RuntimeException rollbackFailure) {
      log.warn("Rollback/release failed for transaction {}", transaction.getId(), rollbackFailure);
    }
  }

  private String firstNonBlank(String first, String second) {
    if (!isBlank(first)) {
      return first.trim();
    }
    if (!isBlank(second)) {
      return second.trim();
    }
    return null;
  }

  private boolean isBlank(String value) {
    return value == null || value.isBlank();
  }
}
