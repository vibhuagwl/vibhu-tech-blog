package com.vibhu.ratelimit.store;

import com.vibhu.ratelimit.api.RateLimitKey;
import com.vibhu.ratelimit.api.RateLimitPolicy;
import com.vibhu.ratelimit.api.RateLimitResult;
import com.vibhu.ratelimit.clock.Clock;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Process-local token bucket. Correct for a single JVM; insufficient as the sole store when
 * multiple application servers must share one quota.
 */
public final class InMemoryRateLimitStore implements RateLimitStore {

  private final ConcurrentHashMap<String, TokenBucketState> buckets = new ConcurrentHashMap<>();
  private final Clock clock;

  public InMemoryRateLimitStore(Clock clock) {
    this.clock = clock;
  }

  @Override
  public RateLimitResult consume(RateLimitKey key, RateLimitPolicy policy, double cost) {
    String redisKey = key.redisKey();
    Holder holder = new Holder();
    buckets.compute(
        redisKey,
        (k, existing) -> {
          long now = clock.millis();
          TokenBucketState current =
              existing == null ? TokenBucketState.full(policy.capacity(), now) : existing;
          holder.decision = TokenBucketMath.consume(current, policy, now, cost);
          return holder.decision.nextState();
        });
    TokenBucketMath.Decision d = holder.decision;
    if (d.allowed()) {
      return RateLimitResult.allow(d.remaining(), d.limit(), redisKey, policy.id());
    }
    return RateLimitResult.reject(d.remaining(), d.retryAfter(), d.limit(), redisKey, policy.id());
  }

  @Override
  public void delete(RateLimitKey key) {
    buckets.remove(key.redisKey());
  }

  public int size() {
    return buckets.size();
  }

  public void clear() {
    buckets.clear();
  }

  private static final class Holder {
    private TokenBucketMath.Decision decision;
  }
}
