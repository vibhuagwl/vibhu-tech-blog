package com.vibhu.connectionpool.exception;

public class PoolShutdownException extends ConnectionPoolException {
  public PoolShutdownException(String message) {
    super(message);
  }
}
