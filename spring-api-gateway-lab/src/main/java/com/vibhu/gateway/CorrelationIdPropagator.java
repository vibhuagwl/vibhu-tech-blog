package com.vibhu.gateway;

import java.util.UUID;

/**
 * Propagate an existing correlation/trace id when present; otherwise mint one.
 * Mirrors the Spring Cloud Gateway GlobalFilter interview sketch.
 */
public final class CorrelationIdPropagator {
  public static final String HEADER = "X-Trace-Id";

  private CorrelationIdPropagator() {}

  public static String resolve(String incomingTraceParentOrId) {
    if (incomingTraceParentOrId != null && !incomingTraceParentOrId.isBlank()) {
      return incomingTraceParentOrId.trim();
    }
    return UUID.randomUUID().toString();
  }
}
