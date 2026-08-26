package com.vibhu.sapi.dto;

import java.time.Instant;

public record InvestigationCaseView(
    String caseId,
    String paymentId,
    String status,
    String reason,
    Instant createdAt) {}
