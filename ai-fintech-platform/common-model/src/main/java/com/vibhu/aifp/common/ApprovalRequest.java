package com.vibhu.aifp.common;

import java.time.Instant;
import java.util.Map;

public record ApprovalRequest(
    String id,
    String toolName,
    Map<String, Object> payload,
    String status,
    String proposedBy,
    String approvedBy,
    Instant createdAt,
    Instant resolvedAt) {}
