package com.vibhu.resilience;

import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Supplier;
import org.springframework.stereotype.Component;

/**
 * In-memory stand-in for UNIQUE(idempotency_key). Production: Postgres/Redis with the same key the
 * bank sees on Idempotency-Key.
 */
@Component
public class IdempotencyStore {
  private final ConcurrentHashMap<String, PaymentResult> completed = new ConcurrentHashMap<>();

  public PaymentResult once(String key, Supplier<PaymentResult> charge) {
    PaymentResult cached = completed.get(key);
    if (cached != null) {
      return cached;
    }
    PaymentResult result = charge.get();
    if ("CAPTURED".equals(result.status())) {
      completed.putIfAbsent(key, result);
      return completed.get(key);
    }
    return result;
  }
}
