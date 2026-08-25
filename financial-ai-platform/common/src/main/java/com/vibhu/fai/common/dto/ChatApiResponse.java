package com.vibhu.fai.common.dto;

import java.util.List;

public record ChatApiResponse(
    String conversationId,
    String executionId,
    Object result,
    List<String> toolsInvoked,
    String mode) {}
