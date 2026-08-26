package com.vibhu.sapi.dto;

import jakarta.validation.constraints.NotBlank;

public record ApprovalDecision(@NotBlank String decision, String comment) {}
