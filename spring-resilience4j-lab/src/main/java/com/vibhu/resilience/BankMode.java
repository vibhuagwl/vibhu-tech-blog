package com.vibhu.resilience;

/** Simulated bank gateway modes for interview demos. */
public enum BankMode {
  OK,
  ERROR,
  FLAKY,
  SLOW,
  DOWN
}
