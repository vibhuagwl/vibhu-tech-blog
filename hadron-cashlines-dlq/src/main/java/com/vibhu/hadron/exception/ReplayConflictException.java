package com.vibhu.hadron.exception;

public class ReplayConflictException extends PermanentBusinessException {

  public ReplayConflictException(String message) {
    super(message);
  }
}
