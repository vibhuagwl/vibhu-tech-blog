package com.example.payment.exception;

public record ApiError(String code, String message, String traceId) {
}
