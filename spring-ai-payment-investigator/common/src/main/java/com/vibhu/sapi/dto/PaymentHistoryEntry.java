package com.vibhu.sapi.dto;

import java.time.Instant;

public record PaymentHistoryEntry(
    String paymentId, String event, String status, String detail, Instant occurredAt) {}
