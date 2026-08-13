package com.vibhu.crypto.dto;

import jakarta.validation.constraints.NotBlank;

public record HybridEncryptRequest(@NotBlank String plaintext) {}
