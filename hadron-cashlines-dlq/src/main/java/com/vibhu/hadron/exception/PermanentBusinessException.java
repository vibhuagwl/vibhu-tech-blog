package com.vibhu.hadron.exception;

import com.vibhu.hadron.domain.FailureCategory;

public class PermanentBusinessException extends HadronException {

  public PermanentBusinessException(String message) {
    super(message, FailureCategory.BUSINESS, false);
  }
}
