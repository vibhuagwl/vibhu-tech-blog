package com.vibhu.payment.exception;

/** Transient / technical failure — Camunda retries the job. */
public class RetryablePaymentException extends PaymentException {
  public RetryablePaymentException(String message) {
    super(message);
  }

  public RetryablePaymentException(String message, Throwable cause) {
    super(message, cause);
  }
}
