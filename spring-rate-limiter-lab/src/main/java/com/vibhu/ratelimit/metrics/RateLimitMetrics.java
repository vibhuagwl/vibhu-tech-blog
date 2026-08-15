package com.vibhu.ratelimit.metrics;

import com.vibhu.ratelimit.api.RateLimitPolicy;
import com.vibhu.ratelimit.api.RateLimitResult;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import java.util.concurrent.TimeUnit;

public class RateLimitMetrics {

  private final MeterRegistry registry;

  public RateLimitMetrics(MeterRegistry registry) {
    this.registry = registry;
    Counter.builder("rate_limit_requests_total")
        .description("All rate-limit checks")
        .register(registry);
  }

  public void recordDecision(RateLimitPolicy policy, RateLimitResult result, long nanos) {
    Counter.builder("rate_limit_requests_total")
        .tag("policy", policy.id())
        .tag("scope", policy.scope().name())
        .register(registry)
        .increment();
    if (result.allowed()) {
      Counter.builder("rate_limit_allowed_total")
          .tag("policy", policy.id())
          .tag("degraded", String.valueOf(result.degraded()))
          .register(registry)
          .increment();
    } else {
      Counter.builder("rate_limit_rejected_total")
          .tag("policy", policy.id())
          .tag("reason", result.reason())
          .register(registry)
          .increment();
    }
    Timer.builder("rate_limit_latency")
        .tag("policy", policy.id())
        .register(registry)
        .record(nanos, TimeUnit.NANOSECONDS);
  }

  public void recordStoreError(RateLimitPolicy policy, Throwable error) {
    Counter.builder("redis_errors")
        .tag("policy", policy.id())
        .tag("type", error.getClass().getSimpleName())
        .register(registry)
        .increment();
  }

  public void recordRedisLatency(long nanos) {
    Timer.builder("redis_latency").register(registry).record(nanos, TimeUnit.NANOSECONDS);
  }

  public void recordUnconfigured() {
    Counter.builder("rate_limit_unconfigured_total").register(registry).increment();
  }

  public void recordHotKey(String key) {
    Counter.builder("hot_keys").tag("key", trim(key)).register(registry).increment();
  }

  private static String trim(String key) {
    return key.length() > 64 ? key.substring(0, 64) : key;
  }
}
