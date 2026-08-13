package com.vibhu.hadron.dto;

import java.math.BigDecimal;
import java.time.Instant;

public record NeptuneSeedRequest(
    String cashLineId,
    String participantId,
    String accountId,
    String currency,
    BigDecimal amount,
    String eventType,
    int sequenceNumber,
    int version,
    boolean deleted,
    Instant updatedAt) {}
