package com.vibhu.connectionpool.exception;

public class PoolCapacityExceededException extends ConnectionPoolException {
  public PoolCapacityExceededException(String message) {
    super(message);
  }
}
