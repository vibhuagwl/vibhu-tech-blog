package com.vibhu.kafka.common;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.Instant;

public final class PaymentMessages {

    private PaymentMessages() {
    }

    public enum FailMode {
        NONE,
        TRANSIENT_BANK_TIMEOUT,
        POISON
    }

    public record CreatePaymentRequest(
            @NotBlank String paymentId,
            @NotBlank String accountId,
            @NotNull @DecimalMin("0.01") BigDecimal amount,
            @NotBlank String currency,
            @NotBlank String merchantRef,
            @NotNull FailMode failMode
    ) {
    }

    public record PaymentRequestedEvent(
            String paymentId,
            String accountId,
            BigDecimal amount,
            String currency,
            String merchantRef,
            FailMode failMode,
            Instant createdAt
    ) {
    }

    public record PaymentResultEvent(
            String paymentId,
            String accountId,
            String status,
            String detail,
            Instant processedAt
    ) {
    }
}
