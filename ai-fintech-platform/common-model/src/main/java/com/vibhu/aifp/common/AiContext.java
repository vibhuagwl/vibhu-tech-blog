package com.vibhu.aifp.common;

import java.util.List;
import java.util.Map;

public record AiContext(
    Intent intent,
    List<String> retrievedDocIds,
    Map<String, String> entities,
    String memorySummary,
    List<String> allowedTools) {}
