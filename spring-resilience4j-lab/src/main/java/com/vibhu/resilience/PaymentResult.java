package com.vibhu.resilience;

public record PaymentResult(String idempotencyKey, String status, String reason) {
  public static PaymentResult captured(String key) {
    return new PaymentResult(key, "CAPTURED", "ok");
  }

  public static PaymentResult pending(String key, String reason) {
    return new PaymentResult(key, "PENDING", reason);
  }
}
