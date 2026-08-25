package com.vibhu.ratelimit.limiter;

import com.vibhu.ratelimit.api.RateLimitPolicy;
import com.vibhu.ratelimit.api.RateLimiter;

/** Rate limiter tied to a single policy configuration (factory flyweight cache). */
public interface PolicyBoundRateLimiter extends RateLimiter {

  RateLimitPolicy policy();
}
