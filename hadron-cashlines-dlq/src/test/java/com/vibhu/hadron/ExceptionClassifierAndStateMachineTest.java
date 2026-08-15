package com.vibhu.hadron;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.vibhu.hadron.classify.ExceptionClassifier;
import com.vibhu.hadron.domain.CashLineStatus;
import com.vibhu.hadron.domain.EventType;
import com.vibhu.hadron.domain.RetryDecision;
import com.vibhu.hadron.exception.InvalidCashLineException;
import com.vibhu.hadron.exception.PoisonMessageException;
import com.vibhu.hadron.exception.TransientTechnicalException;
import com.vibhu.hadron.service.CashLineStateMachine;
import java.sql.SQLException;
import org.apache.kafka.common.errors.SerializationException;
import org.junit.jupiter.api.Test;
import org.springframework.dao.CannotAcquireLockException;
import org.springframework.dao.QueryTimeoutException;

class ExceptionClassifierAndStateMachineTest {

  private final ExceptionClassifier classifier = new ExceptionClassifier();
  private final CashLineStateMachine machine = new CashLineStateMachine();

  @Test
  void timeoutAndDeadlockAreRetryable() {
    assertThat(classifier.classify(new QueryTimeoutException("timeout")))
        .isEqualTo(RetryDecision.RETRY);
    assertThat(classifier.classify(new CannotAcquireLockException("deadlock")))
        .isEqualTo(RetryDecision.RETRY);
    assertThat(classifier.classify(new TransientTechnicalException("db down")))
        .isEqualTo(RetryDecision.RETRY);
    assertThat(classifier.classify(new SQLException("deadlock", "40P01")))
        .isEqualTo(RetryDecision.RETRY);
  }

  @Test
  void poisonAndBusinessGoToDlqImmediately() {
    assertThat(classifier.classify(new PoisonMessageException("bad json")))
        .isEqualTo(RetryDecision.DLQ_IMMEDIATE);
    assertThat(classifier.classify(new InvalidCashLineException("bad amount")))
        .isEqualTo(RetryDecision.DLQ_IMMEDIATE);
    assertThat(classifier.classify(new SerializationException("schema")))
        .isEqualTo(RetryDecision.DLQ_IMMEDIATE);
    assertThat(classifier.classify(new NullPointerException("npe")))
        .isEqualTo(RetryDecision.DLQ_IMMEDIATE);
  }

  @Test
  void legalAndIdempotentTransitions() {
    assertThat(machine.next(CashLineStatus.NEW, EventType.CASHLINE_CREATED))
        .isEqualTo(CashLineStatus.VALIDATED);
    assertThat(machine.next(CashLineStatus.SETTLED, EventType.CASHLINE_COMPLETED))
        .isEqualTo(CashLineStatus.COMPLETED);
    assertThat(machine.next(CashLineStatus.COMPLETED, EventType.CASHLINE_COMPLETED))
        .isEqualTo(CashLineStatus.COMPLETED);
  }

  @Test
  void illegalTransitionsRejected() {
    assertThatThrownBy(() -> machine.next(CashLineStatus.COMPLETED, EventType.CASHLINE_CREATED))
        .hasMessageContaining("Illegal transition");
    assertThatThrownBy(() -> machine.next(CashLineStatus.SETTLED, EventType.CASHLINE_UPDATED))
        .hasMessageContaining("Illegal transition");
  }
}
