package com.vibhu.ratelimit.config;

import com.vibhu.ratelimit.api.RateLimitPolicy;
import java.util.List;
import java.util.Optional;

/**
 * Dynamic policy source. Implementations must be safe to call on the hot path
 * and must reflect admin updates without a process restart.
 */
public interface RateLimitConfigProvider {

  List<RateLimitPolicy> policiesFor(com.vibhu.ratelimit.api.RequestContext context);

  Optional<RateLimitPolicy> findById(String id);

  List<RateLimitPolicy> findAll();

  RateLimitPolicy upsert(RateLimitPolicy policy);

  boolean delete(String id);
}
