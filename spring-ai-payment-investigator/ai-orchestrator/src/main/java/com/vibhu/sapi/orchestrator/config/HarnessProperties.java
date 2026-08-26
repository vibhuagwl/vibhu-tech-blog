package com.vibhu.sapi.orchestrator.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.harness")
public record HarnessProperties(int maxToolCalls, int maxModelIterations, long wallClockMs, int contextBudgetChars) {
}
