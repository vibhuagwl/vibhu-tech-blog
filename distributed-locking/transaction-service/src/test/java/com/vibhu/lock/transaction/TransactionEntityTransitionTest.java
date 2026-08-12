package com.vibhu.lock.transaction;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.vibhu.lock.common.TransactionState;
import java.math.BigDecimal;
import org.junit.jupiter.api.Test;

class TransactionEntityTransitionTest {
  @Test
  void enforcesStrict3plTransitions() {
    TransactionEntity tx = new TransactionEntity("t1", "A", "B", new BigDecimal("100"));
    assertEquals(TransactionState.ACTIVE, tx.getState());
    tx.transitionTo(TransactionState.LOCKING);
    tx.transitionTo(TransactionState.PRE_COMMIT);
    tx.transitionTo(TransactionState.COMMIT_READY);
    tx.transitionTo(TransactionState.COMMITTED);
    tx.transitionTo(TransactionState.RELEASED);
    assertThrows(IllegalStateException.class, () -> tx.transitionTo(TransactionState.ACTIVE));
  }
}
