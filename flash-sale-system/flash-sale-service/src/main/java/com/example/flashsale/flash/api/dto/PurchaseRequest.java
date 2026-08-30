package com.example.flashsale.flash.api.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public record PurchaseRequest(@NotBlank String productId, @Min(1) int quantity, @NotBlank String idempotencyKey) {
}
