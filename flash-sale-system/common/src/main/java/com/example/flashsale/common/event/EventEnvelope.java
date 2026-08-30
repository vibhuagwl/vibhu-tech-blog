package com.example.flashsale.common.event;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * Versioned, self-contained event. Consumers must key idempotency on {@code eventId}, not Kafka offset.
 * WHY: offset rewind / redelivery / multi-subscriber would otherwise double-apply.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record EventEnvelope(
        String eventId,
        String eventType,
        int eventVersion,
        Instant timestamp,
        String correlationId,
        String aggregateId,
        String partitionKey,
        Map<String, Object> payload) {

    public static EventEnvelope of(
            String eventType, String correlationId, String aggregateId, String partitionKey,
            Map<String, Object> payload) {
        return new EventEnvelope(
                UUID.randomUUID()
                        .toString(),
                eventType,
                1,
                Instant.now(),
                correlationId,
                aggregateId,
                partitionKey,
                payload);
    }
}
