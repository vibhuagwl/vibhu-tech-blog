package com.vibhu.sapi.dto;

import java.time.Instant;

public record ApprovalRequest(
    String id,
    String action,
    String paymentId,
    String requestedBy,
    String status,
    Instant createdAt,
    String payload) {}
