package com.vibhu.spring.dlock.domain;

import java.math.BigDecimal;

public class InsufficientFundsException extends RuntimeException {
  public InsufficientFundsException(String id, BigDecimal bal, BigDecimal amt) {
    super("Insufficient funds account=" + id + " balance=" + bal + " debit=" + amt);
  }
}
