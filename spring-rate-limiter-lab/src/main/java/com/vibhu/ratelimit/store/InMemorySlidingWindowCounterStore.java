package com.vibhu.ratelimit.store;

import com.vibhu.ratelimit.api.RateLimitKey;
import com.vibhu.ratelimit.api.RateLimitPolicy;
import com.vibhu.ratelimit.api.RateLimitResult;
import com.vibhu.ratelimit.clock.Clock;
import java.util.concurrent.ConcurrentHashMap;

public final class InMemorySlidingWindowCounterStore implements RateLimitStore {

  private final ConcurrentHashMap<String, SlidingWindowCounterState> counters =
      new ConcurrentHashMap<>();
  private final Clock clock;

  public InMemorySlidingWindowCounterStore(Clock clock) {
    this.clock = clock;
  }

  @Override
  public RateLimitResult consume(RateLimitKey key, RateLimitPolicy policy, double cost) {
    String redisKey = key.redisKey();
    Holder holder = new Holder();
    counters.compute(
        redisKey,
        (k, existing) -> {
          long now = clock.millis();
          SlidingWindowCounterState current =
              existing == null ? SlidingWindowCounterState.empty(now) : existing;
          holder.decision = SlidingWindowCounterMath.consume(current, policy, now, cost);
          return holder.decision.nextState();
        });
    SlidingWindowCounterMath.Decision d = holder.decision;
    if (d.allowed()) {
      return RateLimitResult.allow(d.remaining(), d.limit(), redisKey, policy.id());
    }
    return RateLimitResult.reject(d.remaining(), d.retryAfter(), d.limit(), redisKey, policy.id());
  }

  @Override
  public void delete(RateLimitKey key) {
    counters.remove(key.redisKey());
  }

  public void clear() {
    counters.clear();
  }

  private static final class Holder {
    private SlidingWindowCounterMath.Decision decision;
  }
}
