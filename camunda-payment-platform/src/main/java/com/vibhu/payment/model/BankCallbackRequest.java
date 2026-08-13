package com.vibhu.payment.model;

import jakarta.validation.constraints.NotBlank;

public record BankCallbackRequest(
    @NotBlank String paymentId, @NotBlank String bankReference, @NotBlank String result) {}
