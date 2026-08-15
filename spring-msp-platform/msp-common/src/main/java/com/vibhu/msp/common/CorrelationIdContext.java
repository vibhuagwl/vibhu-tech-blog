package com.vibhu.msp.common;

import java.util.Optional;
import java.util.UUID;

public final class CorrelationIdContext {
  private static final ThreadLocal<String> CURRENT = new ThreadLocal<>();

  public static void set(String correlationId) {
    CURRENT.set(correlationId);
  }

  public static String getOrCreate() {
    String id = CURRENT.get();
    if (id == null || id.isBlank()) {
      id = UUID.randomUUID().toString();
      CURRENT.set(id);
    }
    return id;
  }

  public static Optional<String> get() {
    return Optional.ofNullable(CURRENT.get());
  }

  public static void clear() {
    CURRENT.remove();
  }

  private CorrelationIdContext() {}
}
