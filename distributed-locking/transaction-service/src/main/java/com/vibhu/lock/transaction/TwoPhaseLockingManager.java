package com.vibhu.lock.transaction;

import com.vibhu.lock.common.LockMode;
import com.vibhu.lock.common.LockToken;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TwoPhaseLockingManager {
  private static final Logger log = LoggerFactory.getLogger(TwoPhaseLockingManager.class);

  private final LockServiceClient lockServiceClient;
  private final TransactionLockRepository lockRepository;

  public TwoPhaseLockingManager(
      LockServiceClient lockServiceClient, TransactionLockRepository lockRepository) {
    this.lockServiceClient = lockServiceClient;
    this.lockRepository = lockRepository;
  }

  @Transactional
  public List<TransactionLockEntity> acquireLocks(TransactionEntity transaction) {
    List<String> accountIds =
        List.of(transaction.getSourceAccountId(), transaction.getDestinationAccountId()).stream()
            .distinct()
            .sorted(Comparator.naturalOrder())
            .toList();

    List<TransactionLockEntity> acquired = new ArrayList<>();
    try {
      for (String accountId : accountIds) {
        String lockKey = lockKey(accountId);
        LockToken token = lockServiceClient.acquireExclusive(lockKey, transaction.getId());
        TransactionLockEntity lock =
            lockRepository.save(
                new TransactionLockEntity(
                    transaction.getId(),
                    lockKey,
                    LockMode.EXCLUSIVE,
                    token.ownerToken(),
                    token.fencingToken()));
        acquired.add(lock);
      }
      return acquired;
    } catch (RuntimeException ex) {
      acquired.forEach(this::releaseQuietly);
      lockRepository.deleteByTransactionId(transaction.getId());
      throw ex;
    }
  }

  @Transactional
  public void releaseLocks(String transactionId) {
    List<TransactionLockEntity> locks =
        lockRepository.findByTransactionIdOrderByLockKeyAsc(transactionId);
    locks.forEach(this::releaseQuietly);
    lockRepository.deleteByTransactionId(transactionId);
  }

  private void releaseQuietly(TransactionLockEntity lock) {
    try {
      lockServiceClient.release(lock);
    } catch (RuntimeException ex) {
      log.warn(
          "Failed to release lock {} for transaction {}",
          lock.getLockKey(),
          lock.getTransactionId(),
          ex);
    }
  }

  static String lockKey(String accountId) {
    return "account:" + accountId;
  }
}
