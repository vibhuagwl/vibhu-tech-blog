package com.vibhu.lock.common;

import java.time.Instant;

public record TransactionPrepared(String transactionId, String correlationId, Instant timestamp) {}
