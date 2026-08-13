package com.vibhu.hadron.domain;

public enum CashLineStatus {
  NEW,
  VALIDATED,
  PROCESSING,
  PROCESSED,
  SETTLED,
  COMPLETED,
  CANCELLED,
  RETRY,
  DLQ,
  MANUAL_REVIEW
}
