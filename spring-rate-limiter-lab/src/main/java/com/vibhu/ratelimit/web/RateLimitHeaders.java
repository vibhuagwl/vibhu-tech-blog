package com.vibhu.ratelimit.web;

import com.vibhu.ratelimit.api.RateLimitResult;
import jakarta.servlet.http.HttpServletResponse;

public final class RateLimitHeaders {

  public static final String LIMIT = "X-RateLimit-Limit";
  public static final String REMAINING = "X-RateLimit-Remaining";
  public static final String RESET = "X-RateLimit-Reset";
  public static final String RETRY_AFTER = "Retry-After";
  public static final String POLICY = "X-RateLimit-Policy";

  private RateLimitHeaders() {}

  public static void apply(HttpServletResponse response, RateLimitResult result) {
    response.setHeader(LIMIT, Long.toString(result.limit()));
    response.setHeader(REMAINING, Long.toString(Math.max(0, result.remainingTokens())));
    long resetEpochSeconds = (System.currentTimeMillis() + result.retryAfter().toMillis()) / 1000;
    response.setHeader(RESET, Long.toString(resetEpochSeconds));
    response.setHeader(POLICY, result.policyId());
    if (!result.allowed()) {
      response.setHeader(RETRY_AFTER, Long.toString(Math.max(1, result.retryAfterSeconds())));
    }
  }
}
