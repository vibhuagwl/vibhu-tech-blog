package com.vibhu.lock.transaction;

import com.vibhu.lock.common.TransactionState;
import com.vibhu.lock.transaction.TransactionDtos.AccountTransferApplyResponse;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import java.time.Instant;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ThreePhaseTransactionManager {
  private static final Logger log = LoggerFactory.getLogger(ThreePhaseTransactionManager.class);

  private final TransactionRepository transactionRepository;
  private final TwoPhaseLockingManager lockingManager;
  private final AccountServiceClient accountServiceClient;
  private final KafkaEventPublisher eventPublisher;
  private final Counter successCounter;
  private final Counter failureCounter;
  private final Counter rollbackCounter;
  private final Counter recoveryCounter;

  public ThreePhaseTransactionManager(
      TransactionRepository transactionRepository,
      TwoPhaseLockingManager lockingManager,
      AccountServiceClient accountServiceClient,
      KafkaEventPublisher eventPublisher,
      MeterRegistry meterRegistry
  ) {
    this.transactionRepository = transactionRepository;
    this.lockingManager = lockingManager;
    this.accountServiceClient = accountServiceClient;
    this.eventPublisher = eventPublisher;
    this.successCounter = meterRegistry.counter("transaction_success_total");
    this.failureCounter = meterRegistry.counter("transaction_failure_total");
    this.rollbackCounter = meterRegistry.counter("transaction_rollback_total");
    this.recoveryCounter = meterRegistry.counter("transaction_recovery_total");
  }

  @Transactional
  public TransactionEntity begin(com.vibhu.lock.common.TransferRequest request) {
    TransactionEntity transaction = transactionRepository.saveAndFlush(new TransactionEntity(
        UUID.randomUUID().toString(),
        request.sourceAccountId(),
        request.destinationAccountId(),
        request.amount()
    ));
    eventPublisher.publishStarted(transaction);
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
    eventPublisher.publishLockAcquired(transaction);
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

    AccountTransferApplyResponse response = accountServiceClient.prepareTransfer(transaction);
    eventPublisher.publishPrepared(transaction);
    eventPublisher.publishLifecycle(transaction, "transaction.prepare", Map.of(
        "sourceBalance", response.sourceBalance(),
        "destinationBalance", response.destBalance()
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
    AccountTransferApplyResponse response = accountServiceClient.applyTransfer(transaction);
    transaction.transitionTo(TransactionState.COMMITTED);
    transaction = transactionRepository.saveAndFlush(transaction);
    successCounter.increment();
    eventPublisher.publishCommitted(transaction);
    eventPublisher.publishLifecycle(transaction, "transaction.committed", Map.of(
        "sourceBalance", response.sourceBalance(),
        "destinationBalance", response.destBalance()
    ));
    return transaction;
  }

  @Transactional
  public TransactionEntity rollback(TransactionEntity transaction, String reason) {
    transaction.transitionTo(TransactionState.ABORTING);
    transaction.setError(reason);
    transaction = transactionRepository.saveAndFlush(transaction);
    eventPublisher.publishLifecycle(transaction, "transaction.aborting", Map.of("reason", reason));

    transaction.transitionTo(TransactionState.ABORTED);
    transaction = transactionRepository.saveAndFlush(transaction);
    rollbackCounter.increment();
    failureCounter.increment();
    eventPublisher.publishRolledBack(transaction, reason);
    eventPublisher.publishLifecycle(transaction, "transaction.aborted", Map.of("reason", reason));
    return transaction;
  }

  @Transactional
  public TransactionEntity releaseLocks(TransactionEntity transaction) {
    lockingManager.releaseLocks(transaction.getId());
    transaction.transitionTo(TransactionState.RELEASED);
    transaction = transactionRepository.saveAndFlush(transaction);
    eventPublisher.publishLockReleased(transaction);
    eventPublisher.publishLifecycle(transaction, "transaction.released", Map.of(
        "status", transaction.getStatus()
    ));
    return transaction;
  }

  /**
   * Crash recovery for incomplete 3PL states.
   * PRE_COMMIT has not mutated balances → abort.
   * COMMIT_READY may have crashed before apply → retry commit (idempotent via fencing/ledger).
   * COMMITTED without RELEASED → release locks only.
   */
  @Transactional
  public TransactionEntity recoverOne(TransactionEntity transaction) {
    recoveryCounter.increment();
    log.info(
        "Recovering transactionId={} state={} fencingSource={} fencingDest={}",
        transaction.getId(),
        transaction.getState(),
        transaction.getFencingSource(),
        transaction.getFencingDest()
    );

    return switch (transaction.getState()) {
      case COMMITTED -> releaseLocks(transaction);
      case COMMIT_READY, PRE_COMMIT -> {
        try {
          if (transaction.getState() == TransactionState.PRE_COMMIT) {
            transaction = preCommit(transaction);
          }
          TransactionEntity committed = commit(transaction);
          yield releaseLocks(committed);
        } catch (RuntimeException ex) {
          log.warn("Recovery commit failed for {}, aborting: {}", transaction.getId(), ex.getMessage());
          TransactionEntity aborted = rollback(transaction, "Recovery abort: " + ex.getMessage());
          yield releaseLocks(aborted);
        }
      }
      case ACTIVE, LOCKING, ABORTING, TIMED_OUT -> {
        TransactionEntity aborted = rollback(transaction, "Recovered incomplete transaction");
        yield releaseLocks(aborted);
      }
      default -> transaction;
    };
  }

  @Transactional
  public List<TransactionEntity> recoverStale(Instant updatedBefore) {
    List<TransactionEntity> incomplete = transactionRepository.findByStateInAndUpdatedAtBefore(
        EnumSet.of(
            TransactionState.ACTIVE,
            TransactionState.LOCKING,
            TransactionState.PRE_COMMIT,
            TransactionState.COMMIT_READY,
            TransactionState.COMMITTED,
            TransactionState.ABORTING,
            TransactionState.TIMED_OUT
        ),
        updatedBefore
    );
    return incomplete.stream().map(this::recoverOne).toList();
  }

  @Transactional
  public void recover() {
    recoverStale(Instant.now());
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
