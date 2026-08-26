package com.vibhu.sapi.dto;

import java.time.Instant;

public record BankResponseView(
    String paymentId,
    String businessCode,
    String message,
    String rawResponse,
    Instant receivedAt) {}
