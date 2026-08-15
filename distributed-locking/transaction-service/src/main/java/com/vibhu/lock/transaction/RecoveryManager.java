package com.vibhu.lock.transaction;

import com.vibhu.lock.common.TransactionState;
import com.vibhu.lock.transaction.TransactionDtos.TransactionView;
import java.time.Duration;
import java.time.Instant;
import java.util.EnumSet;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RecoveryManager {
  private static final Logger log = LoggerFactory.getLogger(RecoveryManager.class);
  private static final EnumSet<TransactionState> RECOVERABLE =
      EnumSet.of(
          TransactionState.ACTIVE,
          TransactionState.LOCKING,
          TransactionState.PRE_COMMIT,
          TransactionState.COMMIT_READY,
          TransactionState.COMMITTED,
          TransactionState.ABORTING,
          TransactionState.TIMED_OUT);

  private final TransactionRepository transactionRepository;
  private final ThreePhaseTransactionManager transactionManager;

  public RecoveryManager(
      TransactionRepository transactionRepository,
      ThreePhaseTransactionManager transactionManager) {
    this.transactionRepository = transactionRepository;
    this.transactionManager = transactionManager;
  }

  @Transactional(readOnly = true)
  public List<TransactionView> listIncomplete() {
    return transactionRepository.findByStateIn(RECOVERABLE).stream()
        .map(TransactionView::from)
        .toList();
  }

  public TransactionView recover(String transactionId) {
    TransactionEntity transaction =
        transactionRepository
            .findById(transactionId)
            .orElseThrow(
                () ->
                    new jakarta.persistence.EntityNotFoundException(
                        "Transaction not found: " + transactionId));
    return TransactionView.from(transactionManager.recoverOne(transaction));
  }

  public List<TransactionView> recoverStale(Duration staleAfter) {
    Instant cutoff = Instant.now().minus(staleAfter);
    log.info("Running recovery for transactions updated before {}", cutoff);
    return transactionManager.recoverStale(cutoff).stream().map(TransactionView::from).toList();
  }
}
