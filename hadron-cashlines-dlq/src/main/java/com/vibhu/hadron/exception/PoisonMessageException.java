package com.vibhu.hadron.exception;

import com.vibhu.hadron.domain.FailureCategory;

public class PoisonMessageException extends HadronException {

  public PoisonMessageException(String message) {
    super(message, FailureCategory.POISON, false);
  }

  public PoisonMessageException(String message, Throwable cause) {
    super(message, cause, FailureCategory.POISON, false);
  }
}
