package com.vibhu.resilience;

public class DuplicatePaymentException extends BusinessException {
  public DuplicatePaymentException(String key) {
    super("Duplicate payment for idempotencyKey=" + key);
  }
}
