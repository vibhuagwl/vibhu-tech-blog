package com.vibhu.hadron.dto;

import com.vibhu.hadron.domain.DlqStatus;
import java.time.Instant;

public record DeadLetterResponse(
    Long id,
    String eventId,
    String cashLineId,
    String eventType,
    String topic,
    int partition,
    long offset,
    String failureReason,
    String exceptionType,
    String exceptionMessage,
    int retryCount,
    DlqStatus status,
    int replayCount,
    String replayActor,
    Instant firstFailedAt,
    Instant lastFailedAt,
    Instant replayedAt,
    Instant resolvedAt,
    int version) {}
