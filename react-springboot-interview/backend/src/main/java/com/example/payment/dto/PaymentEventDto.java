package com.example.payment.dto;

import com.example.payment.entity.PaymentStatus;
import java.math.BigDecimal;
import java.time.Instant;

public record PaymentEventDto(
        Long paymentId,
        String reference,
        PaymentStatus status,
        BigDecimal amount,
        String currency,
        Instant occurredAt
) {
}
