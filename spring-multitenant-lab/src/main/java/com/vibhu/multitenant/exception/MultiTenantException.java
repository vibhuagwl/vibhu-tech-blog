package com.vibhu.multitenant.exception;

public class MultiTenantException extends RuntimeException {
  private final String code;
  private final int httpStatus;

  public MultiTenantException(String code, String message, int httpStatus) {
    super(message);
    this.code = code;
    this.httpStatus = httpStatus;
  }

  public String code() {
    return code;
  }

  public int httpStatus() {
    return httpStatus;
  }
}
