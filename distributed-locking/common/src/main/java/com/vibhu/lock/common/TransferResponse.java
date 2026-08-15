package com.vibhu.lock.common;

public record TransferResponse(String transactionId, String status) {
  public TransferResponse(String transactionId, TransactionState state) {
    this(transactionId, mapStatus(state));
  }

  private static String mapStatus(TransactionState state) {
    if (state == null) {
      return "UNKNOWN";
    }
    return switch (state) {
      case COMMITTED, RELEASED -> "COMPLETED";
      case ABORTED, TIMED_OUT -> "FAILED";
      case ABORTING -> "ABORTING";
      default -> state.name();
    };
  }
}
