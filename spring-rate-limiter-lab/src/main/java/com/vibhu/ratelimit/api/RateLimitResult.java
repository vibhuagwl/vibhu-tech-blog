package com.vibhu.ratelimit.api;

import java.time.Duration;
import java.util.Objects;

public record RateLimitResult(
    boolean allowed,
    long remainingTokens,
    Duration retryAfter,
    long limit,
    String key,
    String policyId,
    boolean degraded,
    String reason) {

  public RateLimitResult {
    retryAfter = retryAfter == null ? Duration.ZERO : retryAfter;
    key = key == null ? "" : key;
    policyId = policyId == null ? "" : policyId;
    reason = reason == null ? "" : reason;
  }

  public static RateLimitResult allow(long remaining, long limit, String key, String policyId) {
    return new RateLimitResult(true, remaining, Duration.ZERO, limit, key, policyId, false, "ok");
  }

  public static RateLimitResult reject(
      long remaining, Duration retryAfter, long limit, String key, String policyId) {
    return new RateLimitResult(
        false, remaining, retryAfter, limit, key, policyId, false, "quota_exceeded");
  }

  public static RateLimitResult blocked(String key, String policyId) {
    return new RateLimitResult(
        false, 0, Duration.ofHours(1), 0, key, policyId, false, "client_blocked");
  }

  public static RateLimitResult failClosed(String key, String policyId, String reason) {
    return new RateLimitResult(false, 0, Duration.ofSeconds(1), 0, key, policyId, true, reason);
  }

  public static RateLimitResult failOpen(String key, String policyId, long limit, String reason) {
    return new RateLimitResult(true, limit, Duration.ZERO, limit, key, policyId, true, reason);
  }

  public long retryAfterSeconds() {
    long seconds = retryAfter.toSeconds();
    if (seconds <= 0 && !retryAfter.isZero() && !retryAfter.isNegative()) {
      return 1;
    }
    return Math.max(0, seconds);
  }

  public RateLimitResult tighterThan(RateLimitResult other) {
    Objects.requireNonNull(other, "other");
    if (!allowed) {
      return this;
    }
    return other;
  }
}
