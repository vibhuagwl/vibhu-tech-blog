package com.vibhu.lock.transaction;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.vibhu.lock.common.TransactionState;
import org.junit.jupiter.api.Test;

class TransactionStateMachineTest {
  private final TransactionStateMachine machine = new TransactionStateMachine();

  @Test
  void happyPathTransitions() {
    assertTrue(machine.canTransition(TransactionState.ACTIVE, TransactionState.LOCKING));
    assertTrue(machine.canTransition(TransactionState.LOCKING, TransactionState.PRE_COMMIT));
    assertTrue(machine.canTransition(TransactionState.PRE_COMMIT, TransactionState.COMMIT_READY));
    assertTrue(machine.canTransition(TransactionState.COMMIT_READY, TransactionState.COMMITTED));
    assertTrue(machine.canTransition(TransactionState.COMMITTED, TransactionState.RELEASED));
  }

  @Test
  void failurePaths() {
    assertTrue(machine.canTransition(TransactionState.LOCKING, TransactionState.TIMED_OUT));
    assertTrue(machine.canTransition(TransactionState.COMMIT_READY, TransactionState.ABORTING));
    assertTrue(machine.canTransition(TransactionState.ABORTING, TransactionState.ABORTED));
    assertFalse(machine.canTransition(TransactionState.RELEASED, TransactionState.ACTIVE));
  }
}
