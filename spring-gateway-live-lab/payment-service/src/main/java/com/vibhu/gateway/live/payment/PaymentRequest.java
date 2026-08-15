package com.vibhu.gateway.live.payment;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record PaymentRequest(
    @NotNull Long fromAccountId,
    @NotNull Long toAccountId,
    @NotNull @DecimalMin("0.01") BigDecimal amount) {}
