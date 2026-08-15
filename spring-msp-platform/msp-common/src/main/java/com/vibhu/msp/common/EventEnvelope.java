package com.vibhu.msp.common;

import java.time.Instant;

public record EventEnvelope<T>(
    String eventId,
    String eventType,
    String correlationId,
    Instant occurredAt,
    T payload
) {
  public static <T> EventEnvelope<T> of(String eventType, String correlationId, T payload) {
    return new EventEnvelope<>(
        java.util.UUID.randomUUID().toString(),
        eventType,
        correlationId,
        Instant.now(),
        payload
    );
  }
}
