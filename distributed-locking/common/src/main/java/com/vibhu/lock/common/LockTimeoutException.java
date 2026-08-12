package com.vibhu.lock.common;

public class LockTimeoutException extends RuntimeException {
  public LockTimeoutException(String message) {
    super(message);
  }
}
