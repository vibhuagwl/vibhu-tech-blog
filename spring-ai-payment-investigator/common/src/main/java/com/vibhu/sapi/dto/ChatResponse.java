package com.vibhu.sapi.dto;

import com.vibhu.sapi.enums.HarnessState;
import java.util.List;

public record ChatResponse(
    String conversationId,
    String executionId,
    Object result,
    HarnessState finalState,
    List<String> toolCalls,
    String summary) {}
