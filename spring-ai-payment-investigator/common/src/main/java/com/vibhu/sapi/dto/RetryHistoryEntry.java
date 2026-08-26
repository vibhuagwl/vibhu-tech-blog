package com.vibhu.sapi.dto;

import java.time.Instant;

public record RetryHistoryEntry(
    int attempt, String status, String failureCode, String detail, Instant attemptedAt) {}
