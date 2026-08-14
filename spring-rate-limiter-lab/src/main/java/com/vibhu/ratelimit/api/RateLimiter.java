package com.vibhu.ratelimit.api;

/**
 * Strategy interface for a rate-limiting algorithm. Implementations must be
 * thread-safe: concurrent {@link #allow(RequestContext)} calls on the same key
 * must not consume the same token twice.
 */
public interface RateLimiter {

  RateLimitResult allow(RequestContext request);
}
