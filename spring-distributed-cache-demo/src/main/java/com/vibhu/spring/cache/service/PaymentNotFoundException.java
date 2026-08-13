package com.vibhu.spring.cache.service;

public class PaymentNotFoundException extends RuntimeException {
  public PaymentNotFoundException(String id) {
    super("Payment not found: " + id);
  }
}
