package com.vibhu.aifp.common;

public record ToolCallTrace(
    String toolName, String arguments, String result, long durationMs, boolean authorized) {}
