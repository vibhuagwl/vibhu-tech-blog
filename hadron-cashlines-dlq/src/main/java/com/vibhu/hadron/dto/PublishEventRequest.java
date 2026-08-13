package com.vibhu.hadron.dto;

import com.vibhu.hadron.domain.EventType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;

public record PublishEventRequest(
    @NotBlank String eventId,
    @NotBlank String cashLineId,
    @NotNull EventType eventType,
    @Min(1) int sequenceNumber,
    int version,
    String participantId,
    String accountId,
    String currency,
    BigDecimal amount,
    String transactionType,
    Instant occurredAt,
    Map<String, String> attributes) {}
