package com.vibhu.payment.exception;

/** Permanent business failure — map to BPMN error (no blind retry). */
public class BusinessPaymentException extends PaymentException {
  private final String errorCode;

  public BusinessPaymentException(String errorCode, String message) {
    super(message);
    this.errorCode = errorCode;
  }

  public String getErrorCode() {
    return errorCode;
  }
}
