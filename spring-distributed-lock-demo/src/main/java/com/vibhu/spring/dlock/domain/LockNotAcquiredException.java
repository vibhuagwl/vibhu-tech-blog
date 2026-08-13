package com.vibhu.spring.dlock.domain;

public class LockNotAcquiredException extends RuntimeException {
  public LockNotAcquiredException(String key) {
    super("LOCK_BUSY key=" + key);
  }
}
