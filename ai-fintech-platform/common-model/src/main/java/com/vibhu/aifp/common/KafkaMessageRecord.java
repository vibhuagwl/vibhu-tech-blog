package com.vibhu.aifp.common;

import java.time.Instant;

public record KafkaMessageRecord(
    String messageId,
    String topic,
    int partition,
    long offset,
    String key,
    String payload,
    String status,
    String error,
    Instant timestamp) {}
