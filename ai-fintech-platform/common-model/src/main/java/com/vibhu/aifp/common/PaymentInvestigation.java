package com.vibhu.aifp.common;

import java.util.List;

public record PaymentInvestigation(
    String paymentId,
    String status,
    String rootCause,
    String failureCode,
    String bank,
    List<String> evidence,
    String recommendedAction,
    boolean approvalRequired) {}
