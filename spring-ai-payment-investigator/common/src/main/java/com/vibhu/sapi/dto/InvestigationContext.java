package com.vibhu.sapi.dto;

import java.util.List;
import java.util.Map;

public record InvestigationContext(
    String conversationId,
    String tenantId,
    String userId,
    String paymentId,
    List<ContextItem> items,
    Map<String, String> entities,
    List<String> allowedTools,
    int budgetChars,
    int usedChars) {}
