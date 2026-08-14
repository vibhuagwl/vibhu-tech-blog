package com.vibhu.ratelimit.api;

public enum RateLimitAlgorithm {
  TOKEN_BUCKET,
  LEAKY_BUCKET,
  FIXED_WINDOW,
  SLIDING_WINDOW_LOG,
  SLIDING_WINDOW_COUNTER
}
