package com.vibhu.lock.common;

import java.time.Instant;

public record TransactionRolledBack(
    String transactionId, String correlationId, String reason, Instant timestamp) {}
