package com.vibhu.sapi.dto;

import java.util.List;

public record PaymentInvestigation(
    String paymentId,
    String status,
    String rootCause,
    List<Evidence> evidence,
    List<String> recommendedActions,
    String confidence,
    boolean humanApprovalRequired) {}
