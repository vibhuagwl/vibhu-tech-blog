package com.vibhu.hadron.exception;

import com.vibhu.hadron.domain.FailureCategory;

public abstract class HadronException extends RuntimeException {

  private final FailureCategory category;
  private final boolean retryable;

  protected HadronException(String message, FailureCategory category, boolean retryable) {
    super(message);
    this.category = category;
    this.retryable = retryable;
  }

  protected HadronException(String message, Throwable cause, FailureCategory category, boolean retryable) {
    super(message, cause);
    this.category = category;
    this.retryable = retryable;
  }

  public FailureCategory category() {
    return category;
  }

  public boolean retryable() {
    return retryable;
  }
}
