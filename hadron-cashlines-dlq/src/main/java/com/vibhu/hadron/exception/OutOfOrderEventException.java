package com.vibhu.hadron.exception;

import com.vibhu.hadron.domain.FailureCategory;

public class OutOfOrderEventException extends HadronException {

  private final int expected;
  private final int received;

  public OutOfOrderEventException(String cashLineId, int expected, int received) {
    super(
        "Out-of-order CashLine " + cashLineId + " expected sequence " + expected + " received " + received,
        FailureCategory.DATA,
        true);
    this.expected = expected;
    this.received = received;
  }

  public int expected() {
    return expected;
  }

  public int received() {
    return received;
  }
}
