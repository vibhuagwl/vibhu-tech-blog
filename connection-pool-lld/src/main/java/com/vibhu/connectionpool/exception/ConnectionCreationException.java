package com.vibhu.connectionpool.exception;

public class ConnectionCreationException extends ConnectionPoolException {
  public ConnectionCreationException(String message) {
    super(message);
  }

  public ConnectionCreationException(String message, Throwable cause) {
    super(message, cause);
  }
}
