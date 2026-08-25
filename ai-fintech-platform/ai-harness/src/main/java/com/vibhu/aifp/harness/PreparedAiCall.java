package com.vibhu.aifp.harness;

import com.vibhu.aifp.common.AiContext;
import com.vibhu.aifp.common.Intent;
import java.util.List;

public record PreparedAiCall(
    String conversationId,
    String userMessage,
    Intent intent,
    AiContext context,
    String systemPrompt,
    List<String> allowedTools) {}
