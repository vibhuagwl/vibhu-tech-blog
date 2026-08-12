package com.vibhu.lock.transaction;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TransactionLockRepository extends JpaRepository<TransactionLockEntity, Long> {
  List<TransactionLockEntity> findByTransactionIdOrderByLockKeyAsc(String transactionId);

  void deleteByTransactionId(String transactionId);
}
