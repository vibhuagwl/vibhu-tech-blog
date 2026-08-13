package com.vibhu.resilience;

/** Non-retryable business rejection (e.g. insufficient funds). Must not trip the circuit. */
public class BusinessException extends RuntimeException {
  public BusinessException(String message) {
    super(message);
  }
}
