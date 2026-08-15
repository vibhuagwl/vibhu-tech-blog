package com.vibhu.lock.common;

import java.time.Instant;

public record TransactionCommitted(String transactionId, String correlationId, Instant timestamp) {}
