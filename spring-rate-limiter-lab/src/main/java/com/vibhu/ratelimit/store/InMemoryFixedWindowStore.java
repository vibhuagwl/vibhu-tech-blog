package com.vibhu.ratelimit.store;

import com.vibhu.ratelimit.api.RateLimitKey;
import com.vibhu.ratelimit.api.RateLimitPolicy;
import com.vibhu.ratelimit.api.RateLimitResult;
import com.vibhu.ratelimit.clock.Clock;
import java.util.concurrent.ConcurrentHashMap;

public final class InMemoryFixedWindowStore implements RateLimitStore {

  private final ConcurrentHashMap<String, FixedWindowState> windows = new ConcurrentHashMap<>();
  private final Clock clock;

  public InMemoryFixedWindowStore(Clock clock) {
    this.clock = clock;
  }

  @Override
  public RateLimitResult consume(RateLimitKey key, RateLimitPolicy policy, double cost) {
    String redisKey = key.redisKey();
    Holder holder = new Holder();
    windows.compute(
        redisKey,
        (k, existing) -> {
          long now = clock.millis();
          long windowMs = policy.timeWindow().toMillis();
          FixedWindowState current =
              existing == null ? FixedWindowMath.initialState(now, windowMs) : existing;
          holder.decision = FixedWindowMath.consume(current, policy, now, cost);
          return holder.decision.nextState();
        });
    FixedWindowMath.Decision d = holder.decision;
    if (d.allowed()) {
      return RateLimitResult.allow(d.remaining(), d.limit(), redisKey, policy.id());
    }
    return RateLimitResult.reject(d.remaining(), d.retryAfter(), d.limit(), redisKey, policy.id());
  }

  @Override
  public void delete(RateLimitKey key) {
    windows.remove(key.redisKey());
  }

  public void clear() {
    windows.clear();
  }

  private static final class Holder {
    private FixedWindowMath.Decision decision;
  }
}
