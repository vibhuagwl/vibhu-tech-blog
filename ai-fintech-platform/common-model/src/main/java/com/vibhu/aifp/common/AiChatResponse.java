package com.vibhu.aifp.common;

import java.util.List;

public record AiChatResponse(
    String conversationId,
    String answer,
    Intent intent,
    List<ToolCallTrace> toolTraces,
    AiContext context,
    EvalScore evalScore) {}
