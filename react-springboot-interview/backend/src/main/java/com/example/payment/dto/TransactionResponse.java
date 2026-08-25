package com.example.payment.dto;

import com.example.payment.entity.PaymentStatus;
import java.time.Instant;

public record TransactionResponse(
        Long id,
        Long paymentId,
        PaymentStatus status,
        String message,
        Instant createdAt
) {
}
