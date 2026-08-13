package com.vibhu.crypto.dto;

import jakarta.validation.constraints.NotBlank;

public record HybridPacket(@NotBlank String encryptedDek, @NotBlank String payload) {}
