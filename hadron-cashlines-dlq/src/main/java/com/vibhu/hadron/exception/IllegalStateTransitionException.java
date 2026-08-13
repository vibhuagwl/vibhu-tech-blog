package com.vibhu.hadron.exception;

import com.vibhu.hadron.domain.FailureCategory;

public class IllegalStateTransitionException extends HadronException {

  public IllegalStateTransitionException(String message) {
    super(message, FailureCategory.BUSINESS, false);
  }
}
