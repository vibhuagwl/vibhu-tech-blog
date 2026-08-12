package com.vibhu.lock.common;

public class FenceTokenRejectedException extends RuntimeException {
  public FenceTokenRejectedException(String message) {
    super(message);
  }
}
