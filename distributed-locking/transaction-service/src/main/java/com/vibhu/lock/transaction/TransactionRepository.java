package com.vibhu.lock.transaction;

import com.vibhu.lock.common.TransactionState;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TransactionRepository extends JpaRepository<TransactionEntity, String> {
  List<TransactionEntity> findByStateIn(Collection<TransactionState> states);
}
