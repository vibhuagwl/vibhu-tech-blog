package com.vibhu.ratelimit.store;

import com.vibhu.ratelimit.api.RateLimitKey;
import com.vibhu.ratelimit.api.RateLimitPolicy;
import com.vibhu.ratelimit.api.RateLimitResult;
import com.vibhu.ratelimit.clock.Clock;
import java.util.concurrent.ConcurrentHashMap;

public final class InMemoryLeakyBucketStore implements RateLimitStore {

  private final ConcurrentHashMap<String, LeakyBucketState> buckets = new ConcurrentHashMap<>();
  private final Clock clock;

  public InMemoryLeakyBucketStore(Clock clock) {
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
          LeakyBucketState current = existing == null ? LeakyBucketState.empty(now) : existing;
          holder.decision = LeakyBucketMath.consume(current, policy, now, cost);
          return holder.decision.nextState();
        });
    LeakyBucketMath.Decision d = holder.decision;
    if (d.allowed()) {
      return RateLimitResult.allow(d.remaining(), d.limit(), redisKey, policy.id());
    }
    return RateLimitResult.reject(d.remaining(), d.retryAfter(), d.limit(), redisKey, policy.id());
  }

  @Override
  public void delete(RateLimitKey key) {
    buckets.remove(key.redisKey());
  }

  public void clear() {
    buckets.clear();
  }

  private static final class Holder {
    private LeakyBucketMath.Decision decision;
  }
}
