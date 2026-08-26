package com.vibhu.sapi.dto;

public record CustomerPaymentProfile(
    String customerId,
    String name,
    String segment,
    String riskTier,
    int failedPaymentsLast30Days,
    int totalPaymentsLast30Days) {}
