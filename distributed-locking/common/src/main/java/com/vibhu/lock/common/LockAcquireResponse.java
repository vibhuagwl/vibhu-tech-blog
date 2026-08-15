package com.vibhu.lock.common;

public record LockAcquireResponse(
    boolean acquired, LockToken lockToken, TransactionState transactionState, String message) {}
