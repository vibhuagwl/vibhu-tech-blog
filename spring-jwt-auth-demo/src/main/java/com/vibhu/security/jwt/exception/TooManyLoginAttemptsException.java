package com.vibhu.security.jwt.exception;

public class TooManyLoginAttemptsException extends RuntimeException {

  public TooManyLoginAttemptsException(String message) {
    super(message);
  }
}
