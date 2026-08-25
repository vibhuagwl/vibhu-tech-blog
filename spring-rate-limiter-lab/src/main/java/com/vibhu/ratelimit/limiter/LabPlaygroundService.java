package com.vibhu.ratelimit.limiter;

import com.vibhu.ratelimit.api.RateLimitAlgorithm;
import com.vibhu.ratelimit.api.RateLimitPolicy;
import com.vibhu.ratelimit.api.RateLimitResult;
import com.vibhu.ratelimit.api.RateLimitScope;
import com.vibhu.ratelimit.api.RateLimiter;
import com.vibhu.ratelimit.api.RefillPeriod;
import com.vibhu.ratelimit.api.RequestContext;
import com.vibhu.ratelimit.clock.Clock;
import com.vibhu.ratelimit.clock.SystemClock;
import com.vibhu.ratelimit.metrics.RateLimitMetrics;
import com.vibhu.ratelimit.store.InMemoryFixedWindowStore;
import com.vibhu.ratelimit.store.InMemoryLeakyBucketStore;
import com.vibhu.ratelimit.store.InMemoryRateLimitStore;
import com.vibhu.ratelimit.store.InMemorySlidingWindowCounterStore;
import com.vibhu.ratelimit.store.InMemorySlidingWindowLogStore;
import java.time.Duration;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Service;

/** In-memory playground limiters keyed by algorithm + lab key (no Redis). */
@Service
public class LabPlaygroundService {

  private static final long LAB_LIMIT = 10;
  private static final Duration LAB_WINDOW = Duration.ofSeconds(10);

  private final RateLimitMetrics metrics;
  private final Clock clock = new SystemClock();
  private final InMemoryRateLimitStore tokenBucketStore = new InMemoryRateLimitStore(clock);
  private final InMemoryFixedWindowStore fixedWindowStore = new InMemoryFixedWindowStore(clock);
  private final InMemorySlidingWindowLogStore slidingLogStore =
      new InMemorySlidingWindowLogStore(clock);
  private final InMemorySlidingWindowCounterStore slidingCounterStore =
      new InMemorySlidingWindowCounterStore(clock);
  private final InMemoryLeakyBucketStore leakyBucketStore = new InMemoryLeakyBucketStore(clock);
  private final ConcurrentHashMap<String, RateLimiter> limiters = new ConcurrentHashMap<>();

  public LabPlaygroundService(RateLimitMetrics metrics) {
    this.metrics = metrics;
  }

  public List<Map<String, String>> algorithms() {
    return Arrays.stream(RateLimitAlgorithm.values())
        .map(
            a ->
                Map.of(
                    "name", a.name(),
                    "path", "/api/lab/" + a.name(),
                    "description", describe(a)))
        .toList();
  }

  public RateLimitResult tryAllow(RateLimitAlgorithm algorithm, String labKey, double cost) {
    RateLimiter limiter = limiterFor(algorithm, labKey);
    RequestContext ctx =
        RequestContext.builder()
            .tenantId("lab")
            .clientId(labKey)
            .apiPath("/api/lab/" + algorithm.name())
            .cost(cost)
            .build();
    return limiter.allow(ctx);
  }

  private RateLimiter limiterFor(RateLimitAlgorithm algorithm, String labKey) {
    String cacheKey = algorithm.name() + ":" + labKey;
    return limiters.computeIfAbsent(cacheKey, k -> createLimiter(algorithm, labKey));
  }

  private RateLimiter createLimiter(RateLimitAlgorithm algorithm, String labKey) {
    RateLimitPolicy policy =
        RateLimitPolicy.builder()
            .id("lab-" + algorithm.name() + "-" + labKey)
            .scope(RateLimitScope.CLIENT_API)
            .algorithm(algorithm)
            .capacity(LAB_LIMIT)
            .refillRate(LAB_LIMIT)
            .refillPeriod(RefillPeriod.SECOND)
            .timeWindow(LAB_WINDOW)
            .build();
    return switch (algorithm) {
      case TOKEN_BUCKET ->
          new TokenBucketRateLimiter(policy, tokenBucketStore, tokenBucketStore, metrics);
      case FIXED_WINDOW ->
          new FixedWindowRateLimiter(policy, fixedWindowStore, fixedWindowStore, metrics);
      case SLIDING_WINDOW_LOG ->
          new SlidingWindowLogRateLimiter(policy, slidingLogStore, slidingLogStore, metrics);
      case SLIDING_WINDOW_COUNTER ->
          new SlidingWindowCounterRateLimiter(
              policy, slidingCounterStore, slidingCounterStore, metrics);
      case LEAKY_BUCKET ->
          new LeakyBucketRateLimiter(policy, leakyBucketStore, leakyBucketStore, metrics);
    };
  }

  private static String describe(RateLimitAlgorithm algorithm) {
    return switch (algorithm) {
      case TOKEN_BUCKET -> "Burst + sustained refill; lazy token accrual";
      case LEAKY_BUCKET -> "Constant drain rate; overflow rejects";
      case FIXED_WINDOW -> "Counter resets each window; boundary burst risk";
      case SLIDING_WINDOW_LOG -> "Deque of timestamps; accurate, memory-heavy";
      case SLIDING_WINDOW_COUNTER -> "Weighted previous+current window estimate";
    };
  }
}
