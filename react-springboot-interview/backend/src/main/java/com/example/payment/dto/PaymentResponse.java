package com.example.payment.dto;

import com.example.payment.entity.PaymentStatus;
import java.math.BigDecimal;
import java.time.Instant;

public record PaymentResponse(
        Long id,
        BigDecimal amount,
        String currency,
        PaymentStatus status,
        Long customerId,
        String customerName,
        String customerEmail,
        String reference,
        Instant createdAt,
        Instant updatedAt
) {
}
