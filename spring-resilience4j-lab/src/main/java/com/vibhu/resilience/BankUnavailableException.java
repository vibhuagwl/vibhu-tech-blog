package com.vibhu.resilience;

public class BankUnavailableException extends RuntimeException {
  public BankUnavailableException(String message) {
    super(message);
  }
}
