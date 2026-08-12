package com.vibhu.lock.transaction;

import com.vibhu.lock.common.TransactionState;
import com.vibhu.lock.transaction.TransactionDtos.AccountTransferApplyResponse;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ThreePhaseTransactionManager {
  private final TransactionRepository transactionRepository;
  private final TransactionLockRepository lockRepository;
  private final TwoPhaseLockingManager lockingManager;
  private final AccountServiceClient accountServiceClient;
  private final KafkaEventPublisher eventPublisher;

  public ThreePhaseTransactionManager(
      TransactionRepository transactionRepository,
      TransactionLockRepository lockRepository,
      TwoPhaseLockingManager lockingManager,
      AccountServiceClient accountServiceClient,
      KafkaEventPublisher eventPublisher
  ) {
    this.transactionRepository = transactionRepository;
    this.lockRepository = lockRepository;
    this.lockingManager = lockingManager;
    this.accountServiceClient = accountServiceClient;
    this.eventPublisher = eventPublisher;
  }

  @Transactional
  public TransactionEntity begin(com.vibhu.lock.common.TransferRequest request) {
    TransactionEntity transaction = transactionRepository.saveAndFlush(new TransactionEntity(
        UUID.randomUUID().toString(),
        request.sourceAccountId(),
        request.destinationAccountId(),
        request.amount()
    ));
    eventPublisher.publishLifecycle(transaction, "transaction.begin", Map.of(
        "sourceAccountId", transaction.getSourceAccountId(),
        "destinationAccountId", transaction.getDestinationAccountId(),
        "amount", transaction.getAmount()
    ));
    return transaction;
  }

  @Transactional
  public TransactionEntity acquireLocks(TransactionEntity transaction) {
    transaction.transitionTo(TransactionState.LOCKING);
    transaction = transactionRepository.saveAndFlush(transaction);
    eventPublisher.publishLifecycle(transaction, "transaction.locking", Map.of(
        "lockOrder", List.of(transaction.getSourceAccountId(), transaction.getDestinationAccountId()).stream()
            .distinct()
            .sorted()
            .toList()
    ));

    List<TransactionLockEntity> locks = lockingManager.acquireLocks(transaction);
    transaction.setFencingSource(fenceFor(locks, transaction.getSourceAccountId()));
    transaction.setFencingDest(fenceFor(locks, transaction.getDestinationAccountId()));
    transaction = transactionRepository.saveAndFlush(transaction);
    eventPublisher.publishLifecycle(transaction, "transaction.locks-acquired", Map.of(
        "fencingSource", transaction.getFencingSource(),
        "fencingDest", transaction.getFencingDest()
    ));
    return transaction;
  }

  @Transactional
  public TransactionEntity prepare(TransactionEntity transaction) {
    transaction.transitionTo(TransactionState.PRE_COMMIT);
    transaction = transactionRepository.saveAndFlush(transaction);
    eventPublisher.publishLifecycle(transaction, "transaction.prepare", Map.of(
        "sourceAccountId", transaction.getSourceAccountId(),
        "destinationAccountId", transaction.getDestinationAccountId()
    ));

    AccountTransferApplyResponse response = accountServiceClient.applyTransfer(transaction);
    eventPublisher.publishLifecycle(transaction, "transaction.account-transfer-applied", Map.of(
        "sourceBalance", response.sourceBalance(),
        "destinationBalance", response.destBalance(),
        "sourceVersion", response.sourceVersion(),
        "destinationVersion", response.destVersion()
    ));
    return transaction;
  }

  @Transactional
  public TransactionEntity preCommit(TransactionEntity transaction) {
    transaction.transitionTo(TransactionState.COMMIT_READY);
    transaction = transactionRepository.saveAndFlush(transaction);
    eventPublisher.publishLifecycle(transaction, "transaction.pre-commit", Map.of(
        "status", transaction.getStatus()
    ));
    return transaction;
  }

  @Transactional
  public TransactionEntity commit(TransactionEntity transaction) {
    transaction.transitionTo(TransactionState.COMMITTED);
    transaction = transactionRepository.saveAndFlush(transaction);
    eventPublisher.publishLifecycle(transaction, "transaction.committed", Map.of(
        "status", transaction.getStatus()
    ));
    return transaction;
  }

  @Transactional
  public TransactionEntity rollback(TransactionEntity transaction, String reason) {
    transaction.transitionTo(TransactionState.ABORTING);
    transaction.setError(reason);
    transaction = transactionRepository.saveAndFlush(transaction);
    eventPublisher.publishLifecycle(transaction, "transaction.aborting", Map.of(
        "reason", reason
    ));

    transaction.transitionTo(TransactionState.ABORTED);
    transaction = transactionRepository.saveAndFlush(transaction);
    eventPublisher.publishLifecycle(transaction, "transaction.aborted", Map.of(
        "reason", reason
    ));
    return transaction;
  }

  @Transactional
  public TransactionEntity releaseLocks(TransactionEntity transaction) {
    lockingManager.releaseLocks(transaction.getId());
    transaction.transitionTo(TransactionState.RELEASED);
    transaction = transactionRepository.saveAndFlush(transaction);
    eventPublisher.publishLifecycle(transaction, "transaction.released", Map.of(
        "status", transaction.getStatus()
    ));
    return transaction;
  }

  @Transactional
  public void recover() {
    transactionRepository.findByStateIn(EnumSet.of(
        TransactionState.ACTIVE,
        TransactionState.LOCKING,
        TransactionState.PRE_COMMIT,
        TransactionState.COMMIT_READY,
        TransactionState.ABORTING,
        TransactionState.TIMED_OUT
    )).forEach(transaction -> {
      TransactionEntity aborted = rollback(transaction, "Recovered incomplete transaction");
      releaseLocks(aborted);
    });
  }

  private long fenceFor(List<TransactionLockEntity> locks, String accountId) {
    String lockKey = TwoPhaseLockingManager.lockKey(accountId);
    return locks.stream()
        .filter(lock -> lock.getLockKey().equals(lockKey))
        .findFirst()
        .orElseThrow(() -> new IllegalStateException("Missing lock for " + accountId))
        .getFencingToken();
  }
}
