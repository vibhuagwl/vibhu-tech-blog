package com.vibhu.hadron.domain;

public enum RetryDecision {
  RETRY,
  DLQ_IMMEDIATE,
  IGNORE,
  MANUAL
}
