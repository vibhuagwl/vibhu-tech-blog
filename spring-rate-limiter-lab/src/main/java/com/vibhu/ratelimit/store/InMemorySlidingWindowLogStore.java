package com.vibhu.ratelimit.store;

import com.vibhu.ratelimit.api.RateLimitKey;
import com.vibhu.ratelimit.api.RateLimitPolicy;
import com.vibhu.ratelimit.api.RateLimitResult;
import com.vibhu.ratelimit.clock.Clock;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.concurrent.ConcurrentHashMap;

public final class InMemorySlidingWindowLogStore implements RateLimitStore {

  private final ConcurrentHashMap<String, Deque<Long>> logs = new ConcurrentHashMap<>();
  private final Clock clock;

  public InMemorySlidingWindowLogStore(Clock clock) {
    this.clock = clock;
  }

  @Override
  public RateLimitResult consume(RateLimitKey key, RateLimitPolicy policy, double cost) {
    String redisKey = key.redisKey();
    Holder holder = new Holder();
    logs.compute(
        redisKey,
        (k, existing) -> {
          Deque<Long> deque = existing == null ? new ArrayDeque<>() : existing;
          long now = clock.millis();
          holder.decision = SlidingWindowLogMath.consume(deque, policy, now, cost);
          return holder.decision.nextTimestamps();
        });
    SlidingWindowLogMath.Decision d = holder.decision;
    if (d.allowed()) {
      return RateLimitResult.allow(d.remaining(), d.limit(), redisKey, policy.id());
    }
    return RateLimitResult.reject(d.remaining(), d.retryAfter(), d.limit(), redisKey, policy.id());
  }

  @Override
  public void delete(RateLimitKey key) {
    logs.remove(key.redisKey());
  }

  public void clear() {
    logs.clear();
  }

  private static final class Holder {
    private SlidingWindowLogMath.Decision decision;
  }
}
