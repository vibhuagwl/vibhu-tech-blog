package com.vibhu.connectionpool.exception;

public class ConnectionTimeoutException extends ConnectionPoolException {
  public ConnectionTimeoutException(String message) {
    super(message);
  }
}
