package com.vibhu.ratelimit.limiter;

import com.vibhu.ratelimit.clock.MutableClock;
import com.vibhu.ratelimit.metrics.RateLimitMetrics;
import com.vibhu.ratelimit.store.InMemoryFixedWindowStore;
import com.vibhu.ratelimit.store.InMemoryLeakyBucketStore;
import com.vibhu.ratelimit.store.InMemoryRateLimitStore;
import com.vibhu.ratelimit.store.InMemorySlidingWindowCounterStore;
import com.vibhu.ratelimit.store.InMemorySlidingWindowLogStore;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import java.util.Optional;

final class RateLimiterTestSupport {

  private RateLimiterTestSupport() {}

  static TestHarness harness() {
    MutableClock clock = new MutableClock(0);
    InMemoryRateLimitStore tokenBucket = new InMemoryRateLimitStore(clock);
    InMemoryFixedWindowStore fixedWindow = new InMemoryFixedWindowStore(clock);
    InMemorySlidingWindowLogStore slidingLog = new InMemorySlidingWindowLogStore(clock);
    InMemorySlidingWindowCounterStore slidingCounter =
        new InMemorySlidingWindowCounterStore(clock);
    InMemoryLeakyBucketStore leakyBucket = new InMemoryLeakyBucketStore(clock);
    RateLimitMetrics metrics = new RateLimitMetrics(new SimpleMeterRegistry());
    RateLimiterFactory factory =
        new RateLimiterFactory(
            tokenBucket,
            tokenBucket,
            fixedWindow,
            slidingLog,
            slidingCounter,
            leakyBucket,
            Optional.empty(),
            metrics);
    return new TestHarness(clock, factory, tokenBucket, fixedWindow, slidingLog, slidingCounter, leakyBucket);
  }

  record TestHarness(
      MutableClock clock,
      RateLimiterFactory factory,
      InMemoryRateLimitStore tokenBucket,
      InMemoryFixedWindowStore fixedWindow,
      InMemorySlidingWindowLogStore slidingLog,
      InMemorySlidingWindowCounterStore slidingCounter,
      InMemoryLeakyBucketStore leakyBucket) {}
}
