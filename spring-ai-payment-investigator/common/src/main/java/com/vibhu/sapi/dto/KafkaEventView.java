package com.vibhu.sapi.dto;

import java.time.Instant;

public record KafkaEventView(
    String eventId,
    String topic,
    String paymentId,
    String eventType,
    String payload,
    Instant occurredAt) {}
