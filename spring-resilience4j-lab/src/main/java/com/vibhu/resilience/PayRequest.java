package com.vibhu.resilience;

public record PayRequest(String idempotencyKey, String customerId, long amountCents) {}
