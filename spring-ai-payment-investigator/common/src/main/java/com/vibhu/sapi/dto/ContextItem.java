package com.vibhu.sapi.dto;

import java.time.Instant;

public record ContextItem(
    String sourceType,
    String sourceId,
    String content,
    int priority,
    Instant timestamp,
    String confidence,
    String tenantId) {}
