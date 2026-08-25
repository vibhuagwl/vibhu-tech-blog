package com.vibhu.fai.common.dto;

import java.util.List;

/**
 * ============================================================
 * INTERVIEW NOTES — Structured Output
 * ============================================================
 * ChatClient.entity(PaymentInvestigation.class) maps LLM JSON → record.
 * Never trust blindly: schema ok ≠ business facts correct.
 * Flow: LLM → schema → Java business validation → audit.
 * Memory: Structured output = typed contract, not truth.
 * ============================================================
 */
public record PaymentInvestigation(
    String transactionId,
    String status,
    String rootCause,
    List<String> evidence,
    String recommendedAction,
    boolean approvalRequired) {}
