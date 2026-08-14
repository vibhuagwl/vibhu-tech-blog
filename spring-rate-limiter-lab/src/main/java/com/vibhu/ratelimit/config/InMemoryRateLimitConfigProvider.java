package com.vibhu.ratelimit.config;

import com.vibhu.ratelimit.api.FailPolicy;
import com.vibhu.ratelimit.api.RateLimitPolicy;
import com.vibhu.ratelimit.api.RateLimitScope;
import com.vibhu.ratelimit.api.RefillPeriod;
import com.vibhu.ratelimit.api.RequestContext;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-process policy map. Production would back this with a DB + Kafka fan-out;
 * the contract is the same: upsert is immediately visible to the next request.
 */
public final class InMemoryRateLimitConfigProvider implements RateLimitConfigProvider {

  private static final Comparator<RateLimitPolicy> EVAL_ORDER = Comparator.comparingInt(
      p -> switch (p.scope()) {
        case GLOBAL -> 0;
        case TENANT, TENANT_API -> 1;
        case CLIENT, CLIENT_API -> 2;
        case USER -> 3;
        case API, IP, SERVICE -> 4;
      });

  private final ConcurrentHashMap<String, RateLimitPolicy> policies = new ConcurrentHashMap<>();

  public InMemoryRateLimitConfigProvider() {
    seedDefaults();
  }

  private void seedDefaults() {
    upsert(RateLimitPolicy.builder()
        .id("global-hour")
        .scope(RateLimitScope.GLOBAL)
        .capacity(1_000_000)
        .refillRate(1_000_000)
        .refillPeriod(RefillPeriod.HOUR)
        .failPolicy(FailPolicy.FAIL_OPEN)
        .build());
    upsert(RateLimitPolicy.builder()
        .id("tenant-hour")
        .scope(RateLimitScope.TENANT)
        .capacity(100_000)
        .refillRate(100_000)
        .refillPeriod(RefillPeriod.HOUR)
        .failPolicy(FailPolicy.FAIL_OPEN)
        .build());
    upsert(RateLimitPolicy.builder()
        .id("client-hour")
        .scope(RateLimitScope.CLIENT)
        .capacity(10_000)
        .refillRate(10_000)
        .refillPeriod(RefillPeriod.HOUR)
        .failPolicy(FailPolicy.FAIL_OPEN)
        .build());
    upsert(RateLimitPolicy.builder()
        .id("user-minute")
        .scope(RateLimitScope.USER)
        .capacity(100)
        .refillRate(100)
        .refillPeriod(RefillPeriod.MINUTE)
        .failPolicy(FailPolicy.FAIL_OPEN)
        .build());
    upsert(RateLimitPolicy.builder()
        .id("payments-client-minute")
        .scope(RateLimitScope.CLIENT_API)
        .apiPath("/api/payments")
        .capacity(120)
        .refillRate(100)
        .refillPeriod(RefillPeriod.MINUTE)
        .failPolicy(FailPolicy.FAIL_CLOSED)
        .build());
    upsert(RateLimitPolicy.builder()
        .id("api-second")
        .scope(RateLimitScope.API)
        .apiPath("/api/payments")
        .capacity(20)
        .refillRate(20)
        .refillPeriod(RefillPeriod.SECOND)
        .failPolicy(FailPolicy.FAIL_CLOSED)
        .build());
    upsert(RateLimitPolicy.builder()
        .id("internal-service")
        .scope(RateLimitScope.SERVICE)
        .serviceName("ledger-worker")
        .capacity(500)
        .refillRate(500)
        .refillPeriod(RefillPeriod.SECOND)
        .failPolicy(FailPolicy.LOCAL_FALLBACK)
        .build());
  }

  @Override
  public List<RateLimitPolicy> policiesFor(RequestContext context) {
    List<RateLimitPolicy> matched = new ArrayList<>();
    for (RateLimitPolicy policy : policies.values()) {
      if (policy.matches(context)) {
        matched.add(policy);
      }
    }
    matched.sort(EVAL_ORDER);
    return List.copyOf(matched);
  }

  @Override
  public Optional<RateLimitPolicy> findById(String id) {
    return Optional.ofNullable(policies.get(id));
  }

  @Override
  public List<RateLimitPolicy> findAll() {
    return policies.values().stream().sorted(Comparator.comparing(RateLimitPolicy::id)).toList();
  }

  @Override
  public RateLimitPolicy upsert(RateLimitPolicy policy) {
    policies.put(policy.id(), policy);
    return policy;
  }

  @Override
  public boolean delete(String id) {
    return policies.remove(id) != null;
  }
}
