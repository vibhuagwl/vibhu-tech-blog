package com.vibhu.lock.common;

import java.time.Instant;

public record TransactionStarted(String transactionId, String correlationId, Instant timestamp) {}
