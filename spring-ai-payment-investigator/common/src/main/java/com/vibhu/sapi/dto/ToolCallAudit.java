package com.vibhu.sapi.dto;

import java.time.Instant;

public record ToolCallAudit(
    String toolName,
    String arguments,
    String resultSummary,
    String userId,
    String role,
    boolean success,
    long durationMs,
    Instant calledAt) {}
