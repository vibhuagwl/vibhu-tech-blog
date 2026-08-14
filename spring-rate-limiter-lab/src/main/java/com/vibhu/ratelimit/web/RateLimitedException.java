package com.vibhu.ratelimit.web;

import com.vibhu.ratelimit.api.RateLimitResult;

public class RateLimitedException extends RuntimeException {

  private final RateLimitResult result;

  public RateLimitedException(RateLimitResult result) {
    super(result.reason());
    this.result = result;
  }

  public RateLimitResult result() {
    return result;
  }
}
