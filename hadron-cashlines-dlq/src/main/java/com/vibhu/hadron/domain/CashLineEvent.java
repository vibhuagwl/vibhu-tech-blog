package com.vibhu.hadron.domain;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;

@JsonIgnoreProperties(ignoreUnknown = true)
public record CashLineEvent(
    @NotBlank String eventId,
    @NotBlank String cashLineId,
    @NotNull EventType eventType,
    @Min(1) int sequenceNumber,
    @Min(0) int version,
    String participantId,
    String accountId,
    String currency,
    BigDecimal amount,
    String transactionType,
    Instant occurredAt,
    Map<String, String> attributes) {

  public CashLineEvent {
    if (attributes == null) {
      attributes = Map.of();
    }
    if (occurredAt == null) {
      occurredAt = Instant.now();
    }
  }

  public String forceFailure() {
    return attributes.getOrDefault("forceFailure", "");
  }
}
