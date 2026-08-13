package com.vibhu.crypto.dto;

import jakarta.validation.constraints.NotBlank;

public record DecryptRequest(@NotBlank String ciphertext) {}
