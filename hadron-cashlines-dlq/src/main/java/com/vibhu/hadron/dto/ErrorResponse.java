package com.vibhu.hadron.dto;

public record ErrorResponse(String error, String message, String correlationId) {}
