package com.vibhu.crypto.dto;

import jakarta.validation.constraints.NotBlank;

public record EncryptRequest(@NotBlank String plaintext) {}
