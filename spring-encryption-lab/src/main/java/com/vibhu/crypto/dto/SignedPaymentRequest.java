package com.vibhu.crypto.dto;

import jakarta.validation.constraints.NotBlank;

public record SignedPaymentRequest(@NotBlank String payload, @NotBlank String signature) {}
