package com.vibhu.aifp.common;

import jakarta.validation.constraints.NotBlank;

public record AiChatRequest(@NotBlank String conversationId, @NotBlank String message) {}
