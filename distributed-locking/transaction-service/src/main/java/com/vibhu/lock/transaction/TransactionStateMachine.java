package com.vibhu.lock.transaction;

import com.vibhu.lock.common.TransactionState;
import java.util.EnumSet;
import java.util.Set;
import org.springframework.stereotype.Component;

@Component
public class TransactionStateMachine {
  private static final Set<TransactionState> TERMINAL = EnumSet.of(
      TransactionState.RELEASED,
      TransactionState.ABORTED,
      TransactionState.TIMED_OUT
  );

  public boolean canTransition(TransactionState from, TransactionState to) {
    if (from == null || to == null || from == to) {
      return false;
    }
    if (TERMINAL.contains(from)) {
      return false;
    }
    return switch (from) {
      case ACTIVE -> to == TransactionState.LOCKING || to == TransactionState.ABORTING || to == TransactionState.ABORTED;
      case LOCKING -> to == TransactionState.PRE_COMMIT
          || to == TransactionState.ABORTING
          || to == TransactionState.ABORTED
          || to == TransactionState.TIMED_OUT;
      case PRE_COMMIT -> to == TransactionState.COMMIT_READY
          || to == TransactionState.ABORTING
          || to == TransactionState.ABORTED;
      case COMMIT_READY -> to == TransactionState.COMMITTED
          || to == TransactionState.ABORTING
          || to == TransactionState.ABORTED;
      case COMMITTED -> to == TransactionState.RELEASED;
      case ABORTING -> to == TransactionState.ABORTED;
      case ABORTED -> to == TransactionState.RELEASED;
      default -> false;
    };
  }

  public void assertTransition(TransactionState from, TransactionState to) {
    if (!canTransition(from, to) && from != to) {
      throw new IllegalStateException("Illegal 3PL transition " + from + " -> " + to);
    }
  }
}
