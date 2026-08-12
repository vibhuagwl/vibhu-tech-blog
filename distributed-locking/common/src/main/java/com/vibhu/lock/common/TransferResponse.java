package com.vibhu.lock.common;

public record TransferResponse(
    String transactionId,
    TransactionState status
) {
}
