package com.vibhu.hadron.exception;

import com.vibhu.hadron.domain.FailureCategory;

public class TransientTechnicalException extends HadronException {

  public TransientTechnicalException(String message) {
    super(message, FailureCategory.TRANSIENT, true);
  }

  public TransientTechnicalException(String message, Throwable cause) {
    super(message, cause, FailureCategory.TRANSIENT, true);
  }
}
