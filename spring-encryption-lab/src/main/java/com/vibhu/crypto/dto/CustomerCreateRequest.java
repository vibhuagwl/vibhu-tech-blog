package com.vibhu.crypto.dto;

import jakarta.validation.constraints.NotBlank;

public record CustomerCreateRequest(
    @NotBlank String name, @NotBlank String accountNumber, @NotBlank String pan) {}
