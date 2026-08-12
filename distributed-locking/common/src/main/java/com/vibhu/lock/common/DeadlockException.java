package com.vibhu.lock.common;

public class DeadlockException extends RuntimeException {
  public DeadlockException(String message) {
    super(message);
  }
}
