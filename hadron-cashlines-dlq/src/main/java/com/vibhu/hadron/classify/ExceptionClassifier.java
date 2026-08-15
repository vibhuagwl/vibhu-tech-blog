package com.vibhu.hadron.classify;

import com.vibhu.hadron.domain.RetryDecision;
import com.vibhu.hadron.exception.OutOfOrderEventException;
import com.vibhu.hadron.exception.PermanentBusinessException;
import com.vibhu.hadron.exception.PoisonMessageException;
import com.vibhu.hadron.exception.TransientTechnicalException;
import java.sql.SQLException;
import java.sql.SQLTransientException;
import java.util.Set;
import org.apache.kafka.common.errors.SerializationException;
import org.springframework.dao.CannotAcquireLockException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.QueryTimeoutException;
import org.springframework.dao.TransientDataAccessException;
import org.springframework.stereotype.Component;
import org.springframework.transaction.TransactionTimedOutException;

@Component
public class ExceptionClassifier {

  private static final Set<String> RETRY_SQL_STATES =
      Set.of(
          "40001", // serialization failure / deadlock
          "40P01", // postgres deadlock
          "55P03", // lock not available
          "08000", "08003", "08006", "57P01", "57014");

  public RetryDecision classify(Throwable throwable) {
    Throwable current = throwable;
    while (current != null) {
      RetryDecision mapped = map(current);
      if (mapped != null) {
        return mapped;
      }
      current = current.getCause();
    }
    return RetryDecision.RETRY;
  }

  public boolean retryable(Throwable throwable) {
    return classify(throwable) == RetryDecision.RETRY;
  }

  private RetryDecision map(Throwable t) {
    if (t instanceof PoisonMessageException || t instanceof SerializationException) {
      return RetryDecision.DLQ_IMMEDIATE;
    }
    if (t instanceof PermanentBusinessException) {
      return RetryDecision.DLQ_IMMEDIATE;
    }
    if (t instanceof TransientTechnicalException || t instanceof OutOfOrderEventException) {
      return RetryDecision.RETRY;
    }
    if (t instanceof QueryTimeoutException
        || t instanceof TransactionTimedOutException
        || t instanceof CannotAcquireLockException
        || t instanceof TransientDataAccessException) {
      return RetryDecision.RETRY;
    }
    if (t instanceof DataIntegrityViolationException) {
      return RetryDecision.DLQ_IMMEDIATE;
    }
    if (t instanceof SQLTransientException) {
      return RetryDecision.RETRY;
    }
    if (t instanceof SQLException sql) {
      String state = sql.getSQLState();
      if (state != null && RETRY_SQL_STATES.contains(state)) {
        return RetryDecision.RETRY;
      }
      if (state != null && (state.startsWith("23") || "23505".equals(state))) {
        return RetryDecision.DLQ_IMMEDIATE;
      }
    }
    if (t instanceof NullPointerException) {
      return RetryDecision.DLQ_IMMEDIATE;
    }
    return null;
  }
}
